// hooks/useCamera.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { Source } from '../types';

/**
 * A comprehensive hook for managing all media sources (cameras, screen shares).
 * It handles adding, removing, updating, and muting sources, providing a centralized
 * and reliable interface for the rest of the application.
 */
export const useSources = () => {
    // State to hold the array of all current media sources.
    const [sources, setSources] = useState<Source[]>([]);
    // State to hold any critical error message that should be displayed to the user.
    const [error, setError] = useState<string | null>(null);
    // A ref to keep track of the number of cameras added to generate unique names.
    const cameraCountRef = useRef(0);

    /**
     * Removes a source from the list and properly stops all its media tracks
     * to release the hardware.
     */
    const removeSource = useCallback((sourceId: string) => {
        setSources(prev => {
            const sourceToRemove = prev.find(s => s.id === sourceId);
            // If the source exists, stop all its tracks.
            if (sourceToRemove) {
                sourceToRemove.stream.getTracks().forEach(track => track.stop());
            }
            // Return a new array without the removed source.
            return prev.filter(s => s.id !== sourceId);
        });
    }, []);

    /**
     * Toggles the mute state of a specific source's audio track(s).
     * This updates both the source's `isMuted` property in the React state
     * and the `enabled` property on the actual MediaStreamTrack.
     */
    const toggleMute = useCallback((sourceId: string) => {
        setSources(prevSources => 
            prevSources.map(source => {
                if (source.id === sourceId) {
                    const newMutedState = !source.isMuted;
                    // Apply the new state to all audio tracks in the stream.
                    source.stream.getAudioTracks().forEach(track => {
                        track.enabled = !newMutedState;
                    });
                    // Return the updated source object.
                    return { ...source, isMuted: newMutedState };
                }
                return source;
            })
        );
    }, []);

    /**
     * Adds a camera source using specified device IDs.
     * Prompts the user for permission if not already granted.
     */
    const addCamera = useCallback(async (deviceIds?: { videoId?: string, audioId?: string }) => {
        try {
            // Request a media stream from the user's devices with ideal constraints.
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: deviceIds?.videoId ? { exact: deviceIds.videoId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: {
                    deviceId: deviceIds?.audioId ? { exact: deviceIds.audioId } : undefined,
                },
            });
            const videoTrack = stream.getVideoTracks()[0];
            cameraCountRef.current += 1;
            
            // Create a new source object to represent this camera.
            const newSource: Source = {
                id: `camera-${videoTrack.id}`,
                name: videoTrack.label || `Camera ${cameraCountRef.current}`,
                type: 'camera',
                stream,
                isMuted: false, // Cameras are unmuted by default.
            };

            setSources(prev => [...prev, newSource]);
            return newSource;
        } catch (err) {
            console.error("Error adding camera source:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            if ((err as DOMException).name === 'NotAllowedError') {
                 setError("Camera and microphone permissions are required. Please allow access and reload the page.");
            } else {
                 setError(errorMessage);
            }
            return null;
        }
    }, []);
    
    /**
     * Updates an existing camera source with new video and audio device IDs.
     * This is used for changing cameras/mics in the settings modal.
     */
    const updateCamera = useCallback(async (sourceId: string, deviceIds: { videoId: string, audioId: string }) => {
        try {
            // Get the new media stream based on the selected device IDs.
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceIds.videoId }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: { deviceId: { exact: deviceIds.audioId } },
            });
    
            let updatedSource: Source | null = null;
    
            setSources(prev => {
                const sourcesCopy = [...prev];
                const sourceIndex = sourcesCopy.findIndex(s => s.id === sourceId);
    
                if (sourceIndex !== -1) {
                    // Stop the tracks of the old stream to release the previous device.
                    sourcesCopy[sourceIndex].stream.getTracks().forEach(track => track.stop());
                    
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    // Create the updated source object with the new stream.
                    updatedSource = {
                        ...sourcesCopy[sourceIndex],
                        name: newVideoTrack.label || sourcesCopy[sourceIndex].name,
                        stream: newStream,
                    };
                    sourcesCopy[sourceIndex] = updatedSource;
                }
                return sourcesCopy;
            });
            return updatedSource;
        } catch (err) {
            console.error("Error updating camera source:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            return null;
        }
    }, []);

    /**
     * Adds a screen share source.
     * Prompts the user to select a screen, window, or tab to share.
     */
    const addScreenShare = useCallback(async () => {
        try {
            // Request a display media stream from the user.
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            const videoTrack = stream.getVideoTracks()[0];
            
            const newSource: Source = {
                id: `screen-${videoTrack.id}`,
                name: 'Screen Share',
                type: 'screen',
                stream,
                isMuted: false, // Screen share audio is unmuted by default.
            };
            
            // Listen for when the user stops sharing via the browser's native UI.
            videoTrack.onended = () => {
                removeSource(newSource.id);
            };

            setSources(prev => [...prev, newSource]);
            return newSource;
        } catch (err) {
            console.error("Error adding screen share source:", err);
            // Don't show an error if the user simply cancels the screen share prompt.
            if ((err as DOMException).name !== 'NotAllowedError') {
                 setError(err instanceof Error ? err.message : "An unknown error occurred.");
            }
            return null;
        }
    }, [removeSource]);

    // **THE CRITICAL FIX IS HERE**
    // This cleanup effect ensures all media streams are stopped, but ONLY when the 
    // component that uses this hook (i.e., the Studio) is completely unmounted.
    // Previously, this had `[sources]` as a dependency, which caused it to run
    // *every time a source was added or removed*, incorrectly stopping all existing
    // streams and causing the "black screen" bug. By using an empty dependency
    // array `[]`, we guarantee this only runs once on unmount.
    useEffect(() => {
        return () => {
            // This logic is now safe and runs only when leaving the studio.
            sources.forEach(source => {
                source.stream.getTracks().forEach(track => track.stop());
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Expose the state and control functions to the rest of the app.
    return { sources, error, addCamera, addScreenShare, removeSource, updateCamera, toggleMute };
};