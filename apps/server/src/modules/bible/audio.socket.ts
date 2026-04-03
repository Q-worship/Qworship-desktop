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

export function setupAudioSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/api/bible/audio-stream" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[AudioSocket] Client connected to live audio stream");

    let transcriptBuffer = "";

    // Initialize OpenAI streaming service
    const transcriptionService = new TranscriptionService();
    transcriptionService.connect();

    let lastExecutedCommandTime = 0;

    const processTranscript = async (text: string, isPartial: boolean) => {
      if (!text || text.trim().length < 3) return;

      try {
        const command = BibleService.parseVoiceCommandOptimized(text);

        // For partials, only act on high confidence deterministic matches
        if (isPartial && command.confidence < 0.9) {
          return;
        }

        const now = Date.now();
        // Prevent duplicate execution of the same command within a short window
        if (now - lastExecutedCommandTime < 2500) {
          return;
        }

        // Execute the command
        lastExecutedCommandTime = now;

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
          const result = await BibleService.searchBible(
            command.parsedReference,
          );
          if (result) {
            ws.send(
              JSON.stringify({
                type: "bible_match",
                result: result,
                commandType: command.commandType,
              }),
            );
          }
        } else if (!isPartial) {
          // AI Fallback only for final transcripts
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
                }),
              );
            }
          }
        }
      } catch (err) {
        console.error("[AudioSocket] Error processing Voice Command:", err);
      }
    };

    transcriptionService.on("partial", async (text: string) => {
      ws.send(
        JSON.stringify({
          type: "transcript_partial",
          text: text,
        }),
      );
      await processTranscript(text, true);
    });

    transcriptionService.on("final", async (text: string) => {
      console.log(`[AudioSocket] Final Transcript: ${text}`);
      ws.send(
        JSON.stringify({
          type: "transcript_final",
          text: text,
        }),
      );
      await processTranscript(text, false);
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
      // Forward incoming audio bytes strictly to OpenAI
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
