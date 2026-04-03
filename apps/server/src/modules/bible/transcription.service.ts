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
              "You are a highly accurate transcription engine for a live church service. The user will dictate bible verses or commands. Just output exactly what they say in English. Do not act as a conversational assistant. Ignore non-English speech and background noise. Expected vocabulary includes: Bible, Jesus Christ, God, Holy Spirit, worship, Hallelujah, Amen, Genesis, Revelation, chapter, verse.",
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
      this.openaiWs.close();
      this.openaiWs = null;
    }
    this.isConnected = false;
  }

  private handleOpenAIEvent(event: any) {
    switch (event.type) {
      // Stream partial audio transcription output delta
      case "response.audio_transcript.delta":
        this.emit("partial", event.delta);
        break;

      // Completed speech transcription chunk
      case "conversation.item.input_audio_transcription.completed":
        this.emit("final", event.transcript);
        break;

      // Realtime API can sometimes respond in the text delta
      case "response.text.delta":
        this.emit("partial", event.delta);
        break;

      case "response.text.done":
        this.emit("final", event.text);
        break;
    }
  }
}
