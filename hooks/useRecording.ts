import { useState, useRef, useCallback } from 'react';

export const useRecording = (stream: MediaStream | null) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(() => {
        if (stream && !isRecording) {
            recordedChunksRef.current = [];
            setRecordedUrl(null);
            
            // Prefer webm with vp9 for quality and compatibility
            const options = { mimeType: 'video/webm; codecs=vp9' };
            try {
                mediaRecorderRef.current = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn("VP9 codec not supported, falling back.");
                mediaRecorderRef.current = new MediaRecorder(stream);
            }

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, {
                    type: 'video/webm',
                });
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
                setIsRecording(false);
            };

            mediaRecorderRef.current.start(1000); // Start with timeslice to get data chunks
            setIsRecording(true);
        }
    }, [stream, isRecording]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    }, [isRecording]);

    return { isRecording, recordedUrl, startRecording, stopRecording, setRecordedUrl };
};
