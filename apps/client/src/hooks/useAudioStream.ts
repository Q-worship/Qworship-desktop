import { useState, useRef, useCallback } from "react";

export const useAudioStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const resolveRecordingRef = useRef<((blob: Blob) => void) | null>(null);

  const startRecording = useCallback(
    async (onDataAvailable?: (buffer: Blob) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
          },
        });
        streamRef.current = stream;
        audioChunksRef.current = [];

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
            if (onDataAvailable) {
              onDataAvailable(e.data);
            }
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          if (resolveRecordingRef.current) {
            resolveRecordingRef.current(audioBlob);
            resolveRecordingRef.current = null;
          }
        };

        // If onDataAvailable is provided (streaming mode), emit chunks every 250ms
        // Otherwise (batch mode), don't specify timeslice so it fires at stop
        if (onDataAvailable) {
          mediaRecorder.start(250);
        } else {
          mediaRecorder.start();
        }

        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start audio stream:", err);
        setIsRecording(false);
      }
    },
    [],
  );

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error("No active recording"));
        return;
      }

      resolveRecordingRef.current = resolve;

      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setIsRecording(false);
      streamRef.current = null;
      mediaRecorderRef.current = null;
    });
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
};
