"use strict";
const require$$0 = require("smart-whisper");
var whisperWorker = {};
const { Whisper } = require$$0;
let instance = null;
const BIBLE_INITIAL_PROMPT = "Genesis, Exodus, Luke, Psalms, Matthew, John, Revelation, chapter, verse.";
process.on("message", async (msg) => {
  var _a;
  try {
    if (msg.type === "init") {
      console.log("[WhisperWorker] Initializing smart-whisper with model:", msg.modelPath);
      instance = new Whisper(msg.modelPath, {
        gpu: false,
        offload: 0,
        flash_attn: false,
        dtw: 0
      });
      process.send({ type: "ready" });
    }
    if (msg.type === "transcribe" && instance) {
      console.log("[WhisperWorker] Received transcribe IPC payload. Buffer size bytes:", msg.buffer.data ? msg.buffer.data.length : msg.buffer.length);
      const nodeBuf = Buffer.isBuffer(msg.buffer) ? msg.buffer : Buffer.from(msg.buffer.data || msg.buffer);
      const cleanBuffer = new ArrayBuffer(nodeBuf.length);
      new Uint8Array(cleanBuffer).set(nodeBuf);
      const float32 = new Float32Array(cleanBuffer);
      let maxAmp = 0;
      for (let i = 0; i < float32.length; i++) {
        const abs = Math.abs(float32[i]);
        if (abs > maxAmp) maxAmp = abs;
      }
      if (maxAmp < 5e-4) {
        console.log(`[WhisperWorker] Dropping chunk: Audio is pure silence (Peak: ${maxAmp.toFixed(5)})`);
        process.send({ type: "transcript-partial", text: "" });
        process.send({ type: "transcript-final", text: "" });
        return;
      }
      console.log("[WhisperWorker] Starting instance.transcribe...");
      const task = await instance.transcribe(float32, {
        language: "en",
        n_threads: 4,
        initial_prompt: BIBLE_INITIAL_PROMPT,
        // Overwrite standard ABI struct garbage variables that cause infinite length decoder locks:
        max_len: 400,
        no_timestamps: false,
        single_segment: false,
        print_realtime: false,
        print_progress: false,
        translate: false,
        no_context: true,
        beam_size: 1,
        temperature: 0
      });
      task.on("transcribed", (segment) => {
        if (segment.text) {
          process.send({ type: "transcript-partial", text: segment.text.trim() });
        }
      });
      console.log("[WhisperWorker] Task scheduled, awaiting result...");
      const result = await Promise.race([
        task.result,
        new Promise((_, reject) => setTimeout(() => reject(new Error("INFERENCE_TIMEOUT: C++ engine hung for 60s")), 6e4))
      ]);
      console.log("[WhisperWorker] Task resolved!");
      try {
        console.log("[WhisperWorker] Raw result payload:", (_a = JSON.stringify(result)) == null ? void 0 : _a.substring(0, 500));
      } catch (e) {
      }
      let transcript = "";
      if (!result || typeof result === "object" && Object.keys(result).length === 0) {
        transcript = "";
      } else if (typeof result === "string") {
        transcript = result;
      } else if (Array.isArray(result)) {
        transcript = result.map((s) => s.text || "").join(" ");
      } else if (result && typeof result === "object") {
        transcript = result.text || (result.segments ? result.segments.map((s) => s.text).join(" ") : "");
      }
      let safeTranscript = transcript || "";
      safeTranscript = safeTranscript.replace(/\[BLANK_AUDIO\]/g, "");
      safeTranscript = safeTranscript.replace(/\(BLANK_AUDIO\)/g, "");
      console.log(`[WhisperWorker] Final transcript string: "${safeTranscript.trim()}"`);
      process.send({ type: "transcript-final", text: safeTranscript.trim() });
    }
    if (msg.type === "shutdown" && instance) {
      await instance.free();
      instance = null;
      process.exit(0);
    }
  } catch (err) {
    console.error("[WhisperWorker] Unhandled specific error:", err);
    process.send({ type: "error", message: err.message || err.toString() });
    if (err.message && err.message.includes("INFERENCE_TIMEOUT")) {
      console.error("[WhisperWorker] FATAL: Killing worker process to wipe leaked C++ thread...");
      process.exit(1);
    }
  }
});
module.exports = whisperWorker;
