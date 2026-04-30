import { EventEmitter } from "node:events";

import { OfflineWhisperSpeechProvider } from "./offlineWhisperSpeechProvider";
import { OnlineWhisperSpeechProvider } from "./onlineWhisperSpeechProvider";
import { VoskSpeechProvider } from "./voskSpeechProvider";
import type {
  SpeechProvider,
  SpeechProviderDescriptor,
  SpeechProviderFactoryContext,
  SpeechStatusPayload,
  SpeechTranscriptPayload,
} from "./speechTypes";

export type AvailableSpeechProviderId = "offline-vosk" | "online-whisper" | "offline-whisper";

export class SpeechEngineManager extends EventEmitter {
  private activeProvider: SpeechProvider;
  private activeProviderId: AvailableSpeechProviderId;

  constructor(private readonly context: SpeechProviderFactoryContext = {}) {
    super();
    // Default to offline-whisper (Whisper tiny.en q5_1 + Silero VAD).
    // Vosk is retained in the registry for backward compatibility but is no longer the default.
    this.activeProviderId = context.getAuthToken?.() ? "online-whisper" : "offline-whisper";
    this.activeProvider = this.createProvider(this.activeProviderId);
    this.bindProviderEvents(this.activeProvider);
  }

  private createProvider(id: AvailableSpeechProviderId): SpeechProvider {
    switch (id) {
      case "offline-vosk":
        return new VoskSpeechProvider(this.context);
      case "online-whisper":
        return new OnlineWhisperSpeechProvider(this.context);
      case "offline-whisper":
        return new OfflineWhisperSpeechProvider(this.context);
      default:
        throw new Error(`Unsupported speech provider: ${id satisfies never}`);
    }
  }

  private bindProviderEvents(provider: SpeechProvider) {
    provider.on("transcript-partial", (payload: SpeechTranscriptPayload) => {
      this.emit("transcript-partial", payload);
    });

    provider.on("transcript-final", (payload: SpeechTranscriptPayload) => {
      this.emit("transcript-final", payload);
    });

    provider.on("status-change", (payload: SpeechStatusPayload) => {
      this.emit("status-change", payload);
    });
  }

  getAvailableProviders() {
    return [
      {
        id: "offline-vosk",
        label: "Offline Vosk",
        mode: "offline",
        implemented: true,
      },
      {
        id: "online-whisper",
        label: "Online Whisper",
        mode: "online",
        implemented: true,
      },
      {
        id: "offline-whisper",
        label: "Offline Whisper",
        mode: "offline",
        implemented: true,
      },
    ] as const;
  }

  getActiveProviderId(): AvailableSpeechProviderId {
    return this.activeProviderId;
  }

  getDescriptor(): SpeechProviderDescriptor {
    return this.activeProvider.descriptor;
  }

  getStatus(): SpeechStatusPayload {
    return {
      status: this.activeProvider.getStatus(),
      provider: this.activeProvider.descriptor,
    };
  }

  async initialize(): Promise<void> {
    await this.activeProvider.initialize();
  }

  async setProvider(id: AvailableSpeechProviderId) {
    if (id === this.activeProviderId) {
      if (this.activeProvider.getStatus() === "uninitialized") {
        await this.activeProvider.initialize();
      }

      return {
        success: true,
        provider: this.activeProvider.descriptor,
        activeProviderId: this.activeProviderId,
      };
    }

    const previousProvider = this.activeProvider;
    const previousProviderId = this.activeProviderId;

    try {
      const nextProvider = this.createProvider(id);
      this.bindProviderEvents(nextProvider);
      await previousProvider.stopListening();
      await previousProvider.shutdown();
      this.activeProvider = nextProvider;
      this.activeProviderId = id;
      await this.activeProvider.initialize();

      return {
        success: true,
        provider: this.activeProvider.descriptor,
        activeProviderId: this.activeProviderId,
      };
    } catch (error) {
      try {
        const restoredProvider = this.createProvider(previousProviderId);
        this.bindProviderEvents(restoredProvider);
        this.activeProvider = restoredProvider;
        this.activeProviderId = previousProviderId;
        await this.activeProvider.initialize();
      } catch (restoreError) {
        console.warn("[SpeechEngineManager] Failed to restore previous provider after switch error", restoreError);
        this.activeProvider = previousProvider;
        this.activeProviderId = previousProviderId;
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to switch speech provider.",
        provider: this.activeProvider.descriptor,
        activeProviderId: this.activeProviderId,
      };
    }
  }

  startListening(): void {
    this.activeProvider.startListening();
  }

  async stopListening(): Promise<void> {
    await this.activeProvider.stopListening();
  }

  feedAudioChunk(pcm16: Int16Array): void {
    this.activeProvider.feedAudioChunk(pcm16);
  }

  async shutdown(): Promise<void> {
    await this.activeProvider.shutdown();
  }
}
