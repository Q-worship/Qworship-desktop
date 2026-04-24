/**
 * useLocalWhisper — Local IPC-based transcription hook.
 *
 * Drop-in replacement for `useRealtimeSocket`. Instead of streaming audio
 * over a WebSocket to a cloud server, this hook routes audio to the Electron
 * Main Process via IPC where whisper.cpp runs inference locally.
 *
 * The hook also handles command parsing locally using the offlineBibleEngine,
 * eliminating the need for any server-side logic.
 *
 * OPTIMIZATIONS (sliding window + early detection):
 * - Partial transcripts are parsed with `detectBookAndChapter()` for
 *   early Bible reference detection ("John 3" triggers prefetch)
 * - Speculative prefetch loads chapter data from IndexedDB before the
 *   user finishes speaking
 * - Full `parseVoiceCommand()` still runs on final transcripts for
 *   navigation, version changes, and confirmed lookups
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  parseVoiceCommand,
  lookupOffline,
  detectBookAndChapter,
  prefetchChapter,
  type BibleVersion,
  type BibleReference,
  type EarlyDetection,
  type OfflineBibleResult,
} from '@/lib/offlineBibleEngine';
import { useBibleRAMCache } from '@/features/dashboard/hooks/useBibleRAMCache';

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

/** Type for the preload-exposed whisper API */
interface WhisperAPI {
  sendAudioChunk: (pcm16Buffer: ArrayBuffer) => void;
  startListening: () => void;
  stopListening: () => void;
  getStatus: () => Promise<string>;
  onTranscriptPartial: (callback: (text: string) => void) => () => void;
  onTranscriptFinal: (callback: (text: string) => void) => () => void;
  onStatusChange: (callback: (status: string, message?: string) => void) => () => void;
  onModelDownloadProgress: (callback: (percent: number, downloadedMB: number, totalMB: number) => void) => () => void;
}

/** Access the whisper API exposed via preload */
function getWhisperAPI(): WhisperAPI | null {
  const api = (window as any).api;
  return api?.whisper ?? null;
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

  // ── 3-Tier Lookup Helper ────────────────────────────────────────
  // Matches the same fallback chain as useInlineBibleBrowser/useHFBStore:
  // RAM Cache → IndexedDB → Cloud API
  const lookupWithFallback = useCallback(async (
    ref: BibleReference,
  ): Promise<OfflineBibleResult | null> => {
    const vKey = ref.version;

    // Tier 1: RAM Cache (0ms)
    const ramVerses = useBibleRAMCache.getState().getChapter(vKey, ref.book, ref.chapter);
    if (ramVerses && ramVerses.length > 0) {
      const filtered = ramVerses.filter(
        (v) => v.number >= ref.verseStart && (ref.verseEnd ? v.number <= ref.verseEnd : true),
      );
      if (filtered.length > 0) {
        console.log(`[useLocalWhisper] 🚀 RAM Cache hit: ${ref.book} ${ref.chapter}`);
        return {
          book: ref.book,
          chapter: ref.chapter,
          verses: filtered,
          version: vKey,
          formattedReference: `${ref.book} ${ref.chapter}:${ref.verseStart}`,
        };
      }
    }

    // Tier 2: IndexedDB (offline engine)
    const offlineResult = await lookupOffline(ref);
    if (offlineResult && offlineResult.verses.length > 0) {
      console.log(`[useLocalWhisper] 📦 IndexedDB hit: ${ref.book} ${ref.chapter}`);
      return offlineResult;
    }

    // Tier 3: Cloud API fallback
    try {
      console.log(`[useLocalWhisper] ☁️ Cloud fallback: ${ref.book} ${ref.chapter}:${ref.verseStart}`);
      const resp = await fetch('/api/bible/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: ref.book,
          chapter: ref.chapter,
          verseStart: ref.verseStart,
          verseEnd: ref.verseEnd ?? ref.verseStart,
          version: vKey,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.result) {
          const verses = (data.result.verses || []).map((v: any) => ({
            number: v.verse,
            text: v[vKey] || v.kjv || '',
          }));
          if (verses.length > 0) {
            return {
              book: ref.book,
              chapter: ref.chapter,
              verses,
              version: vKey,
              formattedReference: `${ref.book} ${ref.chapter}:${ref.verseStart}`,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[useLocalWhisper] Cloud API fallback failed:', err);
    }

    return null;
  }, []);

  // ── Speculative Prefetch Cache ──────────────────────────────────
  // Caches chapter data from IndexedDB when we detect a book+chapter
  // in a partial transcript, so the verse lookup is instant when the
  // full reference arrives.
  const prefetchCacheRef = useRef<{
    key: string;
    data: OfflineBibleResult;
  } | null>(null);

  /** Track the last early detection to avoid redundant prefetches */
  const lastDetectionRef = useRef<string>('');

  /**
   * Track whether the current partial has already triggered a bible match.
   * Reset when a new final transcript arrives.
   */
  const partialMatchDeliveredRef = useRef(false);

  /**
   * Process a partial transcript for early Bible reference detection.
   * This runs on every sliding window partial (~750ms intervals).
   */
  const processPartialForEarlyDetection = useCallback(async (text: string) => {
    if (isSleepingRef.current) return;

    const detection = detectBookAndChapter(text);
    if (!detection || !detection.book) return;

    // Build a key for deduplication
    const detectionKey = `${detection.book}:${detection.chapter ?? ''}:${detection.verse ?? ''}`;
    if (detectionKey === lastDetectionRef.current) return; // Already processed
    lastDetectionRef.current = detectionKey;

    const version = currentVersionRef.current;

    // Stage 1: Book detected → log it (prefetch could happen here for book metadata)
    if (detection.book && !detection.chapter) {
      console.log(`[EarlyDetect] Book detected: "${detection.book}" — waiting for chapter...`);
      return;
    }

    // Stage 2: Book + Chapter detected → speculative prefetch
    if (detection.book && detection.chapter && !detection.verse) {
      console.log(`[EarlyDetect] Prefetching: ${detection.book} ${detection.chapter}`);
      const chapterData = await prefetchChapter(detection.book, detection.chapter, version);
      if (chapterData) {
        prefetchCacheRef.current = {
          key: `${detection.book}:${detection.chapter}:${version}`,
          data: chapterData,
        };
        console.log(`[EarlyDetect] Prefetched ${chapterData.verses.length} verses for ${detection.book} ${detection.chapter}`);
      }
      return;
    }

    // Stage 3: Book + Chapter + Verse detected → immediate display!
    if (detection.book && detection.chapter && detection.verse && !partialMatchDeliveredRef.current) {
      console.log(`[EarlyDetect] 🎯 Full reference from partial: ${detection.book} ${detection.chapter}:${detection.verse}`);
      partialMatchDeliveredRef.current = true;

      // Try to use the prefetched cache first (instant, no DB hit)
      const cacheKey = `${detection.book}:${detection.chapter}:${version}`;
      let result: OfflineBibleResult | null = null;

      if (prefetchCacheRef.current?.key === cacheKey) {
        // Use cached chapter data — filter to the specific verse
        const cached = prefetchCacheRef.current.data;
        const matchedVerses = cached.verses.filter((v) => v.number === detection.verse);
        if (matchedVerses.length > 0) {
          result = {
            ...cached,
            verses: matchedVerses,
            formattedReference: `${detection.book} ${detection.chapter}:${detection.verse}`,
          };
        }
      }

      // If cache miss, fall back to 3-tier lookup (RAM → IndexedDB → Cloud API)
      if (!result) {
        result = await lookupWithFallback({
          book: detection.book,
          chapter: detection.chapter,
          verseStart: detection.verse,
          version,
        });
      }

      if (result && result.verses.length > 0) {
        const versesFormatted = result.verses.map((v) => {
          const entry: Record<string, any> = { verse: v.number };
          entry[result!.version] = v.text;
          return entry;
        });

        callbacks.current.onBibleMatch?.({
          success: true,
          commandType: 'lookup',
          result: {
            book: result.book,
            chapter: result.chapter,
            verses: versesFormatted,
          },
        });
      }
    }
  }, []);

  /**
   * Process a final transcript: parse the voice command and dispatch
   * the appropriate callback (bible match, navigation, version change, etc.)
   */
  const processTranscript = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Reset early detection state for next utterance
    partialMatchDeliveredRef.current = false;
    lastDetectionRef.current = '';
    prefetchCacheRef.current = null;

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

        // Look up the verse using 3-tier fallback (RAM → IndexedDB → Cloud API)
        const result = await lookupWithFallback(command.parsedReference);
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
    const whisperAPI = getWhisperAPI();
    if (!whisperAPI) {
      console.warn('[useLocalWhisper] Whisper API not available (not running in Electron?)');
      return;
    }

    // Set up IPC event listeners
    const unsubPartial = whisperAPI.onTranscriptPartial((text) => {
      callbacks.current.onPartialTranscript?.(text);
      // Run early detection on every partial transcript
      processPartialForEarlyDetection(text);
    });

    const unsubFinal = whisperAPI.onTranscriptFinal((text) => {
      callbacks.current.onFinalTranscript?.(text);
      processTranscript(text);
    });

    const unsubStatus = whisperAPI.onStatusChange((status, message) => {
      console.log('[useLocalWhisper] Whisper status:', status, message);
      setIsConnected(status === 'ready');
    });

    cleanupRef.current = [unsubPartial, unsubFinal, unsubStatus];

    // Tell main process to start listening
    whisperAPI.startListening();
    setIsConnected(true);
  }, [processTranscript, processPartialForEarlyDetection]);

  /**
   * Disconnect from the local whisper engine.
   */
  const disconnect = useCallback(() => {
    const whisperAPI = getWhisperAPI();
    if (whisperAPI) {
      whisperAPI.stopListening();
    }

    // Clean up IPC listeners
    cleanupRef.current.forEach((unsub) => unsub());
    cleanupRef.current = [];

    // Reset early detection state
    partialMatchDeliveredRef.current = false;
    lastDetectionRef.current = '';
    prefetchCacheRef.current = null;

    setIsConnected(false);
  }, []);

  /**
   * Send PCM16 audio data to the main process.
   * Drop-in replacement for the old WebSocket `sendPCMData`.
   */
  const sendPCMData = useCallback((pcmBuffer: Int16Array) => {
    const whisperAPI = getWhisperAPI();
    if (whisperAPI) {
      // Transfer the ArrayBuffer to the main process
      whisperAPI.sendAudioChunk(pcmBuffer.buffer as ArrayBuffer);
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
