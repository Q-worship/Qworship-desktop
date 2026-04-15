/**
 * WhisperService — Core offline STT engine for Hands-Free Bible.
 *
 * Wraps the `smart-whisper` native addon with a streaming-compatible interface:
 * 1. Receives PCM16 audio chunks at 16kHz via `feedAudioChunk()`
 * 2. Converts Int16 → Float32 and accumulates in a buffer
 * 3. Uses VAD to gate when inference runs (saves CPU when silent)
 * 4. Runs whisper.cpp inference on accumulated audio segments
 * 5. Uses `initial_prompt` to bias recognition toward Bible book names
 * 6. Emits partial and final transcripts via event callbacks
 */

import { EventEmitter } from 'node:events';
import { VADDetector } from './vadDetector';

// smart-whisper is a native addon — imported dynamically to avoid
// Vite bundling issues. The actual import happens in initialize().
let Whisper: any = null;

/** Bible book names used as initial_prompt to bias Whisper recognition */
const BIBLE_INITIAL_PROMPT =
  'Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, Judges, Ruth, ' +
  '1 Samuel, 2 Samuel, 1 Kings, 2 Kings, 1 Chronicles, 2 Chronicles, ' +
  'Ezra, Nehemiah, Esther, Job, Psalms, Proverbs, Ecclesiastes, ' +
  'Song of Solomon, Isaiah, Jeremiah, Lamentations, Ezekiel, Daniel, ' +
  'Hosea, Joel, Amos, Obadiah, Jonah, Micah, Nahum, Habakkuk, ' +
  'Zephaniah, Haggai, Zechariah, Malachi, Matthew, Mark, Luke, John, ' +
  'Acts, Romans, 1 Corinthians, 2 Corinthians, Galatians, Ephesians, ' +
  'Philippians, Colossians, 1 Thessalonians, 2 Thessalonians, ' +
  '1 Timothy, 2 Timothy, Titus, Philemon, Hebrews, James, ' +
  '1 Peter, 2 Peter, 1 John, 2 John, 3 John, Jude, Revelation. ' +
  'Chapter, verse, next, previous, switch to, KJV, NKJV, NIV, ESV, Amplified.';

export type WhisperStatus = 'uninitialized' | 'loading' | 'ready' | 'processing' | 'error';

export interface WhisperServiceEvents {
  'transcript-partial': (text: string) => void;
  'transcript-final': (text: string) => void;
  'status-change': (status: WhisperStatus, message?: string) => void;
}

export class WhisperService extends EventEmitter {
  private whisper: any = null;
  private status: WhisperStatus = 'uninitialized';
  private vad: VADDetector;
  private modelPath: string = '';

  /** Audio buffer — accumulates Float32 samples at 16kHz */
  private audioBuffer: Float32Array;
  private bufferWritePos: number = 0;

  /** Max buffer size: 30 seconds @ 16kHz = 480,000 samples */
  private readonly MAX_BUFFER_SAMPLES = 16000 * 30;

  /** Minimum audio to process: ~0.8 seconds @ 16kHz */
  private readonly MIN_INFERENCE_SAMPLES = 16000 * 0.8;

  /** Are we actively listening for audio? */
  private isListening: boolean = false;

  /** Is an inference currently running? */
  private isProcessing: boolean = false;

  /** Timer for periodic inference during speech */
  private inferenceTimer: NodeJS.Timeout | null = null;

  /** Interval between inference runs during speech (ms) */
  private readonly INFERENCE_INTERVAL_MS = 1200;

  /** Track whether speech was detected since last inference */
  private speechDetectedSinceLastInference: boolean = false;

  constructor() {
    super();
    this.audioBuffer = new Float32Array(this.MAX_BUFFER_SAMPLES);
    this.vad = new VADDetector({
      onsetThreshold: 0.01,
      offsetThreshold: 0.006,
      silenceTimeoutMs: 1500,
      sampleRate: 16000,
    });
  }

  /** Get current engine status */
  getStatus(): WhisperStatus {
    return this.status;
  }

  /**
   * Initialize the whisper engine and load the model.
   * This should be called once during app startup.
   */
  async initialize(modelPath: string): Promise<void> {
    if (this.status === 'ready' || this.status === 'loading') return;

    this.setStatus('loading', `Loading model: ${modelPath}`);

    try {
      // Dynamic import to avoid Vite bundling the native module
      if (!Whisper) {
        const smartWhisper = await import('smart-whisper');
        Whisper = smartWhisper.Whisper;
      }

      this.modelPath = modelPath;
      this.whisper = new Whisper(modelPath, { gpu: false });
      this.setStatus('ready');
      console.log('[WhisperService] Model loaded successfully');
    } catch (err: any) {
      this.setStatus('error', err.message);
      console.error('[WhisperService] Failed to load model:', err);
      throw err;
    }
  }

  /**
   * Start listening for audio input.
   * Begins the inference timer and VAD processing.
   */
  startListening(): void {
    if (this.status !== 'ready') {
      console.warn('[WhisperService] Cannot start listening — status:', this.status);
      return;
    }

    this.isListening = true;
    this.resetBuffer();
    this.vad.reset();
    this.speechDetectedSinceLastInference = false;

    // We explicitly DO NOT trigger periodic partial inference!
    // Repeatedly hammering `smart-whisper` with growing arrays while speaking
    // causes native GGML graph reallocation segfaults and thread exhaustion.

    console.log('[WhisperService] Started listening');
  }

  /**
   * Stop listening and process any remaining audio.
   */
  async stopListening(): Promise<void> {
    this.isListening = false;

    if (this.inferenceTimer) {
      clearInterval(this.inferenceTimer);
      this.inferenceTimer = null;
    }

    // Process any remaining audio in the buffer
    if (this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
      await this.runInference(true);
    }

    this.resetBuffer();
    this.vad.reset();
    console.log('[WhisperService] Stopped listening');
  }

  /**
   * Feed a chunk of PCM16 audio data at 16kHz.
   * Called by the IPC handler for each audio worklet message.
   */
  feedAudioChunk(pcm16: Int16Array): void {
    if (!this.isListening) return;

    // Convert Int16 → Float32
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    // Feed VAD
    this.vad.process(float32);

    if (this.vad.isSpeaking()) {
      this.speechDetectedSinceLastInference = true;
    }

    // Append to buffer
    const spaceLeft = this.MAX_BUFFER_SAMPLES - this.bufferWritePos;
    const samplesToWrite = Math.min(float32.length, spaceLeft);

    if (samplesToWrite > 0) {
      this.audioBuffer.set(float32.subarray(0, samplesToWrite), this.bufferWritePos);
      this.bufferWritePos += samplesToWrite;
    }

    // If buffer is full, force inference
    if (this.bufferWritePos >= this.MAX_BUFFER_SAMPLES) {
      this.tryRunInference(true);
    }

    // Check for end of utterance (silence timeout reached)
    if (this.vad.isEndOfUtterance() && this.speechDetectedSinceLastInference) {
      this.tryRunInference(true);
    }
  }

  /**
   * Attempt to run inference if conditions are met.
   * @param isFinal Whether this is a final segment (end of utterance or forced)
   */
  private tryRunInference(isFinal: boolean): void {
    if (this.isProcessing) return;
    if (this.bufferWritePos < this.MIN_INFERENCE_SAMPLES) return;
    if (!this.speechDetectedSinceLastInference && !isFinal) return;

    // Run async inference without blocking
    console.log(`[WhisperService] VAD Triggered Inference (isFinal: ${isFinal}). Samples: ${this.bufferWritePos}`);
    this.runInference(isFinal).catch((err) => {
      console.error('[WhisperService] Inference error:', err);
    });
  }

  /**
   * Run whisper.cpp inference on the current audio buffer.
   */
  private async runInference(isFinal: boolean): Promise<void> {
    if (!this.whisper || this.isProcessing) return;

    this.isProcessing = true;
    this.speechDetectedSinceLastInference = false;

    try {
      // Create a precisely sized copy of the actively recorded audio
      // to avoid passing massive silent arrays which cause whisper to hallucinate/hang.
      // (The `activeWhisper.free()` handles the GGML segfault safely).
      const audioData = new Float32Array(this.audioBuffer.buffer, 0, this.bufferWritePos);
      const audioCopy = new Float32Array(audioData);

      if (isFinal) {
        // Clear buffer after capturing the data for final segment
        this.resetBuffer();
        this.vad.reset();
      }

      const startTime = Date.now();
      console.log(`[WhisperService] C++ Engine chunk dispatched. Samples: ${audioCopy.length}, Duration: ${(audioCopy.length / 16000).toFixed(1)}s`);
      
      // Use the persistent pre-loaded instance — safe now that the
      // setInterval concurrent-call bug has been removed.
      const task = await this.whisper.transcribe(audioCopy, {
        language: 'en',
        n_threads: 4,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        // initial_prompt removed — it was causing 60s+ decode times on CPU
      });

      // Hook into the native C++ stream for real-time partial results
      task.on('transcribed', (segment: any) => {
        console.log(`[WhisperService-C++] Segment: "${segment.text}"`);
      });

      // Race: wait for result or timeout after 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Whisper inference timed out after 30s')), 30000)
      );

      const result = await Promise.race([task.result, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      console.log(`[WhisperService] C++ Engine resolved in ${elapsed}ms.`);

      // Extract transcript text from result
      const transcript = this.extractTranscript(result);

      if (transcript && transcript.trim().length > 0) {
        const cleaned = transcript.trim();
        if (isFinal) {
          this.emit('transcript-final', cleaned);
          console.log('[WhisperService] Final transcript:', cleaned);
        } else {
          this.emit('transcript-partial', cleaned);
          console.log('[WhisperService] Partial transcript:', cleaned);
        }
      }
    } catch (err) {
      console.error('[WhisperService] Inference failed:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract plain text from whisper transcription result.
   * smart-whisper returns segments with text and timestamps.
   */
  private extractTranscript(result: any): string {
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) {
      return result.map((seg: any) => seg.text || seg).join(' ');
    }
    if (result && typeof result === 'object') {
      if (result.text) return result.text;
      if (result.segments) {
        return result.segments.map((seg: any) => seg.text || '').join(' ');
      }
    }
    return String(result || '');
  }

  /** Reset the audio buffer */
  private resetBuffer(): void {
    this.bufferWritePos = 0;
  }

  /** Update status and emit event */
  private setStatus(status: WhisperStatus, message?: string): void {
    this.status = status;
    this.emit('status-change', status, message);
  }

  /** Shut down the whisper engine and free resources */
  async shutdown(): Promise<void> {
    this.isListening = false;

    if (this.inferenceTimer) {
      clearInterval(this.inferenceTimer);
      this.inferenceTimer = null;
    }

    if (this.whisper) {
      try {
        await this.whisper.free();
      } catch (err) {
        console.error('[WhisperService] Error during shutdown:', err);
      }
      this.whisper = null;
    }

    this.setStatus('uninitialized');
    console.log('[WhisperService] Shut down');
  }
}
