import { EventEmitter } from "node:events";

import WebSocket from "ws";

import type {
  SpeechProvider,
  SpeechProviderDescriptor,
  SpeechProviderFactoryContext,
  SpeechStatusPayload,
  SpeechTranscriptPayload,
} from "./speechTypes";

const ONLINE_MAX_INPUT_GAIN = 24;
const ONLINE_TARGET_PEAK = 16000;
const INPUT_SAMPLE_RATE = 16000;
const BACKEND_SAMPLE_RATE = 24000;
const ONLINE_KEEPALIVE_MS = 15000;
const ONLINE_RECONNECT_DELAY_MS = 900;
const ONLINE_TRANSCRIPT_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\bmathew\b/gi, "matthew"],
  [/\bmattew\b/gi, "matthew"],
  [/\blook\b/gi, "luke"],
  [/\bluck\b/gi, "luke"],
  [/\broman\b/gi, "romans"],
  [/\bromance\b/gi, "romans"],
  [/\bsalm\b/gi, "psalm"],
  [/\bsalms\b/gi, "psalms"],
  [/\bsams\b/gi, "psalms"],
  [/\bsawms\b/gi, "psalms"],
  [/\bphilipians\b/gi, "philippians"],
  [/\b1 john\b/gi, "first john"],
  [/\b2 john\b/gi, "second john"],
  [/\b3 john\b/gi, "third john"],
  [/\bshow me the amplified\b/gi, "show me the amplified bible"],
  [/\bshow me niv\b/gi, "show me the niv"],
  [/\bshow me kjv\b/gi, "show me the kjv"],
  [/\bshow me nkjv\b/gi, "show me the nkjv"],
  [/\bshow me esv\b/gi, "show me the esv"],
  [/\bshow me msg\b/gi, "show me the msg"],
];

function amplifyPcm16(pcm16: Int16Array) {
  let peak = 0;
  for (let i = 0; i < pcm16.length; i += 1) {
    const abs = Math.abs(pcm16[i]);
    if (abs > peak) peak = abs;
  }

  if (peak <= 0) return pcm16;

  const adaptiveGain = Math.max(1, Math.min(ONLINE_MAX_INPUT_GAIN, ONLINE_TARGET_PEAK / peak));
  if (adaptiveGain === 1) return pcm16;

  const boosted = new Int16Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i += 1) {
    const sample = Math.round(pcm16[i] * adaptiveGain);
    boosted[i] = Math.max(-32768, Math.min(32767, sample));
  }

  return boosted;
}

function resamplePcm16(pcm16: Int16Array, outputSampleRate: number) {
  if (INPUT_SAMPLE_RATE === outputSampleRate) {
    return pcm16;
  }

  const outputLength = Math.max(1, Math.floor((pcm16.length * outputSampleRate) / INPUT_SAMPLE_RATE));
  const output = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const sourceIndex = (i * INPUT_SAMPLE_RATE) / outputSampleRate;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(pcm16.length - 1, leftIndex + 1);
    const interpolation = sourceIndex - leftIndex;
    const sample = pcm16[leftIndex] + (pcm16[rightIndex] - pcm16[leftIndex]) * interpolation;
    output[i] = Math.max(-32768, Math.min(32767, Math.round(sample)));
  }

  return output;
}

function bufferFromPcm16(pcm16: Int16Array) {
  const boosted = amplifyPcm16(pcm16);
  const normalized = resamplePcm16(boosted, BACKEND_SAMPLE_RATE);
  return Buffer.from(normalized.buffer, normalized.byteOffset, normalized.byteLength);
}

function sanitizeTranscript(text: string) {
  let cleaned = text.replace(/\s+/g, " ").trim().toLowerCase();
  for (const [pattern, replacement] of ONLINE_TRANSCRIPT_NORMALIZATION_RULES) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function resolveBackendAudioSocketUrl() {
  const apiBase =
    process.env.QWORSHIP_API_URL ||
    process.env.VITE_API_URL ||
    "https://api.qworship.com/api";

  const normalizedBase = apiBase.startsWith("http://") || apiBase.startsWith("https://")
    ? apiBase
    : `https://${apiBase.replace(/^\/+/, "")}`;

  const url = new URL(normalizedBase);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/bible/audio-stream`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export class OnlineWhisperSpeechProvider extends EventEmitter implements SpeechProvider {
  readonly descriptor: SpeechProviderDescriptor = {
    id: "online-whisper",
    label: "Online Whisper",
    mode: "online",
  };

  private socket: WebSocket | null = null;
  private initialized = false;
  private listening = false;
  private status: SpeechStatusPayload["status"] = "uninitialized";
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private readonly getAuthToken: () => string | null;
  private readonly backendSocketUrl: string;

  constructor(context: SpeechProviderFactoryContext = {}) {
    super();
    this.getAuthToken = context.getAuthToken ?? (() => null);
    this.backendSocketUrl = context.onlineSpeechSocketUrl ?? resolveBackendAudioSocketUrl();
  }

  private emitStatus(status: SpeechStatusPayload["status"], message?: string) {
    this.status = status;
    const payload: SpeechStatusPayload = {
      status,
      message,
      provider: this.descriptor,
    };
    this.emit("status-change", payload);
  }

  private emitTranscript(text: string, isFinal: boolean) {
    const cleaned = sanitizeTranscript(text);
    if (!cleaned) return;

    const payload: SpeechTranscriptPayload = {
      text: cleaned,
      isFinal,
      provider: this.descriptor,
    };
    this.emit(isFinal ? "transcript-final" : "transcript-partial", payload);
  }

  private clearKeepAliveTimer() {
    if (this.keepAliveTimer) {
      clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private scheduleKeepAlive() {
    this.clearKeepAliveTimer();

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.keepAliveTimer = setTimeout(() => {
      this.keepAliveTimer = null;
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        this.socket.ping();
      } catch (error) {
        console.warn("[OnlineWhisperSpeechProvider] Failed to send keepalive ping", error);
      }

      this.scheduleKeepAlive();
    }, ONLINE_KEEPALIVE_MS);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(reason: string) {
    if (this.reconnectTimer || !this.listening) {
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.listening || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
        return;
      }

      try {
        console.log(`[OnlineWhisperSpeechProvider] Attempting reconnect after ${reason}`);
        await this.initialize();
        if (this.listening) {
          this.emitStatus("ready", "Listening online...");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Online Whisper reconnect failed.";
        this.emitStatus("error", message);
        this.scheduleReconnect("retry");
      }
    }, ONLINE_RECONNECT_DELAY_MS);
  }

  private handleSocketMessage(data: WebSocket.RawData) {
    try {
      const event = JSON.parse(data.toString()) as {
        type?: string;
        text?: string;
        transcript?: string;
        message?: string;
        error?: { message?: string };
      };

      switch (event.type) {
        case "transcript_partial":
          if (event.text) {
            this.emitStatus("processing", "Streaming online transcript...");
            this.emitTranscript(event.text, false);
          }
          break;
        case "transcript_final":
          if (event.text) {
            this.emitStatus("processing", "Resolving online Bible command...");
            this.emitTranscript(event.text, true);
          }
          this.emitStatus(this.listening ? "ready" : "uninitialized", this.listening ? "Listening online..." : undefined);
          break;
        case "error": {
          const message = event.error?.message || event.message || "Online transcription error.";
          this.emitStatus("error", message);
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.warn("[OnlineWhisperSpeechProvider] Failed to parse backend socket event", error);
    }
  }

  private bindSocket(socket: WebSocket) {
    socket.on("open", () => {
      this.clearReconnectTimer();
      this.scheduleKeepAlive();
      this.initialized = true;
      this.emitStatus("ready", this.listening ? "Listening online..." : "Online Whisper ready.");
    });

    socket.on("message", (data) => {
      this.handleSocketMessage(data);
    });

    socket.on("close", () => {
      this.socket = null;
      this.initialized = false;
      this.clearKeepAliveTimer();
      if (this.listening) {
        this.emitStatus("loading", "Reconnecting online transcription session...");
        this.scheduleReconnect("socket-close");
      } else {
        this.emitStatus("uninitialized");
      }
    });

    socket.on("error", (error) => {
      const message = error instanceof Error ? error.message : "Online Whisper websocket error.";
      this.emitStatus("error", message);
      if (this.listening) {
        this.scheduleReconnect("socket-error");
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = this.getAuthToken()?.trim();
    if (!token) {
      throw new Error("Qworship login token is missing. Please sign in again before using Online Hands-Free Bible mode.");
    }

    this.emitStatus("loading", "Connecting to Qworship online transcription...");

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.backendSocketUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.socket = socket;
      this.bindSocket(socket);

      const handleOpen = () => {
        socket.off("error", handleError);
        resolve();
      };
      const handleError = (error: Error) => {
        socket.off("open", handleOpen);
        reject(error);
      };

      socket.once("open", handleOpen);
      socket.once("error", handleError);
    });
  }

  startListening(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Online Whisper provider is not initialized.");
    }

    this.clearReconnectTimer();
    this.listening = true;
    this.emitStatus(this.initialized ? "ready" : "loading", this.initialized ? "Listening online..." : "Preparing online transcription...");
  }

  async stopListening(): Promise<void> {
    if (!this.listening) return;
    this.listening = false;
    this.clearReconnectTimer();
    this.emitStatus("ready", "Online listening stopped.");
  }

  feedAudioChunk(pcm16: Int16Array): void {
    if (!this.listening || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.socket.send(bufferFromPcm16(pcm16));
    } catch (error) {
      console.warn("[OnlineWhisperSpeechProvider] Failed to send backend audio chunk", error);
      this.emitStatus("error", "Failed to stream online audio.");
    }
  }

  getStatus() {
    return this.status;
  }

  async shutdown(): Promise<void> {
    this.listening = false;
    this.clearReconnectTimer();
    this.clearKeepAliveTimer();

    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      await new Promise<void>((resolve) => {
        if (socket.readyState === WebSocket.CLOSED) {
          resolve();
          return;
        }
        socket.once("close", () => resolve());
        socket.close();
      });
    }

    this.initialized = false;
    this.emitStatus("uninitialized");
  }
}
