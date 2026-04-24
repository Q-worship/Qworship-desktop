"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("node:path");
const os = require("node:os");
const node_url = require("node:url");
const node_events = require("node:events");
const fs = require("node:fs");
const https = require("node:https");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
let grandiose = null;
let grandioseError = null;
try {
  grandiose = require("@stagetimerio/grandiose");
  console.log("[NdiManager] grandiose module loaded successfully");
} catch (e) {
  const err = e;
  console.error(
    "[NdiManager] CRITICAL: grandiose native module could not be loaded.\nMake sure the NDI Runtime is installed.\nDownload from: https://www.ndi.tv/tools/\nError:",
    err.message
  );
  grandioseError = {
    message: "NDI Runtime not found",
    details: err.message,
    solution: "Download and install NDI Tools from https://www.ndi.tv/tools/"
  };
}
class NdiSender {
  constructor(index, name, width, height) {
    this._sender = null;
    this._frameCount = 0;
    this._lastFpsCheck = Date.now();
    this._fps = 0;
    this._bytesSent = 0;
    this._lastBitCheck = Date.now();
    this._bitrateMbps = 0;
    this._index = index;
    this._name = name;
    this._width = width;
    this._height = height;
    this._init();
  }
  async _init() {
    if (!grandiose) return;
    try {
      const senderObj = await grandiose.send({
        name: this._name,
        clockVideo: true,
        clockAudio: false
      });
      this._sender = senderObj;
      console.log(`[NdiSender ${this._index}] NDI sender "${this._name}" initialised`);
    } catch (e) {
      console.error(`[NdiSender ${this._index}] Failed to create NDI sender:`, e.message);
    }
  }
  sendFrame(bgraBuffer, width, height) {
    if (!this._sender) return;
    this._frameCount++;
    this._bytesSent += bgraBuffer.byteLength;
    const now = Date.now();
    if (now - this._lastFpsCheck >= 1e3) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastFpsCheck = now;
    }
    if (now - this._lastBitCheck >= 1e3) {
      this._bitrateMbps = parseFloat((this._bytesSent * 8 / 1e6).toFixed(1));
      this._bytesSent = 0;
      this._lastBitCheck = now;
    }
    try {
      this._sender.video({
        xres: width,
        yres: height,
        frameRateN: 6e4,
        frameRateD: 1001,
        pictureAspectRatio: width / height,
        frameFormatType: grandiose.FORMAT_TYPE_PROGRESSIVE,
        fourCC: 1095911234,
        // BGRA
        lineStrideBytes: width * 4,
        data: bgraBuffer
      }).catch(() => {
      });
    } catch (e) {
      console.error(`[NdiSender ${this._index}] sendFrame sync error:`, e.message);
    }
  }
  get fps() {
    return this._fps;
  }
  get bitrateMbps() {
    return this._bitrateMbps;
  }
  destroy() {
    if (this._sender) {
      try {
        this._sender.destroy();
      } catch (_) {
      }
      this._sender = null;
    }
  }
}
class NdiManager {
  constructor() {
    this._senders = [null, null];
  }
  static getGrandioseError() {
    return grandioseError;
  }
  createSender(index, name, width, height) {
    if (this._senders[index]) this._senders[index].destroy();
    const s = new NdiSender(index, name, width, height);
    this._senders[index] = s;
    return s;
  }
  getFpsStats() {
    return this._senders.map((s) => s ? s.fps : 0);
  }
  getBitrateStats() {
    return this._senders.map((s) => s ? s.bitrateMbps : 0);
  }
  destroy() {
    this._senders.forEach((s) => s && s.destroy());
    this._senders = [null, null];
  }
}
class VADDetector {
  constructor(options = {}) {
    this.speaking = false;
    this.silenceStartMs = null;
    this.lastProcessTime = 0;
    this._endOfUtteranceTriggered = false;
    this.rmsHistory = [];
    this.RMS_WINDOW_SIZE = 8;
    this.onsetThreshold = options.onsetThreshold ?? 0.01;
    this.offsetThreshold = options.offsetThreshold ?? 6e-3;
    this.silenceTimeoutMs = options.silenceTimeoutMs ?? 1500;
    this.sampleRate = options.sampleRate ?? 16e3;
  }
  /**
   * Process a chunk of audio samples and update internal state.
   * @param samples Float32Array of audio samples (mono, any length)
   */
  process(samples) {
    const rms = this.computeRMS(samples);
    this.rmsHistory.push(rms);
    if (this.rmsHistory.length > this.RMS_WINDOW_SIZE) {
      this.rmsHistory.shift();
    }
    const smoothedRMS = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
    const now = Date.now();
    this.lastProcessTime = now;
    if (!this.speaking) {
      if (smoothedRMS >= this.onsetThreshold) {
        this.speaking = true;
        this.silenceStartMs = null;
        this._endOfUtteranceTriggered = false;
      }
    } else {
      if (smoothedRMS < this.offsetThreshold) {
        if (this.silenceStartMs === null) {
          this.silenceStartMs = now;
        }
      } else {
        this.silenceStartMs = null;
      }
      if (this.silenceStartMs !== null && now - this.silenceStartMs >= this.silenceTimeoutMs) {
        this.speaking = false;
        this.silenceStartMs = null;
        this._endOfUtteranceTriggered = true;
      }
    }
  }
  /** Whether voice activity is currently detected */
  isSpeaking() {
    return this.speaking;
  }
  /** How many milliseconds of silence since last speech. 0 if currently speaking. */
  getSilenceDurationMs() {
    if (!this.silenceStartMs || this.speaking === false) return 0;
    return Date.now() - this.silenceStartMs;
  }
  /**
   * Whether the silence timeout has been reached (end of utterance).
   * This is a CONSUMABLE flag — it returns true exactly once after the
   * silence timeout fires, then resets itself.
   */
  isEndOfUtterance() {
    if (this._endOfUtteranceTriggered) {
      this._endOfUtteranceTriggered = false;
      return true;
    }
    return false;
  }
  /** Reset all state */
  reset() {
    this.speaking = false;
    this.silenceStartMs = null;
    this._endOfUtteranceTriggered = false;
    this.rmsHistory = [];
  }
  /** Compute Root Mean Square of a Float32 audio buffer */
  computeRMS(samples) {
    if (samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
let Whisper = null;
const BIBLE_INITIAL_PROMPT = "Genesis, Exodus, Luke, Psalms, Matthew, John, Revelation, chapter, verse.";
const SLIDING_WINDOW = {
  /** How often to run partial inference while speech is active (ms) */
  INTERVAL_MS: 750,
  /** How much audio to include in each sliding window (seconds) */
  WINDOW_SECONDS: 2.5,
  /** Minimum audio duration before first partial inference (seconds) */
  MIN_SPEECH_SECONDS: 0.6
};
class WhisperService extends node_events.EventEmitter {
  constructor() {
    super();
    this.whisper = null;
    this.status = "uninitialized";
    this.modelPath = "";
    this.bufferWritePos = 0;
    this.MAX_BUFFER_SAMPLES = 16e3 * 30;
    this.MIN_INFERENCE_SAMPLES = 16e3 * SLIDING_WINDOW.MIN_SPEECH_SECONDS;
    this.WINDOW_SAMPLES = 16e3 * SLIDING_WINDOW.WINDOW_SECONDS;
    this.isListening = false;
    this.isProcessing = false;
    this.slidingTimer = null;
    this.inferenceTimer = null;
    this._pendingFinalInference = false;
    this.speechDetectedSinceLastInference = false;
    this.speechStartTime = null;
    this.lastPartialText = "";
    this.audioBuffer = new Float32Array(this.MAX_BUFFER_SAMPLES);
    this.nThreads = Math.max(2, Math.floor(os.cpus().length / 2));
    this.vad = new VADDetector({
      onsetThreshold: 0.01,
      offsetThreshold: 6e-3,
      silenceTimeoutMs: 800,
      // Reduced from 1500ms for faster end-of-utterance
      sampleRate: 16e3
    });
  }
  /** Get current engine status */
  getStatus() {
    return this.status;
  }
  /**
   * Initialize the whisper engine and load the model.
   * This should be called once during app startup.
   */
  async initialize(modelPath) {
    if (this.status === "ready" || this.status === "loading") return;
    this.setStatus("loading", `Loading model: ${modelPath}`);
    try {
      if (!Whisper) {
        const smartWhisper = await import("smart-whisper");
        Whisper = smartWhisper.Whisper;
      }
      this.modelPath = modelPath;
      this.whisper = new Whisper(modelPath, { gpu: false });
      this.setStatus("ready");
      console.log(`[WhisperService] Model loaded successfully (threads: ${this.nThreads})`);
    } catch (err) {
      this.setStatus("error", err.message);
      console.error("[WhisperService] Failed to load model:", err);
      throw err;
    }
  }
  /**
   * Start listening for audio input.
   * Begins the sliding window timer and VAD processing.
   */
  startListening() {
    if (this.status !== "ready") {
      console.warn("[WhisperService] Cannot start listening — status:", this.status);
      return;
    }
    this.isListening = true;
    this.resetBuffer();
    this.vad.reset();
    this.speechDetectedSinceLastInference = false;
    this.speechStartTime = null;
    this.lastPartialText = "";
    console.log("[WhisperService] Started listening (sliding window mode)");
  }
  /**
   * Stop listening and process any remaining audio.
   */
  async stopListening() {
    this.isListening = false;
    this.stopSlidingTimer();
    if (this.inferenceTimer) {
      clearInterval(this.inferenceTimer);
      this.inferenceTimer = null;
    }
    if (this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
      await this.runInference(true);
    }
    this.resetBuffer();
    this.vad.reset();
    console.log("[WhisperService] Stopped listening");
  }
  /**
   * Feed a chunk of PCM16 audio data at 16kHz.
   * Called by the IPC handler for each audio worklet message.
   */
  feedAudioChunk(pcm16) {
    if (!this.isListening) return;
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }
    this.vad.process(float32);
    const isSpeaking = this.vad.isSpeaking();
    if (isSpeaking) {
      if (!this.speechDetectedSinceLastInference) {
        this.speechDetectedSinceLastInference = true;
        this.speechStartTime = Date.now();
      }
      this.startSlidingTimer();
    }
    const spaceLeft = this.MAX_BUFFER_SAMPLES - this.bufferWritePos;
    const samplesToWrite = Math.min(float32.length, spaceLeft);
    if (samplesToWrite > 0) {
      this.audioBuffer.set(float32.subarray(0, samplesToWrite), this.bufferWritePos);
      this.bufferWritePos += samplesToWrite;
    }
    if (this.bufferWritePos >= this.MAX_BUFFER_SAMPLES) {
      this.tryRunFinalInference();
    }
    if (this.vad.isEndOfUtterance() && this.speechDetectedSinceLastInference) {
      this.stopSlidingTimer();
      if (this.isProcessing) {
        this._pendingFinalInference = true;
        console.log("[WhisperService] End-of-utterance queued (inference in progress)");
      } else {
        this.tryRunFinalInference();
      }
    }
  }
  // ── Sliding Window Timer ──────────────────────────────────────
  /** Start the sliding window partial inference timer */
  startSlidingTimer() {
    if (this.slidingTimer) return;
    this.slidingTimer = setInterval(() => {
      if (!this.isListening || !this.speechDetectedSinceLastInference) {
        this.stopSlidingTimer();
        return;
      }
      if (!this.isProcessing && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        const speechDuration = this.speechStartTime ? Date.now() - this.speechStartTime : 0;
        if (speechDuration >= SLIDING_WINDOW.MIN_SPEECH_SECONDS * 1e3) {
          this.runSlidingWindowInference().catch((err) => {
            console.error("[WhisperService] Sliding window inference error:", err);
          });
        }
      }
    }, SLIDING_WINDOW.INTERVAL_MS);
    console.log("[WhisperService] Sliding window timer started");
  }
  /** Stop the sliding window timer */
  stopSlidingTimer() {
    if (this.slidingTimer) {
      clearInterval(this.slidingTimer);
      this.slidingTimer = null;
    }
  }
  /**
   * Run a sliding window partial inference on the last N seconds of audio.
   * Uses a FIXED-SIZE window to avoid the growing-buffer GGML reallocation
   * segfault that plagued the original periodic inference approach.
   */
  async runSlidingWindowInference() {
    if (!this.whisper || this.isProcessing) return;
    this.isProcessing = true;
    try {
      const windowSamples = Math.min(this.bufferWritePos, this.WINDOW_SAMPLES);
      const startOffset = this.bufferWritePos - windowSamples;
      const audioCopy = new Float32Array(windowSamples);
      audioCopy.set(this.audioBuffer.subarray(startOffset, this.bufferWritePos));
      const startTime = Date.now();
      console.log(`[WhisperService] Sliding window partial. Window: ${(windowSamples / 16e3).toFixed(1)}s, Total buffer: ${(this.bufferWritePos / 16e3).toFixed(1)}s`);
      const task = await this.whisper.transcribe(audioCopy, {
        language: "en",
        n_threads: this.nThreads,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        initial_prompt: BIBLE_INITIAL_PROMPT
      });
      task.on("transcribed", (segment) => {
        const segText = (segment.text || "").trim();
        if (segText && segText !== this.lastPartialText) {
          this.lastPartialText = segText;
          this.emit("transcript-partial", segText);
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Sliding window inference timed out after 10s")), 1e4)
      );
      const result = await Promise.race([task.result, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      const transcript = this.extractTranscript(result);
      if (transcript && transcript.trim().length > 0) {
        const cleaned = transcript.trim();
        if (cleaned !== this.lastPartialText) {
          this.lastPartialText = cleaned;
          this.emit("transcript-partial", cleaned);
          console.log(`[WhisperService] Sliding partial (${elapsed}ms): "${cleaned}"`);
        }
      }
    } catch (err) {
      console.error("[WhisperService] Sliding window inference failed:", err);
    } finally {
      this.isProcessing = false;
      if (this._pendingFinalInference && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        this._pendingFinalInference = false;
        console.log("[WhisperService] Draining queued final inference after partial...");
        this.tryRunFinalInference();
      }
    }
  }
  // ── Final Inference (End of Utterance) ────────────────────────
  /**
   * Attempt to run final inference if conditions are met.
   */
  tryRunFinalInference() {
    if (this.isProcessing) return;
    if (this.bufferWritePos < this.MIN_INFERENCE_SAMPLES) return;
    console.log(`[WhisperService] Final inference triggered. Samples: ${this.bufferWritePos}`);
    this.runInference(true).catch((err) => {
      console.error("[WhisperService] Final inference error:", err);
    });
  }
  /**
   * Run whisper.cpp inference on the FULL current audio buffer.
   * Used for end-of-utterance final results.
   */
  async runInference(isFinal) {
    if (!this.whisper || this.isProcessing) return;
    this.isProcessing = true;
    this.speechDetectedSinceLastInference = false;
    this.speechStartTime = null;
    this.lastPartialText = "";
    try {
      const audioData = new Float32Array(this.audioBuffer.buffer, 0, this.bufferWritePos);
      const audioCopy = new Float32Array(audioData);
      if (isFinal) {
        this.resetBuffer();
        this.vad.reset();
      }
      const startTime = Date.now();
      console.log(`[WhisperService] Final inference dispatched. Samples: ${audioCopy.length}, Duration: ${(audioCopy.length / 16e3).toFixed(1)}s`);
      const task = await this.whisper.transcribe(audioCopy, {
        language: "en",
        n_threads: this.nThreads,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        initial_prompt: BIBLE_INITIAL_PROMPT
      });
      task.on("transcribed", (segment) => {
        const segText = (segment.text || "").trim();
        if (segText) {
          this.emit("transcript-partial", segText);
        }
      });
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Whisper inference timed out after 30s")), 3e4)
      );
      const result = await Promise.race([task.result, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      console.log(`[WhisperService] Final inference resolved in ${elapsed}ms.`);
      const transcript = this.extractTranscript(result);
      if (transcript && transcript.trim().length > 0) {
        const cleaned = transcript.trim();
        if (isFinal) {
          this.emit("transcript-final", cleaned);
          console.log("[WhisperService] Final transcript:", cleaned);
        } else {
          this.emit("transcript-partial", cleaned);
          console.log("[WhisperService] Partial transcript:", cleaned);
        }
      }
    } catch (err) {
      console.error("[WhisperService] Inference failed:", err);
    } finally {
      this.isProcessing = false;
      if (this._pendingFinalInference && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        this._pendingFinalInference = false;
        console.log("[WhisperService] Draining queued final inference...");
        this.tryRunFinalInference();
      } else {
        this._pendingFinalInference = false;
      }
    }
  }
  /**
   * Extract plain text from whisper transcription result.
   * smart-whisper returns segments with text and timestamps.
   */
  extractTranscript(result) {
    if (typeof result === "string") return result;
    if (Array.isArray(result)) {
      return result.map((seg) => seg.text || seg).join(" ");
    }
    if (result && typeof result === "object") {
      if (result.text) return result.text;
      if (result.segments) {
        return result.segments.map((seg) => seg.text || "").join(" ");
      }
    }
    return String(result || "");
  }
  /** Reset the audio buffer */
  resetBuffer() {
    this.bufferWritePos = 0;
  }
  /** Update status and emit event */
  setStatus(status, message) {
    this.status = status;
    this.emit("status-change", status, message);
  }
  /** Shut down the whisper engine and free resources */
  async shutdown() {
    this.isListening = false;
    this.stopSlidingTimer();
    if (this.inferenceTimer) {
      clearInterval(this.inferenceTimer);
      this.inferenceTimer = null;
    }
    if (this.whisper) {
      try {
        await this.whisper.free();
      } catch (err) {
        console.error("[WhisperService] Error during shutdown:", err);
      }
      this.whisper = null;
    }
    this.setStatus("uninitialized");
    console.log("[WhisperService] Shut down");
  }
}
const MODEL_REGISTRY = {
  "ggml-tiny.en.bin": {
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
    expectedSizeMB: 75
  },
  "ggml-small.en.bin": {
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin",
    expectedSizeMB: 466
  },
  "ggml-base.en.bin": {
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
    expectedSizeMB: 142
  }
};
class WhisperModelManager {
  constructor() {
    if (electron.app.isPackaged) {
      this.modelsDir = path.join(process.resourcesPath, "models");
    } else {
      this.modelsDir = path.join(electron.app.getAppPath(), "models");
    }
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }
  /** Get the absolute path to a model file */
  getModelPath(modelName) {
    return path.join(this.modelsDir, modelName);
  }
  /** Check if a model file exists and has a reasonable size */
  isModelDownloaded(modelName) {
    const modelPath = this.getModelPath(modelName);
    if (!fs.existsSync(modelPath)) return false;
    const registry = MODEL_REGISTRY[modelName];
    if (!registry) return fs.existsSync(modelPath);
    const stats = fs.statSync(modelPath);
    const sizeMB = stats.size / (1024 * 1024);
    return sizeMB >= registry.expectedSizeMB * 0.9;
  }
  /**
   * Ensure a model exists locally. If not, download it from Hugging Face.
   * Returns the absolute path to the model file.
   */
  async ensureModelExists(modelName, onProgress) {
    const modelPath = this.getModelPath(modelName);
    if (this.isModelDownloaded(modelName)) {
      console.log(`[WhisperModelManager] Model "${modelName}" already exists at ${modelPath}`);
      return modelPath;
    }
    const registry = MODEL_REGISTRY[modelName];
    if (!registry) {
      throw new Error(`[WhisperModelManager] Unknown model: "${modelName}". Available: ${Object.keys(MODEL_REGISTRY).join(", ")}`);
    }
    console.log(`[WhisperModelManager] Downloading "${modelName}" from ${registry.url}...`);
    await this.downloadFile(registry.url, modelPath, onProgress);
    if (!this.isModelDownloaded(modelName)) {
      if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
      throw new Error(`[WhisperModelManager] Downloaded model "${modelName}" failed integrity check`);
    }
    console.log(`[WhisperModelManager] Model "${modelName}" downloaded successfully`);
    return modelPath;
  }
  /** Download a file with progress reporting, following redirects */
  downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const tempPath = `${destPath}.downloading`;
      const makeRequest = (requestUrl, redirectCount = 0) => {
        if (redirectCount > 5) {
          reject(new Error("Too many redirects"));
          return;
        }
        const urlObj = new URL(requestUrl);
        const requestModule = urlObj.protocol === "https:" ? https : require("node:http");
        const req = requestModule.get(requestUrl, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, requestUrl).toString();
            console.log(`[WhisperModelManager] Following redirect to ${redirectUrl}`);
            makeRequest(redirectUrl, redirectCount + 1);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed with status ${res.statusCode}`));
            return;
          }
          const totalBytes = parseInt(res.headers["content-length"] || "0", 10);
          const totalMB = totalBytes / (1024 * 1024);
          let downloadedBytes = 0;
          const fileStream = fs.createWriteStream(tempPath);
          res.on("data", (chunk) => {
            downloadedBytes += chunk.length;
            fileStream.write(chunk);
            if (onProgress && totalBytes > 0) {
              onProgress({
                percent: Math.round(downloadedBytes / totalBytes * 100),
                downloadedMB: Math.round(downloadedBytes / (1024 * 1024) * 10) / 10,
                totalMB: Math.round(totalMB * 10) / 10
              });
            }
          });
          res.on("end", () => {
            fileStream.end(() => {
              fs.renameSync(tempPath, destPath);
              resolve();
            });
          });
          res.on("error", (err) => {
            fileStream.close();
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            reject(err);
          });
        });
        req.on("error", (err) => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          reject(err);
        });
      };
      makeRequest(url);
    });
  }
}
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let lowerThirdWindow = null;
let mainPresentationWindow = null;
let deepLinkUrl = null;
const whisperService = new WhisperService();
const modelManager = new WhisperModelManager();
const DEFAULT_MODEL = "ggml-tiny.en.bin";
let ndiManager = null;
let statsInterval = null;
let _lastCpu = os.cpus().map((c) => ({ ...c.times }));
function getCpuPercent() {
  const cpus = os.cpus();
  let total = 0;
  let idle = 0;
  cpus.forEach((cpu, i) => {
    const prev = _lastCpu[i];
    const curr = cpu.times;
    const dUser = curr.user - prev.user;
    const dNice = curr.nice - prev.nice;
    const dSys = curr.sys - prev.sys;
    const dIrq = curr.irq - prev.irq;
    const dIdle = curr.idle - prev.idle;
    const tTotal = dUser + dNice + dSys + dIrq + dIdle;
    total += tTotal;
    idle += dIdle;
  });
  _lastCpu = cpus.map((c) => ({ ...c.times }));
  return total > 0 ? Math.round((total - idle) / total * 100) : 0;
}
function createHiddenRendererWindow(rendererType) {
  const win2 = new electron.BrowserWindow({
    width: 1920,
    height: 1080,
    // enableLargerThanScreen is deprecated in modern Electron — bounds handles this
    show: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // allow local file:// assets from public dir
      preload: path.join(__dirname$1, "preload.cjs")
    }
  });
  const htmlFile = rendererType === "lowerThird" ? "lower-third.html" : "main-presentation.html";
  if (VITE_DEV_SERVER_URL) {
    win2.loadURL(`${VITE_DEV_SERVER_URL}renderer/${htmlFile}`);
  } else {
    win2.loadFile(path.join(RENDERER_DIST, "renderer", htmlFile));
  }
  win2.webContents.on("did-finish-load", () => {
    console.log(`[RendererWindow:${rendererType}] page loaded`);
  });
  win2.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error(`[RendererWindow:${rendererType}] load failed:`, code, desc);
  });
  return win2;
}
function startNdiStreams(sources) {
  console.log("[NDI] startNdiStreams", sources);
  stopNdiStreams();
  ndiManager = new NdiManager();
  const grandioseError2 = NdiManager.getGrandioseError();
  if (grandioseError2) {
    console.error("[NDI] Grandiose error:", grandioseError2);
    win == null ? void 0 : win.webContents.send("ndi-error", grandioseError2);
    return;
  }
  if (!lowerThirdWindow || lowerThirdWindow.isDestroyed()) {
    lowerThirdWindow = createHiddenRendererWindow("lowerThird");
  }
  if (!mainPresentationWindow || mainPresentationWindow.isDestroyed()) {
    mainPresentationWindow = createHiddenRendererWindow("mainPresentation");
  }
  const windows = [lowerThirdWindow, mainPresentationWindow];
  sources.forEach((src, i) => {
    if (!src.ndiName) {
      console.warn(`[NDI] Source ${i} missing ndiName, skipping`);
      return;
    }
    const rendererWin = windows[i];
    if (!rendererWin || rendererWin.isDestroyed()) return;
    const sender = ndiManager.createSender(i, src.ndiName, 1920, 1080);
    let frameLogged = false;
    rendererWin.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        rendererWin.webContents.setFrameRate(60);
        rendererWin.webContents.on("paint", (_event, _dirty, image) => {
          if (!frameLogged) {
            console.log(`[NDI] First frame for source ${i} (${src.ndiName})`);
            frameLogged = true;
          }
          try {
            if (!image) return;
            const frameData = image.getBitmap();
            if (!frameData) return;
            const size = image.getSize();
            sender.sendFrame(frameData, size.width, size.height);
          } catch (err) {
            console.error(`[NDI] Frame error for source ${i}:`, err.message);
          }
        });
        console.log(`[NDI] Paint listener registered for source ${i}`);
      }, 500);
    });
  });
  statsInterval = setInterval(async () => {
    if (!win || win.isDestroyed()) return;
    const mem = process.memoryUsage();
    const fps = ndiManager ? ndiManager.getFpsStats() : [0, 0];
    const bitrate = ndiManager ? ndiManager.getBitrateStats() : [0, 0];
    const previews = await Promise.all(
      windows.map(async (w) => {
        if (!w || w.isDestroyed()) return null;
        try {
          const img = await w.webContents.capturePage();
          return img ? img.resize({ width: 480 }).toDataURL() : null;
        } catch {
          return null;
        }
      })
    );
    win.webContents.send("ndi-stats-update", {
      cpu: getCpuPercent(),
      ram: Math.round(mem.rss / 1024 / 1024),
      sources: [
        { fps: fps[0], bitrateMbps: bitrate[0], active: !!(lowerThirdWindow && !lowerThirdWindow.isDestroyed()) },
        { fps: fps[1], bitrateMbps: bitrate[1], active: !!(mainPresentationWindow && !mainPresentationWindow.isDestroyed()) }
      ],
      previews
    });
  }, 1e3);
}
function stopNdiStreams() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  if (lowerThirdWindow && !lowerThirdWindow.isDestroyed()) {
    lowerThirdWindow.destroy();
    lowerThirdWindow = null;
  }
  if (mainPresentationWindow && !mainPresentationWindow.isDestroyed()) {
    mainPresentationWindow.destroy();
    mainPresentationWindow = null;
  }
  if (ndiManager) {
    ndiManager.destroy();
    ndiManager = null;
  }
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) handleProtocolUri(uri);
  });
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      electron.app.setAsDefaultProtocolClient("qworship", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    electron.app.setAsDefaultProtocolClient("qworship");
  }
  electron.app.whenReady().then(async () => {
    electron.session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
      callback(allowed.includes(permission));
    });
    electron.session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
      return allowed.includes(permission);
    });
    if (process.platform === "darwin") {
      electron.systemPreferences.askForMediaAccess("microphone").then((granted) => {
        console.log("OS-level microphone permission granted:", granted);
      }).catch((err) => console.error("OS-level microphone permission error:", err));
    }
    createWindow();
    initializeWhisper().catch((err) => {
      console.error("[Main] Whisper initialization failed:", err);
    });
  });
  electron.app.on("open-url", (event, url) => {
    event.preventDefault();
    if (electron.app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}
async function initializeWhisper() {
  try {
    const modelPath = await modelManager.ensureModelExists(DEFAULT_MODEL, (progress) => {
      if (win && win.webContents) {
        win.webContents.send("hfb:model-download-progress", progress.percent, progress.downloadedMB, progress.totalMB);
      }
    });
    await whisperService.initialize(modelPath);
    whisperService.on("transcript-partial", (text) => {
      if (win && win.webContents) {
        win.webContents.send("hfb:transcript-partial", text);
      }
    });
    whisperService.on("transcript-final", (text) => {
      if (win && win.webContents) {
        win.webContents.send("hfb:transcript-final", text);
      }
    });
    whisperService.on("status-change", (status, message) => {
      if (win && win.webContents) {
        win.webContents.send("hfb:status-change", status, message);
      }
    });
    console.log("[Main] Whisper initialized successfully");
  } catch (err) {
    console.error("[Main] Failed to initialize Whisper:", err);
  }
}
let _audioChunkCount = 0;
electron.ipcMain.on("hfb:audio-chunk", (_event, rawData) => {
  const pcm16 = new Int16Array(
    rawData.buffer || rawData,
    rawData.byteOffset || 0,
    (rawData.byteLength || rawData.length) / 2
  );
  if (_audioChunkCount++ % 100 === 0) {
    let maxAmplitude = 0;
    for (let i = 0; i < pcm16.length; i++) {
      const val = Math.abs(pcm16[i]);
      if (val > maxAmplitude) maxAmplitude = val;
    }
    console.log(`[Main] Audio chunk #${_audioChunkCount}. Peak amplitude: ${maxAmplitude}/32768`);
  }
  whisperService.feedAudioChunk(pcm16);
});
electron.ipcMain.on("hfb:start-listening", () => {
  whisperService.startListening();
});
electron.ipcMain.on("hfb:stop-listening", () => {
  whisperService.stopListening();
});
electron.ipcMain.handle("hfb:get-status", () => {
  return whisperService.getStatus();
});
function handleProtocolUri(url) {
  console.log("Received deep link:", url);
  deepLinkUrl = url;
  if (win && win.webContents) {
    win.webContents.send("deep-link-payload", url);
  }
}
electron.ipcMain.on("request-deep-link", () => {
  if (deepLinkUrl && win && win.webContents) {
    win.webContents.send("deep-link-payload", deepLinkUrl);
    deepLinkUrl = null;
  }
});
electron.ipcMain.on("open-external-url", (_event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    electron.shell.openExternal(url);
  }
});
electron.ipcMain.handle("ndi-start-stream", (_event, sources) => {
  startNdiStreams(sources);
  return { ok: true };
});
electron.ipcMain.handle("ndi-stop-stream", () => {
  stopNdiStreams();
  return { ok: true };
});
electron.ipcMain.handle("ndi-get-grandiose-error", () => {
  return NdiManager.getGrandioseError();
});
electron.ipcMain.on("update-renderer-state", (_event, type, state) => {
  const target = type === "lowerThird" ? lowerThirdWindow : mainPresentationWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send("state-update", state);
  }
});
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });
  win.on("ready-to-show", () => {
    win == null ? void 0 : win.show();
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("⚠️ [RENDERER CRASHED]", details.reason, "exitCode:", details.exitCode);
  });
  win.on("unresponsive", () => {
    console.error("⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding");
  });
  win.on("responsive", () => {
    console.log("✅ [RENDERER RESPONSIVE] The renderer process recovered");
  });
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const prefix = level >= 2 ? "🔴 [RENDERER ERROR]" : "🔵 [RENDERER LOG]";
    console.log(`${prefix} ${message} (${sourceId}:${line})`);
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1") || url.startsWith("file://")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          fullscreen: false,
          width: 1024,
          height: 768,
          frame: true,
          title: "Qworship Live Presentation",
          webPreferences: {
            preload: path.join(__dirname$1, "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    if (url.startsWith("http:") || url.startsWith("https:")) {
      electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.on("did-finish-load", () => {
    if (deepLinkUrl) {
      handleProtocolUri(deepLinkUrl);
      deepLinkUrl = null;
    }
  });
}
electron.app.on("window-all-closed", () => {
  stopNdiStreams();
  if (process.platform !== "darwin") {
    whisperService.shutdown().finally(() => {
      electron.app.quit();
    });
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
