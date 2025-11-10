import React, { useState } from 'react';
import { Recording } from '../types';

interface LibraryPageProps {
  recordings: Recording[];
  deleteRecording: (id: string) => void;
  renameRecording: (id: string, newName: string) => void;
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

const LibraryPage: React.FC<LibraryPageProps> = ({ 
  recordings, 
  deleteRecording, 
  renameRecording 
}) => {
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Library</h1>
      {recordings.length === 0 ? (
        <div className="text-center bg-[#1a102b] p-12 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Your Library is Empty</h2>
          <p className="text-gray-400">Create a recording in the studio and it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map(rec => (
            <div key={rec.id} className="bg-[#1a102b] rounded-lg flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/40">
              <div className="aspect-video bg-black rounded-t-lg relative">
                  <div className="w-full h-full bg-purple-900/30 flex items-center justify-center rounded-t-lg">
                      <p className="text-purple-400 text-sm">Recording</p>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-mono">{formatDuration(rec.duration)}</span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
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
                    className="bg-purple-900/60 text-white font-semibold p-1 rounded -ml-1 mb-1 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                    autoFocus
                  />
                ) : (
                  <h3 className="font-semibold flex-1 mb-1">{rec.name}</h3>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(rec.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-4 pt-0 flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleStartRename(rec)} className="text-xs font-semibold text-gray-300 hover:text-white">Rename</button>
                <button onClick={() => handleDownload(rec.url, rec.name)} className="text-xs font-semibold text-purple-400 hover:text-purple-300">Download</button>
                <button onClick={() => deleteRecording(rec.id)} className="text-xs font-semibold text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
