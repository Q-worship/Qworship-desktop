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
import { evaluateConfidence, findCollisionGroup, type CGEConfig } from '@/lib/confidenceGatingEngine';
import { CGE_CONFIG_OFFLINE_VOSK, CGE_CONFIG_ONLINE_WHISPER, VOSK_COLLISION_GROUPS, COLLISION_CANDIDATE_SCORE_STEP } from '@/lib/cgeConfigs';
import { getLiveConsoleBibleBooks } from '@/features/dashboard/data/bibleBooks';

/** A candidate that the CGE has routed to the Confidence Queue. */
export interface CGEQueueCandidate {
  /** Unique ID (Date.now()) for React key and removal. */
  id: number;
  /** Resolved Bible reference label, e.g. "Malachi 3:10". */
  reference: string;
  /** Bible version abbreviation, e.g. "KJV". */
  version: string;
  /** Effective confidence score after structural penalties (0–1). */
  confidence: number;
  /** Human-readable reason the CGE queued this result. */
  reason: string;
  /** The full parsed result ready to project if the pastor confirms. */
  lookupResult: any;
  /** Timestamp when this candidate was created (ms). */
  createdAt: number;
}

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
  /**
   * Called when the CGE routes a lookup result to the Confidence Queue instead
   * of projecting it automatically. The pastor can confirm or dismiss it.
   */
  onConfidenceQueue?: (candidate: CGEQueueCandidate) => void;
  /**
   * The active speech provider ID — used to select the appropriate CGE config.
   * Defaults to 'offline-vosk' if not supplied.
   */
  activeSpeechProviderId?: string | null;
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

/** Select the CGE config appropriate for the active speech provider. */
function getCGEConfig(providerId: string | null | undefined): CGEConfig {
  if (providerId && providerId.includes('whisper') && !providerId.includes('legacy')) {
    return CGE_CONFIG_ONLINE_WHISPER;
  }
  return CGE_CONFIG_OFFLINE_VOSK;
}

/**
 * Return the collision groups map for the active provider.
 * Only offline-vosk uses collision groups; online-whisper does not.
 */
function getCGECollisionGroups(
  providerId: string | null | undefined,
): Record<string, string[]> | undefined {
  if (providerId && providerId.includes('whisper') && !providerId.includes('legacy')) {
    return undefined; // Whisper is accurate enough — no collision groups needed
  }
  return VOSK_COLLISION_GROUPS;
}

/** Bible book metadata cache — built once at module load. */
const BIBLE_BOOK_CHAPTER_MAP = new Map<string, number>(
  getLiveConsoleBibleBooks().map((b) => [b.name.toLowerCase(), b.chapters]),
);

/**
 * Return true if the given book has at least `chapter` chapters.
 * Used to filter impossible collision-group candidates.
 */
function bookHasChapter(bookName: string, chapter: number): boolean {
  const maxChapters = BIBLE_BOOK_CHAPTER_MAP.get(bookName.toLowerCase());
  if (maxChapters == null) return true; // Unknown book — allow through
  return chapter >= 1 && chapter <= maxChapters;
}

export const useLocalWhisper = ({
  onBibleMatch,
  onPartialTranscript,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
  onConfidenceQueue,
  activeSpeechProviderId,
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
    onConfidenceQueue,
    activeSpeechProviderId,
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
      onConfidenceQueue,
      activeSpeechProviderId,
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

        // ── Confidence Gating Engine ─────────────────────────────────────
        const cgeConfig = getCGEConfig(cb.activeSpeechProviderId);
        const cgeCollisionGroups = getCGECollisionGroups(cb.activeSpeechProviderId);
        const cgeInput = {
          commandType: command.commandType,
          confidence: command.confidence,
          hasChapterCue: command.hasChapterCue ?? false,
          hasVerseCue: command.hasVerseCue ?? false,
          hasBook: !!command.parsedReference.book,
          hasChapter: command.parsedReference.chapter > 0,
          hasVerse: command.parsedReference.verseStart > 0,
          resolvedBook: command.parsedReference.book,
        };
        const cgeDecision = evaluateConfidence(cgeInput, trimmed, cgeConfig, cgeCollisionGroups);

        console.log(
          `[CGE] ${cgeDecision.action.toUpperCase()} — ${cgeDecision.reason}`,
          `(effective confidence: ${Math.round(cgeDecision.effectiveConfidence * 100)}%)`,
        );

        if (cgeDecision.action === 'drop') {
          // Silently discard — do not project, do not show error
          return;
        }

        // ── Multi-candidate collision group path ─────────────────────────
        if (cgeDecision.action === 'queue_multi' && cgeDecision.collisionGroup) {
          if (cb.onConfidenceQueue) {
            const chapter = command.parsedReference.chapter;
            const verseStart = command.parsedReference.verseStart;
            const version = command.parsedReference.version;
            const baseScore = cgeDecision.effectiveConfidence;
            const batchId = Date.now();

            // Generate a candidate for each book in the collision group,
            // filtering out books that don't have the requested chapter.
            const candidatePromises = cgeDecision.collisionGroup
              .filter((bookName) => bookHasChapter(bookName, chapter))
              .map(async (bookName, index) => {
                const candidateRef = {
                  book: bookName,
                  chapter,
                  verseStart,
                  version,
                };
                const candidateResult = await lookupOffline(candidateRef);
                if (!candidateResult || candidateResult.verses.length === 0) return null;

                const versesFormatted = candidateResult.verses.map((v) => {
                  const entry: Record<string, any> = { verse: v.number };
                  entry[candidateResult.version] = v.text;
                  return entry;
                });

                const matchPayload = {
                  success: true,
                  commandType: 'lookup',
                  requestedVersion: version,
                  result: {
                    book: candidateResult.book,
                    chapter: candidateResult.chapter,
                    version: candidateResult.version,
                    verses: versesFormatted,
                  },
                };

                const referenceLabel =
                  candidateResult.book + ' ' + candidateResult.chapter + ':' +
                  (candidateResult.verses[0]?.number ?? verseStart);

                // Fixed-spread confidence: primary candidate keeps base score,
                // each subsequent candidate is reduced by COLLISION_CANDIDATE_SCORE_STEP.
                const candidateConfidence = Math.max(
                  0,
                  baseScore - index * COLLISION_CANDIDATE_SCORE_STEP,
                );

                const candidate: CGEQueueCandidate = {
                  id: batchId + index,
                  reference: referenceLabel,
                  version: candidateResult.version.toUpperCase(),
                  confidence: candidateConfidence,
                  reason: `Acoustic collision group — candidate ${index + 1} of ${cgeDecision.collisionGroup!.length}`,
                  lookupResult: matchPayload,
                  createdAt: batchId,
                };
                return candidate;
              });

            const candidates = (await Promise.all(candidatePromises)).filter(
              (c): c is CGEQueueCandidate => c !== null,
            );

            candidates.forEach((candidate) => cb.onConfidenceQueue!(candidate));
          } else {
            // No queue handler — fall through to project the primary result
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
            }
          }
          return;
        }

        // ── Single-candidate path (project or queue) ─────────────────────
        const result = await lookupOffline(command.parsedReference);

        if (!result || result.verses.length === 0) {
          cb.onBibleMatch?.({
            success: false,
            error: `Verse not found: ${trimmed}`,
          });
          return;
        }

        const versesFormatted = result.verses.map((v) => {
          const entry: Record<string, any> = { verse: v.number };
          entry[result.version] = v.text;
          return entry;
        });

        const matchPayload = {
          success: true,
          commandType: 'lookup',
          requestedVersion: command.parsedReference.version,
          result: {
            book: result.book,
            chapter: result.chapter,
            version: result.version,
            verses: versesFormatted,
          },
        };

        if (cgeDecision.action === 'queue') {
          // Route to Confidence Queue — do not project automatically
          if (cb.onConfidenceQueue) {
            const referenceLabel =
              result.book + ' ' + result.chapter + ':' +
              (result.verses[0]?.number ?? command.parsedReference.verseStart);
            const candidate: CGEQueueCandidate = {
              id: Date.now(),
              reference: referenceLabel,
              version: result.version.toUpperCase(),
              confidence: cgeDecision.effectiveConfidence,
              reason: cgeDecision.reason,
              lookupResult: matchPayload,
              createdAt: Date.now(),
            };
            cb.onConfidenceQueue(candidate);
          } else {
            // No queue handler registered — fall through to project
            cb.onBibleMatch?.(matchPayload);
          }
          return;
        }

        // action === 'project' — auto-project immediately
        cb.onBibleMatch?.(matchPayload);
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
    });

    cleanupRef.current = [unsubPartial, unsubFinal, unsubStatus];

    try {
      const status = await speechAPI.getStatus();
      if (status.status === 'ready' || status.status === 'processing') {
        setIsConnected(true);
      }
    } catch (error) {
      console.warn('[useLocalWhisper] Failed to read speech status before connect', error);
    }

    speechAPI.startListening();
    setIsConnected(true);
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

