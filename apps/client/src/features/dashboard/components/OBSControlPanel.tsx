import { useState, useEffect } from 'react';
import { obsService, OBSStatus } from "@/services/OBSConnectionService";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Circle, Radio, Loader2 } from 'lucide-react';

export function OBSControlPanel() {
  const [status, setStatus] = useState<OBSStatus>({
    connected: false,
    recording: false,
    streaming: false,
  });
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [isStartingStreaming, setIsStartingStreaming] = useState(false);
  const [isStoppingStreaming, setIsStoppingStreaming] = useState(false);

  useEffect(() => {
    const unsubscribe = obsService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      
      // Reset loading states when status changes
      if (newStatus.recording) {
        setIsStartingRecording(false);
      } else {
        setIsStoppingRecording(false);
      }
      
      if (newStatus.streaming) {
        setIsStartingStreaming(false);
      } else {
        setIsStoppingStreaming(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status.recording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status.recording]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setIsStartingRecording(true);
    try {
      await obsService.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsStartingRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setIsStoppingRecording(true);
    try {
      await obsService.stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsStoppingRecording(false);
    }
  };

  const handleStartStreaming = async () => {
    setIsStartingStreaming(true);
    try {
      await obsService.startStreaming();
    } catch (error) {
      console.error('Failed to start streaming:', error);
      setIsStartingStreaming(false);
    }
  };

  const handleStopStreaming = async () => {
    setIsStoppingStreaming(true);
    try {
      await obsService.stopStreaming();
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      setIsStoppingStreaming(false);
    }
  };

  const isDisabled = !status.connected;

  return (
    <div className="w-full space-y-4" data-testid="obs-control-panel">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#4a4560]">
        <span className="text-sm text-white font-medium">Status</span>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              status.connected
                ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                : 'bg-[#6b7280]'
            }`}
            data-testid="indicator-connection-status"
          />
          <span
            className={`text-sm font-medium ${
              status.connected ? 'text-green-400' : 'text-[#9ca3af]'
            }`}
            data-testid="text-connection-status"
          >
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Current Scene */}
      {status.currentScene && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#4a4560]">
          <span className="text-sm text-white font-medium">Current Scene</span>
          <span className="text-sm font-medium text-[#c4b5fd]" data-testid="text-current-scene">
            {status.currentScene}
          </span>
        </div>
      )}

      <Separator className="bg-[#5a5575]" />

      {/* Recording Controls */}
      <div className="p-4 rounded-xl bg-[#4a4560] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle
              className={`h-4 w-4 ${
                status.recording ? 'text-red-500 fill-red-500' : 'text-[#9ca3af]'
              }`}
              data-testid="icon-recording-status"
            />
            <span className="text-sm font-medium text-white">Recording</span>
          </div>
          {status.recording && (
            <span
              className="text-sm font-mono text-red-400 tabular-nums"
              data-testid="text-recording-time"
            >
              {formatTime(recordingTime)}
            </span>
          )}
        </div>

        {status.recording ? (
          <Button
            onClick={handleStopRecording}
            disabled={isDisabled || isStoppingRecording}
            className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            data-testid="button-stop-recording"
          >
            {isStoppingRecording ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Circle className="mr-2 h-4 w-4 fill-white" />
                Stop Recording
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStartRecording}
            disabled={isDisabled || isStartingRecording}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            data-testid="button-start-recording"
          >
            {isStartingRecording ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Circle className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
        )}
      </div>

      <Separator className="bg-[#5a5575]" />

      {/* Streaming Controls */}
      <div className="p-4 rounded-xl bg-[#4a4560] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              className={`h-4 w-4 ${
                status.streaming ? 'text-[#a78bfa]' : 'text-[#9ca3af]'
              }`}
              data-testid="icon-streaming-status"
            />
            <span className="text-sm font-medium text-white">Streaming</span>
          </div>
          {status.streaming && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" data-testid="indicator-streaming-active" />
              <span className="text-sm text-[#c4b5fd]" data-testid="text-streaming-status">
                Live
              </span>
            </div>
          )}
        </div>

        {status.streaming ? (
          <Button
            onClick={handleStopStreaming}
            disabled={isDisabled || isStoppingStreaming}
            className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            data-testid="button-stop-streaming"
          >
            {isStoppingStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Radio className="mr-2 h-4 w-4" />
                Stop Streaming
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStartStreaming}
            disabled={isDisabled || isStartingStreaming}
            className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            data-testid="button-start-streaming"
          >
            {isStartingStreaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Radio className="mr-2 h-4 w-4" />
                Start Streaming
              </>
            )}
          </Button>
        )}
      </div>

      {/* Disabled State Message */}
      {isDisabled && (
        <div className="p-4 rounded-xl bg-[#4a4560] border border-yellow-600/30">
          <p className="text-sm text-yellow-400 text-center" data-testid="text-disabled-message">
            Connect to OBS to enable controls
          </p>
        </div>
      )}
    </div>
  );
}
