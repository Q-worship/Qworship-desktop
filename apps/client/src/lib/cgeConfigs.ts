/**
 * Per-engine Confidence Gating Engine (CGE) configurations.
 *
 * offline-vosk uses tighter thresholds because the Vosk small acoustic model
 * produces lower-quality transcripts with more acoustic confusions (e.g.
 * Nahum→Luke, Malachi→Mark/Micah, Zechariah→Jeremiah/Zephaniah).
 *
 * online-whisper uses looser thresholds because the Whisper model is
 * significantly more accurate and rarely produces structural omissions.
 *
 * Import the appropriate config and pass it to evaluateConfidence().
 */

import type { CGEConfig } from './confidenceGatingEngine';

// ---------------------------------------------------------------------------
// Acoustic Collision Groups (offline-vosk)
// ---------------------------------------------------------------------------

/**
 * Each collision group is keyed by the "spoken book" (what the pastor intends
 * to say) and lists ALL books that Vosk may confuse it with, including the
 * spoken book itself.
 *
 * When the CGE detects that the resolved book belongs to any collision group,
 * it generates a candidate for every member of the group using the same
 * chapter and verse numbers, filters out structurally impossible references
 * (e.g. Zephaniah chapter 15 — only 3 chapters exist), and routes the
 * surviving candidates to the Confidence Queue as a ranked batch.
 *
 * The spoken book is always listed first so it receives the highest
 * confidence score in the fixed-spread ranking.
 *
 * To add a new group after live testing, append a new entry here. The key
 * should be the lowercase canonical book name of the spoken book.
 */
export const VOSK_COLLISION_GROUPS: Record<string, string[]> = {
  // Zechariah is often heard as Jeremiah or Zephaniah by Vosk.
  zechariah: ['Zechariah', 'Jeremiah', 'Zephaniah'],

  // Malachi is often heard as Mark or Micah by Vosk.
  malachi: ['Malachi', 'Mark', 'Micah'],

  // Nahum is often heard as Luke by Vosk.
  nahum: ['Nahum', 'Luke'],

  // Ecclesiastes is often heard as Exodus by Vosk.
  ecclesiastes: ['Ecclesiastes', 'Exodus'],

  // Philippians is often heard as Philemon by Vosk.
  philippians: ['Philippians', 'Philemon'],
};

/**
 * Confidence score decrement applied to each successive candidate in a
 * collision group. The primary candidate (spoken book) keeps its natural
 * score; each additional candidate is reduced by this amount.
 *
 * Example with COLLISION_CANDIDATE_SCORE_STEP = 0.05:
 *   Zechariah  → 0.88 (natural score)
 *   Jeremiah   → 0.83
 *   Zephaniah  → 0.78
 */
export const COLLISION_CANDIDATE_SCORE_STEP = 0.05;

// ---------------------------------------------------------------------------
// Per-engine CGE configurations
// ---------------------------------------------------------------------------

/**
 * CGE configuration for the offline-vosk speech provider.
 *
 * Thresholds are deliberately conservative:
 * - autoProjectThreshold: 0.88  — only project when confidence is high
 * - queueThreshold: 0.55        — queue borderline results for pastor review
 * - chapterCuePenalty: 0.18     — heavy penalty for missing "chapter" cue
 * - verseCuePenalty: 0.15       — heavy penalty for missing "verse" cue
 * - minWordCount: 4             — "show john three sixteen" = 4 words minimum
 */
export const CGE_CONFIG_OFFLINE_VOSK: CGEConfig = {
  autoProjectThreshold: 0.88,
  queueThreshold: 0.55,
  requireChapterCue: true,
  requireVerseCue: true,
  chapterCuePenalty: 0.18,
  verseCuePenalty: 0.15,
  minWordCount: 4,
};

/**
 * CGE configuration for the online-whisper speech provider.
 *
 * Thresholds are more permissive:
 * - autoProjectThreshold: 0.82  — Whisper is accurate enough to trust more
 * - queueThreshold: 0.45        — lower floor before dropping
 * - chapterCuePenalty: 0.10     — lighter penalty (Whisper rarely omits cues)
 * - verseCuePenalty: 0.08       — lighter penalty
 * - minWordCount: 3             — Whisper can reliably parse 3-word references
 */
export const CGE_CONFIG_ONLINE_WHISPER: CGEConfig = {
  autoProjectThreshold: 0.82,
  queueThreshold: 0.45,
  requireChapterCue: false,
  requireVerseCue: false,
  chapterCuePenalty: 0.10,
  verseCuePenalty: 0.08,
  minWordCount: 3,
};
