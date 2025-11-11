// components/Studio.tsx
import React, { useState, useRef, useEffect, useCallback, useReducer } from 'react';
import VideoPreview from './VideoPreview';
import SourcePreview from './SourcePreview';
import StudioControls from './StudioControls';
import { OverlaySettings, Destination, LayoutMode, Source, Preset, Recording, SourceType } from '../types';
import { StudioMode } from '../App';
import { useSources } from '../hooks/useCamera';
import { useRecording } from '../hooks/useRecording';
import DownloadModal from './DownloadModal';
import AddSourceModal from './AddSourceModal';
import CameraSettingsModal from './CameraSettingsModal';

// REWORK: Define actions for the overlay settings reducer
type OverlayAction = 
  | { type: 'SET_ALL'; payload: OverlaySettings }
  | { type: 'UPDATE_LOGO'; payload: Partial<OverlaySettings['logo']> }
  | { type: 'UPDATE_BANNER'; payload: Partial<OverlaySettings['banner']> }
  | { type: 'UPDATE_LOWER_THIRD'; payload: Partial<OverlaySettings['lowerThird']> }
  | { type: 'UPDATE_OVERLAY'; payload: Partial<OverlaySettings['overlay']> }
  | { type: 'UPDATE_FILTERS'; payload: Partial<OverlaySettings['filters']> }
  | { type: 'UPDATE_COUNTDOWN'; payload: Partial<OverlaySettings['countdown']> }
  | { type: 'UPDATE_TICKER'; payload: Partial<OverlaySettings['ticker']> }
  | { type: 'UPDATE_BULLET_LISTS'; payload: Partial<OverlaySettings['bulletLists']> }
  | { type: 'UPDATE_TEXT_OVERLAY'; payload: Partial<OverlaySettings['textOverlay']> };

// REWORK: Reducer function to manage overlay settings state
const overlayReducer = (state: OverlaySettings, action: OverlayAction): OverlaySettings => {
  switch (action.type) {
    case 'SET_ALL':
      return action.payload;
    case 'UPDATE_LOGO':
      return { ...state, logo: { ...state.logo, ...action.payload } };
    case 'UPDATE_BANNER':
      return { ...state, banner: { ...state.banner, ...action.payload } };
    case 'UPDATE_LOWER_THIRD':
      return { ...state, lowerThird: { ...state.lowerThird, ...action.payload } };
    case 'UPDATE_OVERLAY':
      return { ...state, overlay: { ...state.overlay, ...action.payload } };
    case 'UPDATE_FILTERS':
        return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_COUNTDOWN':
        return { ...state, countdown: { ...state.countdown, ...action.payload } };
    case 'UPDATE_TICKER':
        return { ...state, ticker: { ...state.ticker, ...action.payload } };
    case 'UPDATE_BULLET_LISTS':
        return { ...state, bulletLists: { ...state.bulletLists, ...action.payload } };
    case 'UPDATE_TEXT_OVERLAY':
        return { ...state, textOverlay: { ...state.textOverlay, ...action.payload } };
    default:
      return state;
  }
};

const initialOverlaySettings: OverlaySettings = {
    logo: { show: true, placement: 'top-right', url: null },
    banner: { 
      show: false, 
      text: 'Welcome to the Stream!', 
      theme: 'default',
      font: 'Inter',
      textSize: 1.0,
      backgroundOpacity: 0.9,
    },
    lowerThird: { 
      show: false, 
      title: 'Host Name', 
      subtitle: 'Stream Title', 
      theme: 'default',
      font: 'Inter',
      textSize: 1.0,
      backgroundOpacity: 0.9,
    },
    overlay: { show: false, style: 'none', url: null, type: 'procedural', opacity: 0.8, size: 0.5 },
    filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: false },
    countdown: { show: false, duration: 5, title: 'Starting Soon', theme: 'default', running: false },
    ticker: { show: false, text: 'This is a scrolling ticker. Edit the text in the Widgets tab!', theme: 'default' },
    bulletLists: { lists: [], activeListId: null, show: false, placement: 'top-left' },
    textOverlay: {
      show: false,
      text: 'Your Text Here',
      font: 'Inter',
      size: 5,
      color: '#ffffff',
      isBold: false,
      isItalic: false,
      placement: 'bottom-left',
      backgroundColor: '#2a0e44',
      backgroundOpacity: 0.8,
    },
};

interface StudioProps {
  mode: StudioMode;
  onExitStudio: () => void;
  addRecording: (recording: Recording) => void;
  recordings: Recording[];
  deleteRecording: (id: string) => void;
  renameRecording: (id: string, newName: string) => void;
  destinations: Destination[];
  removeDestination: (id: string) => void;
}

const Studio: React.FC<StudioProps> = ({ mode, onExitStudio, addRecording, recordings, deleteRecording, renameRecording, destinations, removeDestination }) => {
  const [isLive, setIsLive] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>('solo');
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isCameraSettingsModalOpen, setIsCameraSettingsModalOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);
  
  // REWORK: Use useReducer for overlay settings
  const [overlaySettings, dispatchOverlay] = useReducer(overlayReducer, initialOverlaySettings);
  
  const [countdownTime, setCountdownTime] = useState(overlaySettings.countdown.duration * 60);
  const countdownIntervalRef = useRef<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sources, error, addCamera, addScreenShare, removeSource, updateCamera, toggleMute, toggleBackgroundBlur } = useSources();
  const [composedStream, setComposedStream] = useState<MediaStream | null>(null);
  const { isRecording, recordedUrl, startRecording, stopRecording, setRecordedUrl } = useRecording(composedStream);
  const prevRecordedUrlRef = useRef<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const connectedAudioSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());

  // FIX: Corrected dependency array for initialization effect.
  useEffect(() => {
    const init = async () => {
      if (sources.length === 0) {
        const defaultCam = await addCamera();
        if (defaultCam) {
          setActiveSources([defaultCam.id]);
        }
      }
    };
    init();
  }, [addCamera, sources.length]);

  useEffect(() => {
    if (recordedUrl && !prevRecordedUrlRef.current) {
        const newRecording: Recording = {
            id: crypto.randomUUID(),
            name: `Recording - ${new Date().toLocaleString()}`,
            url: recordedUrl,
            createdAt: new Date().toISOString(),
            duration: timer,
        };
        addRecording(newRecording);
    }
    prevRecordedUrlRef.current = recordedUrl;
  }, [recordedUrl, addRecording, timer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
    }
    const audioContext = audioContextRef.current;
    const destination = audioDestinationRef.current;
    const connectedNodes = connectedAudioSourcesRef.current;

    connectedNodes.forEach((node, sourceId) => {
      if (!activeSources.includes(sourceId)) {
        node.disconnect();
        connectedNodes.delete(sourceId);
      }
    });

    activeSources.forEach(sourceId => {
      if (!connectedNodes.has(sourceId)) {
        const source = sources.find(s => s.id === sourceId);
        if (source && source.stream.getAudioTracks().length > 0) {
          const mediaStreamSource = audioContext.createMediaStreamSource(source.stream);
          mediaStreamSource.connect(destination);
          connectedNodes.set(sourceId, mediaStreamSource);
        }
      }
    });

    const canvasStream = canvas.captureStream(30);
    const finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
    ]);
    setComposedStream(finalStream);

    return () => {
        finalStream.getTracks().forEach(t => t.stop());
    }
  }, [sources, activeSources]);


  useEffect(() => {
    if (isLive || isRecording) {
        timerIntervalRef.current = window.setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    } else {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [isLive, isRecording]);
  
  useEffect(() => {
    if (overlaySettings.countdown.running && countdownTime > 0) {
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTime(prev => prev - 1);
      }, 1000);
    } else if (countdownTime === 0 && overlaySettings.countdown.running) {
        dispatchOverlay({ type: 'UPDATE_COUNTDOWN', payload: { running: false } });
    }
    
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [overlaySettings.countdown.running, countdownTime]);

  const resetCountdown = () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      dispatchOverlay({ type: 'UPDATE_COUNTDOWN', payload: { running: false } });
      setCountdownTime(overlaySettings.countdown.duration * 60);
  };
  
  const toggleStagePresence = (sourceId: string) => {
    setActiveSources(prev => {
      if (prev.includes(sourceId)) {
        return prev.filter(id => id !== sourceId);
      }
      if (prev.length < 2) {
        return [...prev, sourceId];
      }
      return prev;
    });
  };
  
  const handleMainAction = () => {
      if (mode === 'record') {
          isRecording ? stopRecording() : startRecording();
      } else {
          setIsLive(prev => !prev);
      }
      if (!isLive && !isRecording) setTimer(0);
  };

  const handleRecordAction = () => {
      isRecording ? stopRecording() : startRecording();
      if (!isLive && !isRecording) setTimer(0);
  };

  const savePreset = (name: string) => {
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      settings: overlaySettings,
      layout,
    };
    setPresets(prev => [...prev, newPreset]);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      dispatchOverlay({ type: 'SET_ALL', payload: preset.settings });
      setLayout(preset.layout);
    }
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  const handleCameraSettingsChange = async (deviceIds: { videoId: string; audioId: string }) => {
    const mainCamera = sources.find(s => s.type === 'camera');
    if (mainCamera) {
      await updateCamera(mainCamera.id, deviceIds);
    }
    setIsCameraSettingsModalOpen(false);
  };

  const guestCount = useRef(0);
  const addGuestSource = useCallback(async () => {
    guestCount.current += 1;
    const guestSource = await addCamera();
    if (guestSource) {
      guestSource.name = `Guest ${guestCount.current}`;
      guestSource.type = 'guest' as SourceType;
    }
  }, [addCamera]);
  
  const getMainButtonText = () => {
    if (mode === 'live') return isLive ? 'End Stream' : 'Go Live';
    if (mode === 'webinar') return isLive ? 'End Webinar' : 'Start Webinar';
    return isRecording ? 'End Recording' : 'Start Recording';
  };

  const isMainButtonActive = mode === 'record' ? isRecording : isLive;

  return (
    <div className="flex h-screen bg-black text-gray-200 overflow-hidden">
      {recordedUrl && <DownloadModal url={recordedUrl} onClose={() => { setRecordedUrl(null); prevRecordedUrlRef.current = null; }} />}
      {isAddSourceModalOpen && (
        <AddSourceModal 
          onClose={() => setIsAddSourceModalOpen(false)}
          onAddCamera={async (deviceId) => { await addCamera({ videoId: deviceId }); setIsAddSourceModalOpen(false); }}
          onAddScreenShare={async () => { await addScreenShare(); setIsAddSourceModalOpen(false); }}
        />
      )}
      {isCameraSettingsModalOpen && (
        <CameraSettingsModal
            onClose={() => setIsCameraSettingsModalOpen(false)}
            onSave={handleCameraSettingsChange}
            sources={sources}
        />
      )}
       {error && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
              <div className="bg-[#1a102b] p-8 rounded-lg text-center max-w-md">
                  <h2 className="text-xl font-bold text-red-500 mb-4">An Error Occurred</h2>
                  <p className="mb-6 text-gray-300">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white">Reload Page</button>
              </div>
          </div>
      )}
      <div className="flex flex-col flex-1">
        <header className="flex justify-between items-center p-3 bg-[#1a102b] border-b border-purple-900">
          <div>
            <button onClick={onExitStudio} className="text-sm font-semibold hover:text-white text-gray-300">
              &larr; Back to Dashboard
            </button>
            <span className="ml-4 text-sm font-bold capitalize">{mode} Studio</span>
          </div>
          <div className="flex items-center space-x-3">
             {isLive && destinations.length > 0 && (
                <div className="flex items-center space-x-2 bg-purple-900/60 px-3 py-1.5 rounded-md">
                    <span className="text-xs font-semibold text-gray-300">Streaming to:</span>
                    {destinations.map(d => (
                        <div key={d.id} className="w-5 h-5" title={d.name}>{d.icon}</div>
                    ))}
                </div>
              )}
              {mode !== 'record' && (
                <button
                    onClick={handleRecordAction}
                    className={`px-4 py-2 rounded-md font-semibold text-sm flex items-center transition-colors ${
                        isRecording 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                        : 'bg-purple-800 hover:bg-purple-700 text-white'
                    }`}
                    disabled={!composedStream}
                >
                    <span className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-black animate-pulse' : 'bg-yellow-300'}`}></span>
                    {isRecording ? 'Stop Rec' : 'Record'}
                </button>
              )}
              <button 
                onClick={handleMainAction}
                className={`px-6 py-2 rounded-md font-semibold text-sm flex items-center transition-colors ${
                  isMainButtonActive
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                disabled={!composedStream || (mode === 'live' && destinations.length === 0)}
                title={mode === 'live' && destinations.length === 0 ? "Add a destination before going live" : ""}
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${isMainButtonActive ? 'bg-white animate-pulse' : (mode === 'record' ? 'bg-yellow-300' : 'bg-red-400')}`}></span>
                {getMainButtonText()}
              </button>
          </div>
        </header>

        <main className="flex flex-1 p-4 md:p-8 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center relative min-w-0">
            <VideoPreview 
                canvasRef={canvasRef}
                settings={overlaySettings}
                layout={layout}
                sources={sources}
                activeSources={activeSources}
                isLive={isLive}
                isRecording={isRecording}
                mode={mode}
                timer={timer}
                countdownTime={countdownTime}
            />
            <div className="mt-4 w-full max-w-7xl overflow-x-auto">
                <SourcePreview 
                    sources={sources}
                    onAddSource={() => setIsAddSourceModalOpen(true)}
                    onOpenSettings={() => setIsCameraSettingsModalOpen(true)}
                    layout={layout}
                    setLayout={setLayout}
                    activeSources={activeSources}
                    toggleStagePresence={toggleStagePresence}
                    removeSource={removeSource}
                    toggleMute={toggleMute}
                    toggleBackgroundBlur={toggleBackgroundBlur}
                />
            </div>
          </div>
        </main>
      </div>
      <StudioControls 
        settings={overlaySettings} 
        setSettings={dispatchOverlay}
        destinations={destinations}
        removeDestination={removeDestination}
        presets={presets}
        savePreset={savePreset}
        applyPreset={applyPreset}
        deletePreset={deletePreset}
        resetCountdown={resetCountdown}
        recordings={recordings}
        deleteRecording={deleteRecording}
        renameRecording={renameRecording}
        addGuestSource={addGuestSource}
       />
    </div>
  );
};

export default Studio;