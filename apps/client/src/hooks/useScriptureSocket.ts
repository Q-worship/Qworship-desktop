import { useState, useRef, useCallback } from "react";

interface ScriptureSocketProps {
  onBibleMatch: (result: any) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSleepCommand?: () => void;
  onWakeCommand?: () => void;
  onVersionChange?: (version: string) => void;
  onNavigation?: (commandType: string, direction: "next" | "previous") => void;
}

export const useScriptureSocket = ({
  onBibleMatch,
  onPartialTranscript,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
}: ScriptureSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    // Connect to same host, but ws:// or wss:// depending on protocol
    const wsUrl = `ws://localhost:5000/api/bible/audio-stream`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[ScriptureSocket] Connected to server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "transcript_partial":
            onPartialTranscript?.(data.text);
            break;
          case "transcript_final":
            onFinalTranscript?.(data.text);
            break;
          case "bible_match":
            onBibleMatch(data);
            break;
          case "sleep_command":
            onSleepCommand?.();
            break;
          case "wake_command":
            onWakeCommand?.();
            break;
          case "version_change":
            onVersionChange?.(data.requestedVersion);
            break;
          case "navigation":
            onNavigation?.(data.commandType, data.direction);
            break;
          case "error":
            console.error("[ScriptureSocket] Server error:", data.message);
            break;
        }
      } catch (err) {
        console.error("[ScriptureSocket] Failed to parse message", err);
      }
    };

    ws.onclose = () => {
      console.log("[ScriptureSocket] Disconnected from server");
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error("[ScriptureSocket] Error:", err);
    };

    socketRef.current = ws;
  }, [
    onBibleMatch,
    onPartialTranscript,
    onFinalTranscript,
    onSleepCommand,
    onWakeCommand,
    onVersionChange,
    onNavigation,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendAudioChunk = useCallback((blob: Blob) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(blob);
    }
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendAudioChunk,
  };
};
