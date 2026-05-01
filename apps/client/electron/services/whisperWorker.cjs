/**
 * Whisper Worker (Isolated Thread Pattern)
 *
 * Runs the 'smart-whisper' native addon in a dedicated Node process to prevent
 * Metal/Graph deallocation memory faults from crashing the Electron main loop.
 *
 * Changes vs. baseline:
 *  - BIBLE_INITIAL_PROMPT expanded to all 66 canonical book names + 6 version
 *    acronyms + navigation vocabulary for maximum transcription accuracy.
 *  - Silero VAD (ONNX) integrated as a pre-inference gate: audio chunks that
 *    contain no speech energy according to the neural VAD are dropped before
 *    they ever reach the C++ Whisper engine, reducing hallucinations and
 *    cutting wasted inference cycles.
 */

'use strict';

const { Whisper } = require('smart-whisper');
const ort = require('onnxruntime-node');
const path = require('node:path');
const fs = require('node:fs');

// ---------------------------------------------------------------------------
// Bible-domain initial prompt — all 66 canonical books, all 6 versions, and
// the core navigation vocabulary.  Whisper uses this to bias the attention
// mechanism toward biblical proper nouns and command phrases.
// ---------------------------------------------------------------------------
const BIBLE_INITIAL_PROMPT = [
  // Old Testament
  'Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, Judges, Ruth,',
  '1 Samuel, 2 Samuel, 1 Kings, 2 Kings, 1 Chronicles, 2 Chronicles,',
  'Ezra, Nehemiah, Esther, Job, Psalms, Proverbs, Ecclesiastes,',
  'Song of Solomon, Isaiah, Jeremiah, Lamentations, Ezekiel, Daniel,',
  'Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk,',
  'Zephaniah, Haggai, Zechariah, Malachi,',
  // New Testament
  'Matthew, Mark, Luke, John, Acts, Romans,',
  '1 Corinthians, 2 Corinthians, Galatians, Ephesians, Philippians, Colossians,',
  '1 Thessalonians, 2 Thessalonians, 1 Timothy, 2 Timothy, Titus, Philemon,',
  'Hebrews, James, 1 Peter, 2 Peter, 1 John, 2 John, 3 John, Jude, Revelation,',
  // Versions
  'KJV, NKJV, NIV, ESV, AMP, MSG,',
  // Navigation commands
  'chapter, verse, next verse, previous verse, show me, wake up, amen, thank you.',
].join(' ');

// ---------------------------------------------------------------------------
// Silero VAD — lightweight neural voice activity detector (ONNX, ~2.3 MB).
// Runs in ~5 ms per 512-sample frame on CPU.  Used to gate audio before
// sending to Whisper, eliminating silence/noise hallucinations.
// ---------------------------------------------------------------------------

/** Silero VAD state — persisted across frames within one utterance */
let sileroSession = null;
let sileroH = null; // hidden state (1×1×64 float32)
let sileroC = null; // cell state  (1×1×64 float32)

async function loadSileroVAD(modelPath) {
  if (sileroSession) return; // already loaded
  if (!fs.existsSync(modelPath)) {
    console.warn('[WhisperWorker] Silero VAD model not found at', modelPath, '— VAD disabled, falling back to amplitude gate.');
    return;
  }
  try {
    sileroSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });
    // Initialise hidden/cell states to zeros (shape: 2×1×64)
    sileroH = new ort.Tensor('float32', new Float32Array(2 * 1 * 64), [2, 1, 64]);
    sileroC = new ort.Tensor('float32', new Float32Array(2 * 1 * 64), [2, 1, 64]);
    console.log('[WhisperWorker] Silero VAD loaded successfully.');
  } catch (err) {
    console.warn('[WhisperWorker] Failed to load Silero VAD:', err.message, '— falling back to amplitude gate.');
    sileroSession = null;
  }
}

function resetSileroState() {
  if (!sileroSession) return;
  sileroH = new ort.Tensor('float32', new Float32Array(2 * 1 * 64), [2, 1, 64]);
  sileroC = new ort.Tensor('float32', new Float32Array(2 * 1 * 64), [2, 1, 64]);
}

/**
 * Run Silero VAD on a Float32Array of 16 kHz mono audio.
 * Returns the maximum speech probability across all 512-sample frames.
 * If Silero is not loaded, falls back to RMS amplitude check.
 */
async function getSpeechProbability(float32Audio) {
  // --- Fallback: RMS amplitude gate ---
  if (!sileroSession) {
    let sum = 0;
    for (let i = 0; i < float32Audio.length; i++) sum += float32Audio[i] * float32Audio[i];
    const rms = Math.sqrt(sum / float32Audio.length);
    return rms > 0.0005 ? 0.9 : 0.0;
  }

  const FRAME_SIZE = 512; // Silero v4 uses 512-sample frames at 16 kHz
  const SR_TENSOR = new ort.Tensor('int64', BigInt64Array.from([16000n]), [1]);
  let maxProb = 0;

  for (let offset = 0; offset + FRAME_SIZE <= float32Audio.length; offset += FRAME_SIZE) {
    const frame = float32Audio.slice(offset, offset + FRAME_SIZE);
    const inputTensor = new ort.Tensor('float32', frame, [1, FRAME_SIZE]);

    try {
      const feeds = { input: inputTensor, sr: SR_TENSOR, h: sileroH, c: sileroC };
      const results = await sileroSession.run(feeds);

      // Update recurrent state for the next frame
      sileroH = results.hn;
      sileroC = results.cn;

      const prob = results.output.data[0];
      if (prob > maxProb) maxProb = prob;
    } catch (frameErr) {
      console.warn('[WhisperWorker] Silero frame error:', frameErr.message);
    }
  }

  return maxProb;
}

// ---------------------------------------------------------------------------
// Whisper instance
// ---------------------------------------------------------------------------
let instance = null;

// ---------------------------------------------------------------------------
// IPC message handler
// ---------------------------------------------------------------------------
process.on('message', async (msg) => {
  try {
    // ── INIT ──────────────────────────────────────────────────────────────
    if (msg.type === 'init') {
      console.log('[WhisperWorker] Initializing smart-whisper with model:', msg.modelPath);
      instance = new Whisper(msg.modelPath, {
        gpu: false,
        offload: 0,
        flash_attn: false,
        dtw: 0,
      });

      // Load Silero VAD from the models directory (same folder as the Whisper model)
      const sileroPath = path.join(path.dirname(msg.modelPath), 'silero_vad.onnx');
      await loadSileroVAD(sileroPath);

      process.send({ type: 'ready' });
    }

    // ── TRANSCRIBE ────────────────────────────────────────────────────────
    if (msg.type === 'transcribe' && instance) {
      console.log('[WhisperWorker] Received transcribe IPC payload. Buffer size bytes:',
        msg.buffer.data ? msg.buffer.data.length : msg.buffer.length);

      const nodeBuf = Buffer.isBuffer(msg.buffer) ? msg.buffer : Buffer.from(msg.buffer.data || msg.buffer);

      // Reconstruct the Float32Array securely from a raw ArrayBuffer to prevent
      // N-API reading from Node's GC-pooled memory bounds
      const cleanBuffer = new ArrayBuffer(nodeBuf.length);
      new Uint8Array(cleanBuffer).set(nodeBuf);
      const float32 = new Float32Array(cleanBuffer);

      // ── Silero VAD gate ──────────────────────────────────────────────
      // Reset recurrent state before each new utterance so that state from
      // a previous command does not bleed into the current one.
      resetSileroState();
      const speechProb = await getSpeechProbability(float32);
      console.log(`[WhisperWorker] Silero speech probability: ${speechProb.toFixed(3)}`);

      if (speechProb < 0.35) {
        console.log(`[WhisperWorker] Dropping chunk: VAD speech probability too low (${speechProb.toFixed(3)} < 0.35)`);
        process.send({ type: 'transcript-partial', text: '' });
        process.send({ type: 'transcript-final', text: '' });
        return;
      }

      // ── Whisper inference ────────────────────────────────────────────
      console.log('[WhisperWorker] Starting instance.transcribe...');
      const task = await instance.transcribe(float32, {
        language: 'en',
        n_threads: 4,
        initial_prompt: BIBLE_INITIAL_PROMPT,
        // Prevent ABI struct garbage from causing infinite-length decoder locks
        max_len: 400,
        no_timestamps: false,
        single_segment: false,
        print_realtime: false,
        print_progress: false,
        translate: false,
        no_context: true,
        beam_size: 1,
        temperature: 0.0,
      });

      task.on('transcribed', (segment) => {
        if (segment.text) {
          process.send({ type: 'transcript-partial', text: segment.text.trim() });
        }
      });

      console.log('[WhisperWorker] Task scheduled, awaiting result...');
      const result = await Promise.race([
        task.result,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('INFERENCE_TIMEOUT: C++ engine hung for 60s')), 60000)
        ),
      ]);
      console.log('[WhisperWorker] Task resolved!');

      try {
        console.log('[WhisperWorker] Raw result payload:', JSON.stringify(result)?.substring(0, 500));
      } catch (_) {}

      let transcript = '';
      if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
        transcript = '';
      } else if (typeof result === 'string') {
        transcript = result;
      } else if (Array.isArray(result)) {
        transcript = result.map((s) => s.text || '').join(' ');
      } else if (result && typeof result === 'object') {
        transcript = result.text || (result.segments ? result.segments.map((s) => s.text).join(' ') : '');
      }

      let safeTranscript = transcript || '';

      // Filter Whisper hallucination artefacts
      safeTranscript = safeTranscript.replace(/\[BLANK_AUDIO\]/g, '');
      safeTranscript = safeTranscript.replace(/\(BLANK_AUDIO\)/g, '');
      safeTranscript = safeTranscript.replace(/\[Music\]/gi, '');
      safeTranscript = safeTranscript.replace(/\[Applause\]/gi, '');
      safeTranscript = safeTranscript.replace(/\[Noise\]/gi, '');

      console.log(`[WhisperWorker] Final transcript string: "${safeTranscript.trim()}"`);

      // ALWAYS send a message back to release the lock in WhisperService
      process.send({ type: 'transcript-final', text: safeTranscript.trim() });
    }

    // ── SHUTDOWN ──────────────────────────────────────────────────────────
    if (msg.type === 'shutdown' && instance) {
      await instance.free();
      instance = null;
      sileroSession = null;
      process.exit(0);
    }
  } catch (err) {
    console.error('[WhisperWorker] Unhandled error:', err);
    process.send({ type: 'error', message: err.message || err.toString() });

    // FATAL: If the C++ engine has timed out or hung, forcefully kill the V8 process.
    // Returning to the event loop would permanently leak CPU and deadlock future queries.
    if (err.message && err.message.includes('INFERENCE_TIMEOUT')) {
      console.error('[WhisperWorker] FATAL: Killing worker process to wipe leaked C++ thread...');
      process.exit(1);
    }
  }
});
