/**
 * useLocalWhisper — Local IPC-based transcription hook.
 *
 * This hook now prefers the provider-neutral `window.api.speech` bridge while
 * still supporting the legacy `window.api.whisper` bridge during the migration.
 * It continues to parse Bible voice commands locally in the renderer so the
 * downstream Hands-Free Bible flow remains unchanged during Sprint 1.
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

interface LegacyWhisperAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<string>;
  onTranscriptPartial: (callback: (text: string) => void) => () => void;
  onTranscriptFinal: (callback: (text: string) => void) => () => void;
  onStatusChange: (callback: (status: string, message?: string) => void) => () => void;
  onModelDownloadProgress?: (
    callback: (percent: number, downloadedMB: number, totalMB: number) => void,
  ) => () => void;
}

interface SpeechDescriptor {
  id: string;
  label: string;
  mode: 'offline' | 'online';
}

interface SpeechTranscriptPayload {
  text: string;
  isFinal: boolean;
  provider: SpeechDescriptor;
}

interface SpeechStatusPayload {
  status: string;
  message?: string;
  provider: SpeechDescriptor;
}

interface SpeechModelDownloadPayload {
  percent: number;
  downloadedMB: number;
  totalMB: number;
  provider?: SpeechDescriptor;
}

interface ProviderNeutralSpeechAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<SpeechStatusPayload | string>;
  setProvider?: (providerId: string) => Promise<any>;
  getProviders?: () => Promise<any>;
  onTranscriptPartial: (callback: (payload: SpeechTranscriptPayload) => void) => () => void;
  onTranscriptFinal: (callback: (payload: SpeechTranscriptPayload) => void) => () => void;
  onStatusChange: (callback: (payload: SpeechStatusPayload) => void) => () => void;
  onModelDownloadProgress?: (
    callback: (payload: SpeechModelDownloadPayload) => void,
  ) => () => void;
}

interface NormalizedSpeechAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<SpeechStatusPayload>;
  setProvider?: (providerId: string) => Promise<any>;
  getProviders?: () => Promise<any>;
  onTranscriptPartial: (callback: (payload: SpeechTranscriptPayload) => void) => () => void;
  onTranscriptFinal: (callback: (payload: SpeechTranscriptPayload) => void) => () => void;
  onStatusChange: (callback: (payload: SpeechStatusPayload) => void) => () => void;
  onModelDownloadProgress?: (
    callback: (payload: SpeechModelDownloadPayload) => void,
  ) => () => void;
}

const LEGACY_PROVIDER: SpeechDescriptor = {
  id: 'offline-whisper-legacy',
  label: 'Offline Whisper (Legacy)',
  mode: 'offline',
};

function normalizeStatusPayload(
  payload: SpeechStatusPayload | string,
): SpeechStatusPayload {
  if (typeof payload === 'string') {
    return {
      status: payload,
      provider: LEGACY_PROVIDER,
    };
  }

  return payload;
}

function normalizeTranscriptPayload(
  text: string,
  isFinal: boolean,
): SpeechTranscriptPayload {
  return {
    text,
    isFinal,
    provider: LEGACY_PROVIDER,
  };
}

function getSpeechAPI(): NormalizedSpeechAPI | null {
  const api = (window as any).api;

  if (api?.speech) {
    const speechApi = api.speech as ProviderNeutralSpeechAPI;

    return {
      sendAudioChunk: speechApi.sendAudioChunk,
      startListening: speechApi.startListening,
      stopListening: speechApi.stopListening,
      getStatus: async () => normalizeStatusPayload(await speechApi.getStatus()),
      setProvider: speechApi.setProvider,
      getProviders: speechApi.getProviders,
      onTranscriptPartial: (callback) =>
        speechApi.onTranscriptPartial((payload) => callback(payload)),
      onTranscriptFinal: (callback) =>
        speechApi.onTranscriptFinal((payload) => callback(payload)),
      onStatusChange: (callback) =>
        speechApi.onStatusChange((payload) => callback(payload)),
      onModelDownloadProgress: speechApi.onModelDownloadProgress,
    };
  }

  if (api?.whisper) {
    const whisperApi = api.whisper as LegacyWhisperAPI;

    return {
      sendAudioChunk: whisperApi.sendAudioChunk,
      startListening: whisperApi.startListening,
      stopListening: whisperApi.stopListening,
      getStatus: async () => normalizeStatusPayload(await whisperApi.getStatus()),
      setProvider: undefined,
      getProviders: undefined,
      onTranscriptPartial: (callback) =>
        whisperApi.onTranscriptPartial((text) =>
          callback(normalizeTranscriptPayload(text, false)),
        ),
      onTranscriptFinal: (callback) =>
        whisperApi.onTranscriptFinal((text) =>
          callback(normalizeTranscriptPayload(text, true)),
        ),
      onStatusChange: (callback) =>
        whisperApi.onStatusChange((status, message) =>
          callback({ status, message, provider: LEGACY_PROVIDER }),
        ),
      onModelDownloadProgress: whisperApi.onModelDownloadProgress
        ? (callback) =>
            whisperApi.onModelDownloadProgress?.((percent, downloadedMB, totalMB) =>
              callback({
                percent,
                downloadedMB,
                totalMB,
                provider: LEGACY_PROVIDER,
              }),
            ) ?? (() => undefined)
        : undefined,
    };
  }

  return null;
}

const SLEEP_PATTERNS = [
  /\b(go to sleep|sleep|stop listening|pause|be quiet|shut up|mute)\b/i,
];
const WAKE_PATTERNS = [
  /\b(wake up|i'?m ready|bible|start listening|resume|unmute|listen)\b/i,
];
const IGNORED_TRANSCRIPT_PATTERNS = [/^\[(silence|pause|noise)\]$/i, /^(silence|noise)$/i];

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

  const processTranscript = useCallback(async (text: string, provider?: SpeechDescriptor) => {
    const trimmed = text.trim();
    if (!trimmed || IGNORED_TRANSCRIPT_PATTERNS.some((pattern) => pattern.test(trimmed))) return;

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
        if (!command.parsedReference) {
          console.warn('[useLocalWhisper] Could not parse reference:', trimmed);
          cb.onBibleMatch?.({
            success: false,
            error: `Command unclear: ${trimmed}`,
          });
          return;
        }

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
            requestedVersion: command.parsedReference.version,
            result: {
              book: result.book,
              chapter: result.chapter,
              version: result.version,
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
        console.log('[useLocalWhisper] Unhandled command type:', command.commandType, trimmed);
        break;
    }
  }, []);

  const connect = useCallback(async () => {
    const speechAPI = getSpeechAPI();
    if (!speechAPI) {
      console.warn('[useLocalWhisper] Speech API not available (not running in Electron?)');
      return;
    }

    cleanupRef.current.forEach((unsub) => unsub());
    cleanupRef.current = [];

    let resolveReady: (() => void) | null = null;
    const readyPromise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const settleReady = () => {
      if (resolveReady) {
        resolveReady();
        resolveReady = null;
      }
    };

    const unsubPartial = speechAPI.onTranscriptPartial((payload) => {
      callbacks.current.onPartialTranscript?.(payload.text);
    });

    const unsubFinal = speechAPI.onTranscriptFinal((payload) => {
      callbacks.current.onFinalTranscript?.(payload.text);
      processTranscript(payload.text, payload.provider);
    });

    const unsubStatus = speechAPI.onStatusChange((payload) => {
      console.log('[useLocalWhisper] Speech status:', payload.status, payload.message, payload.provider?.id);
      const ready = payload.status === 'ready' || payload.status === 'processing';
      setIsConnected(ready);
      if (ready || payload.status === 'error') {
        settleReady();
      }
    });

    cleanupRef.current = [unsubPartial, unsubFinal, unsubStatus];

    try {
      const status = await speechAPI.getStatus();
      if (status.status === 'ready' || status.status === 'processing') {
        setIsConnected(true);
        settleReady();
      }
    } catch (error) {
      console.warn('[useLocalWhisper] Failed to read speech status before connect', error);
    }

    speechAPI.startListening();
    await Promise.race([
      readyPromise,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 2200);
      }),
    ]);
  }, [processTranscript]);

  const disconnect = useCallback(() => {
    const speechAPI = getSpeechAPI();
    if (speechAPI) {
      speechAPI.stopListening();
    }

    cleanupRef.current.forEach((unsub) => unsub());
    cleanupRef.current = [];

    setIsConnected(false);
  }, []);

  const sendPCMData = useCallback((pcmBuffer: Int16Array) => {
    const speechAPI = getSpeechAPI();
    if (speechAPI) {
      speechAPI.sendAudioChunk(pcmBuffer.buffer as ArrayBuffer);
    }
  }, []);

  const setSpeechProvider = useCallback(async (providerId: string) => {
    const speechAPI = getSpeechAPI();
    if (!speechAPI?.setProvider) {
      return {
        success: false,
        error: 'Speech provider switching is not available in the current bridge.',
      };
    }

    return speechAPI.setProvider(providerId);
  }, []);

  const getSpeechProviders = useCallback(async () => {
    const speechAPI = getSpeechAPI();
    if (!speechAPI?.getProviders) {
      return [];
    }

    return speechAPI.getProviders();
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
    setSpeechProvider,
    getSpeechProviders,
  };
}

