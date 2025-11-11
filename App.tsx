import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Studio from './components/Studio';
import { Recording, Destination } from './types';
import { ICONS } from './constants';


export type StudioMode = 'live' | 'record' | 'webinar';

export const ALL_DESTINATIONS: Destination[] = [
    { id: 'youtube', name: 'YouTube', icon: <div className="text-red-500">{ICONS.YOUTUBE}</div> },
    { id: 'twitch', name: 'Twitch', icon: <div className="text-purple-500">{ICONS.TWITCH}</div> },
    { id: 'facebook', name: 'Facebook', icon: <div className="text-blue-600">{ICONS.FACEBOOK}</div> },
];

const App: React.FC = () => {
  const [studioMode, setStudioMode] = useState<StudioMode | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const addRecording = (newRecording: Recording) => {
    setRecordings(prev => [newRecording, ...prev]);
  };

  const deleteRecording = (recordingId: string) => {
    const recordingToDelete = recordings.find(rec => rec.id === recordingId);
    if (recordingToDelete) {
      // Revoke the Blob URL to prevent memory leaks
      URL.revokeObjectURL(recordingToDelete.url);
    }
    setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
  };

  const renameRecording = (recordingId: string, newName: string) => {
    setRecordings(prev => 
      prev.map(rec => 
        rec.id === recordingId ? { ...rec, name: newName } : rec
      )
    );
  };
  
  const addDestination = (dest: Destination) => {
      if (!destinations.find(d => d.id === dest.id)) {
          setDestinations(prev => [...prev, dest]);
      }
  };

  const removeDestination = (destId: string) => {
      setDestinations(prev => prev.filter(d => d.id !== destId));
  };

  if (studioMode) {
    return <Studio 
              mode={studioMode} 
              onExitStudio={() => setStudioMode(null)} 
              addRecording={addRecording}
              recordings={recordings}
              deleteRecording={deleteRecording}
              renameRecording={renameRecording}
              destinations={destinations}
              removeDestination={removeDestination}
           />;
  }

  return <Dashboard 
            onEnterStudio={(mode) => setStudioMode(mode)} 
            recordings={recordings}
            deleteRecording={deleteRecording}
            renameRecording={renameRecording}
            destinations={destinations}
            addDestination={addDestination}
            removeDestination={removeDestination}
         />;
};

export default App;