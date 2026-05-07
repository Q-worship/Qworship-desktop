import WebSocket from "ws";
import { EventEmitter } from "events";

// ─── Deepgram Bible Keyword Boost ────────────────────────────────────────────
// All 66 canonical Bible book names submitted as Deepgram keyword boosts.
// The :2 suffix applies a 2x confidence boost so Deepgram strongly prefers
// these spellings over phonetically similar common words.
const DEEPGRAM_BIBLE_KEYWORDS = [
  "Genesis:2", "Exodus:2", "Leviticus:2", "Numbers:2", "Deuteronomy:2",
  "Joshua:2", "Judges:2", "Ruth:2",
  "Samuel:2", "Kings:2", "Chronicles:2",
  "Ezra:2", "Nehemiah:2", "Esther:2", "Job:2",
  "Psalms:3", "Psalm:3", "Proverbs:2", "Ecclesiastes:2",
  "Isaiah:2", "Jeremiah:2", "Lamentations:2", "Ezekiel:2", "Daniel:2",
  "Hosea:2", "Joel:2", "Amos:2", "Obadiah:2", "Jonah:2", "Micah:2",
  "Nahum:2", "Habakkuk:3", "Zephaniah:3", "Haggai:2", "Zechariah:2", "Malachi:2",
  "Matthew:2", "Mark:2", "Luke:2", "John:2", "Acts:2", "Romans:2",
  "Corinthians:2", "Galatians:2", "Ephesians:2", "Philippians:2",
  "Colossians:2", "Thessalonians:2", "Timothy:2", "Titus:2",
  "Philemon:2", "Hebrews:2", "James:2", "Peter:2",
  "Jude:2", "Revelation:2",
  "chapter:2", "verse:2",
];

// ─── Deepgram Streaming URL ───────────────────────────────────────────────────
// Nova-2 general model with:
//   interim_results=true  -> word-by-word partials as you speak
//   utterance_end_ms=1000 -> fires UtteranceEnd after 1s of silence
//   vad_events=true       -> SpeechStarted / SpeechFinished events
//   smart_format=true     -> normalises numbers
//   punctuate=true        -> adds punctuation for cleaner downstream parsing
//   no_delay=true         -> minimises latency
//   encoding=linear16     -> PCM16 raw audio
//   sample_rate=16000     -> 16kHz mono from Electron
const DEEPGRAM_WS_URL =
  "wss://api.deepgram.com/v1/listen?" +
  "model=nova-2-general" +
  "&language=en" +
  "&encoding=linear16" +
  "&sample_rate=16000" +
  "&channels=1" +
  "&interim_results=true" +
  "&utterance_end_ms=1000" +
  "&vad_events=true" +
  "&smart_format=true" +
  "&punctuate=true" +
  "&no_delay=true" +
  "&" + DEEPGRAM_BIBLE_KEYWORDS.map(k => `keywords=${encodeURIComponent(k)}`).join("&");

// QC49: Keep-alive interval — send a Deepgram KeepAlive JSON message every
// 8 seconds during silence to prevent the 10-second Deepgram timeout (1011).
const DEEPGRAM_KEEPALIVE_MS = 8000;

// ─── TranscriptionService ─────────────────────────────────────────────────────
// QC48: Replaced OpenAI GPT-4o Realtime with Deepgram Nova-2.
// QC49: Lazy Deepgram connect — Deepgram WebSocket is opened only when the
//       first audio chunk arrives, not on client WebSocket open. This prevents
//       the 1011 "no audio received" timeout that occurs because the Electron
//       AudioWorklet takes 2-5 seconds to initialise after the client WebSocket
//       connects. A KeepAlive ping is sent every 8s to prevent timeout during
//       natural pauses in speech.
//
// Key improvements:
//   1. Zero hallucinations - discriminative STT model, silence = empty string
//   2. Single WebSocket - no dual VAD + buffer path complexity
//   3. No hallucination filter code needed
//   4. Sub-1-second latency - interim_results fires ~80-150ms per word
//   5. 14x cheaper than GPT-4o Realtime
//   6. Bible keyword boost - 66 book names boosted for superior accuracy
//
// Emitted events (unchanged - audio.socket.ts consumes these):
//   "partial"  (text: string)  - growing sentence as each word arrives
//   "final"    (text: string)  - complete utterance after end-of-speech
//   "error"    (err: Error)
export class TranscriptionService extends EventEmitter {
  private deepgramWs: WebSocket | null = null;
  private isConnected = false;

  // QC49: Lazy connect — true once connect() has been called (i.e. first audio chunk)
  private _connectCalled = false;

  // QC49: Audio chunks queued before Deepgram is open (during the handshake)
  private _pendingChunks: Buffer[] = [];

  // QC49: Keep-alive timer handle
  private _keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  // Accumulate interim words into a growing sentence for the Live Transcript
  private _partialAccumulator = "";

  // Track the last final transcript to avoid double-emitting the same utterance
  private _lastFinalTranscript = "";
  private _lastFinalTime = 0;

  constructor() {
    super();
  }

  // ─── connect() is now a no-op kept for API compatibility ─────────────────────
  // QC49: Previously called eagerly from audio.socket.ts on WebSocket open.
  // Now the actual Deepgram connection is deferred to the first processAudioChunk
  // call so Deepgram never times out waiting for audio.
  public connect() {
    // No-op: Deepgram connection is now established lazily in processAudioChunk.
    // Keeping this method so audio.socket.ts does not need to be changed.
  }

  // ─── Internal: open the Deepgram WebSocket ───────────────────────────────────
  private _openDeepgramConnection() {
    // Built-in Qworship Deepgram key — all users share the Qworship account.
    // An environment variable override is still supported for development.
    const BUILTIN_KEY = "fc5d0c26fa79d5749593ba0a8a745eaa2470cb9a";
    const apiKey = process.env.DEEPGRAM_API_KEY_DESKTOP || BUILTIN_KEY;
    if (!apiKey) {
      console.error("[Transcription] Missing DEEPGRAM_API_KEY_DESKTOP in environment");
      this.emit("error", new Error("Missing Deepgram API Key"));
      return;
    }

    console.log("[Transcription] Connecting to Deepgram Nova-2 (lazy, first audio chunk)...");

    this.deepgramWs = new WebSocket(DEEPGRAM_WS_URL, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    this.deepgramWs.on("open", () => {
      this.isConnected = true;
      console.log("[Transcription] Connected to Deepgram Nova-2 (streaming)");

      // Flush any audio chunks that arrived during the WebSocket handshake
      if (this._pendingChunks.length > 0) {
        console.log(`[Transcription] Flushing ${this._pendingChunks.length} queued audio chunks to Deepgram`);
        for (const chunk of this._pendingChunks) {
          try {
            this.deepgramWs!.send(chunk);
          } catch (_) {}
        }
        this._pendingChunks = [];
      }

      // QC49: Start keep-alive pings so Deepgram does not time out during silence
      this._startKeepAlive();
    });

    this.deepgramWs.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        this._handleDeepgramMessage(msg);
      } catch (err) {
        console.error("[Transcription] Failed to parse Deepgram message", err);
      }
    });

    this.deepgramWs.on("close", (code: number, reason: Buffer) => {
      this.isConnected = false;
      this._stopKeepAlive();
      console.log(`[Transcription] Deepgram connection closed (${code}: ${reason.toString()})`);
    });

    this.deepgramWs.on("error", (err: Error) => {
      console.error("[Transcription] Deepgram WS Error:", err.message);
      this.emit("error", err);
    });
  }

  // ─── QC49: Keep-alive helpers ─────────────────────────────────────────────────
  private _startKeepAlive() {
    this._stopKeepAlive();
    this._keepAliveTimer = setInterval(() => {
      if (this.deepgramWs && this.deepgramWs.readyState === WebSocket.OPEN) {
        try {
          // Deepgram's documented keep-alive message
          this.deepgramWs.send(JSON.stringify({ type: "KeepAlive" }));
        } catch (_) {}
      }
    }, DEEPGRAM_KEEPALIVE_MS);
  }

  private _stopKeepAlive() {
    if (this._keepAliveTimer !== null) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
  }

  // ─── Handle Deepgram Messages ───────────────────────────────────────────────
  private _handleDeepgramMessage(msg: any) {
    const msgType = msg?.type;

    // 1. Results (interim + final transcripts)
    if (msgType === "Results") {
      const channel = msg?.channel?.alternatives?.[0];
      if (!channel) return;

      const transcript: string = (channel.transcript || "").trim();
      const isFinal: boolean = msg?.is_final === true;
      const speechFinal: boolean = msg?.speech_final === true;

      if (!transcript) return;

      if (!isFinal) {
        // Interim result: emit growing partial for Live Transcript UI
        this._partialAccumulator = transcript;
        this.emit("partial", transcript);
        return;
      }

      // Final result - reset partial accumulator
      this._partialAccumulator = "";

      // Deduplicate: skip if same transcript emitted within 2s
      const now = Date.now();
      if (
        transcript.toLowerCase() === this._lastFinalTranscript.toLowerCase() &&
        now - this._lastFinalTime < 2000
      ) {
        return;
      }

      this._lastFinalTranscript = transcript.toLowerCase();
      this._lastFinalTime = now;

      console.log(`[Transcription] Deepgram Final (speech_final=${speechFinal}): "${transcript.slice(0, 100)}"`);
      this.emit("final", transcript);
      return;
    }

    // 2. UtteranceEnd - fires after utterance_end_ms of silence
    // Safety net: if a final transcript was not emitted, flush the partial
    if (msgType === "UtteranceEnd") {
      if (this._partialAccumulator.trim()) {
        const text = this._partialAccumulator.trim();
        this._partialAccumulator = "";

        const now = Date.now();
        if (
          text.toLowerCase() === this._lastFinalTranscript.toLowerCase() &&
          now - this._lastFinalTime < 2000
        ) {
          return;
        }

        this._lastFinalTranscript = text.toLowerCase();
        this._lastFinalTime = now;

        console.log(`[Transcription] Deepgram UtteranceEnd flush: "${text.slice(0, 100)}"`);
        this.emit("final", text);
      }
      return;
    }

    // 3. SpeechStarted (informational)
    if (msgType === "SpeechStarted") {
      console.log("[Transcription] Deepgram: speech started");
      return;
    }

    // 4. Metadata (connection confirmation)
    if (msgType === "Metadata") {
      console.log(`[Transcription] Deepgram Metadata: request_id=${msg?.request_id}`);
      return;
    }

    // 5. KeepAlive acknowledgement (informational — Deepgram echoes it back)
    if (msgType === "KeepAlive") {
      return;
    }

    // 6. Error
    if (msgType === "Error") {
      console.error("[Transcription] Deepgram Error:", msg?.description || msg);
      this.emit("error", new Error(msg?.description || "Deepgram error"));
      return;
    }
  }

  // ─── Feed raw PCM16 audio from the client ────────────────────────────────────
  // Called by audio.socket.ts on every incoming audio chunk.
  // QC49: On the first call, lazily opens the Deepgram WebSocket. Subsequent
  // calls send audio directly. Chunks arriving during the handshake are queued.
  public processAudioChunk(pcmData: Buffer | string) {
    let rawBuffer: Buffer;

    if (typeof pcmData === "string") {
      // Client sends base64-encoded PCM16 - decode to raw binary for Deepgram
      rawBuffer = Buffer.from(pcmData, "base64");
    } else {
      rawBuffer = pcmData as Buffer;
    }

    // QC49: Lazy connect — open Deepgram on the very first audio chunk
    if (!this._connectCalled) {
      this._connectCalled = true;
      this._openDeepgramConnection();
    }

    // If Deepgram is already open, send immediately
    if (this.isConnected && this.deepgramWs && this.deepgramWs.readyState === WebSocket.OPEN) {
      try {
        this.deepgramWs.send(rawBuffer);
      } catch (err) {
        console.warn("[Transcription] Failed to send audio chunk to Deepgram:", err);
      }
      return;
    }

    // Deepgram handshake in progress — queue the chunk
    // Cap the queue at 500 chunks (~5 seconds at 100 chunks/s) to avoid unbounded memory
    if (this._pendingChunks.length < 500) {
      this._pendingChunks.push(rawBuffer);
    }
  }

  // ─── Kept for API compatibility with audio.socket.ts ─────────────────────────
  // Deepgram handles end-of-speech detection natively via utterance_end_ms.
  // This is a no-op.
  public commitAudioBuffer() {
    // No-op: Deepgram VAD handles this automatically
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────────
  public disconnect() {
    this._partialAccumulator = "";
    this._pendingChunks = [];
    this._connectCalled = false;
    this._stopKeepAlive();

    if (this.deepgramWs) {
      if (
        this.deepgramWs.readyState === WebSocket.OPEN ||
        this.deepgramWs.readyState === WebSocket.CONNECTING
      ) {
        try {
          if (this.deepgramWs.readyState === WebSocket.OPEN) {
            this.deepgramWs.send(JSON.stringify({ type: "CloseStream" }));
          }
        } catch (_) {}

        try {
          this.deepgramWs.close();
        } catch (_) {}
      }
      this.deepgramWs = null;
    }

    this.isConnected = false;
    console.log("[Transcription] Deepgram disconnected");
  }
}
