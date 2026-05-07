import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import OpenAI from "openai";
import { TranscriptionService } from "./transcription.service.js";
import { BibleService } from "./bible.service.js";

// Lazy-init - avoids cost if never called
let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/**
 * QC45: Guard — only invoke the AI fallback when the transcript plausibly
 * contains a Bible reference. This prevents ambient speech, hallucinated
 * text, and general conversation from being sent to GPT-4o-mini.
 *
 * A transcript is considered plausible if it contains:
 *   (a) a known Bible book name (or common alias), AND
 *   (b) at least one number (chapter/verse indicator)
 *
 * This eliminates the vast majority of false-positive AI calls while still
 * allowing natural-language references like "turn to John three sixteen".
 */
const BIBLE_BOOK_KEYWORDS = [
  // OT
  "genesis","exodus","leviticus","numbers","deuteronomy","joshua","judges",
  "ruth","samuel","kings","chronicles","ezra","nehemiah","esther","job",
  "psalms","psalm","proverbs","ecclesiastes","isaiah","jeremiah","lamentations",
  "ezekiel","daniel","hosea","joel","amos","obadiah","jonah","micah",
  "nahum","habakkuk","zephaniah","haggai","zechariah","malachi",
  // NT
  "matthew","mark","luke","john","acts","romans","corinthians","galatians",
  "ephesians","philippians","colossians","thessalonians","timothy","titus",
  "philemon","hebrews","james","peter","jude","revelation",
];

const NUMBER_WORDS = [
  "one","two","three","four","five","six","seven","eight","nine","ten",
  "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen",
  "eighteen","nineteen","twenty","thirty","forty","fifty","sixty","seventy",
  "eighty","ninety","hundred","first","second","third",
];

function looksLikeBibleReference(text: string): boolean {
  const lower = text.toLowerCase();
  const hasBookName = BIBLE_BOOK_KEYWORDS.some(k => lower.includes(k));
  if (!hasBookName) return false;
  // Must also contain a digit or a number-word to indicate chapter/verse
  const hasNumber = /\d/.test(lower) || NUMBER_WORDS.some(w => lower.includes(w));
  return hasNumber;
}

/**
 * LLM fallback: ask GPT-4o-mini to extract a Bible reference from spoken text.
 * Returns a BibleReference-compatible object or null.
 */
async function extractReferenceWithAI(transcript: string): Promise<{
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
} | null> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Bible reference extractor. The user will give you a spoken sentence and you must extract the Bible reference if one exists. " +
            'Respond ONLY with a compact JSON object. Example: {"book":"John","chapter":3,"verseStart":16} ' +
            'or {"book":"Genesis","chapter":1,"verseStart":1,"verseEnd":3}. ' +
            'If no Bible reference can be identified, respond with: {"error":"no_reference"}. ' +
            "For numbered books, use the full canonical name e.g. '1 John', '2 Samuel'.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0,
      max_tokens: 80,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed.error || !parsed.book || !parsed.chapter || !parsed.verseStart) {
      return null;
    }

    console.log(
      `[AI Fallback] Extracted reference: ${parsed.book} ${parsed.chapter}:${parsed.verseStart}`,
    );
    return {
      book: parsed.book,
      chapter: Number(parsed.chapter),
      verseStart: Number(parsed.verseStart),
      verseEnd: parsed.verseEnd ? Number(parsed.verseEnd) : undefined,
    };
  } catch (err) {
    console.error("[AI Fallback] Failed to extract reference:", err);
    return null;
  }
}

/**
 * QC40 Phase 5: Build a canonical reference fingerprint string for deduplication.
 * Format: "Book:chapter:verse" — e.g. "Matthew:6:4", "1 John:3:16"
 */
function buildRefFingerprint(book: string, chapter: number, verse: number): string {
  return `${book}:${chapter}:${verse}`;
}

export function setupAudioSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/bible/audio-stream" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[AudioSocket] Client connected to live audio stream");

    // Initialize Deepgram streaming service
    const transcriptionService = new TranscriptionService();
    transcriptionService.connect();

    // QC50: Deduplication guard — fingerprint-based, 3s window for same verse
    let lastExecutedCommandTime = 0;
    let lastExecutedRefFingerprint = "";

    // QC34: Startup warmup window — suppress all transcripts for the first 2 seconds
    const connectedAt = Date.now();
    const STARTUP_WARMUP_MS = 2000;

    const processTranscript = async (
      text: string,
      isPartial: boolean,
      source: "vad" | "partial" | "buffer" = "vad",
    ) => {
      if (!text || text.trim().length < 3) return;

      // QC51: Skip transcripts with fewer than 3 words — they cannot contain a
      // valid Bible reference (e.g. "that", "where", "you know", "Again,").
      const wc = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (wc < 3) {
        console.log(`[AudioSocket] Skipping short transcript (${wc} words): "${text.trim().slice(0, 60)}"`);
        return;
      }

      // QC34: Discard any transcript received during the startup warmup window.
      if (Date.now() - connectedAt < STARTUP_WARMUP_MS) {
        console.log(`[AudioSocket] Startup warmup — suppressing transcript: "${text.trim().slice(0, 60)}"`);
        return;
      }

      // QC50: Partial early-triggering is DISABLED for Deepgram.
      // Deepgram interim results are word-by-word growing sentences (e.g. "John",
      // then "John three", then "John three sixteen"). The sliding-window parser
      // matches book names + numbers extremely aggressively on these short fragments,
      // causing false scripture projections from ordinary speech containing numbers
      // (e.g. "that's one", "give me a second", "five things at the same time").
      // Only speech_final=true transcripts (fully committed utterances) are used
      // for scripture lookup. Partials are displayed in the Live Transcript only.
      if (isPartial) return;

      try {
        // SCALPEL: Slice the block down to STRICTLY the last 25 words
        const words = text.trim().split(/\s+/);
        const rollingContext = words.slice(-25).join(" ");

        const command = BibleService.parseVoiceCommandOptimized(rollingContext);

        const now = Date.now();

        // Fingerprint-based dedup: suppress same verse within 3s
        if (command.parsedReference) {
          const fingerprint = buildRefFingerprint(
            command.parsedReference.book,
            command.parsedReference.chapter,
            command.parsedReference.verseStart,
          );
          if (
            fingerprint === lastExecutedRefFingerprint &&
            now - lastExecutedCommandTime < 3000
          ) {
            console.log(`[AudioSocket] Dedup: suppressing duplicate reference ${fingerprint} within 3s (source=${source})`);
            return;
          }
        } else if (
          command.commandType !== 'lookup' &&
          now - lastExecutedCommandTime < 1500
        ) {
          // Non-lookup commands (navigation, version, sleep, wake): 1500ms guard
          console.log(`[AudioSocket] Dedup: suppressing non-lookup command within 1500ms (source=${source})`);
          return;
        }

        // Execute the command
        if (command.commandType !== 'lookup' || command.parsedReference) {
          lastExecutedCommandTime = now;
        }

        if (command.commandType === "sleep") {
          ws.send(JSON.stringify({ type: "sleep_command" }));
        } else if (command.commandType === "wake") {
          ws.send(JSON.stringify({ type: "wake_command" }));
        } else if (
          command.commandType === "version_change" &&
          command.requestedVersion
        ) {
          ws.send(
            JSON.stringify({
              type: "version_change",
              requestedVersion: command.requestedVersion,
            }),
          );
        } else if (
          command.commandType === "verse_change" ||
          command.commandType === "chapter_change" ||
          command.commandType === "jump_to_verse" ||
          command.commandType === "last_verse" ||
          command.commandType === "jump_relative"
        ) {
          ws.send(
            JSON.stringify({
              type: "navigation",
              commandType: command.commandType,
              direction: command.navigationDirection,
              targetVerse: command.targetVerse,
              offset: command.offset,
            }),
          );
        } else if (command.parsedReference) {
          // QC50: Record the reference fingerprint for dedup
          const fingerprint = buildRefFingerprint(
            command.parsedReference.book,
            command.parsedReference.chapter,
            command.parsedReference.verseStart,
          );
          lastExecutedRefFingerprint = fingerprint;

          const result = await BibleService.searchBible(
            command.parsedReference,
          );
          if (result) {
            ws.send(
              JSON.stringify({
                type: "bible_match",
                result: result,
                commandType: command.commandType,
                clampNote: result.clampNote || null,
                source: source,
              }),
            );
          } else {
            const ref = command.parsedReference;
            const notFoundMsg = `${ref.book} ${ref.chapter}:${ref.verseStart} was not found`;
            console.warn(`[AudioSocket] verse_not_found: ${notFoundMsg}`);
            ws.send(
              JSON.stringify({
                type: "verse_not_found",
                message: notFoundMsg,
                reference: {
                  book: ref.book,
                  chapter: ref.chapter,
                  verseStart: ref.verseStart,
                },
              }),
            );
          }
        } else {
          // AI Fallback only for final transcripts
          // QC45: Only invoke AI fallback if the transcript plausibly contains a
          // Bible reference (book name + number).
          if (!looksLikeBibleReference(text)) {
            console.log(`[AudioSocket] AI fallback skipped — no Bible reference pattern in: "${text.trim().slice(0, 60)}"`);
            return;
          }
          console.log(
            `[AudioSocket] Deterministic parse failed for: "${text}". Invoking AI fallback...`,
          );
          const fallbackRef = await extractReferenceWithAI(text);
          if (fallbackRef) {
            const result = await BibleService.searchBible(fallbackRef);
            if (result) {
              ws.send(
                JSON.stringify({
                  type: "bible_match",
                  result: result,
                  commandType: "lookup",
                  source: "ai_fallback",
                  clampNote: result.clampNote || null,
                }),
              );
            } else {
              const notFoundMsg = `${fallbackRef.book} ${fallbackRef.chapter}:${fallbackRef.verseStart} was not found`;
              console.warn(`[AudioSocket] verse_not_found (AI fallback): ${notFoundMsg}`);
              ws.send(
                JSON.stringify({
                  type: "verse_not_found",
                  message: notFoundMsg,
                  reference: {
                    book: fallbackRef.book,
                    chapter: fallbackRef.chapter,
                    verseStart: fallbackRef.verseStart,
                  },
                }),
              );
            }
          }
        }
      } catch (err) {
        console.error("[AudioSocket] Error processing Voice Command:", err);
      }
    };

    // ─── Deepgram partial (interim) transcripts ───────────────────────────────
    // QC50: Partials are sent to the client for Live Transcript display ONLY.
    // They are NOT processed for scripture lookup (see processTranscript guard above).
    // This eliminates all hallucinations caused by partial early-triggering.
    transcriptionService.on("partial", (text: string) => {
      console.log(`[AudioSocket] Deepgram Partial: "${text.slice(0, 80)}"`);
      ws.send(
        JSON.stringify({
          type: "transcript_partial",
          text: text,
          hasBibleRef: BibleService.scanForBibleReference(text) !== null,
        }),
      );
      // NOTE: processTranscript is intentionally NOT called for partials.
    });

    // ─── Deepgram final transcripts (speech_final=true) ──────────────────────
    // QC50: Only committed, speech_final=true utterances trigger scripture lookup.
    transcriptionService.on("final", async (text: string) => {
      console.log(`[AudioSocket] Deepgram Final Transcript: ${text}`);
      ws.send(
        JSON.stringify({
          type: "transcript_final",
          text: text,
          hasBibleRef: BibleService.scanForBibleReference(text) !== null,
        }),
      );
      await processTranscript(text, false, "vad");
    });

    transcriptionService.on("error", (err) => {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Transcription Service Error",
        }),
      );
    });

    ws.on("message", async (data: Buffer | string) => {
      // Check if this is a JSON control message (e.g., vad_commit from Silero VAD)
      // rather than raw PCM audio bytes.
      if (typeof data === "string" || (data instanceof Buffer && data[0] === 0x7b /* '{' */)) {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "vad_commit") {
            // No-op for Deepgram — VAD is handled server-side via utterance_end_ms
            console.log("[AudioSocket] vad_commit received (no-op for Deepgram).");
            return;
          }
        } catch {
          // Not JSON — fall through to treat as audio bytes
        }
      }
      // Forward incoming audio bytes to Deepgram
      transcriptionService.processAudioChunk(data);
    });

    ws.on("close", () => {
      console.log("[AudioSocket] Client disconnected");
      transcriptionService.disconnect();
    });

    ws.on("error", (error) => {
      console.error("[AudioSocket] WebSocket error:", error);
      transcriptionService.disconnect();
    });
  });

  return wss;
}
