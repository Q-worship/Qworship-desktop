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

interface SttAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<string>;
  onTranscriptPartial: (callback: (text: string) => void) => () => void;
  onTranscriptFinal: (callback: (text: string) => void) => () => void;
  onCommandPartial?: (callback: (text: string) => void) => () => void;
  onCommandFinal?: (callback: (text: string) => void) => () => void;
  onStatusChange: (callback: (status: string, message?: string) => void) => () => void;
}

function getSttAPI(): SttAPI | null {
  const api = (window as any).api;
  return api?.stt ?? null;
}

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
  const lastProcessedCommandRef = useRef('');
  const lastProcessedAtRef = useRef(0);

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

  const cleanupRef = useRef<(() => void)[]>([]);

  const processTranscript = useCallback(async (text: string, source: 'partial' | 'final' = 'final') => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const dedupeKey = `${source}:${trimmed.toLowerCase()}`;
    const now = Date.now();
    if (lastProcessedCommandRef.current === dedupeKey && now - lastProcessedAtRef.current < 400) {
      return;
    }
    lastProcessedCommandRef.current = dedupeKey;
    lastProcessedAtRef.current = now;

    const cb = callbacks.current;

    if (SLEEP_PATTERNS.some((p) => p.test(trimmed))) {
      isSleepingRef.current = true;
      cb.onSleepCommand?.();
      return;
    }

    if (isSleepingRef.current) {
      if (WAKE_PATTERNS.some((p) => p.test(trimmed))) {
        isSleepingRef.current = false;
        cb.onWakeCommand?.();
      }
      return;
    }

    const command = parseVoiceCommand(trimmed, currentVersionRef.current);

    switch (command.commandType) {
      case 'lookup': {
        if (!command.parsedReference) return;

        const result = await lookupOffline(command.parsedReference);
        if (result && result.verses.length > 0) {
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
        } else if (source === 'final') {
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
        cb.onNavigation?.('verse_change', command.navigationDirection);
        break;
      }

      case 'chapter_change': {
        cb.onNavigation?.('chapter_change', command.navigationDirection);
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
        break;
    }
  }, []);

  const connect = useCallback(() => {
    const sttAPI = getSttAPI();
    if (!sttAPI) {
      console.warn('[useLocalWhisper] STT API not available (not running in Electron?)');
      return;
    }

    const unsubPartial = sttAPI.onTranscriptPartial((text) => {
      const cleanedText = text.replace(/\[unk\]/gi, '').trim();
      callbacks.current.onPartialTranscript?.(cleanedText);
    });

    const unsubFinal = sttAPI.onTranscriptFinal((text) => {
      const cleanedText = text.replace(/\[unk\]/gi, '').trim();
      callbacks.current.onFinalTranscript?.(cleanedText);
    });

    let unsubCommandPartial: (() => void) | undefined;
    if (sttAPI.onCommandPartial) {
      unsubCommandPartial = sttAPI.onCommandPartial((text) => {
        const cleanedText = text.replace(/\[unk\]/gi, '').trim();
        if (!cleanedText) return;
        processTranscript(cleanedText, 'partial');
      });
    }

    let unsubCommand: (() => void) | undefined;
    if (sttAPI.onCommandFinal) {
      unsubCommand = sttAPI.onCommandFinal((text) => {
        const cleanedText = text.replace(/\[unk\]/gi, '').trim();
        if (!cleanedText) return;
        processTranscript(cleanedText, 'final');
      });
    }

    const unsubStatus = sttAPI.onStatusChange((status, message) => {
      console.log('[useLocalWhisper] STT status:', status, message);
      setIsConnected(status === 'ready');
    });

    cleanupRef.current = [unsubPartial, unsubFinal, unsubCommandPartial, unsubCommand, unsubStatus].filter(Boolean) as (() => void)[];

    sttAPI.startListening();
    setIsConnected(true);
  }, [processTranscript]);

  const disconnect = useCallback(() => {
    const sttAPI = getSttAPI();
    if (sttAPI) {
      sttAPI.stopListening();
    }

    cleanupRef.current.forEach((unsub) => unsub());
    cleanupRef.current = [];

    setIsConnected(false);
  }, []);

  const sendPCMData = useCallback((pcmBuffer: Int16Array) => {
    const sttAPI = getSttAPI();
    if (sttAPI) {
      sttAPI.sendAudioChunk(pcmBuffer.buffer as ArrayBuffer);
    }
  }, []);

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
