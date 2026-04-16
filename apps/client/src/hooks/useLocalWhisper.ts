/**
 * useLocalWhisper — Local IPC-based transcription hook.
 *
 * Drop-in replacement for `useRealtimeSocket`. Instead of streaming audio
 * over a WebSocket to a cloud server, this hook routes audio to the Electron
 * Main Process via IPC where whisper.cpp runs inference locally.
 *
 * The hook also handles command parsing locally using the offlineBibleEngine,
 * eliminating the need for any server-side logic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseVoiceCommand, lookupOffline, type BibleVersion } from '@/lib/offlineBibleEngine';

interface LocalWhisperProps {
  onBibleMatch: (result: any) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSleepCommand?: () => void;
  onWakeCommand?: () => void;
  onVersionChange?: (version: string) => void;
  onNavigation?: (
    commandType: string,
    direction: 'next' | 'previous' | undefined,
    targetVerse?: number,
    offset?: number,
  ) => void;
}

/** Type for the preload-exposed STT API */
interface SttAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<string>;
  onTranscriptPartial: (callback: (text: string) => void) => () => void;
  onTranscriptFinal: (callback: (text: string) => void) => () => void;
  onStatusChange: (callback: (status: string, message?: string) => void) => () => void;
}

/** Access the STT API exposed via preload */
function getSttAPI(): SttAPI | null {
  const api = (window as any).api;
  return api?.stt ?? null;
}

// ── Sleep / Wake patterns ────────────────────────────────────────
const SLEEP_PATTERNS = [
  /\b(go to sleep|sleep|stop listening|pause|be quiet|shut up|mute)\b/i,
];
const WAKE_PATTERNS = [
  /\b(wake up|i'?m ready|bible|start listening|resume|unmute|listen)\b/i,
];

export const useLocalWhisper = ({
  onBibleMatch,
  onPartialTranscript,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
}: LocalWhisperProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const isSleepingRef = useRef(false);
  const currentVersionRef = useRef<BibleVersion>('kjv');

  // Store callbacks in refs to avoid stale closures
  const callbacks = useRef({
    onBibleMatch,
    onPartialTranscript,
    onFinalTranscript,
    onSleepCommand,
    onWakeCommand,
    onVersionChange,
    onNavigation,
  });

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

  // Cleanup functions for IPC listeners
  const cleanupRef = useRef<(() => void)[]>([]);

  /**
   * Process a final transcript: parse the voice command and dispatch
   * the appropriate callback (bible match, navigation, version change, etc.)
   */
  const processTranscript = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const cb = callbacks.current;

    // Check for sleep command
    if (SLEEP_PATTERNS.some((p) => p.test(trimmed))) {
      isSleepingRef.current = true;
      cb.onSleepCommand?.();
      return;
    }

    // Check for wake command
    if (isSleepingRef.current) {
      if (WAKE_PATTERNS.some((p) => p.test(trimmed))) {
        isSleepingRef.current = false;
        cb.onWakeCommand?.();
      }
      // While sleeping, ignore all other commands
      return;
    }

    // Parse the voice command using the offline engine
    const command = parseVoiceCommand(trimmed, currentVersionRef.current);

    switch (command.commandType) {
      case 'lookup': {
        if (!command.parsedReference) {
          console.warn('[useLocalWhisper] Could not parse reference:', trimmed);
          return;
        }

        // Look up the verse from local IndexedDB
        const result = await lookupOffline(command.parsedReference);
        if (result && result.verses.length > 0) {
          // Format result to match the shape expected by handleBibleMatch
          // in useHandsfreeBible (same shape as the old server response)
          const versesFormatted = result.verses.map((v) => {
            const entry: Record<string, any> = { verse: v.number };
            entry[result.version] = v.text;
            return entry;
          });

          cb.onBibleMatch?.({
            success: true,
            commandType: 'lookup',
            result: {
              book: result.book,
              chapter: result.chapter,
              verses: versesFormatted,
            },
          });
        } else {
          cb.onBibleMatch?.({
            success: false,
            error: `Verse not found: ${trimmed}`,
          });
        }
        break;
      }

      case 'version_change': {
        if (command.requestedVersion) {
          currentVersionRef.current = command.requestedVersion;
          cb.onVersionChange?.(command.requestedVersion);
        }
        break;
      }

      case 'verse_change': {
        cb.onNavigation?.(
          'verse_change',
          command.navigationDirection,
        );
        break;
      }

      case 'chapter_change': {
        cb.onNavigation?.(
          'chapter_change',
          command.navigationDirection,
        );
        break;
      }

      case 'jump_to_verse': {
        cb.onNavigation?.('jump_to_verse', undefined, command.targetVerse);
        break;
      }

      case 'jump_relative': {
        cb.onNavigation?.('jump_relative', undefined, undefined, command.offset);
        break;
      }

      case 'last_verse': {
        cb.onNavigation?.('last_verse', undefined);
        break;
      }

      default:
        console.log('[useLocalWhisper] Unhandled command type:', command.commandType, trimmed);
        break;
    }
  }, []);

  /**
   * Connect to the local whisper engine.
   * Sets up IPC listeners for transcription events.
   */
  const connect = useCallback(() => {
    const sttAPI = getSttAPI();
    if (!sttAPI) {
      console.warn('[useLocalWhisper] STT API not available (not running in Electron?)');
      return;
    }

    // Set up IPC event listeners
    const unsubPartial = sttAPI.onTranscriptPartial((text) => {
      callbacks.current.onPartialTranscript?.(text);
    });

    const unsubFinal = sttAPI.onTranscriptFinal((text) => {
      callbacks.current.onFinalTranscript?.(text);
      processTranscript(text);
    });

    const unsubStatus = sttAPI.onStatusChange((status, message) => {
      console.log('[useLocalWhisper] STT status:', status, message);
      setIsConnected(status === 'ready');
    });

    cleanupRef.current = [unsubPartial, unsubFinal, unsubStatus];

    // Tell main process to start listening
    sttAPI.startListening();
    setIsConnected(true);
  }, [processTranscript]);

  /**
   * Disconnect from the local whisper engine.
   */
  const disconnect = useCallback(() => {
    const sttAPI = getSttAPI();
    if (sttAPI) {
      sttAPI.stopListening();
    }

    // Clean up IPC listeners
    cleanupRef.current.forEach((unsub) => unsub());
    cleanupRef.current = [];

    setIsConnected(false);
  }, []);

  /**
   * Send PCM16 audio data to the main process.
   * Drop-in replacement for the old WebSocket `sendPCMData`.
   */
  const sendPCMData = useCallback((pcmBuffer: Int16Array) => {
    const sttAPI = getSttAPI();
    if (sttAPI) {
      // Transfer the ArrayBuffer to the main process
      sttAPI.sendAudioChunk(pcmBuffer.buffer as ArrayBuffer);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((unsub) => unsub());
      cleanupRef.current = [];
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendPCMData,
  };
};
