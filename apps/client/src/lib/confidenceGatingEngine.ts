/**
 * Confidence Gating Engine (CGE)
 *
 * A real-time decision layer that sits between the speech recognition pipeline
 * and the Bible projection system. For every parsed voice command it decides:
 *
 *   - AUTO-PROJECT   (confidence ≥ autoProjectThreshold + structurally complete
 *                     AND the resolved book is NOT in a collision group)
 *   - CONFIDENCE QUEUE  (confidence ≥ queueThreshold but below auto-project, or
 *                        structurally incomplete but still resolvable)
 *   - QUEUE_MULTI    (resolved book belongs to a collision group — all group
 *                     members are sent to the queue as a ranked batch)
 *   - DROP           (confidence < queueThreshold, or structurally unresolvable)
 *
 * The engine is stateless and engine-agnostic. Callers supply a CGEConfig that
 * sets the thresholds appropriate for the active speech provider (offline-vosk
 * uses tighter thresholds than online-whisper).
 *
 * @module confidenceGatingEngine
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The four possible routing decisions returned by the CGE. */
export type CGEAction = 'project' | 'queue' | 'queue_multi' | 'drop';

export interface CGEDecision {
  action: CGEAction;
  /** Human-readable reason — used for debug logging and regression tests. */
  reason: string;
  /**
   * The effective confidence score after structural penalties have been applied.
   * This is what is displayed in the Confidence Queue card (e.g. "71%").
   */
  effectiveConfidence: number;
  /**
   * For queue_multi action: the ordered list of collision-group book names
   * (canonical, e.g. ["Zechariah", "Jeremiah", "Zephaniah"]).
   * The primary candidate (spoken book) is always first.
   * Undefined for all other actions.
   */
  collisionGroup?: string[];
}

/**
 * Per-engine configuration for the CGE.
 * Use CGE_CONFIG_OFFLINE_VOSK or CGE_CONFIG_ONLINE_WHISPER from cgeConfigs.ts.
 */
export interface CGEConfig {
  /**
   * Minimum confidence score required for automatic projection.
   * Results at or above this threshold are projected immediately without
   * any confirmation from the pastor.
   */
  autoProjectThreshold: number;

  /**
   * Minimum confidence score required to enter the Confidence Queue.
   * Results below this threshold are silently dropped.
   */
  queueThreshold: number;

  /**
   * When true, the absence of an explicit "chapter" cue in the transcript
   * applies a confidence penalty (chapterCuePenalty).
   */
  requireChapterCue: boolean;

  /**
   * When true, the absence of an explicit "verse" cue in the transcript
   * applies a confidence penalty (verseCuePenalty).
   */
  requireVerseCue: boolean;

  /**
   * Confidence penalty applied when requireChapterCue is true and no chapter
   * cue was detected in the transcript.
   */
  chapterCuePenalty: number;

  /**
   * Confidence penalty applied when requireVerseCue is true and no verse
   * cue was detected in the transcript.
   */
  verseCuePenalty: number;

  /**
   * Minimum number of words required in the transcript for a lookup command
   * to be considered. Transcripts shorter than this are dropped immediately.
   */
  minWordCount: number;
}

/**
 * The subset of ParsedVoiceCommand fields that the CGE needs.
 * Keeping this interface narrow avoids a circular dependency with
 * offlineBibleEngine.ts.
 */
export interface CGECommandInput {
  commandType: string;
  /** Raw confidence score from parseVoiceCommand (0.0 – 1.0). */
  confidence: number;
  /** True if the transcript contained an explicit "chapter" cue word. */
  hasChapterCue: boolean;
  /** True if the transcript contained an explicit "verse" cue word. */
  hasVerseCue: boolean;
  /** True if a Bible book was successfully resolved. */
  hasBook: boolean;
  /** True if a chapter number was successfully resolved. */
  hasChapter: boolean;
  /** True if a verse number was successfully resolved. */
  hasVerse: boolean;
  /**
   * The resolved canonical book name (e.g. "Zechariah").
   * Used for collision-group detection.
   */
  resolvedBook?: string;
}

// ---------------------------------------------------------------------------
// Core evaluation function
// ---------------------------------------------------------------------------

/**
 * Evaluate a parsed voice command against the supplied CGE configuration and
 * return a routing decision.
 *
 * @param command        Parsed command fields needed for evaluation.
 * @param rawTranscript  The raw transcript string (used for word-count check).
 * @param config         Per-engine CGE configuration.
 * @param collisionGroups  Optional map of spoken-book → collision group members.
 *                         Pass VOSK_COLLISION_GROUPS for offline-vosk.
 * @returns A CGEDecision with action, reason, and effectiveConfidence.
 */
export function evaluateConfidence(
  command: CGECommandInput,
  rawTranscript: string,
  config: CGEConfig,
  collisionGroups?: Record<string, string[]>,
): CGEDecision {
  // Only lookup commands are gated — navigation/version commands pass through.
  if (command.commandType !== 'lookup') {
    return {
      action: 'project',
      reason: 'Non-lookup command — CGE pass-through',
      effectiveConfidence: 1.0,
    };
  }

  // ── Hard structural DROP rules ──────────────────────────────────────────

  // 1. Minimum word count
  const wordCount = rawTranscript.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < config.minWordCount) {
    return {
      action: 'drop',
      reason: `Transcript too short (${wordCount} words, min ${config.minWordCount})`,
      effectiveConfidence: 0,
    };
  }

  // 2. No book resolved — cannot project anything meaningful
  if (!command.hasBook) {
    return {
      action: 'drop',
      reason: 'No Bible book resolved',
      effectiveConfidence: 0,
    };
  }

  // 3. No chapter resolved
  if (!command.hasChapter) {
    return {
      action: 'drop',
      reason: 'No chapter number resolved',
      effectiveConfidence: 0,
    };
  }

  // 4. No verse resolved
  if (!command.hasVerse) {
    return {
      action: 'drop',
      reason: 'No verse number resolved',
      effectiveConfidence: 0,
    };
  }

  // ── Confidence score with structural penalties ───────────────────────────

  let score = command.confidence;

  if (config.requireChapterCue && !command.hasChapterCue) {
    score -= config.chapterCuePenalty;
  }

  if (config.requireVerseCue && !command.hasVerseCue) {
    score -= config.verseCuePenalty;
  }

  // Clamp to [0, 1]
  const effectiveConfidence = Math.max(0, Math.min(1, score));

  // ── Collision group detection ────────────────────────────────────────────

  if (collisionGroups && command.resolvedBook) {
    const group = findCollisionGroup(command.resolvedBook, collisionGroups);
    if (group) {
      // The resolved book is in a known collision group — always route to
      // queue_multi regardless of confidence score, so the pastor can pick
      // the correct book from the full ranked list.
      return {
        action: 'queue_multi',
        reason: `Book "${command.resolvedBook}" is in acoustic collision group [${group.join(', ')}]`,
        effectiveConfidence,
        collisionGroup: group,
      };
    }
  }

  // ── Standard routing decision ────────────────────────────────────────────

  if (effectiveConfidence >= config.autoProjectThreshold) {
    return {
      action: 'project',
      reason: `Confidence ${pct(effectiveConfidence)} ≥ auto-project threshold ${pct(config.autoProjectThreshold)}`,
      effectiveConfidence,
    };
  }

  if (effectiveConfidence >= config.queueThreshold) {
    const reasons: string[] = [];
    if (config.requireChapterCue && !command.hasChapterCue) {
      reasons.push('no chapter cue');
    }
    if (config.requireVerseCue && !command.hasVerseCue) {
      reasons.push('no verse cue');
    }
    if (reasons.length === 0) {
      reasons.push(`confidence ${pct(effectiveConfidence)} below auto-project threshold`);
    }
    return {
      action: 'queue',
      reason: `Queued — ${reasons.join(', ')}`,
      effectiveConfidence,
    };
  }

  return {
    action: 'drop',
    reason: `Confidence ${pct(effectiveConfidence)} below queue threshold ${pct(config.queueThreshold)}`,
    effectiveConfidence,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the collision group that contains the given book name.
 * Returns the group array (with the spoken book first) if found, or null.
 */
export function findCollisionGroup(
  bookName: string,
  collisionGroups: Record<string, string[]>,
): string[] | null {
  const normalised = bookName.toLowerCase().trim();
  for (const [, members] of Object.entries(collisionGroups)) {
    if (members.some((m) => m.toLowerCase() === normalised)) {
      return members;
    }
  }
  return null;
}

function pct(score: number): string {
  return `${Math.round(score * 100)}%`;
}
