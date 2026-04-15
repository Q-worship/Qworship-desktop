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
const node_url = require("node:url");
const node_events = require("node:events");
const fs = require("node:fs");
const https = require("node:https");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
class VADDetector {
  constructor(options = {}) {
    this.speaking = false;
    this.silenceStartMs = null;
    this.lastProcessTime = 0;
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
  /** Whether the silence timeout has been reached (end of utterance) */
  isEndOfUtterance() {
    if (this.silenceStartMs === null) return false;
    return Date.now() - this.silenceStartMs >= this.silenceTimeoutMs;
  }
  /** Reset all state */
  reset() {
    this.speaking = false;
    this.silenceStartMs = null;
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
class WhisperService extends node_events.EventEmitter {
  constructor() {
    super();
    this.whisper = null;
    this.status = "uninitialized";
    this.bufferWritePos = 0;
    this.MAX_BUFFER_SAMPLES = 16e3 * 30;
    this.MIN_INFERENCE_SAMPLES = 16e3 * 0.8;
    this.isListening = false;
    this.isProcessing = false;
    this.inferenceTimer = null;
    this.INFERENCE_INTERVAL_MS = 1200;
    this.speechDetectedSinceLastInference = false;
    this.audioBuffer = new Float32Array(this.MAX_BUFFER_SAMPLES);
    this.vad = new VADDetector({
      onsetThreshold: 0.01,
      offsetThreshold: 6e-3,
      silenceTimeoutMs: 1500,
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
      this.whisper = new Whisper(modelPath, { gpu: false });
      this.setStatus("ready");
      console.log("[WhisperService] Model loaded successfully");
    } catch (err) {
      this.setStatus("error", err.message);
      console.error("[WhisperService] Failed to load model:", err);
      throw err;
    }
  }
  /**
   * Start listening for audio input.
   * Begins the inference timer and VAD processing.
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
    this.inferenceTimer = setInterval(() => {
      this.tryRunInference(false);
    }, this.INFERENCE_INTERVAL_MS);
    console.log("[WhisperService] Started listening");
  }
  /**
   * Stop listening and process any remaining audio.
   */
  async stopListening() {
    this.isListening = false;
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
    if (this.vad.isSpeaking()) {
      this.speechDetectedSinceLastInference = true;
    }
    const spaceLeft = this.MAX_BUFFER_SAMPLES - this.bufferWritePos;
    const samplesToWrite = Math.min(float32.length, spaceLeft);
    if (samplesToWrite > 0) {
      this.audioBuffer.set(float32.subarray(0, samplesToWrite), this.bufferWritePos);
      this.bufferWritePos += samplesToWrite;
    }
    if (this.bufferWritePos >= this.MAX_BUFFER_SAMPLES) {
      this.tryRunInference(true);
    }
    if (this.vad.isEndOfUtterance() && this.speechDetectedSinceLastInference) {
      this.tryRunInference(true);
    }
  }
  /**
   * Attempt to run inference if conditions are met.
   * @param isFinal Whether this is a final segment (end of utterance or forced)
   */
  tryRunInference(isFinal) {
    if (this.isProcessing) return;
    if (this.bufferWritePos < this.MIN_INFERENCE_SAMPLES) return;
    if (!this.speechDetectedSinceLastInference && !isFinal) return;
    console.log(`[WhisperService] VAD Triggered Inference (isFinal: ${isFinal}). Samples: ${this.bufferWritePos}`);
    this.runInference(isFinal).catch((err) => {
      console.error("[WhisperService] Inference error:", err);
    });
  }
  /**
   * Run whisper.cpp inference on the current audio buffer.
   */
  async runInference(isFinal) {
    if (!this.whisper || this.isProcessing) return;
    this.isProcessing = true;
    this.speechDetectedSinceLastInference = false;
    try {
      const audioCopy = new Float32Array(this.MAX_BUFFER_SAMPLES);
      const activeSlice = new Float32Array(this.audioBuffer.buffer, 0, this.bufferWritePos);
      audioCopy.set(activeSlice);
      if (isFinal) {
        this.resetBuffer();
        this.vad.reset();
      }
      console.log(`[WhisperService] C++ Engine chunk dispatched. Language: EN.`);
      const task = await this.whisper.transcribe(audioCopy, {
        language: "en"
        // initial_prompt temporarily disabled to test if it's breaking the C++ wrapper
      });
      task.on("transcribed", (segment) => {
        console.log(`[WhisperService-C++] Extracted chunk: "${segment.text}"`);
      });
      const result = await task.result;
      console.log(`[WhisperService] C++ Engine resolved.`);
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
let deepLinkUrl = null;
const whisperService = new WhisperService();
const modelManager = new WhisperModelManager();
const DEFAULT_MODEL = "ggml-small.en.bin";
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) {
      handleProtocolUri(uri);
    }
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
function createWindow() {
  const { session: session2 } = require("electron");
  session2.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
    callback(allowed.includes(permission));
  });
  session2.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
    return allowed.includes(permission);
  });
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    // Don't show immediately to prevent white flash
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
      // Necessary if they use <webview> for pricing
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
          // Changed from true so it appears as a distinct window
          width: 1024,
          height: 768,
          frame: true,
          // Allow user to drag it to an external display
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
