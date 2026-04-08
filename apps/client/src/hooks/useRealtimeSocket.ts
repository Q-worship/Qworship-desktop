import { useState, useRef, useCallback, useEffect } from "react";

interface RealtimeSocketProps {
  onBibleMatch: (result: any) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSleepCommand?: () => void;
  onWakeCommand?: () => void;
  onVersionChange?: (version: string) => void;
  onNavigation?: (
    commandType: string,
    direction: "next" | "previous" | undefined,
    targetVerse?: number,
    offset?: number,
  ) => void;
}

export const useRealtimeSocket = ({
  onBibleMatch,
  onPartialTranscript,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
}: RealtimeSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid causing re-renders/re-creation of connect()
  const callbacks = useRef({
    onBibleMatch,
    onPartialTranscript,
    onFinalTranscript,
    onSleepCommand,
    onWakeCommand,
    onVersionChange,
    onNavigation,
  });

  // Update refs on every render
  useEffect(() => {
    callbacks.current = {
      onBibleMatch,
      onPartialTranscript,
      onFinalTranscript,
      onSleepCommand,
      onWakeCommand,
      onVersionChange,
      onNavigation,
    };
  });

  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const wsUrl = `${baseUrl}/api/bible/audio-stream`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[RealtimeSocket] Connected to server bridging OpenAI");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const cb = callbacks.current;

        switch (data.type) {
          case "transcript_partial":
            cb.onPartialTranscript?.(data.text);
            break;
          case "transcript_final":
            cb.onFinalTranscript?.(data.text);
            break;
          case "bible_match":
            cb.onBibleMatch?.(data);
            break;
          case "sleep_command":
            cb.onSleepCommand?.();
            break;
          case "wake_command":
            cb.onWakeCommand?.();
            break;
          case "version_change":
            cb.onVersionChange?.(data.requestedVersion);
            break;
          case "navigation":
            cb.onNavigation?.(
              data.commandType,
              data.direction,
              data.targetVerse,
              data.offset,
            );
            break;
          case "error":
            console.error("[RealtimeSocket] Server error:", data.message);
            break;
        }
      } catch (err) {
        console.error("[RealtimeSocket] Failed to parse message", err);
      }
    };

    ws.onclose = () => {
      console.log("[RealtimeSocket] Disconnected from server");
      setIsConnected(false);
      socketRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("[RealtimeSocket] WebSocket Error:", err);
    };

    socketRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    const socketToClose = socketRef.current;
    if (socketToClose) {
      // Small delay to let final bits transmit
      setTimeout(() => {
        if (socketToClose.readyState === WebSocket.OPEN || socketToClose.readyState === WebSocket.CONNECTING) {
          socketToClose.close();
        }
        if (socketRef.current === socketToClose) {
          socketRef.current = null;
        }
      }, 500);
    }
    setIsConnected(false);
  }, []);

  const sendPCMData = useCallback((pcmBuffer: Int16Array) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(pcmBuffer);
    }
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendPCMData,
  };
};
