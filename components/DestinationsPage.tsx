import React, { useState } from 'react';
import { Destination } from '../types';
import DestinationsModal from './DestinationsModal';
import { ICONS } from '../constants';

interface DestinationsPageProps {
  destinations: Destination[];
  addDestination: (dest: Destination) => void;
  removeDestination: (id: string) => void;
}

const DestinationsPage: React.FC<DestinationsPageProps> = ({
  destinations,
  addDestination,
  removeDestination,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      {isModalOpen && (
          <DestinationsModal 
              onClose={() => setIsModalOpen(false)}
              destinations={destinations}
              addDestination={addDestination}
              removeDestination={removeDestination}
          />
      )}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Destinations</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-md text-sm"
        >
          <div className="w-5 h-5">{ICONS.PLUS}</div>
          <span>Add Destination</span>
        </button>
      </div>

       {destinations.length === 0 ? (
        <div className="text-center bg-[#1a102b] p-12 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Destinations Connected</h2>
          <p className="text-gray-400">Connect your social accounts to start live streaming.</p>
        </div>
      ) : (
        <div className="bg-[#1a102b] rounded-lg">
          <ul className="divide-y divide-purple-900/50">
            {destinations.map(dest => (
              <li key={dest.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="w-8 h-8 flex items-center justify-center">{dest.icon}</span>
                  <span className="font-semibold text-lg">{dest.name}</span>
                </div>
                <button onClick={() => removeDestination(dest.id)} className="text-sm font-semibold text-red-400 hover:text-red-300">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DestinationsPage;
