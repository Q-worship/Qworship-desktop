/**
 * WhisperService — Core offline STT engine for Hands-Free Bible.
 *
 * Wraps the `smart-whisper` native addon with a sliding-window interface:
 * 1. Receives PCM16 audio chunks at 16kHz via `feedAudioChunk()`
 * 2. Converts Int16 → Float32 and accumulates in a ring buffer
 * 3. Uses VAD to gate when inference runs (saves CPU when silent)
 * 4. While speech is active, runs sliding-window partial inference every
 *    ~750ms on the last 2-3 seconds of audio for near real-time partials
 * 5. On end-of-utterance (silence timeout), runs final inference on the
 *    full accumulated segment
 * 6. Uses `initial_prompt` to bias recognition toward Bible book names
 * 7. Emits partial and final transcripts via event callbacks
 */

import { EventEmitter } from 'node:events';
import os from 'node:os';
import { VADDetector } from './vadDetector';

// smart-whisper is a native addon — imported dynamically to avoid
// Vite bundling issues. The actual import happens in initialize().
let Whisper: any = null;

/**
 * Short initial_prompt to bias Whisper toward Bible vocabulary.
 * Kept very short (<20 tokens) to avoid slowing down CPU inference.
 */
const BIBLE_INITIAL_PROMPT = 'Genesis, Exodus, Luke, Psalms, Matthew, John, Revelation, chapter, verse.';

export type WhisperStatus = 'uninitialized' | 'loading' | 'ready' | 'processing' | 'error';

export interface WhisperServiceEvents {
  'transcript-partial': (text: string) => void;
  'transcript-final': (text: string) => void;
  'status-change': (status: WhisperStatus, message?: string) => void;
}

/** Sliding window configuration */
const SLIDING_WINDOW = {
  /** How often to run partial inference while speech is active (ms) */
  INTERVAL_MS: 750,
  /** How much audio to include in each sliding window (seconds) */
  WINDOW_SECONDS: 2.5,
  /** Minimum audio duration before first partial inference (seconds) */
  MIN_SPEECH_SECONDS: 0.6,
} as const;

export class WhisperService extends EventEmitter {
  private whisper: any = null;
  private status: WhisperStatus = 'uninitialized';
  private vad: VADDetector;
  private modelPath: string = '';

  /** Audio buffer — accumulates Float32 samples at 16kHz (SPEECH ONLY) */
  private audioBuffer: Float32Array;
  private bufferWritePos: number = 0;

  /** Max buffer size: 30 seconds @ 16kHz = 480,000 samples */
  private readonly MAX_BUFFER_SAMPLES = 16000 * 30;

  /** Minimum audio to process: ~0.6 seconds @ 16kHz */
  private readonly MIN_INFERENCE_SAMPLES = 16000 * SLIDING_WINDOW.MIN_SPEECH_SECONDS;

  /** Sliding window size in samples (2.5s @ 16kHz) */
  private readonly WINDOW_SAMPLES = 16000 * SLIDING_WINDOW.WINDOW_SECONDS;

  /**
   * Pre-speech lookback ring buffer (300ms @ 16kHz = 4800 samples).
   * Captures audio BEFORE VAD onset so we don't clip the start of a word.
   * When speech is first detected, this is flushed into the main buffer.
   */
  private readonly LOOKBACK_SAMPLES = 16000 * 0.3;
  private lookbackBuffer: Float32Array;
  private lookbackWritePos: number = 0;
  private lookbackFilled: boolean = false;

  /** Are we actively listening for audio? */
  private isListening: boolean = false;

  /** Is an inference currently running? */
  private isProcessing: boolean = false;

  /** Sliding window timer — fires every INTERVAL_MS while speech is active */
  private slidingTimer: ReturnType<typeof setInterval> | null = null;

  /** Legacy timer reference (kept for shutdown compat) */
  private inferenceTimer: ReturnType<typeof setInterval> | null = null;

  /** Queue flag: an end-of-utterance arrived while processing */
  private _pendingFinalInference: boolean = false;

  /** Track whether speech was detected since last inference */
  private speechDetectedSinceLastInference: boolean = false;

  /** Whether we are currently in a speech segment (buffering audio) */
  private isInSpeechSegment: boolean = false;

  /** Track when speech started (for minimum speech duration check) */
  private speechStartTime: number | null = null;

  /** Computed thread count: half of available CPU cores, minimum 2 */
  private readonly nThreads: number;

  /** Last partial text — used to deduplicate identical partials */
  private lastPartialText: string = '';

  constructor() {
    super();
    this.audioBuffer = new Float32Array(this.MAX_BUFFER_SAMPLES);
    this.lookbackBuffer = new Float32Array(this.LOOKBACK_SAMPLES);
    this.nThreads = Math.max(2, Math.floor(os.cpus().length / 2));

    this.vad = new VADDetector({
      onsetThreshold: 0.01,
      offsetThreshold: 0.006,
      silenceTimeoutMs: 800,   // Reduced from 1500ms for faster end-of-utterance
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
      console.log(`[WhisperService] Model loaded successfully (threads: ${this.nThreads})`);
    } catch (err: any) {
      this.setStatus('error', err.message);
      console.error('[WhisperService] Failed to load model:', err);
      throw err;
    }
  }

  /**
   * Start listening for audio input.
   * Begins the sliding window timer and VAD processing.
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
    this.isInSpeechSegment = false;
    this.speechStartTime = null;
    this.lastPartialText = '';

    console.log('[WhisperService] Started listening (sliding window mode)');
  }

  /**
   * Stop listening and process any remaining audio.
   */
  async stopListening(): Promise<void> {
    this.isListening = false;

    this.stopSlidingTimer();

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

    // Feed VAD (must always run so it can detect speech onset)
    this.vad.process(float32);

    const isSpeaking = this.vad.isSpeaking();

    if (isSpeaking && !this.isInSpeechSegment) {
      // ── Speech onset: transition from silence → speaking ──────
      this.isInSpeechSegment = true;
      this.speechDetectedSinceLastInference = true;
      this.speechStartTime = Date.now();

      // Flush the lookback buffer into the main buffer so we capture
      // the start of the word (audio just before VAD triggered).
      this.flushLookback();

      // Start sliding window timer
      this.startSlidingTimer();
      console.log('[WhisperService] Speech onset detected — buffering started');
    }

    if (this.isInSpeechSegment) {
      // ── During speech: buffer audio for inference ──────────────
      const spaceLeft = this.MAX_BUFFER_SAMPLES - this.bufferWritePos;
      const samplesToWrite = Math.min(float32.length, spaceLeft);

      if (samplesToWrite > 0) {
        this.audioBuffer.set(float32.subarray(0, samplesToWrite), this.bufferWritePos);
        this.bufferWritePos += samplesToWrite;
      }

      // If buffer is full, force inference
      if (this.bufferWritePos >= this.MAX_BUFFER_SAMPLES) {
        this.tryRunFinalInference();
      }
    } else {
      // ── Silence: only write to the lookback ring buffer ────────
      // This data is discarded unless speech onset happens next.
      this.writeLookback(float32);
    }

    // Check for end of utterance (silence timeout reached)
    if (this.vad.isEndOfUtterance() && this.speechDetectedSinceLastInference) {
      this.isInSpeechSegment = false;
      this.stopSlidingTimer();
      if (this.isProcessing) {
        this._pendingFinalInference = true;
        console.log('[WhisperService] End-of-utterance queued (inference in progress)');
      } else {
        this.tryRunFinalInference();
      }
    }
  }

  // ── Lookback Ring Buffer ───────────────────────────────────────

  /**
   * Write audio samples to the lookback ring buffer.
   * This captures the last 300ms of silence so we can recover
   * the onset of speech when VAD triggers.
   */
  private writeLookback(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.lookbackBuffer[this.lookbackWritePos] = samples[i];
      this.lookbackWritePos = (this.lookbackWritePos + 1) % this.LOOKBACK_SAMPLES;
    }
    if (samples.length >= this.LOOKBACK_SAMPLES) {
      this.lookbackFilled = true;
    }
    if (!this.lookbackFilled && this.lookbackWritePos >= this.LOOKBACK_SAMPLES) {
      this.lookbackFilled = true;
    }
  }

  /**
   * Flush the lookback buffer into the main audio buffer.
   * Called exactly once at speech onset to capture the word start.
   */
  private flushLookback(): void {
    const totalLookback = this.lookbackFilled ? this.LOOKBACK_SAMPLES : this.lookbackWritePos;
    if (totalLookback === 0) return;

    const spaceLeft = this.MAX_BUFFER_SAMPLES - this.bufferWritePos;
    const samplesToWrite = Math.min(totalLookback, spaceLeft);

    if (this.lookbackFilled) {
      // Ring buffer wrapped — read from writePos to end, then 0 to writePos
      const firstPart = this.lookbackBuffer.subarray(this.lookbackWritePos);
      const secondPart = this.lookbackBuffer.subarray(0, this.lookbackWritePos);

      const firstWrite = Math.min(firstPart.length, samplesToWrite);
      this.audioBuffer.set(firstPart.subarray(0, firstWrite), this.bufferWritePos);
      this.bufferWritePos += firstWrite;

      const remainingSpace = samplesToWrite - firstWrite;
      if (remainingSpace > 0) {
        const secondWrite = Math.min(secondPart.length, remainingSpace);
        this.audioBuffer.set(secondPart.subarray(0, secondWrite), this.bufferWritePos);
        this.bufferWritePos += secondWrite;
      }
    } else {
      // Buffer hasn't wrapped yet — simple copy
      this.audioBuffer.set(this.lookbackBuffer.subarray(0, samplesToWrite), this.bufferWritePos);
      this.bufferWritePos += samplesToWrite;
    }

    // Reset lookback
    this.lookbackWritePos = 0;
    this.lookbackFilled = false;
  }

  // ── Sliding Window Timer ──────────────────────────────────────

  /** Start the sliding window partial inference timer */
  private startSlidingTimer(): void {
    if (this.slidingTimer) return; // Already running

    this.slidingTimer = setInterval(() => {
      if (!this.isListening || !this.speechDetectedSinceLastInference) {
        this.stopSlidingTimer();
        return;
      }

      // Only run partials if we have enough audio and aren't already processing
      if (!this.isProcessing && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        // Check minimum speech duration to avoid premature partials
        const speechDuration = this.speechStartTime ? Date.now() - this.speechStartTime : 0;
        if (speechDuration >= SLIDING_WINDOW.MIN_SPEECH_SECONDS * 1000) {
          this.runSlidingWindowInference().catch((err) => {
            console.error('[WhisperService] Sliding window inference error:', err);
          });
        }
      }
    }, SLIDING_WINDOW.INTERVAL_MS);

    console.log('[WhisperService] Sliding window timer started');
  }

  /** Stop the sliding window timer */
  private stopSlidingTimer(): void {
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
  private async runSlidingWindowInference(): Promise<void> {
    if (!this.whisper || this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Extract the last WINDOW_SECONDS of audio (fixed-size window)
      const windowSamples = Math.min(this.bufferWritePos, this.WINDOW_SAMPLES);
      const startOffset = this.bufferWritePos - windowSamples;
      const audioCopy = new Float32Array(windowSamples);
      audioCopy.set(this.audioBuffer.subarray(startOffset, this.bufferWritePos));

      // DO NOT clear the buffer — this is a partial, audio continues accumulating

      const startTime = Date.now();
      console.log(`[WhisperService] Sliding window partial. Window: ${(windowSamples / 16000).toFixed(1)}s, Total buffer: ${(this.bufferWritePos / 16000).toFixed(1)}s`);

      const task = await this.whisper.transcribe(audioCopy, {
        language: 'en',
        n_threads: this.nThreads,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        initial_prompt: BIBLE_INITIAL_PROMPT,
      });

      // Forward C++ streaming segments as real-time partials
      task.on('transcribed', (segment: any) => {
        const segText = (segment.text || '').trim();
        if (segText && segText !== this.lastPartialText) {
          this.lastPartialText = segText;
          this.emit('transcript-partial', segText);
        }
      });

      // Wait for full result (with timeout)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Sliding window inference timed out after 10s')), 10000)
      );

      const result = await Promise.race([task.result, timeoutPromise]);
      const elapsed = Date.now() - startTime;

      const transcript = this.extractTranscript(result);
      if (transcript && transcript.trim().length > 0) {
        const cleaned = transcript.trim();
        // Only emit if different from last partial (deduplicate)
        if (cleaned !== this.lastPartialText) {
          this.lastPartialText = cleaned;
          this.emit('transcript-partial', cleaned);
          console.log(`[WhisperService] Sliding partial (${elapsed}ms): "${cleaned}"`);
        }
      }
    } catch (err) {
      console.error('[WhisperService] Sliding window inference failed:', err);
    } finally {
      this.isProcessing = false;

      // If a final inference was queued while we were doing a partial, run it now
      if (this._pendingFinalInference && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        this._pendingFinalInference = false;
        console.log('[WhisperService] Draining queued final inference after partial...');
        this.tryRunFinalInference();
      }
    }
  }

  // ── Final Inference (End of Utterance) ────────────────────────

  /**
   * Attempt to run final inference if conditions are met.
   */
  private tryRunFinalInference(): void {
    if (this.isProcessing) return;
    if (this.bufferWritePos < this.MIN_INFERENCE_SAMPLES) return;

    console.log(`[WhisperService] Final inference triggered. Samples: ${this.bufferWritePos}`);
    this.runInference(true).catch((err) => {
      console.error('[WhisperService] Final inference error:', err);
    });
  }

  /**
   * Run whisper.cpp inference on the FULL current audio buffer.
   * Used for end-of-utterance final results.
   */
  private async runInference(isFinal: boolean): Promise<void> {
    if (!this.whisper || this.isProcessing) return;

    this.isProcessing = true;
    this.speechDetectedSinceLastInference = false;
    this.speechStartTime = null;
    this.lastPartialText = '';

    try {
      // Create a precisely sized copy of the actively recorded audio
      const audioData = new Float32Array(this.audioBuffer.buffer, 0, this.bufferWritePos);
      const audioCopy = new Float32Array(audioData);

      if (isFinal) {
        // Clear buffer after capturing the data for final segment
        this.resetBuffer();
        this.vad.reset();
      }

      const startTime = Date.now();
      console.log(`[WhisperService] Final inference dispatched. Samples: ${audioCopy.length}, Duration: ${(audioCopy.length / 16000).toFixed(1)}s`);

      const task = await this.whisper.transcribe(audioCopy, {
        language: 'en',
        n_threads: this.nThreads,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        initial_prompt: BIBLE_INITIAL_PROMPT,
      });

      // Forward C++ streaming segments as real-time partials
      task.on('transcribed', (segment: any) => {
        const segText = (segment.text || '').trim();
        if (segText) {
          this.emit('transcript-partial', segText);
        }
      });

      // Race: wait for result or timeout after 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Whisper inference timed out after 30s')), 30000)
      );

      const result = await Promise.race([task.result, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      console.log(`[WhisperService] Final inference resolved in ${elapsed}ms.`);

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

      // Drain the queue
      if (this._pendingFinalInference && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
        this._pendingFinalInference = false;
        console.log('[WhisperService] Draining queued final inference...');
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

  /** Reset the audio buffer and lookback */
  private resetBuffer(): void {
    this.bufferWritePos = 0;
    this.lookbackWritePos = 0;
    this.lookbackFilled = false;
  }

  /** Update status and emit event */
  private setStatus(status: WhisperStatus, message?: string): void {
    this.status = status;
    this.emit('status-change', status, message);
  }

  /** Shut down the whisper engine and free resources */
  async shutdown(): Promise<void> {
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
        console.error('[WhisperService] Error during shutdown:', err);
      }
      this.whisper = null;
    }

    this.setStatus('uninitialized');
    console.log('[WhisperService] Shut down');
  }
}
