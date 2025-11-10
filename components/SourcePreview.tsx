// components/SourcePreview.tsx
import React, { useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { LayoutMode, Source } from '../types';

interface SourcePreviewProps {
    sources: Source[];
    onAddSource: () => void;
    onOpenSettings: () => void;
    layout: LayoutMode;
    setLayout: (layout: LayoutMode) => void;
    activeSources: string[];
    toggleStagePresence: (sourceId: string) => void;
    removeSource: (sourceId: string) => void;
    toggleMute: (sourceId: string) => void;
}

const ControlButton: React.FC<{onClick: (e: React.MouseEvent) => void; children: React.ReactNode; isActive?: boolean; title?: string}> = ({onClick, children, isActive, title}) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isActive ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-800 hover:bg-purple-700'}`}
    >
        <div className="w-5 h-5">{children}</div>
    </button>
)

const LayoutButton: React.FC<{onClick: () => void; children: React.ReactNode; isActive?: boolean; disabled?: boolean; title?: string}> = ({ onClick, children, isActive, disabled, title }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
            isActive ? 'bg-purple-600 text-white' : 'bg-purple-800 hover:bg-purple-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        <div className="w-5 h-5">{children}</div>
    </button>
);

const SourceCard: React.FC<{
    source: Source;
    isActive: boolean;
    onToggleStage: () => void;
    onRemove: () => void;
    onToggleMute: () => void;
}> = ({ source, isActive, onToggleStage, onRemove, onToggleMute }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasAudio = source.stream.getAudioTracks().length > 0;

    useEffect(() => {
        if (videoRef.current && source.stream) {
            videoRef.current.srcObject = source.stream;
        }
    }, [source.stream]);

    return (
        <div className="flex-shrink-0 w-48 h-32 relative group flex flex-col">
            <div className={`w-full h-24 bg-black rounded-t-lg overflow-hidden relative border-2 border-b-0 transition-all duration-200 ${isActive ? 'border-purple-500 shadow-lg' : 'border-purple-800 group-hover:border-purple-600'}`}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                    {source.name}
                </div>
                {isActive && (
                    <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                        ON STAGE
                    </div>
                )}
                {/* Control Icons */}
                <div className="absolute top-1 left-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hasAudio && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                            title={source.isMuted ? "Unmute" : "Mute"}
                            className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${source.isMuted ? 'bg-red-600 text-white' : 'bg-black/50 backdrop-blur-sm text-white'}`}
                        >
                            <div className="w-4 h-4">{source.isMuted ? ICONS.MIC_OFF : ICONS.MIC_ON}</div>
                        </button>
                    )}
                </div>
            </div>
            <button 
                onClick={onToggleStage}
                className={`w-full flex-1 rounded-b-lg font-semibold text-xs transition-colors ${isActive ? 'bg-purple-800/80 hover:bg-purple-700/80' : 'bg-purple-900/60 hover:bg-purple-900/80'}`}
            >
                {isActive ? 'Remove from Stage' : 'Add to Stage'}
            </button>
            <button onClick={onRemove} title="Remove source" className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        </div>
    )
}

const SourcePreview: React.FC<SourcePreviewProps> = ({ 
    sources, onAddSource, onOpenSettings, layout, setLayout, activeSources, toggleStagePresence, removeSource, toggleMute
}) => {

    return (
        <div className="flex items-end space-x-4">
            {sources.map(source => (
                <SourceCard 
                    key={source.id}
                    source={source}
                    isActive={activeSources.includes(source.id)}
                    onToggleStage={() => toggleStagePresence(source.id)}
                    onRemove={() => removeSource(source.id)}
                    onToggleMute={() => toggleMute(source.id)}
                />
            ))}
            <button onClick={onAddSource} className="flex-shrink-0 w-48 h-32 bg-[#1a102b] hover:bg-purple-900/60 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors">
                <div className="w-8 h-8">{ICONS.PLUS}</div>
                <span className="text-sm font-semibold mt-1">Add Source</span>
            </button>
            
            <div className="h-10 border-l border-purple-800 ml-4 mr-2 self-center"></div>

            <div className="flex items-center space-x-2 self-center">
                 <ControlButton onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} title="Settings">
                    {ICONS.SETTINGS}
                </ControlButton>
            </div>

            <div className="h-10 border-l border-purple-800 mx-2 self-center"></div>
            
            <div className="flex items-center space-x-2 self-center">
                <LayoutButton onClick={() => setLayout('solo')} isActive={layout === 'solo'} title="Solo Layout">
                    {ICONS.LAYOUT_SOLO}
                </LayoutButton>
                <LayoutButton onClick={() => setLayout('pip')} isActive={layout === 'pip'} disabled={activeSources.length !== 2} title="Picture-in-Picture Layout">
                    {ICONS.LAYOUT_PIP}
                </LayoutButton>
                <LayoutButton onClick={() => setLayout('side-by-side')} isActive={layout === 'side-by-side'} disabled={activeSources.length !== 2} title="Side by Side Layout">
                    {ICONS.LAYOUT_SIDEBYSIDE}
                </LayoutButton>
                <LayoutButton onClick={() => setLayout('sidebar')} isActive={layout === 'sidebar'} disabled={activeSources.length !== 2} title="Sidebar Layout">
                    {ICONS.LAYOUT_SIDEBAR}
                </LayoutButton>
                 <LayoutButton onClick={() => setLayout('hero-below')} isActive={layout === 'hero-below'} disabled={activeSources.length !== 2} title="Hero Below Layout">
                    {ICONS.LAYOUT_HERO_BELOW}
                </LayoutButton>
                <LayoutButton onClick={() => setLayout('split-vertical')} isActive={layout === 'split-vertical'} disabled={activeSources.length !== 2} title="Vertical Split Layout">
                    {ICONS.LAYOUT_SPLIT_VERTICAL}
                </LayoutButton>
                 <LayoutButton onClick={() => setLayout('cinematic')} isActive={layout === 'cinematic'} disabled={activeSources.length !== 2} title="Cinematic Layout">
                    {ICONS.LAYOUT_CINEMATIC}
                </LayoutButton>
            </div>
        </div>
    );
};

export default SourcePreview;