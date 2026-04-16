import { useState, useRef, useCallback } from "react";

export const useRawAudioStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // Throttle: only dispatch hfb-volume at ~12fps (every 80ms) to avoid 60fps CPU wake-ups
  const lastVolumeDispatchRef = useRef<number>(0);

  const startRecording = useCallback(
    async (onAudioData: (pcmBuffer: Int16Array) => void) => {
      try {
        console.log("[useRawAudioStream] Requesting microphone access...");
        let audioConstraints: any = {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        };

        try {
          const selectedDeviceId = localStorage.getItem(
            "qworship-audio-device",
          );
          if (selectedDeviceId && selectedDeviceId !== "default") {
            audioConstraints.deviceId = { exact: selectedDeviceId };
          }
        } catch (e) {
          console.warn(
            "[useRawAudioStream] Failed to read audio device setting from localStorage",
            e,
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
        streamRef.current = stream;

        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )({ sampleRate: 16000 });
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // --- Volume Analyser Setup ---
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        isRecordingRef.current = true;

        const updateVolume = () => {
          if (!analyserRef.current || !isRecordingRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // Map average (0-255) to a smoother 0-100 percentage for the UI
          const percentage = Math.min(100, Math.max(0, (average / 128) * 100));
          
          const now = performance.now();
          // Throttle to ~12fps (80ms) to save CPU
          if (now - lastVolumeDispatchRef.current > 80) {
            // VAD gate: Only dispatch if there's actual sound, or if we need to drop the meter back down to 0
            if (percentage > 1 || (getVolumeRef() > 0)) {
              window.dispatchEvent(
                new CustomEvent("hfb-volume", { detail: percentage }),
              );
              lastVolumeDispatchRef.current = now;
              // Keep an internal track of the last dispatched to allow dropping to 0
              if (!(window as any).__lastVolume) (window as any).__lastVolume = 0;
              (window as any).__lastVolume = percentage;
            }
          }

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        
        // Helper
        const getVolumeRef = () => (window as any).__lastVolume || 0;
        
        updateVolume(); // Start the loop

        // --- AudioWorklet Setup ---
        // AudioWorkletNode runs in a dedicated audio thread, unlike the deprecated
        // ScriptProcessorNode which ran on the main thread and caused native
        // ACCESS_VIOLATION crashes (0xC0000005) in Electron on Windows.
        await audioContext.audioWorklet.addModule("/pcm-processor.js");

        const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
        workletNodeRef.current = workletNode;

        let _feChunkCounter = 0;
        let accumulator = new Int16Array(8192); // ~500ms block
        let accumIndex = 0;

        // Receive PCM16 data from the audio thread
        workletNode.port.onmessage = (event) => {
          if (!isRecordingRef.current) return;
          
          const rawBuffer = event.data.buffer || event.data;
          const pcm16 = rawBuffer instanceof Int16Array ? rawBuffer : new Int16Array(rawBuffer);

          // Append to chunk accumulator buffer to dramatically reduce IPC spam and blocking native FFI calls
          for (let i = 0; i < pcm16.length; i++) {
             if (accumIndex < accumulator.length) {
                accumulator[accumIndex++] = pcm16[i];
             }
          }

          if (accumIndex >= accumulator.length) {
             onAudioData(accumulator.slice()); // flush
             accumIndex = 0;
          }

          if (_feChunkCounter++ % 100 === 0) {
            let feMax = 0;
            for (let i = 0; i < pcm16.length; i++) {
              if (Math.abs(pcm16[i]) > feMax) feMax = Math.abs(pcm16[i]);
            }
            console.log(
              `[Frontend] Audio chunk #${_feChunkCounter}. PCMPeak: ${feMax}/32768, FloatPeak: ${event.data?.maxFloat || 0}`,
            );
          }
        };

        source.connect(workletNode);

        // Connect to destination to keep the audio graph alive in Chrome
        // We use a GainNode set to 0 so we don't trigger Acoustic Echo Cancellation
        // which physically zeroes out the Float32 array coming into the worklet!
        const deadGain = audioContext.createGain();
        deadGain.gain.value = 0;
        workletNode.connect(deadGain);
        deadGain.connect(audioContext.destination);
        (audioContext as any).__deadGain = deadGain; // Hang onto it so it isn't GC'd

        setIsRecording(true);
        console.log(
          "[useRawAudioStream] Microphone stream initialized with AudioWorklet.",
        );
      } catch (err) {
        console.error(
          "[useRawAudioStream] Failed to start raw audio stream:",
          err,
        );
        setIsRecording(false);
        isRecordingRef.current = false;
        throw err;
      }
    },
    [],
  );

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    isRecordingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.port.close();
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
};
