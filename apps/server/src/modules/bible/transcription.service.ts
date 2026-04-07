import WebSocket from "ws";
import { EventEmitter } from "events";
import { VoiceCommand } from "./bible.service.js";

// Emit partial/final transcripts and bible matches
export class TranscriptionService extends EventEmitter {
  private openaiWs: WebSocket | null = null;
  private readonly apiUrl =
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
  private isConnected = false;

  constructor() {
    super();
  }

  public connect() {
    console.log("[Transcription] Connecting to OpenAI Realtime...");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY in environment");
      this.emit("error", new Error("Missing API Key"));
      return;
    }

    this.openaiWs = new WebSocket(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    this.openaiWs.on("open", () => {
      this.isConnected = true;
      console.log("[Transcription] Connected to OpenAI Realtime API");

      this.openaiWs?.send(
        JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text"], // Only requesting text out from audio in
            instructions:
              "You are a raw audio-to-text phonetic correction engine. Your ONLY job is to output the transcript of the audio. NEVER act conversational. NEVER apologize. NEVER say 'I did not catch that' or 'Please repeat'. NEVER reply to the user. If the audio is empty, unclear, or you cannot understand it, simply output the exact word '[UNINTELLIGIBLE]' and nothing else. Fix phonetic errors into proper Bible books (Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, Judges, Ruth, Samuel, Kings, Chronicles, Ezra, Nehemiah, Esther, Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon, Isaiah, Jeremiah, Lamentations, Ezekiel, Daniel, Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk, Zephaniah, Haggai, Zechariah, Malachi, Matthew, Mark, Luke, John, Acts, Romans, Corinthians, Galatians, Ephesians, Philippians, Colossians, Thessalonians, Timothy, Titus, Philemon, Hebrews, James, Peter, Jude, Revelation). Output the pure transcript and absolutely nothing else.",
            input_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1",
              language: "en",
            },
            voice: "alloy",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }),
      );
    });

    this.openaiWs.on("message", (data: WebSocket.Data) => {
      try {
        const event = JSON.parse(data.toString());
        // Temporarily log all event types to debug connection
        console.log(`[Transcription] Received OpenAI event: ${event.type}`);
        if (event.type === "error") {
          console.error("[Transcription] OpenAI Error:", event.error);
        }
        this.handleOpenAIEvent(event);
      } catch (err) {
        console.error("Failed to parse OpenAI message", err);
      }
    });

    this.openaiWs.on("close", () => {
      this.isConnected = false;
      console.log("[Transcription] Disconnected from OpenAI");
    });

    this.openaiWs.on("error", (err: Error) => {
      console.error("[Transcription] OpenAI WS Error:", err);
      this.emit("error", err);
    });
  }

  public processAudioChunk(pcmData: Buffer | string) {
    if (!this.isConnected || !this.openaiWs) return;

    let base64Audio;
    if (typeof pcmData === "string") {
      // If frontend already sends base64 PCM chunks
      base64Audio = pcmData;
    } else {
      base64Audio = pcmData.toString("base64");
    }

    this.openaiWs.send(
      JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64Audio,
      }),
    );
  }

  public commitAudioBuffer() {
    if (!this.isConnected || !this.openaiWs) return;
    this.openaiWs.send(
      JSON.stringify({
        type: "input_audio_buffer.commit",
      }),
    );
    // Manually trigger server VAD response
    this.openaiWs.send(
      JSON.stringify({
        type: "response.create",
      }),
    );
  }

  public disconnect() {
    if (this.openaiWs) {
      if (this.openaiWs.readyState === WebSocket.CONNECTING) {
        // Prevent ws library from emitting unhandled 'error' event to old handlers when closing midway
        this.openaiWs.on("error", () => {});
      }
      try {
        if (this.openaiWs.readyState === WebSocket.OPEN || this.openaiWs.readyState === WebSocket.CONNECTING) {
          this.openaiWs.close();
        }
      } catch (err) {
        // Ignore "WebSocket was closed before the connection was established"
      }
      this.openaiWs = null;
    }
    this.isConnected = false;
  }

  private handleOpenAIEvent(event: any) {
    switch (event.type) {
      // 1. REAL-TIME UI FEEDBACK: Stream fast phonetic guesses from Whisper for instant visual typing effect
      case "conversation.item.input_audio_transcription.delta":
        this.emit("partial", event.delta);
        break;

      // 2. IGNORE WHISPER'S FINAL TRANSCRIPT: Because it suffers from phonetic hallucinations ("JoJo666")
      case "conversation.item.input_audio_transcription.completed":
        break;

      // 3. ACTUAL FINAL EXECUTION: Triggered ~500ms after the user stops speaking.
      // GPT-4o processes the audio natively, fixing phonetic errors Whisper couldn't understand.
      case "response.text.done":
        if (event.text && !event.text.includes("[UNINTELLIGIBLE]")) {
          // If the model still tries to apologize due to LLM stubbornness, drop it.
          const lowerText = event.text.toLowerCase();
          if (!lowerText.includes("could you please repeat") && !lowerText.includes("i did not catch that") && !lowerText.includes("complete sentence")) {
            this.emit("final", event.text);
          }
        }
        break;

      case "response.text.delta":
      case "response.audio_transcript.delta":
        break;
    }
  }
}
