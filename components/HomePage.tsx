import React, { useState } from 'react';
import { ICONS } from '../constants';
import { StudioMode } from '../App';
import { Recording, Destination } from '../types';
import DestinationsModal from './DestinationsModal';

interface HomePageProps {
  onEnterStudio: (mode: StudioMode) => void;
  recordings: Recording[];
  deleteRecording: (id: string) => void;
  renameRecording: (id: string, newName: string) => void;
  destinations: Destination[];
  addDestination: (dest: Destination) => void;
  removeDestination: (id: string) => void;
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

const HomePage: React.FC<HomePageProps> = ({ 
  onEnterStudio, 
  recordings, 
  deleteRecording, 
  renameRecording,
  destinations,
  addDestination,
  removeDestination
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isDestinationsModalOpen, setIsDestinationsModalOpen] = useState(false);

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
    <>
      {isDestinationsModalOpen && (
          <DestinationsModal 
              onClose={() => setIsDestinationsModalOpen(false)}
              destinations={destinations}
              addDestination={addDestination}
              removeDestination={removeDestination}
          />
      )}
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <h1 className="text-2xl font-bold mb-6">Create</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CreateCard
              icon={ICONS.VIDEO}
              title="Live stream"
              onClick={() => onEnterStudio('live')}
            />
            <CreateCard
              icon={ICONS.RECORDING}
              title="Recording"
              onClick={() => onEnterStudio('record')}
            />
            <CreateCard
              icon={ICONS.WEBINAR}
              title="On-Air webinar"
              onClick={() => onEnterStudio('webinar')}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Prepare</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrepareCard
              title="Test studio"
              description="Explore and customize the studio"
              onClick={() => onEnterStudio('record')}
            />
            <PrepareCard
              title="Add a destination"
              description="Connect social accounts for live streaming"
              onClick={() => setIsDestinationsModalOpen(true)}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Past Recordings</h2>
          {recordings.length === 0 ? (
            <div className="text-center bg-[#1a102b] p-8 rounded-lg">
              <p className="text-gray-400">Your past recordings will appear here.</p>
              <button onClick={() => onEnterStudio('record')} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-md text-sm">
                Create a recording
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.slice(0, 5).map(rec => ( // Show only the 5 most recent on the homepage
                <div key={rec.id} className="bg-[#1a102b] p-4 rounded-lg flex items-center justify-between group">
                  <div>
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
                        className="bg-purple-900/60 text-white font-semibold p-1 rounded -ml-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-semibold">{rec.name}</h3>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(rec.createdAt).toLocaleDateString()} &middot; {formatDuration(rec.duration)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleStartRename(rec)} className="text-sm font-semibold text-gray-300 hover:text-white">Rename</button>
                    <button onClick={() => handleDownload(rec.url, rec.name)} className="text-sm font-semibold text-purple-400 hover:text-purple-300">Download</button>
                    <button onClick={() => deleteRecording(rec.id)} className="text-sm font-semibold text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

interface CreateCardProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}

const CreateCard: React.FC<CreateCardProps> = ({ icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="bg-[#1a102b] p-6 rounded-lg text-left flex flex-col items-center justify-center space-y-4 hover:bg-purple-900/60 transition-colors duration-200"
  >
    <div className="text-purple-400 w-8 h-8">{icon}</div>
    <span className="font-semibold">{title}</span>
  </button>
);

interface PrepareCardProps {
    title: string;
    description: string;
    onClick?: () => void;
}

const PrepareCard: React.FC<PrepareCardProps> = ({ title, description, onClick }) => (
    <button
      onClick={onClick}
      className="bg-[#1a102b] p-6 rounded-lg text-left flex justify-between items-center hover:bg-purple-900/60 transition-colors duration-200 w-full"
    >
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
        </div>
        <div className="w-6 h-6 text-gray-400">{ICONS.ARROW_RIGHT}</div>
    </button>
)

export default HomePage;