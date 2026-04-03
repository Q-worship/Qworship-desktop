import { useState, useRef, useCallback } from "react";

export const useRawAudioStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(
    async (onAudioData: (pcmBuffer: Int16Array) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000, // Browser's native high quality
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;

        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )({
          sampleRate: 24000, // Try to force target sample rate if browser supports it
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // --- Volume Analyser Setup ---
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (!analyserRef.current || !isRecording) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;

          // Map average (0-255) to a smoother 0-100 percentage for the UI
          const percentage = Math.min(100, Math.max(0, (average / 128) * 100));
          setVolume(percentage);

          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume(); // Start the loop

        // --- Raw Audio Processor Setup ---
        // 4096 buffer size gives us chunks roughly ~170ms long at 24kHz
        const bufferSize = 4096;
        const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0); // Float32Array (-1.0 to 1.0)

          // Downsample and convert to PCM16
          // If the audioContext is running at 48kHz, but we need 24kHz, we skip every 2nd sample
          const inputSampleRate = audioContext.sampleRate;
          const targetSampleRate = 24000;
          const ratio = Math.floor(inputSampleRate / targetSampleRate);
          const step = ratio > 0 ? ratio : 1;

          const pcm16 = new Int16Array(Math.floor(inputData.length / step));

          let outIndex = 0;
          for (let i = 0; i < inputData.length; i += step) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            // Convert to 16-bit PCM integer
            pcm16[outIndex++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          onAudioData(pcm16);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start raw audio stream:", err);
        setIsRecording(false);
        throw err;
      }
    },
    [isRecording],
  );

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setVolume(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
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

  return { isRecording, volume, startRecording, stopRecording };
};
