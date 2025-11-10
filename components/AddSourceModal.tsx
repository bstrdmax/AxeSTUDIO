import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';

interface AddSourceModalProps {
    onClose: () => void;
    onAddCamera: (deviceId: string) => void;
    onAddScreenShare: () => void;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({ onClose, onAddCamera, onAddScreenShare }) => {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission to get full device labels
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
                // Stop the temporary stream used for permissions
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.error("Could not enumerate devices:", err);
            }
        };
        getDevices();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1a102b] rounded-lg shadow-xl p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add a Source</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Cameras</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {videoDevices.length > 0 ? videoDevices.map((device, index) => (
                                <button key={device.deviceId} onClick={() => onAddCamera(device.deviceId)} className="w-full text-left flex items-center space-x-3 p-3 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 transition-colors">
                                    <span className="w-5 h-5">{ICONS.CAM_ON}</span>
                                    <span>{device.label || `Camera ${index + 1}`}</span>
                                </button>
                            )) : <p className="text-sm text-gray-400">No cameras found.</p>}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Other</h3>
                         <button onClick={onAddScreenShare} className="w-full text-left flex items-center space-x-3 p-3 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 transition-colors">
                            <span className="w-5 h-5">{ICONS.SCREENSHARE}</span>
                            <span>Share Screen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSourceModal;