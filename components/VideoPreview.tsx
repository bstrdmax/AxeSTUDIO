// components/VideoPreview.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { OverlaySettings, LayoutMode, Source, OverlayPlacement } from '../types';
import { StudioMode } from '../App';

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

// Theme styles for various overlays
const themeClasses = {
  default: { primary: 'rgba(88, 28, 135, 0.9)', secondary: 'rgba(59, 7, 100, 0.9)', text: '#FFFFFF' },
  primary: { primary: 'rgba(147, 51, 234, 0.9)', secondary: 'rgba(126, 34, 206, 0.9)', text: '#FFFFFF' },
};

// Helper to apply a new opacity to a CSS color string (handles hex and rgba)
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
    return color; // Best effort for other formats
};


// Formats seconds into MM:SS
const formatTime = (seconds: number) => {
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

/**
 * A helper function to draw a video/canvas onto a canvas area, simulating `object-fit: cover`.
 * It calculates the correct aspect ratio to fill the container without stretching by cropping.
 */
const drawImageCover = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, w: number, h: number) => {
    // FIX: Cast to a more specific type to safely access width/height properties.
    // The 'CanvasImageSource' type is too broad for the compiler, but we know at runtime
    // this will be an element with width/height, primarily HTMLVideoElement or HTMLCanvasElement.
    const videoWidth = 'videoWidth' in image ? image.videoWidth : (image as HTMLCanvasElement).width;
    const videoHeight = 'videoHeight' in image ? image.videoHeight : (image as HTMLCanvasElement).height;

    const videoRatio = videoWidth / videoHeight;
    const targetRatio = w / h;
    let sWidth = videoWidth;
    let sHeight = videoHeight;
    let sx = 0;
    let sy = 0;

    if (videoRatio > targetRatio) { // Image is wider than target area
        sWidth = videoHeight * targetRatio;
        sx = (videoWidth - sWidth) / 2;
    } else { // Image is taller than target area
        sHeight = videoWidth / targetRatio;
        sy = (videoHeight - sHeight) / 2;
    }
    ctx.drawImage(image, sx, sy, sWidth, sHeight, x, y, w, h);
};

/**
 * A helper function to draw a video/canvas inside a box, letterboxed/pillarboxed to fit.
 * Simulates `object-fit: contain` to prevent any stretching or cropping.
 */
const drawImageContain = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, w: number, h: number) => {
    // FIX: Cast to a more specific type to safely access width/height properties.
    const videoWidth = 'videoWidth' in image ? image.videoWidth : (image as HTMLCanvasElement).width;
    const videoHeight = 'videoHeight' in image ? image.videoHeight : (image as HTMLCanvasElement).height;
    const videoRatio = videoWidth / videoHeight;
    
    const targetRatio = w / h;
    let finalWidth = w;
    let finalHeight = h;
    let finalX = x;
    let finalY = y;

    if (videoRatio > targetRatio) { // Video is wider than target area
        finalHeight = w / videoRatio;
        finalY = y + (h - finalHeight) / 2; // Center vertically
    } else { // Video is taller than or has same aspect as target area
        finalWidth = h * videoRatio;
        finalX = x + (w - finalWidth) / 2; // Center horizontally
    }
    ctx.drawImage(image, finalX, finalY, finalWidth, finalHeight);
};


const VideoPreview: React.FC<VideoPreviewProps> = ({ 
    canvasRef, settings, layout, sources, activeSources, isLive, isRecording, mode, timer, countdownTime
}) => {
    const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement }>({});
    const hiddenVideosContainerRef = useRef<HTMLDivElement>(null);
    const logoImgRef = useRef<HTMLImageElement>(document.createElement('img'));
    const tickerXRef = useRef(0); // PERF: Use ref for animation state to avoid re-renders

    // Refs for uploaded overlays
    const overlayVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
    const overlayImageRef = useRef<HTMLImageElement>(document.createElement('img'));

    // Effect for managing hidden <video> elements for each source
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
                video.setAttribute('data-source-id', source.id); // For identifying in blur callback
                video.playsInline = true;
                video.muted = true;
                container.appendChild(video);
            }

            if (video.srcObject !== source.stream) {
                video.srcObject = source.stream;
                // FIX: A monkey-patched video.play() can cause a signature mismatch error.
                // Calling the original prototype method is safer. The returned promise must be handled.
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

    // Effect to load user-uploaded images and videos
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


    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const cw = canvas.width;
        const ch = canvas.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, cw, ch);

        const getDrawableSource = (source: Source): CanvasImageSource | null => {
            const video = videoElementsRef.current[source.id];
            if (!video || video.readyState < 3) return null;
            return video;
        };
        
        const drawSource = (
          ctx: CanvasRenderingContext2D,
          item: { source: Source; image: CanvasImageSource },
          x: number,
          y: number,
          w: number,
          h: number,
          fit: 'cover' | 'contain'
        ) => {
            // **FIX**: Always use 'contain' for screen shares to prevent cropping
            const effectiveFit = item.source.type === 'screen' ? 'contain' : fit;
            if (effectiveFit === 'cover') {
                drawImageCover(ctx, item.image, x, y, w, h);
            } else {
                drawImageContain(ctx, item.image, x, y, w, h);
            }
        }

        const drawableSources = activeSources
            .map(id => sources.find(s => s.id === id))
            .filter((s): s is Source => !!s)
            .map(s => ({ source: s, image: getDrawableSource(s) }))
            .filter((item): item is { source: Source; image: CanvasImageSource } => !!item.image);
        
        const { brightness, contrast, saturate, grayscale } = settings.filters;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) ${grayscale ? 'grayscale(100%)' : ''}`;
        
        if (drawableSources.length === 0) {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(0, 0, cw, ch);
            ctx.font = "bold 24px sans-serif";
            ctx.fillStyle = "#94A3B8";
            ctx.textAlign = "center";
            ctx.fillText("Add a source to the stage", cw / 2, ch / 2);
        } else if (drawableSources.length === 1) {
            drawSource(ctx, drawableSources[0], 0, 0, cw, ch, 'contain');
        } else {
            const item1 = drawableSources[0];
            const item2 = drawableSources[1];
            const margin = cw * 0.015;

            if (layout === 'side-by-side') {
                drawSource(ctx, item1, 0, 0, cw / 2, ch, 'contain');
                drawSource(ctx, item2, cw / 2, 0, cw / 2, ch, 'contain');
            } else if (layout === 'sidebar') {
                let screenItem = drawableSources.find(item => item.source.type === 'screen');
                let cameraItem = drawableSources.find(item => item.source.type === 'camera');
                if (!screenItem || !cameraItem) { 
                    cameraItem = item1;
                    screenItem = item2;
                }
                const sidebarWidth = cw * 0.25;
                const mainWidth = cw - sidebarWidth;

                drawSource(ctx, screenItem, sidebarWidth, 0, mainWidth, ch, 'contain'); // Main content is screen

                const padding = sidebarWidth * 0.1;
                const v_container_x = padding;
                const v_container_y = ch * 0.05;
                const v_container_w = sidebarWidth - (padding * 2);
                const sidebarImage = cameraItem.image;
                const videoHeight = 'videoHeight' in sidebarImage ? sidebarImage.videoHeight : (sidebarImage as HTMLCanvasElement).height;
                const videoWidth = 'videoWidth' in sidebarImage ? sidebarImage.videoWidth : (sidebarImage as HTMLCanvasElement).width;

                const videoRatio = videoHeight > 0 ? videoWidth / videoHeight : 16/9;
                const v_container_h = v_container_w / videoRatio;
                
                // Sidebar camera should be cover
                drawSource(ctx, cameraItem, v_container_x, v_container_y, v_container_w, v_container_h, 'cover');
                
                const nameTagHeight = ch * 0.04;
                const nameTagY = v_container_y + v_container_h;
                if ((nameTagY + nameTagHeight) < (ch - v_container_y)) {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(v_container_x, nameTagY, v_container_w, nameTagHeight);
                    ctx.font = `600 ${ch * 0.02}px sans-serif`;
                    ctx.fillStyle = '#e2e8f0';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cameraItem.source.name, v_container_x + v_container_w / 2, nameTagY + nameTagHeight / 2);
                }
            } else if (layout === 'split-vertical') {
                drawSource(ctx, item1, 0, 0, cw, ch / 2, 'contain');
                drawSource(ctx, item2, 0, ch / 2, cw, ch / 2, 'contain');
            } else if (layout === 'hero-below') {
                const heroHeight = ch * 0.8;
                const belowHeight = ch - heroHeight;
                drawSource(ctx, item1, 0, 0, cw, heroHeight, 'cover');
                const belowWidth = belowHeight * (16 / 9);
                drawSource(ctx, item2, (cw - belowWidth) / 2, heroHeight, belowWidth, belowHeight, 'cover');
            } else if (layout === 'cinematic') {
                drawSource(ctx, item1, 0, 0, cw, ch, 'cover');
                const radius = cw * 0.1;
                const circleX = cw - radius - margin;
                const circleY = ch - radius - margin;
                ctx.save();
                ctx.beginPath();
                ctx.arc(circleX, circleY, radius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                drawImageCover(ctx, item2.image, circleX - radius, circleY - radius, radius * 2, radius * 2);
                ctx.restore();
            } else { // PIP layout
                drawSource(ctx, item1, 0, 0, cw, ch, 'cover');
                const pipWidth = cw * 0.25;
                const pipHeight = pipWidth / (16/9);
                drawSource(ctx, item2, cw - pipWidth - margin, ch - pipHeight - margin, pipWidth, pipHeight, 'cover');
            }
        }
        
        ctx.filter = 'none';

        // --- DRAW UPLOADED OVERLAY (IMAGE/VIDEO) ---
        if (settings.overlay.show && settings.overlay.url) {
            let media: HTMLImageElement | HTMLVideoElement | null = null;
            if (settings.overlay.type === 'image' && overlayImageRef.current.complete && overlayImageRef.current.naturalWidth > 0) {
                media = overlayImageRef.current;
            } else if (settings.overlay.type === 'video' && overlayVideoRef.current.readyState >= 3) {
                media = overlayVideoRef.current;
            }

            if (media) {
                const mediaWidth = 'videoWidth' in media ? media.videoWidth : media.naturalWidth;
                const mediaHeight = 'videoHeight' in media ? media.videoHeight : media.naturalHeight;
                const mediaRatio = mediaWidth / mediaHeight;
                
                const overlayW = cw * settings.overlay.size;
                const overlayH = overlayW / mediaRatio;
                const overlayX = (cw - overlayW) / 2;
                const overlayY = (ch - overlayH) / 2;

                ctx.save();
                ctx.globalAlpha = settings.overlay.opacity;
                ctx.drawImage(media, overlayX, overlayY, overlayW, overlayH);
                ctx.restore();
            }
        }


        // --- DRAW PROCEDURAL OVERLAYS ---
        if (settings.overlay.show && settings.overlay.type === 'procedural' && settings.overlay.style !== 'none') {
            ctx.save();
            switch (settings.overlay.style) {
                case 'geometric':
                    ctx.strokeStyle = 'rgba(147, 51, 234, 0.7)';
                    ctx.lineWidth = cw * 0.005;
                    const lineLength = cw * 0.15;
                    const padding = cw * 0.03;
                    // Top-left
                    ctx.beginPath();
                    ctx.moveTo(padding + lineLength, padding);
                    ctx.lineTo(padding, padding);
                    ctx.lineTo(padding, padding + lineLength);
                    ctx.stroke();
                    // Bottom-right
                    ctx.beginPath();
                    ctx.moveTo(cw - padding - lineLength, ch - padding);
                    ctx.lineTo(cw - padding, ch - padding);
                    ctx.lineTo(cw - padding, ch - padding - lineLength);
                    ctx.stroke();
                    break;
                case 'wave':
                    const waveHeight = ch * 0.15;
                    ctx.fillStyle = 'rgba(147, 51, 234, 0.5)';
                    ctx.beginPath();
                    ctx.moveTo(0, ch - waveHeight);
                    ctx.bezierCurveTo(cw / 3, ch - waveHeight * 1.5, 2 * cw / 3, ch - waveHeight * 0.5, cw, ch - waveHeight);
                    ctx.lineTo(cw, ch);
                    ctx.lineTo(0, ch);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'vignette':
                    const gradient = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.4, cw / 2, ch / 2, cw * 0.8);
                    gradient.addColorStop(0, 'rgba(0,0,0,0)');
                    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, cw, ch);
                    break;
            }
            ctx.restore();
        }

        // --- DRAW FREESTYLE TEXT OVERLAY ---
        if (settings.textOverlay.show && settings.textOverlay.text.trim()) {
            const { text, font, size, color, isBold, isItalic, placement, backgroundColor, backgroundOpacity } = settings.textOverlay;
    
            const fontSize = ch * (size / 100);
            const fontStyle = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px "${font}", sans-serif`;
            ctx.font = fontStyle;
    
            const lines = text.split('\n');
            const lineHeight = fontSize * 1.3;
            const padding = fontSize * 0.4;
            
            const textMetrics = lines.map(line => ctx.measureText(line));
            const maxTextWidth = Math.max(0, ...textMetrics.map(m => m.width));
    
            const boxWidth = maxTextWidth + (padding * 2);
            const boxHeight = (lines.length * lineHeight) - (lineHeight - fontSize) + (padding * 2);
    
            const margin = cw * 0.02;
            let x = margin;
            let y = margin;
            if (placement.includes('right')) x = cw - boxWidth - margin;
            if (placement.includes('bottom')) y = ch - boxHeight - margin;
            
            // Draw background
            ctx.fillStyle = applyOpacity(backgroundColor, backgroundOpacity);
            ctx.fillRect(x, y, boxWidth, boxHeight);
    
            // Draw text
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
    
            lines.forEach((line, index) => {
                ctx.fillText(line, x + padding, y + padding + (index * lineHeight));
            });
        }
        
        if (settings.ticker.show) {
            const theme = themeClasses[settings.ticker.theme];
            const tickerHeight = ch * 0.08;
            ctx.fillStyle = theme.primary;
            ctx.fillRect(0, ch - tickerHeight, cw, tickerHeight);
            ctx.font = `bold ${ch * 0.04}px sans-serif`;
            ctx.fillStyle = theme.text;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            const textWidth = ctx.measureText(settings.ticker.text).width;
            ctx.fillText(settings.ticker.text, tickerXRef.current, ch - tickerHeight / 2);
            tickerXRef.current = tickerXRef.current < -textWidth ? cw : tickerXRef.current - 2;
        }

        if (settings.logo.show && settings.logo.url && logoImgRef.current.complete && logoImgRef.current.naturalHeight !== 0) {
            const logoHeight = ch * 0.07;
            const logoWidth = (logoImgRef.current.width / logoImgRef.current.height) * logoHeight;
            const padding = cw * 0.02;
            let x = padding, y = padding;
            if (settings.logo.placement === 'top-right') x = cw - logoWidth - padding;
            if (settings.logo.placement === 'bottom-left') y = ch - logoHeight - padding;
            if (settings.logo.placement === 'bottom-right') { x = cw - logoWidth - padding; y = ch - logoHeight - padding; }
            ctx.drawImage(logoImgRef.current, x, y, logoWidth, logoHeight);
        }
        
        const { bulletLists } = settings;
        if (bulletLists.show && bulletLists.activeListId) {
            const activeList = bulletLists.lists.find(l => l.id === bulletLists.activeListId);
            if (activeList) {
                const theme = themeClasses[activeList.theme];
                const items = activeList.items.split('\n').filter(line => line.trim() !== '');
                const margin = cw * 0.02;
                const padding = cw * 0.015;
                const boxWidth = cw * 0.35;
                const titleSize = ch * 0.035 * activeList.textSize;
                const itemSize = ch * 0.03 * activeList.textSize;
                const lineHeight = 1.4;
                let totalHeight = padding * 2 + titleSize;
                if (items.length > 0) {
                  totalHeight += padding * 0.5 + (items.length * itemSize * lineHeight);
                }

                let x = margin;
                let y = margin;
                if(bulletLists.placement === 'top-right') x = cw - boxWidth - margin;
                if(bulletLists.placement === 'bottom-left') y = ch - totalHeight - margin;
                if(bulletLists.placement === 'bottom-right') { x = cw - boxWidth - margin; y = ch - totalHeight - margin; }

                ctx.fillStyle = applyOpacity(theme.primary, activeList.backgroundOpacity);
                ctx.fillRect(x, y, boxWidth, totalHeight);
                
                ctx.fillStyle = theme.text;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';

                ctx.font = `bold ${titleSize}px "${activeList.font}", sans-serif`;
                ctx.fillText(activeList.title, x + padding, y + padding);

                ctx.font = `${itemSize}px "${activeList.font}", sans-serif`;
                let yPos = y + padding + titleSize + (padding * 0.5);
                items.forEach(item => {
                    ctx.fillText(item, x + padding, yPos);
                    yPos += itemSize * lineHeight;
                });
            }
        }

        if (settings.banner.show) {
            const theme = themeClasses[settings.banner.theme];
            const { textSize, backgroundOpacity, font } = settings.banner;
            const bannerHeight = ch * 0.12 * textSize;
            ctx.fillStyle = applyOpacity(theme.primary, backgroundOpacity);
            ctx.fillRect(0, ch - bannerHeight, cw, bannerHeight);
            ctx.fillStyle = theme.text;
            const fontSize = ch * 0.05 * textSize;
            ctx.font = `bold ${fontSize}px "${font}", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(settings.banner.text, cw / 2, ch - bannerHeight / 2);
        }

        if (settings.lowerThird.show) {
            const theme = themeClasses[settings.lowerThird.theme];
            const { textSize, backgroundOpacity, font } = settings.lowerThird;
            const margin = cw * 0.02;
            const titleHeight = ch * 0.06 * textSize;
            const subtitleHeight = ch * 0.04 * textSize;
            const totalHeight = titleHeight + subtitleHeight;
            const boxWidth = cw * 0.4;
            const textPadding = cw * 0.01;
            const y_start = ch - margin - totalHeight;

            ctx.fillStyle = applyOpacity(theme.primary, backgroundOpacity);
            ctx.fillRect(margin, y_start, boxWidth, titleHeight);
            
            ctx.fillStyle = applyOpacity(theme.secondary, backgroundOpacity);
            ctx.fillRect(margin, y_start + titleHeight, boxWidth, subtitleHeight);

            ctx.fillStyle = theme.text;
            ctx.font = `bold ${ch * 0.035 * textSize}px "${font}", sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(settings.lowerThird.title, margin + textPadding, y_start + titleHeight / 2);

            ctx.font = `${ch * 0.025 * textSize}px "${font}", sans-serif`;
            ctx.fillText(settings.lowerThird.subtitle, margin + textPadding, y_start + titleHeight + subtitleHeight / 2);
        }
        
        if (settings.countdown.show) {
            const theme = themeClasses[settings.countdown.theme];
            ctx.fillStyle = theme.secondary;
            const boxWidth = cw * 0.5;
            const boxHeight = ch * 0.2;
            ctx.fillRect((cw - boxWidth) / 2, (ch - boxHeight) / 2, boxWidth, boxHeight);
            ctx.fillStyle = theme.text;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `bold ${ch * 0.04}px sans-serif`;
            ctx.fillText(settings.countdown.title, cw / 2, ch / 2 - (ch * 0.05));
            ctx.font = `bold ${ch * 0.09}px monospace`;
            ctx.fillText(formatTime(countdownTime), cw / 2, ch / 2 + (ch * 0.04));
        }

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