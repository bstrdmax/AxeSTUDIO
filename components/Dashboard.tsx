import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { StudioMode } from '../App';
import { Recording, Destination, DashboardView } from '../types';
import HomePage from './HomePage';
import LibraryPage from './LibraryPage';
import DestinationsPage from './DestinationsPage';


interface DashboardProps {
  onEnterStudio: (mode: StudioMode) => void;
  recordings: Recording[];
  deleteRecording: (id: string) => void;
  renameRecording: (id: string, newName: string) => void;
  destinations: Destination[];
  addDestination: (dest: Destination) => void;
  removeDestination: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<DashboardView>('home');

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomePage {...props} />;
      case 'library':
        return <LibraryPage 
                  recordings={props.recordings}
                  deleteRecording={props.deleteRecording}
                  renameRecording={props.renameRecording}
                />;
      case 'destinations':
        return <DestinationsPage 
                  destinations={props.destinations}
                  addDestination={props.addDestination}
                  removeDestination={props.removeDestination}
                />;
      default:
        return <HomePage {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-gray-200">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-end items-center mb-10">
          <div className="flex items-center space-x-4 ml-6">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold">M</div>
            <span className="text-sm">My account</span>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;