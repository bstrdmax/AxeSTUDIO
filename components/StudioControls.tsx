import React, { useState } from 'react';
import { ICONS } from '../constants';
import { OverlaySettings, OverlayPlacement, Destination, Preset, BulletList, Recording } from '../types';

interface StudioControlsProps {
    settings: OverlaySettings;
    setSettings: React.Dispatch<React.SetStateAction<OverlaySettings>>;
    destinations: Destination[];
    removeDestination: (id: string) => void;
    presets: Preset[];
    savePreset: (name: string) => void;
    applyPreset: (id: string) => void;
    deletePreset: (id: string) => void;
    resetCountdown: () => void;
    recordings: Recording[];
    deleteRecording: (id: string) => void;
    renameRecording: (id: string, newName: string) => void;
    addGuestSource: () => void;
}

const FONT_OPTIONS = ['Inter', 'Roboto', 'Montserrat', 'Oswald', 'Lato', 'Open Sans'];

const StyleControls: React.FC<{
    font: string;
    textSize: number;
    backgroundOpacity: number;
    onFontChange: (font: string) => void;
    onTextSizeChange: (size: number) => void;
    onOpacityChange: (opacity: number) => void;
    title: string;
}> = ({ font, textSize, backgroundOpacity, onFontChange, onTextSizeChange, onOpacityChange, title }) => (
    <div className="space-y-3 mt-4 bg-purple-900/40 p-3 rounded-lg">
        <h4 className="text-xs font-semibold text-gray-300">{title}</h4>
        <div>
            <label className="text-xs text-gray-400">Font Family</label>
            <select
                value={font}
                onChange={(e) => onFontChange(e.target.value)}
                className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
                {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </div>
        <div className="text-sm">
            <label className="flex justify-between items-center text-gray-300">
                <span>Text Size</span>
                <span>{Math.round(textSize * 100)}%</span>
            </label>
            <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={textSize}
                onChange={(e) => onTextSizeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
        <div className="text-sm">
            <label className="flex justify-between items-center text-gray-300">
                <span>Background Opacity</span>
                <span>{Math.round(backgroundOpacity * 100)}%</span>
            </label>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={backgroundOpacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
        </div>
    </div>
);


const StudioControls: React.FC<StudioControlsProps> = ({ 
    settings, 
    setSettings, 
    destinations, 
    removeDestination,
    presets, 
    savePreset, 
    applyPreset, 
    deletePreset, 
    resetCountdown, 
    recordings, 
    deleteRecording, 
    renameRecording,
    addGuestSource
}) => {
    const [activeTab, setActiveTab] = useState('Brand');
    
    const tabs = [
        { name: 'Brand', icon: ICONS.BRAND },
        { name: 'Banners', icon: ICONS.BANNERS },
        { name: 'Lower Thirds', icon: ICONS.LAYOUT_LOWERTHIRD },
        { name: 'Guests', icon: ICONS.MEMBERS },
        { name: 'Text', icon: ICONS.TEXT },
        { name: 'Widgets', icon: ICONS.WIDGETS },
        { name: 'Destinations', icon: ICONS.DESTINATIONS },
        { name: 'Presets', icon: ICONS.PRESETS },
        { name: 'Library', icon: ICONS.LIBRARY },
    ];

    const updateSetting = <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], ...value }
        }));
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'Brand':
                return <BrandControls settings={settings} updateSetting={updateSetting} />;
            case 'Banners':
                return <BannerControls settings={settings} updateSetting={updateSetting} />;
            case 'Lower Thirds':
                return <LowerThirdControls settings={settings} updateSetting={updateSetting} />;
            case 'Text':
                return <TextControls settings={settings} updateSetting={updateSetting} />;
            case 'Widgets':
                return <WidgetsControls settings={settings} updateSetting={updateSetting} resetCountdown={resetCountdown} />;
            case 'Destinations':
                return <DestinationsControls destinations={destinations} removeDestination={removeDestination} />;
            case 'Presets':
                return <PresetsControls presets={presets} savePreset={savePreset} applyPreset={applyPreset} deletePreset={deletePreset} />;
            case 'Library':
                return <LibraryControls recordings={recordings} deleteRecording={deleteRecording} renameRecording={renameRecording} />;
            case 'Guests':
                return <GuestsPanel addGuestSource={addGuestSource} />;
            default:
                return <div className="p-4 text-center text-gray-400">Content for {activeTab}</div>
        }
    }

    return (
        <aside className="w-80 bg-[#1a102b] border-l border-purple-900 flex flex-col">
            <div className="grid grid-cols-5 border-b border-purple-900">
                {tabs.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`flex flex-col items-center justify-center py-3 px-1 text-xs transition-colors ${activeTab === tab.name ? 'bg-purple-900/60 text-white' : 'text-gray-400 hover:bg-purple-800/50'}`}
                        title={tab.name}
                    >
                        <span className="w-5 h-5 mb-1">{tab.icon}</span>
                        <span className="truncate w-full">{tab.name}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </aside>
    );
};

const GuestsPanel: React.FC<{addGuestSource: () => void}> = ({ addGuestSource }) => {
    const [copied, setCopied] = useState(false);
    const inviteLink = "https://studio.example.com/join/aB1c2D3e";

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-base font-semibold">Invite Guests</h3>
            <div className="bg-purple-900/40 p-3 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Share this link with your guests to have them join the stream.</p>
                <div className="flex space-x-2">
                    <input type="text" readOnly value={inviteLink} className="flex-1 bg-purple-800/60 text-gray-400 p-2 rounded-md text-sm truncate" />
                    <button onClick={handleCopy} className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-700 font-semibold w-24">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
             <div className="bg-purple-900/40 p-3 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">For demonstration purposes, you can add a simulated guest to the studio.</p>
                <button onClick={addGuestSource} className="w-full px-4 py-2 text-sm rounded bg-purple-800 hover:bg-purple-700 font-semibold">
                    Simulate Guest Join
                </button>
            </div>
        </div>
    );
}

// Formats seconds into HH:MM:SS
const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (h !== '00') {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
};

const LibraryControls: React.FC<{ 
    recordings: Recording[];
    deleteRecording: (id: string) => void;
    renameRecording: (id: string, newName: string) => void;
}> = ({ recordings, deleteRecording, renameRecording }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const handleDownload = (url: string, name: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s/g, '_')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    
    const handleStartRename = (rec: Recording) => {
        setEditingId(rec.id);
        setNewName(rec.name);
    };

    const handleSaveRename = () => {
        if (editingId && newName.trim()) {
            renameRecording(editingId, newName.trim());
        }
        setEditingId(null);
        setNewName('');
    };

    const handleCancelRename = () => {
        setEditingId(null);
        setNewName('');
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-base font-semibold">Past Recordings</h3>
            {recordings.length === 0 ? (
                <p className="text-xs text-gray-400 bg-purple-900/40 p-3 rounded-lg text-center">No recordings yet.</p>
            ) : (
                <div className="space-y-2">
                    {recordings.map(rec => (
                        <div key={rec.id} className="bg-purple-900/40 p-3 rounded-lg">
                            {editingId === rec.id ? (
                                <input
                                  type="text"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  onBlur={handleSaveRename}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename();
                                      if (e.key === 'Escape') handleCancelRename();
                                  }}
                                  className="bg-purple-800/60 text-white font-semibold text-sm w-full p-1 rounded -ml-1 mb-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  autoFocus
                                />
                            ) : (
                                <p className="font-semibold text-sm truncate">{rec.name}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{new Date(rec.createdAt).toLocaleDateString()} &middot; {formatDuration(rec.duration)}</p>
                            <div className="flex justify-end items-center mt-2 space-x-3">
                                <button onClick={() => handleStartRename(rec)} className="text-xs text-gray-300 hover:text-white font-semibold">Rename</button>
                                <button onClick={() => handleDownload(rec.url, rec.name)} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">Download</button>
                                <button onClick={() => deleteRecording(rec.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FreestyleTextControls: React.FC<{
    settings: OverlaySettings;
    updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void;
}> = ({ settings, updateSetting }) => {
    const { textOverlay } = settings;
    const { text, font, size, color, isBold, isItalic, placement, backgroundColor, backgroundOpacity, show } = textOverlay;

    const handleUpdate = (value: Partial<OverlaySettings['textOverlay']>) => {
        updateSetting('textOverlay', value);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-400">Text Content</label>
                <textarea
                    value={text}
                    onChange={(e) => handleUpdate({ text: e.target.value })}
                    rows={4}
                    className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400"
                    placeholder="Enter text to display..."
                />
            </div>

            <div className="bg-purple-900/40 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-semibold text-gray-300">Style</h4>
                <div>
                    <label className="text-xs text-gray-400">Font</label>
                    <select value={font} onChange={(e) => handleUpdate({ font: e.target.value })} className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm">
                        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 flex justify-between">Size <span>{size}%</span></label>
                    <input type="range" min="2" max="15" value={size} onChange={(e) => handleUpdate({ size: parseFloat(e.target.value) })} className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleUpdate({ isBold: !isBold })} className={`px-3 py-1 text-sm rounded ${isBold ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}><b>B</b></button>
                    <button onClick={() => handleUpdate({ isItalic: !isItalic })} className={`px-3 py-1 text-sm rounded ${isItalic ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}><i>I</i></button>
                    <div className="relative">
                        <input type="color" value={color} onChange={(e) => handleUpdate({ color: e.target.value })} className="w-8 h-8 opacity-0 absolute cursor-pointer"/>
                        <div className="w-8 h-8 rounded border-2 border-purple-700" style={{ backgroundColor: color }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Text Color</span>
                </div>
            </div>

             <div className="bg-purple-900/40 p-3 rounded-lg space-y-3">
                <h4 className="text-xs font-semibold text-gray-300">Background</h4>
                <div>
                    <label className="text-xs text-gray-400 flex justify-between">Opacity <span>{Math.round(backgroundOpacity * 100)}%</span></label>
                    <input type="range" min="0" max="1" step="0.05" value={backgroundOpacity} onChange={(e) => handleUpdate({ backgroundOpacity: parseFloat(e.target.value) })} className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                </div>
                 <div className="flex items-center space-x-2">
                    <div className="relative">
                        <input type="color" value={backgroundColor} onChange={(e) => handleUpdate({ backgroundColor: e.target.value })} className="w-8 h-8 opacity-0 absolute cursor-pointer"/>
                        <div className="w-8 h-8 rounded border-2 border-purple-700" style={{ backgroundColor: backgroundColor }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Background Color</span>
                </div>
             </div>

            <div>
                <h3 className="text-base font-semibold mb-2">Placement</h3>
                 <div className="flex space-x-2">
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as OverlayPlacement[]).map(p => (
                        <button key={p} onClick={() => handleUpdate({ placement: p })} className={`flex-1 h-10 border-2 rounded ${placement === p ? 'border-purple-500 bg-purple-500/20' : 'border-purple-700 hover:border-purple-600'}`}></button>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={() => handleUpdate({ show: !show })}
                className={`px-6 py-2 text-sm rounded w-full font-semibold ${show ? 'bg-red-600/80 hover:bg-red-600' : 'bg-purple-600/80 hover:bg-purple-600'}`}
            >
                {show ? 'Hide Text' : 'Show Text'}
            </button>
        </div>
    );
};

const TextControls: React.FC<{
    settings: OverlaySettings;
    updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void;
}> = ({ settings, updateSetting }) => {
    const [textTab, setTextTab] = useState('Lists');
    
    return (
         <div className="p-4">
            <div className="flex bg-black/50 rounded-md p-1 mb-4">
                <button 
                    onClick={() => setTextTab('Lists')} 
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${textTab === 'Lists' ? 'bg-purple-800' : 'text-gray-400 hover:bg-purple-900/60'}`}
                >
                    Lists
                </button>
                <button 
                    onClick={() => setTextTab('Freestyle')} 
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${textTab === 'Freestyle' ? 'bg-purple-800' : 'text-gray-400 hover:bg-purple-900/60'}`}
                >
                    Freestyle
                </button>
            </div>
             {textTab === 'Lists' ? 
                <BulletListControls settings={settings} updateSetting={updateSetting} /> : 
                <FreestyleTextControls settings={settings} updateSetting={updateSetting} />
            }
        </div>
    )
};

const BulletListControls: React.FC<{
    settings: OverlaySettings;
    updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void;
}> = ({ settings, updateSetting }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingList, setEditingList] = useState<BulletList | null>(null);

    const handleSave = (listData: Omit<BulletList, 'id'>) => {
        const { lists } = settings.bulletLists;
        if (editingList) { // Update existing
            const updatedLists = lists.map(l => l.id === editingList.id ? {...editingList, ...listData} : l);
            updateSetting('bulletLists', { lists: updatedLists });
        } else { // Create new
            const newList: BulletList = {
                id: crypto.randomUUID(),
                ...listData
            };
            updateSetting('bulletLists', { lists: [...lists, newList] });
        }
        setIsCreating(false);
        setEditingList(null);
    };

    const handleDelete = (id: string) => {
        const updatedLists = settings.bulletLists.lists.filter(l => l.id !== id);
        updateSetting('bulletLists', { lists: updatedLists, activeListId: settings.bulletLists.activeListId === id ? null : settings.bulletLists.activeListId });
    };

    const handleToggleShow = (id: string) => {
        const { activeListId, show } = settings.bulletLists;
        if (show && activeListId === id) { // If it's active and shown, hide it
            updateSetting('bulletLists', { show: false });
        } else { // Otherwise, make it active and show it
            updateSetting('bulletLists', { activeListId: id, show: true });
        }
    };
    
    const handlePlacementChange = (placement: OverlayPlacement) => {
        updateSetting('bulletLists', { placement });
    };

    if (isCreating || editingList) {
        return <BulletListForm 
                    list={editingList} 
                    onSave={handleSave}
                    onCancel={() => { setIsCreating(false); setEditingList(null); }}
                />
    }

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold">Saved Lists</h3>
                    <button onClick={() => setIsCreating(true)} className="text-sm text-purple-400 hover:text-purple-300 font-semibold">
                        + Create
                    </button>
                </div>
                 {settings.bulletLists.lists.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-purple-900/40 p-3 rounded-lg text-center">No lists created yet.</p>
                ) : (
                    <div className="space-y-2">
                        {settings.bulletLists.lists.map(list => {
                             const isActive = settings.bulletLists.show && settings.bulletLists.activeListId === list.id;
                            return (
                                <div key={list.id} className="bg-purple-900/40 p-3 rounded-lg">
                                    <p className="font-semibold text-sm truncate">{list.title}</p>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{list.items}</p>
                                    <div className="flex items-center justify-end space-x-2 mt-3">
                                        <button onClick={() => setEditingList(list)} className="text-xs text-gray-400 hover:text-white">Edit</button>
                                        <button onClick={() => handleDelete(list.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                        <button 
                                            onClick={() => handleToggleShow(list.id)}
                                            className={`px-4 py-1.5 text-xs rounded font-semibold ${isActive ? 'bg-red-500' : 'bg-purple-600'}`}
                                        >
                                            {isActive ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
             <div>
                <h3 className="text-base font-semibold mb-2">Placement</h3>
                 <div className="flex space-x-2">
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as OverlayPlacement[]).map(p => (
                        <button key={p} onClick={() => handlePlacementChange(p)} className={`flex-1 h-10 border-2 rounded ${settings.bulletLists.placement === p ? 'border-purple-500 bg-purple-500/20' : 'border-purple-700 hover:border-purple-600'}`}></button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BulletListForm: React.FC<{
    list: BulletList | null;
    onSave: (data: Omit<BulletList, 'id'>) => void;
    onCancel: () => void;
}> = ({ list, onSave, onCancel }) => {
    const [title, setTitle] = useState(list?.title || '');
    const [items, setItems] = useState(list?.items || '');
    const [font, setFont] = useState(list?.font || 'Inter');
    const [textSize, setTextSize] = useState(list?.textSize || 1.0);
    const [backgroundOpacity, setBackgroundOpacity] = useState(list?.backgroundOpacity || 0.9);
    const [theme, setTheme] = useState<'default' | 'primary'>(list?.theme || 'default');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave({ title, items, font, textSize, backgroundOpacity, theme });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <h3 className="text-base font-semibold">{list ? 'Edit List' : 'Create New List'}</h3>
            <div>
                <label className="text-xs text-gray-400">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm"
                    required
                />
            </div>
            <div>
                <label className="text-xs text-gray-400">List Items (one per line)</label>
                 <textarea
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    rows={5}
                    className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400"
                    placeholder="• First item..."
                />
            </div>

            <StyleControls
                title="List Style"
                font={font}
                textSize={textSize}
                backgroundOpacity={backgroundOpacity}
                onFontChange={setFont}
                onTextSizeChange={setTextSize}
                onOpacityChange={setBackgroundOpacity}
            />
            
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded bg-purple-800 hover:bg-purple-700 font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-700 font-semibold">Save List</button>
            </div>
        </form>
    );
};


const WidgetsControls: React.FC<{
    settings: OverlaySettings;
    updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void;
    resetCountdown: () => void;
}> = ({ settings, updateSetting, resetCountdown }) => {
    
    const toggleCountdownRunning = () => {
        updateSetting('countdown', { running: !settings.countdown.running });
    }

    return (
        <div className="p-4 space-y-6">
            {/* Countdown Timer */}
            <div>
                <h3 className="text-base font-semibold mb-3">Countdown Timer</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400">Title</label>
                        <input
                            type="text"
                            value={settings.countdown.title}
                            onChange={(e) => updateSetting('countdown', { title: e.target.value })}
                            className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Duration (minutes)</label>
                        <input
                            type="number"
                            value={settings.countdown.duration}
                            min="1"
                            max="60"
                            onChange={(e) => {
                                updateSetting('countdown', { duration: parseInt(e.target.value, 10) });
                                // Reset time when duration changes
                                resetCountdown();
                            }}
                            className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={toggleCountdownRunning} className={`px-4 py-1.5 text-xs rounded font-semibold ${settings.countdown.running ? 'bg-yellow-500/80' : 'bg-green-500/80'}`}>
                           {settings.countdown.running ? 'Pause' : 'Start'}
                        </button>
                         <button onClick={resetCountdown} className="px-4 py-1.5 text-xs rounded bg-purple-800 font-semibold">Reset</button>
                    </div>
                </div>
                <button 
                    onClick={() => updateSetting('countdown', { show: !settings.countdown.show })}
                    className={`mt-3 px-6 py-2 text-sm rounded w-full font-semibold ${settings.countdown.show ? 'bg-red-600/80 hover:bg-red-600' : 'bg-purple-600/80 hover:bg-purple-600'}`}
                >
                    {settings.countdown.show ? 'Hide Timer' : 'Show Timer'}
                </button>
            </div>

            {/* Ticker */}
            <div>
                <h3 className="text-base font-semibold mb-3">Ticker</h3>
                <textarea
                    value={settings.ticker.text}
                    onChange={(e) => updateSetting('ticker', { text: e.target.value })}
                    rows={3}
                    className="w-full bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400"
                    placeholder="Enter scrolling text..."
                />
                 <button 
                    onClick={() => updateSetting('ticker', { show: !settings.ticker.show })}
                    className={`mt-3 px-6 py-2 text-sm rounded w-full font-semibold ${settings.ticker.show ? 'bg-red-600/80 hover:bg-red-600' : 'bg-purple-600/80 hover:bg-purple-600'}`}
                >
                    {settings.ticker.show ? 'Hide Ticker' : 'Show Ticker'}
                </button>
            </div>
        </div>
    )
}

const PresetsControls: React.FC<{
    presets: Preset[];
    savePreset: (name: string) => void;
    applyPreset: (id: string) => void;
    deletePreset: (id: string) => void;
}> = ({ presets, savePreset, applyPreset, deletePreset }) => {
    const [presetName, setPresetName] = useState('');

    const handleSave = () => {
        if (presetName.trim()) {
            savePreset(presetName.trim());
            setPresetName('');
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-2">Save Current Setup</h3>
                <div className="flex space-x-2">
                    <input 
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="New preset name..."
                        className="flex-1 bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-semibold">Save</button>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2">Your Presets</h3>
                {presets.length === 0 ? (
                     <p className="text-xs text-gray-400 bg-purple-900/40 p-3 rounded-lg">You have no saved presets.</p>
                ) : (
                    <div className="space-y-2">
                        {presets.map(preset => (
                            <div key={preset.id} className="group flex items-center justify-between bg-purple-900/40 p-2 rounded-lg">
                                <span className="text-sm font-medium">{preset.name}</span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => deletePreset(preset.id)} className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                    <button onClick={() => applyPreset(preset.id)} className="text-xs bg-purple-800 hover:bg-purple-700 px-3 py-1 rounded">Apply</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const PROCEDURAL_OVERLAYS = [
    { name: 'Geometric', style: 'geometric' },
    { name: 'Wave', style: 'wave' },
    { name: 'Vignette', style: 'vignette' },
];

const BrandControls: React.FC<{settings: OverlaySettings; updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void}> = ({ settings, updateSetting }) => {
    
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            updateSetting('logo', { url });
        }
    };

    const handleOverlayFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : 'image';
            updateSetting('overlay', { url, type, show: true });
        }
    };
    
    const applyProceduralOverlay = (style: string) => {
        updateSetting('overlay', { style, show: true, type: 'procedural', url: null });
    }

    const clearOverlay = () => {
        updateSetting('overlay', { style: 'none', show: false, url: null });
    }

    const handlePlacementChange = (placement: OverlayPlacement) => {
        updateSetting('logo', { placement });
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-2">Logo</h3>
                <div className="bg-purple-900/40 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="w-24 h-10 bg-black/50 rounded flex items-center justify-center">
                            {settings.logo.url ? (
                                <img src={settings.logo.url} alt="Logo Preview" className="max-w-full max-h-full object-contain"/>
                            ) : (
                                <span className="text-xs text-gray-500">No Logo</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                             {settings.logo.url && (
                                <button onClick={() => updateSetting('logo', { url: null })} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                            )}
                            <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                            <label htmlFor="logo-upload" className="px-3 py-1 text-xs rounded bg-purple-800 text-gray-200 hover:bg-purple-700 cursor-pointer">Upload</label>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <label className="text-xs text-gray-400">Placement</label>
                        <div className="flex space-x-2">
                            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as OverlayPlacement[]).map(p => (
                                <button key={p} onClick={() => handlePlacementChange(p)} className={`w-8 h-6 border-2 rounded ${settings.logo.placement === p ? 'border-purple-500 bg-purple-500/20' : 'border-purple-700 hover:border-purple-600'}`}></button>
                            ))}
                        </div>
                    </div>
                     <div className="mt-4 flex items-center justify-between">
                        <label className="text-xs text-gray-400">Show on stream</label>
                        <button 
                            onClick={() => updateSetting('logo', { show: !settings.logo.show })}
                            className={`px-3 py-1 text-xs rounded ${settings.logo.show ? 'bg-purple-600 text-white' : 'bg-purple-800 text-gray-300'}`}
                        >
                            {settings.logo.show ? 'Visible' : 'Hidden'}
                        </button>
                    </div>
                </div>
            </div>
             <div>
                 <h3 className="text-sm font-semibold mb-2">Full-Screen Overlays</h3>
                 <div className="bg-purple-900/40 p-3 rounded-lg space-y-4">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Upload Image/Video</h4>
                        <input type="file" id="overlay-upload" accept="image/*,video/*" className="hidden" onChange={handleOverlayFileChange} />
                        <label htmlFor="overlay-upload" className="w-full text-center block px-3 py-2 text-sm rounded bg-purple-800 text-gray-200 hover:bg-purple-700 cursor-pointer">
                            Upload Overlay
                        </label>
                        {settings.overlay.url && (
                            <div className="mt-3 space-y-2 text-sm">
                                <label className="flex justify-between items-center text-gray-300">
                                    <span>Size</span>
                                    <span>{Math.round(settings.overlay.size * 100)}%</span>
                                </label>
                                <input type="range" min="0.1" max="1.5" step="0.05" value={settings.overlay.size} onChange={(e) => updateSetting('overlay', { size: parseFloat(e.target.value) })} className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                
                                <label className="flex justify-between items-center text-gray-300">
                                    <span>Opacity</span>
                                    <span>{Math.round(settings.overlay.opacity * 100)}%</span>
                                </label>
                                <input type="range" min="0" max="1" step="0.05" value={settings.overlay.opacity} onChange={(e) => updateSetting('overlay', { opacity: parseFloat(e.target.value) })} className="w-full h-2 bg-purple-800/60 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Procedural Overlays</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {PROCEDURAL_OVERLAYS.map(overlay => (
                                <button 
                                    key={overlay.name} 
                                    onClick={() => applyProceduralOverlay(overlay.style)} 
                                    className={`aspect-video bg-black/50 rounded border-2 text-xs font-semibold flex items-center justify-center text-center p-1 ${settings.overlay.show && settings.overlay.style === overlay.style ? 'border-purple-500' : 'border-transparent hover:border-purple-700'}`}
                                >
                                {overlay.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={clearOverlay} className="w-full mt-3 px-3 py-1.5 text-xs rounded bg-purple-800 text-gray-200 hover:bg-purple-700">Clear Overlay</button>
                 </div>
            </div>

        </div>
    )
}

const BannerControls: React.FC<{settings: OverlaySettings; updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void}> = ({ settings, updateSetting }) => {
    return (
        <div className="p-4 space-y-6">
             <div>
                <h3 className="text-sm font-semibold mb-2">Banner</h3>
                <textarea
                    value={settings.banner.text}
                    onChange={(e) => updateSetting('banner', { text: e.target.value })}
                    rows={3}
                    className="w-full bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Type your banner text here..."
                />
                 <div className="mt-2">
                    <label className="text-xs text-gray-400">Theme</label>
                    <div className="flex space-x-2 mt-1">
                        <button onClick={() => updateSetting('banner', { theme: 'default' })} className={`px-3 py-1 text-xs rounded ${settings.banner.theme === 'default' ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}>Default</button>
                        <button onClick={() => updateSetting('banner', { theme: 'primary' })} className={`px-3 py-1 text-xs rounded ${settings.banner.theme === 'primary' ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}>Primary</button>
                    </div>
                </div>
                <StyleControls
                    title="Banner Style"
                    font={settings.banner.font}
                    textSize={settings.banner.textSize}
                    backgroundOpacity={settings.banner.backgroundOpacity}
                    onFontChange={(font) => updateSetting('banner', { font })}
                    onTextSizeChange={(textSize) => updateSetting('banner', { textSize })}
                    onOpacityChange={(backgroundOpacity) => updateSetting('banner', { backgroundOpacity })}
                />
                <div className="flex items-center justify-between mt-4">
                    <button 
                        onClick={() => updateSetting('banner', { show: !settings.banner.show })}
                        className={`px-6 py-2 text-sm rounded w-full font-semibold ${settings.banner.show ? 'bg-red-600/80 hover:bg-red-600' : 'bg-purple-600/80 hover:bg-purple-600'}`}
                    >
                        {settings.banner.show ? 'Hide Banner' : 'Show Banner'}
                    </button>
                </div>
             </div>
        </div>
    )
}

const LowerThirdControls: React.FC<{settings: OverlaySettings; updateSetting: <K extends keyof OverlaySettings>(key: K, value: Partial<OverlaySettings[K]>) => void}> = ({ settings, updateSetting }) => {
    return (
        <div className="p-4 space-y-6">
             <div>
                <h3 className="text-sm font-semibold mb-2">Lower Third</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400">Title</label>
                        <input
                            type="text"
                            value={settings.lowerThird.title}
                            onChange={(e) => updateSetting('lowerThird', { title: e.target.value })}
                            className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="e.g., John Doe"
                        />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">Subtitle</label>
                        <input
                            type="text"
                            value={settings.lowerThird.subtitle}
                            onChange={(e) => updateSetting('lowerThird', { subtitle: e.target.value })}
                            className="w-full mt-1 bg-purple-800/60 p-2 rounded-md text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="e.g., Host"
                        />
                    </div>
                </div>
                 <div className="mt-3">
                    <label className="text-xs text-gray-400">Theme</label>
                    <div className="flex space-x-2 mt-1">
                        <button onClick={() => updateSetting('lowerThird', { theme: 'default' })} className={`px-3 py-1 text-xs rounded ${settings.lowerThird.theme === 'default' ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}>Default</button>
                        <button onClick={() => updateSetting('lowerThird', { theme: 'primary' })} className={`px-3 py-1 text-xs rounded ${settings.lowerThird.theme === 'primary' ? 'bg-purple-600 text-white' : 'bg-purple-800'}`}>Primary</button>
                    </div>
                </div>
                 <StyleControls
                    title="Lower Third Style"
                    font={settings.lowerThird.font}
                    textSize={settings.lowerThird.textSize}
                    backgroundOpacity={settings.lowerThird.backgroundOpacity}
                    onFontChange={(font) => updateSetting('lowerThird', { font })}
                    onTextSizeChange={(textSize) => updateSetting('lowerThird', { textSize })}
                    onOpacityChange={(backgroundOpacity) => updateSetting('lowerThird', { backgroundOpacity })}
                />
                <div className="flex items-center justify-between mt-4">
                    <button 
                        onClick={() => updateSetting('lowerThird', { show: !settings.lowerThird.show })}
                        className={`px-6 py-2 text-sm rounded w-full font-semibold ${settings.lowerThird.show ? 'bg-red-600/80 hover:bg-red-600' : 'bg-purple-600/80 hover:bg-purple-600'}`}
                    >
                        {settings.lowerThird.show ? 'Hide Lower Third' : 'Show Lower Third'}
                    </button>
                </div>
             </div>
        </div>
    )
}

const DestinationsControls: React.FC<{
    destinations: Destination[];
    removeDestination: (id: string) => void;
}> = ({ destinations, removeDestination }) => {
    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="text-sm font-semibold mb-2">Connected Destinations</h3>
                {destinations.length === 0 ? (
                    <p className="text-xs text-gray-400 bg-purple-900/40 p-3 rounded-lg text-center">No destinations connected.</p>
                ) : (
                    <div className="space-y-2">
                        {destinations.map(dest => (
                             <div key={dest.id} className="flex items-center justify-between bg-purple-900/40 p-2 rounded-lg">
                                 <div className="flex items-center space-x-2">
                                     <span className="w-5 h-5">{dest.icon}</span>
                                     <span className="text-sm font-medium">{dest.name}</span>
                                 </div>
                                <button onClick={() => removeDestination(dest.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudioControls;