import React from 'react';

interface DownloadModalProps {
    url: string;
    onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ url, onClose }) => {
    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `stream-recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1a102b] rounded-lg shadow-xl p-8 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">Recording Complete</h2>
                <video src={url} controls className="w-full rounded-md mb-6 aspect-video bg-black"></video>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-md bg-purple-800 hover:bg-purple-700 font-semibold"
                    >
                        Back to Studio
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-6 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                    >
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadModal;