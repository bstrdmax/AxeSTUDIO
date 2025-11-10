import React from 'react';
import { Destination } from '../types';
import { ALL_DESTINATIONS } from '../App';

interface DestinationsModalProps {
  onClose: () => void;
  destinations: Destination[];
  addDestination: (dest: Destination) => void;
  removeDestination: (id: string) => void;
}

const DestinationsModal: React.FC<DestinationsModalProps> = ({
  onClose,
  destinations,
  addDestination,
  removeDestination,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a102b] rounded-lg shadow-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Manage Destinations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Connect an Account</h3>
            <div className="space-y-2">
              {ALL_DESTINATIONS.map(dest => {
                const isConnected = destinations.some(d => d.id === dest.id);
                return (
                  <button
                    key={dest.id}
                    onClick={() => !isConnected && addDestination(dest)}
                    disabled={isConnected}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6">{dest.icon}</span>
                      <span className="font-semibold">{dest.name}</span>
                    </div>
                    {isConnected && <span className="text-xs font-semibold text-green-400">Connected</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {destinations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Connected</h3>
              <div className="space-y-2">
                {destinations.map(dest => (
                  <div key={dest.id} className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-900/40">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6">{dest.icon}</span>
                      <span className="font-semibold">{dest.name}</span>
                    </div>
                    <button onClick={() => removeDestination(dest.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700 font-semibold text-white">Done</button>
        </div>
      </div>
    </div>
  );
};

export default DestinationsModal;