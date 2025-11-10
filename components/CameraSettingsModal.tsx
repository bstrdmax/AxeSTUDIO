
import React, { useState, useEffect } from 'react';
import { Source } from '../types';

interface CameraSettingsModalProps {
    onClose: () => void;
    onSave: (deviceIds: { videoId: string, audioId: string }) => void;
    sources: Source[];
}

const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({ onClose, onSave, sources }) => {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState('');
    const [selectedAudio, setSelectedAudio] = useState('');

    const mainCamera = sources.find(s => s.type === 'camera');

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Ensure permissions are granted to get device labels
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                stream.getTracks().forEach(track => track.stop());

                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                setVideoDevices(videoInputs);
                setAudioDevices(audioInputs);

                if (mainCamera) {
                    const currentVideoTrack = mainCamera.stream.getVideoTracks()[0];
                    const currentAudioTrack = mainCamera.stream.getAudioTracks()[0];
                    const currentVideoId = currentVideoTrack?.getSettings().deviceId;
                    const currentAudioId = currentAudioTrack?.getSettings().deviceId;

                    setSelectedVideo(currentVideoId || (videoInputs.length > 0 ? videoInputs[0].deviceId : ''));
                    setSelectedAudio(currentAudioId || (audioInputs.length > 0 ? audioInputs[0].deviceId : ''));
                } else {
                     if (videoInputs.length > 0) setSelectedVideo(videoInputs[0].deviceId);
                     if (audioInputs.length > 0) setSelectedAudio(audioInputs[0].deviceId);
                }
            } catch (err) {
                console.error("Could not enumerate devices:", err);
            }
        };
        getDevices();
    }, [mainCamera]);
    
    const handleSave = () => {
        if (selectedVideo && selectedAudio) {
            onSave({ videoId: selectedVideo, audioId: selectedAudio });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1a102b] rounded-lg shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Camera & Mic Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="video-select" className="block text-sm font-medium text-gray-300 mb-1">Camera</label>
                        <select id="video-select" value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-purple-900/60 p-2.5 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            {videoDevices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${device.deviceId.substring(0,6)}`}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="audio-select" className="block text-sm font-medium text-gray-300 mb-1">Microphone</label>
                        <select id="audio-select" value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-purple-900/60 p-2.5 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            {audioDevices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label || `Mic ${device.deviceId.substring(0,6)}`}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-8 space-x-4">
                     <button onClick={onClose} className="px-6 py-2 rounded-md bg-purple-800 hover:bg-purple-700 font-semibold">Cancel</button>
                     <button onClick={handleSave} className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default CameraSettingsModal;