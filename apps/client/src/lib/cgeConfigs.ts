/**
 * Per-engine Confidence Gating Engine (CGE) configurations.
 *
 * offline-vosk uses tighter thresholds because the Vosk small acoustic model
 * produces lower-quality transcripts with more acoustic confusions (e.g.
 * Nahum→Luke, Malachi→Mark).
 *
 * online-whisper uses looser thresholds because the Whisper model is
 * significantly more accurate and rarely produces structural omissions.
 *
 * Import the appropriate config and pass it to evaluateConfidence().
 */

import type { CGEConfig } from './confidenceGatingEngine';

/**
 * CGE configuration for the offline-vosk speech provider.
 *
 * Thresholds are deliberately conservative:
 * - autoProjectThreshold: 0.88  — only project when confidence is high
 * - queueThreshold: 0.65        — queue borderline results for pastor review
 * - chapterCuePenalty: 0.18     — heavy penalty for missing "chapter" cue
 * - verseCuePenalty: 0.15       — heavy penalty for missing "verse" cue
 * - minWordCount: 4             — "show john three sixteen" = 4 words minimum
 */
export const CGE_CONFIG_OFFLINE_VOSK: CGEConfig = {
  autoProjectThreshold: 0.88,
  queueThreshold: 0.65,
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
 * - queueThreshold: 0.55        — lower floor before dropping
 * - chapterCuePenalty: 0.10     — lighter penalty (Whisper rarely omits cues)
 * - verseCuePenalty: 0.08       — lighter penalty
 * - minWordCount: 3             — Whisper can reliably parse 3-word references
 */
export const CGE_CONFIG_ONLINE_WHISPER: CGEConfig = {
  autoProjectThreshold: 0.82,
  queueThreshold: 0.55,
  requireChapterCue: false,
  requireVerseCue: false,
  chapterCuePenalty: 0.10,
  verseCuePenalty: 0.08,
  minWordCount: 3,
};
