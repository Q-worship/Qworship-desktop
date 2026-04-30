import { EventEmitter } from "node:events";


import { WhisperModelManager } from "./whisperModelManager";
import { WhisperService } from "./whisperService";
import type {
  SpeechProvider,
  SpeechProviderDescriptor,
  SpeechStatusPayload,
  SpeechTranscriptPayload,
  SpeechProviderFactoryContext,
} from "./speechTypes";

// Use the 5-bit quantized model (31 MB vs 75 MB unquantized) for faster CPU inference
// while maintaining accuracy with Bible-domain prompt biasing.
const DEFAULT_MODEL = "ggml-tiny.en-q5_1.bin";

export class OfflineWhisperSpeechProvider
  extends EventEmitter
  implements SpeechProvider
{
  readonly descriptor: SpeechProviderDescriptor = {
    id: "offline-whisper",
    label: "Offline Whisper",
    mode: "offline",
  };

  private readonly whisperService = new WhisperService();
  private readonly modelManager = new WhisperModelManager();
  private initialized = false;

  constructor(private readonly context: SpeechProviderFactoryContext = {}) {
    super();
    this.bindLegacyEvents();
  }

  private bindLegacyEvents() {
    this.whisperService.on("transcript-partial", (text: string) => {
      const payload: SpeechTranscriptPayload = {
        text,
        isFinal: false,
        provider: this.descriptor,
      };
      this.emit("transcript-partial", payload);
    });

    this.whisperService.on("transcript-final", (text: string) => {
      const payload: SpeechTranscriptPayload = {
        text,
        isFinal: true,
        provider: this.descriptor,
      };
      this.emit("transcript-final", payload);
    });

    this.whisperService.on("status-change", (status: string, message?: string) => {
      const payload: SpeechStatusPayload = {
        status: status as SpeechStatusPayload["status"],
        message,
        provider: this.descriptor,
      };
      this.emit("status-change", payload);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const modelPath = await this.modelManager.ensureModelExists(
      DEFAULT_MODEL,
      (progress) => {
        this.context.sendModelDownloadProgress?.(
          progress.percent,
          progress.downloadedMB,
          progress.totalMB,
        );
      },
    );

    await this.whisperService.initialize(modelPath);
    this.initialized = true;
  }

  startListening(): void {
    this.whisperService.startListening();
  }

  async stopListening(): Promise<void> {
    await this.whisperService.stopListening();
  }

  feedAudioChunk(pcm16: Int16Array): void {
    this.whisperService.feedAudioChunk(pcm16);
  }

  getStatus() {
    return this.whisperService.getStatus();
  }

  async shutdown(): Promise<void> {
    await this.whisperService.shutdown();
    this.initialized = false;
  }
}
