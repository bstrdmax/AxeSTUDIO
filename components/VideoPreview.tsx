// components/VideoPreview.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { OverlaySettings, LayoutMode, Source, OverlayPlacement } from '../types';
import { StudioMode } from '../App';

declare var SelfieSegmentation: any;

interface VideoPreviewProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    settings: OverlaySettings;
    layout: LayoutMode;
    sources: Source[];
    activeSources: string[];
    isLive: boolean;
    isRecording: boolean;
    mode: StudioMode;
    timer: number;
    countdownTime: number;
}

// --- START: DRAWING HELPERS ---

const themeClasses = {
  default: { primary: 'rgba(88, 28, 135, 0.9)', secondary: 'rgba(59, 7, 100, 0.9)', text: '#FFFFFF' },
  primary: { primary: 'rgba(147, 51, 234, 0.9)', secondary: 'rgba(126, 34, 206, 0.9)', text: '#FFFFFF' },
};

const applyOpacity = (color: string, opacity: number): string => {
    if (color.startsWith('rgba')) {
        return color.replace(/[\d\.]+\)$/, `${opacity})`);
    }
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
};

const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const drawImageCover = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, w: number, h: number) => {
    const videoWidth = 'videoWidth' in image ? image.videoWidth : (image as HTMLCanvasElement).width;
    const videoHeight = 'videoHeight' in image ? image.videoHeight : (image as HTMLCanvasElement).height;
    const videoRatio = videoWidth / videoHeight;
    const targetRatio = w / h;
    let sWidth = videoWidth;
    let sHeight = videoHeight;
    let sx = 0;
    let sy = 0;

    if (videoRatio > targetRatio) {
        sWidth = videoHeight * targetRatio;
        sx = (videoWidth - sWidth) / 2;
    } else {
        sHeight = videoWidth / targetRatio;
        sy = (videoHeight - sHeight) / 2;
    }
    ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, w, h);
};

const drawImageContain = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, w: number, h: number) => {
    const videoWidth = 'videoWidth' in image ? image.videoWidth : (image as HTMLCanvasElement).width;
    const videoHeight = 'videoHeight' in image ? image.videoHeight : (image as HTMLCanvasElement).height;
    const videoRatio = videoWidth / videoHeight;
    
    const targetRatio = w / h;
    let finalWidth = w;
    let finalHeight = h;
    let finalX = x;
    let finalY = y;

    if (videoRatio > targetRatio) {
        finalHeight = w / videoRatio;
        finalY = y + (h - finalHeight) / 2;
    } else {
        finalWidth = h * videoRatio;
        finalX = x + (w - finalWidth) / 2;
    }
    ctx.drawImage(image, finalX, finalY, finalWidth, finalHeight);
};

// --- END: DRAWING HELPERS ---

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
    canvasRef, settings, layout, sources, activeSources, isLive, isRecording, mode, timer, countdownTime
}) => {
    const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement }>({});
    const hiddenVideosContainerRef = useRef<HTMLDivElement>(null);
    const logoImgRef = useRef<HTMLImageElement>(document.createElement('img'));
    const tickerXRef = useRef(0);

    const overlayVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
    const overlayImageRef = useRef<HTMLImageElement>(document.createElement('img'));

    const segmentationRef = useRef<any | null>(null);
    const blurredSourcesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

    useEffect(() => {
        const container = hiddenVideosContainerRef.current;
        if (!container) return;

        const currentVideoElements = videoElementsRef.current;
        const nextVideoElements: { [key: string]: HTMLVideoElement } = {};

        sources.forEach(source => {
            let video = currentVideoElements[source.id];
            if (!video) {
                video = document.createElement('video');
                video.id = `hidden-video-${source.id}`;
                video.setAttribute('data-source-id', source.id);
                video.playsInline = true;
                video.muted = true;
                container.appendChild(video);
            }

            if (video.srcObject !== source.stream) {
                video.srcObject = source.stream;
                const playPromise = HTMLVideoElement.prototype.play.call(video);
                if (playPromise) {
                  playPromise.catch(e => console.error(`Video play() failed for ${source.id}:`, e));
                }
            }
            nextVideoElements[source.id] = video;
        });

        Object.keys(currentVideoElements).forEach(sourceId => {
            if (!nextVideoElements[sourceId]) {
                currentVideoElements[sourceId].remove();
            }
        });

        videoElementsRef.current = nextVideoElements;
    }, [sources]);

    useEffect(() => {
        logoImgRef.current.crossOrigin = "anonymous";
        if (settings.logo.url) logoImgRef.current.src = settings.logo.url;
        
        overlayImageRef.current.crossOrigin = "anonymous";
        overlayVideoRef.current.crossOrigin = "anonymous";

        if (settings.overlay.url) {
            if (settings.overlay.type === 'video') {
                const video = overlayVideoRef.current;
                video.src = settings.overlay.url;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.play().catch(e => console.error("Overlay video play failed:", e));
            } else if (settings.overlay.type === 'image') {
                overlayImageRef.current.src = settings.overlay.url;
            }
        }
    }, [settings.logo.url, settings.overlay.url, settings.overlay.type]);

    useEffect(() => {
        const segmentation = new SelfieSegmentation({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/${file}`
        });
        segmentation.setOptions({ modelSelection: 1 });

        segmentation.onResults((results: any) => {
            const sourceId = (results.image as HTMLVideoElement).dataset.sourceId;
            if (!sourceId) return;
            
            let blurredCanvas = blurredSourcesRef.current.get(sourceId);
            if (!blurredCanvas) {
                blurredCanvas = document.createElement('canvas');
                blurredSourcesRef.current.set(sourceId, blurredCanvas);
            }
            const blurCtx = blurredCanvas.getContext('2d');
            if (!blurCtx) return;

            blurredCanvas.width = results.image.width;
            blurredCanvas.height = results.image.height;

            blurCtx.drawImage(results.image, 0, 0, blurredCanvas.width, blurredCanvas.height);
            blurCtx.filter = 'blur(10px)';
            blurCtx.drawImage(blurredCanvas, 0, 0, blurredCanvas.width, blurredCanvas.height);
            blurCtx.filter = 'none';

            blurCtx.globalCompositeOperation = 'destination-in';
            blurCtx.drawImage(results.segmentationMask, 0, 0, blurredCanvas.width, blurredCanvas.height);
            blurCtx.globalCompositeOperation = 'source-over';
            blurCtx.drawImage(results.image, 0, 0, blurredCanvas.width, blurredCanvas.height);
        });

        segmentationRef.current = segmentation;
        return () => { segmentation.close(); };
    }, []);

    useEffect(() => {
        let animationFrameId: number;
        const processFrames = async () => {
            const segmentation = segmentationRef.current;
            if (segmentation) {
                for (const source of sources) {
                    const video = videoElementsRef.current[source.id];
                    if (source.type === 'camera' && source.backgroundBlur && video && video.readyState >= 3) {
                       await segmentation.send({ image: video });
                    }
                }
            }
            animationFrameId = requestAnimationFrame(processFrames);
        };
        processFrames();
        return () => cancelAnimationFrame(animationFrameId);
    }, [sources]);

    // REWORK: Broke down drawing logic into smaller functions
    const drawLayout = (
        ctx: CanvasRenderingContext2D, 
        drawableSources: { source: Source; image: CanvasImageSource }[]
    ) => {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;
        
        const drawSource = (
          item: { source: Source; image: CanvasImageSource },
          x: number, y: number, w: number, h: number, fit: 'cover' | 'contain'
        ) => {
            const effectiveFit = item.source.type === 'screen' ? 'contain' : fit;
            if (effectiveFit === 'cover') {
                drawImageCover(ctx, item.image, x, y, w, h);
            } else {
                drawImageContain(ctx, item.image, x, y, w, h);
            }
        }

        if (drawableSources.length === 0) {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(0, 0, cw, ch);
            ctx.font = "bold 24px sans-serif";
            ctx.fillStyle = "#94A3B8";
            ctx.textAlign = "center";
            ctx.fillText("Add a source to the stage", cw / 2, ch / 2);
        } else if (drawableSources.length === 1) {
            drawSource(drawableSources[0], 0, 0, cw, ch, 'contain');
        } else {
            const item1 = drawableSources[0];
            const item2 = drawableSources[1];
            const margin = cw * 0.015;

            switch (layout) {
                case 'side-by-side':
                    drawSource(item1, 0, 0, cw / 2, ch, 'contain');
                    drawSource(item2, cw / 2, 0, cw / 2, ch, 'contain');
                    break;
                case 'sidebar':
                    let screenItem = drawableSources.find(item => item.source.type === 'screen') || item2;
                    let cameraItem = drawableSources.find(item => item.source.type !== 'screen') || item1;
                    const sidebarWidth = cw * 0.25;
                    drawSource(screenItem, sidebarWidth, 0, cw - sidebarWidth, ch, 'contain');
                    const padding = sidebarWidth * 0.1;
                    const v_container_x = padding;
                    const v_container_y = ch * 0.05;
                    const v_container_w = sidebarWidth - (padding * 2);
                    // FIX: Cast to HTMLCanvasElement to correctly access width/height properties
                    // on the broad CanvasImageSource type, which includes VideoFrame (lacking these properties).
                    const vh = 'videoHeight' in cameraItem.image ? cameraItem.image.videoHeight : (cameraItem.image as HTMLCanvasElement).height;
                    const vw = 'videoWidth' in cameraItem.image ? cameraItem.image.videoWidth : (cameraItem.image as HTMLCanvasElement).width;
                    const v_container_h = v_container_w / (vw/vh);
                    drawSource(cameraItem, v_container_x, v_container_y, v_container_w, v_container_h, 'cover');
                    break;
                case 'split-vertical':
                    drawSource(item1, 0, 0, cw, ch / 2, 'contain');
                    drawSource(item2, 0, ch / 2, cw, ch / 2, 'contain');
                    break;
                case 'hero-below':
                    const heroHeight = ch * 0.8;
                    drawSource(item1, 0, 0, cw, heroHeight, 'cover');
                    const belowWidth = (ch - heroHeight) * (16 / 9);
                    drawSource(item2, (cw - belowWidth) / 2, heroHeight, belowWidth, ch - heroHeight, 'cover');
                    break;
                case 'cinematic':
                    drawSource(item1, 0, 0, cw, ch, 'cover');
                    const radius = cw * 0.1;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cw - radius - margin, ch - radius - margin, radius, 0, Math.PI * 2);
                    ctx.clip();
                    drawImageCover(ctx, item2.image, cw - 2*radius - margin, ch - 2*radius - margin, radius * 2, radius * 2);
                    ctx.restore();
                    break;
                default: // PIP
                    drawSource(item1, 0, 0, cw, ch, 'cover');
                    const pipWidth = cw * 0.25;
                    drawSource(item2, cw - pipWidth - margin, ch - (pipWidth/(16/9)) - margin, pipWidth, pipWidth/(16/9), 'cover');
                    break;
            }
        }
    };
    
    const drawOverlays = (ctx: CanvasRenderingContext2D) => {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        // Uploaded Image/Video Overlay
        if (settings.overlay.show && settings.overlay.url) {
            let media: HTMLImageElement | HTMLVideoElement | null = null;
            if (settings.overlay.type === 'image' && overlayImageRef.current.complete) media = overlayImageRef.current;
            if (settings.overlay.type === 'video' && overlayVideoRef.current.readyState >= 3) media = overlayVideoRef.current;
            if (media) {
                const w = cw * settings.overlay.size;
                const h = w / (('videoWidth' in media ? media.videoWidth : media.naturalWidth) / ('videoHeight' in media ? media.videoHeight : media.naturalHeight));
                ctx.save();
                ctx.globalAlpha = settings.overlay.opacity;
                ctx.drawImage(media, (cw - w) / 2, (ch - h) / 2, w, h);
                ctx.restore();
            }
        }

        // Ticker
        if (settings.ticker.show) {
            const theme = themeClasses[settings.ticker.theme];
            const h = ch * 0.08;
            ctx.fillStyle = theme.primary;
            ctx.fillRect(0, ch - h, cw, h);
            ctx.font = `bold ${ch * 0.04}px sans-serif`;
            ctx.fillStyle = theme.text;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            const textWidth = ctx.measureText(settings.ticker.text).width;
            ctx.fillText(settings.ticker.text, tickerXRef.current, ch - h / 2);
            tickerXRef.current = tickerXRef.current < -textWidth ? cw : tickerXRef.current - 2;
        }

        // Logo
        if (settings.logo.show && settings.logo.url && logoImgRef.current.complete && logoImgRef.current.naturalHeight !== 0) {
            const h = ch * 0.07;
            const w = (logoImgRef.current.width / logoImgRef.current.height) * h;
            const p = cw * 0.02;
            let x = p, y = p;
            if (settings.logo.placement.includes('right')) x = cw - w - p;
            if (settings.logo.placement.includes('bottom')) y = ch - h - p;
            ctx.drawImage(logoImgRef.current, x, y, w, h);
        }

        // Banner
        if (settings.banner.show) {
            const theme = themeClasses[settings.banner.theme];
            const h = ch * 0.12 * settings.banner.textSize;
            ctx.fillStyle = applyOpacity(theme.primary, settings.banner.backgroundOpacity);
            ctx.fillRect(0, ch - h, cw, h);
            ctx.fillStyle = theme.text;
            ctx.font = `bold ${ch * 0.05 * settings.banner.textSize}px "${settings.banner.font}", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(settings.banner.text, cw / 2, ch - h / 2);
        }

        // Lower Third
        if (settings.lowerThird.show) {
            const theme = themeClasses[settings.lowerThird.theme];
            const margin = cw * 0.02;
            const titleH = ch * 0.06 * settings.lowerThird.textSize;
            const subtitleH = ch * 0.04 * settings.lowerThird.textSize;
            const boxW = cw * 0.4;
            const y_start = ch - margin - titleH - subtitleH;
            ctx.fillStyle = applyOpacity(theme.primary, settings.lowerThird.backgroundOpacity);
            ctx.fillRect(margin, y_start, boxW, titleH);
            ctx.fillStyle = applyOpacity(theme.secondary, settings.lowerThird.backgroundOpacity);
            ctx.fillRect(margin, y_start + titleH, boxW, subtitleH);
            ctx.fillStyle = theme.text;
            ctx.font = `bold ${ch * 0.035 * settings.lowerThird.textSize}px "${settings.lowerThird.font}", sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(settings.lowerThird.title, margin + cw*0.01, y_start + titleH / 2);
            ctx.font = `${ch * 0.025 * settings.lowerThird.textSize}px "${settings.lowerThird.font}", sans-serif`;
            ctx.fillText(settings.lowerThird.subtitle, margin + cw*0.01, y_start + titleH + subtitleH / 2);
        }

        // Countdown
        if (settings.countdown.show) {
            const theme = themeClasses[settings.countdown.theme];
            ctx.fillStyle = theme.secondary;
            ctx.fillRect((cw*0.25), (ch*0.4), (cw*0.5), (ch*0.2));
            ctx.fillStyle = theme.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `bold ${ch * 0.04}px sans-serif`;
            ctx.fillText(settings.countdown.title, cw / 2, ch / 2 - (ch * 0.05));
            ctx.font = `bold ${ch * 0.09}px monospace`;
            ctx.fillText(formatTime(countdownTime), cw / 2, ch / 2 + (ch * 0.04));
        }
    };

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, cw, ch);

        const getDrawableSource = (source: Source): CanvasImageSource | null => {
            if (source.backgroundBlur && blurredSourcesRef.current.has(source.id)) {
                return blurredSourcesRef.current.get(source.id)!;
            }
            const video = videoElementsRef.current[source.id];
            return (video && video.readyState >= 3) ? video : null;
        };
        
        const drawableSources = activeSources
            .map(id => sources.find(s => s.id === id))
            .filter((s): s is Source => !!s)
            .map(s => ({ source: s, image: getDrawableSource(s) }))
            .filter((item): item is { source: Source; image: CanvasImageSource } => !!item.image);
        
        const { brightness, contrast, saturate, grayscale } = settings.filters;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) ${grayscale ? 'grayscale(100%)' : ''}`;
        
        drawLayout(ctx, drawableSources);
        
        ctx.filter = 'none';
        
        drawOverlays(ctx);

    }, [canvasRef, settings, layout, sources, activeSources, countdownTime]);


    useEffect(() => {
        let animationFrameId: number;
        const loop = () => {
            renderCanvas();
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();
        
        return () => cancelAnimationFrame(animationFrameId);
    }, [renderCanvas]);

    return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl border border-purple-800 flex items-center justify-center">
            <div ref={hiddenVideosContainerRef} style={{ display: 'none' }}></div>
            <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full" />
            {(isLive || isRecording) && (
                <div className="absolute top-4 left-4 flex items-center space-x-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg border border-white/20">
                    {isLive && (
                        <div className="flex items-center space-x-2">
                             <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                             <span className="font-semibold uppercase tracking-wider">LIVE</span>
                        </div>
                    )}
                    {isRecording && (
                        <div className="flex items-center space-x-2">
                             <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                             <span className="font-semibold uppercase tracking-wider">REC</span>
                        </div>
                    )}
                    <span className="font-mono text-base">{formatTime(timer)}</span>
                </div>
            )}
        </div>
    );
};

export default VideoPreview;