import type { EventEmitter } from "node:events";

export type SpeechEngineStatus =
  | "uninitialized"
  | "loading"
  | "ready"
  | "processing"
  | "error";

export interface SpeechProviderDescriptor {
  id: string;
  label: string;
  mode: SpeechProviderMode;
}

export interface SpeechStatusPayload {
  status: SpeechEngineStatus;
  message?: string;
  provider: SpeechProviderDescriptor;
}

export interface SpeechTranscriptPayload {
  text: string;
  isFinal: boolean;
  provider: SpeechProviderDescriptor;
}

export interface SpeechProviderEvents {
  "transcript-partial": (payload: SpeechTranscriptPayload) => void;
  "transcript-final": (payload: SpeechTranscriptPayload) => void;
  "status-change": (payload: SpeechStatusPayload) => void;
}

export interface SpeechProvider extends EventEmitter {
  readonly descriptor: SpeechProviderDescriptor;
  initialize(): Promise<void>;
  startListening(): void;
  stopListening(): Promise<void>;
  feedAudioChunk(pcm16: Int16Array): void;
  getStatus(): SpeechEngineStatus;
  shutdown(): Promise<void>;
}

export interface SpeechProviderFactoryContext {
  sendModelDownloadProgress?: (
    percent: number,
    downloadedMB: number,
    totalMB: number,
  ) => void;
  getAuthToken?: () => string | null;
  onlineSpeechSocketUrl?: string;
}
