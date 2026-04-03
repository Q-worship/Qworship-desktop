import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Circle,
  Square,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AudioDevice } from "@/hooks/use-audio-devices";

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  selectDevice: (deviceId: string) => void;
  getSelectedDevice: () => AudioDevice | null;
  requestPermission: () => Promise<boolean>;
  refreshDevices: () => Promise<void>;
}

function MicrophoneTester({ deviceId }: { deviceId: string }) {
  const [volume, setVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: deviceId ? { exact: deviceId } : undefined },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!active) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setVolume(Math.min(100, Math.round((average / 255) * 100 * 2.5))); // Scale factor for better visibility
          requestRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.error("Error accessing microphone for test", err);
      }
    };

    initAudio();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [deviceId]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  const startRecording = () => {
    if (!streamRef.current) return;
    setAudioUrl(null);
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play().catch((e) => console.error("Error playing audio", e));
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-[#1a0f2e]/80 border border-gray-700 mt-4">
      <h4 className="text-white font-medium mb-3 text-sm">Test Microphone</h4>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Input Volume</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-75"
            style={{ width: `${volume}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 h-8"
            onClick={startRecording}
            disabled={isPlaying}>
            <Circle className="w-3 h-3 mr-2 text-red-500 fill-red-500/20" />
            Record
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-red-900/50 bg-red-900/20 text-red-400 hover:text-red-300 hover:bg-red-900/40 h-8"
            onClick={stopRecording}>
            <Square className="w-3 h-3 mr-2 fill-red-400" />
            Stop Recording
          </Button>
        )}

        {audioUrl &&
          (!isPlaying ? (
            <Button
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 h-8"
              onClick={playAudio}
              disabled={isRecording}>
              <Play className="w-3 h-3 mr-2 text-green-400 fill-green-400/20" />
              Play
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 h-8"
              onClick={stopAudio}>
              <Square className="w-3 h-3 mr-2 text-green-400 fill-green-400/20" />
              Stop
            </Button>
          ))}
      </div>
    </div>
  );
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  devices,
  selectedDeviceId,
  hasPermission,
  isLoading,
  error,
  selectDevice,
  getSelectedDevice,
  requestPermission,
  refreshDevices,
}: AudioSettingsModalProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !hasPermission) {
      requestPermission();
    }
  }, [isOpen, hasPermission, requestPermission]);

  const handleDeviceSelect = (deviceId: string) => {
    selectDevice(deviceId);
    const device = devices.find((d) => d.deviceId === deviceId);
    toast({
      title: "Audio Device Selected",
      description: `Now using: ${device?.label || "Selected microphone"}`,
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleRefresh = async () => {
    await refreshDevices();
    toast({
      title: "Devices Refreshed",
      description: "Audio device list has been updated.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Permission Granted",
        description: "You can now select your preferred microphone.",
        className: "bg-green-600 text-white",
      });
    } else {
      toast({
        title: "Permission Denied",
        description:
          "Please enable microphone access in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const selectedDevice = getSelectedDevice();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-xl w-[90vw] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-audio-settings">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#C77DFF]">
            Audio Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure your microphone for speech recognition
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Microphone Input
                  </h3>
                  <p className="text-sm text-gray-400">
                    Select your preferred audio input device
                  </p>
                </div>
              </div>

              <div className="ml-13 pl-10 space-y-4">
                {!hasPermission ? (
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-amber-200 text-sm">
                          Microphone permission is required to detect audio
                          devices and enable voice commands.
                        </p>
                        <Button
                          onClick={handleRequestPermission}
                          className="bg-amber-600 hover:bg-amber-500 text-white"
                          size="sm">
                          Grant Microphone Access
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-white font-medium">
                          Select Microphone
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefresh}
                          disabled={isLoading}
                          className="text-gray-400 hover:text-white hover:bg-gray-700">
                          <RefreshCw
                            className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                          />
                          Refresh
                        </Button>
                      </div>

                      {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Detecting devices...</span>
                        </div>
                      ) : devices.length === 0 ? (
                        <p className="text-gray-400 text-sm">
                          No audio input devices found
                        </p>
                      ) : (
                        <Select
                          value={
                            selectedDeviceId ||
                            selectedDevice?.deviceId ||
                            undefined
                          }
                          onValueChange={handleDeviceSelect}>
                          <SelectTrigger className="w-full bg-[#0f0920] border-gray-600 text-white">
                            <SelectValue placeholder="Select a microphone" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a0f2e] border-gray-600">
                            {devices.map((device) => (
                              <SelectItem
                                key={device.deviceId}
                                value={device.deviceId}
                                className="text-white hover:bg-purple-600">
                                {device.label ||
                                  `Microphone (${device.deviceId.slice(0, 8)}...)`}
                                {device.isDefault && " (Default)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {selectedDevice && (
                      <>
                        <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/50">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-green-200 text-sm font-medium">
                                Active Microphone
                              </p>
                              <p className="text-green-300/70 text-xs">
                                {selectedDevice.label}
                              </p>
                            </div>
                          </div>
                        </div>
                        <MicrophoneTester deviceId={selectedDevice.deviceId} />
                      </>
                    )}

                    <div className="p-4 rounded-lg bg-[#1a0f2e]/50 border border-gray-700/50">
                      <p className="text-gray-400 text-xs">
                        <strong className="text-gray-300">Tip:</strong> If you
                        connect a new microphone, click "Refresh" to detect it.
                        Your selection is saved and will be remembered for
                        future sessions.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-close-audio-settings">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
