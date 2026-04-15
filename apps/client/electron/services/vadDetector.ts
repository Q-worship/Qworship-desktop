/**
 * VADDetector — Lightweight Voice Activity Detection using RMS energy.
 *
 * Uses hysteresis thresholds (onset > offset) to prevent rapid flicker
 * between speaking/silence states. Tracks silence duration for
 * end-of-utterance detection.
 */

export interface VADOptions {
  /** RMS threshold to trigger speech onset (0.0–1.0). Default: 0.01 */
  onsetThreshold?: number;
  /** RMS threshold to trigger speech offset (0.0–1.0). Default: 0.006 */
  offsetThreshold?: number;
  /** How many ms of silence before end-of-utterance. Default: 1500 */
  silenceTimeoutMs?: number;
  /** Sample rate of the incoming audio. Default: 16000 */
  sampleRate?: number;
}

export class VADDetector {
  private onsetThreshold: number;
  private offsetThreshold: number;
  private silenceTimeoutMs: number;
  private sampleRate: number;

  private speaking: boolean = false;
  private silenceStartMs: number | null = null;
  private lastProcessTime: number = 0;

  /** Rolling average of recent RMS values (smoothing) */
  private rmsHistory: number[] = [];
  private readonly RMS_WINDOW_SIZE = 8;

  constructor(options: VADOptions = {}) {
    this.onsetThreshold = options.onsetThreshold ?? 0.01;
    this.offsetThreshold = options.offsetThreshold ?? 0.006;
    this.silenceTimeoutMs = options.silenceTimeoutMs ?? 1500;
    this.sampleRate = options.sampleRate ?? 16000;
  }

  /**
   * Process a chunk of audio samples and update internal state.
   * @param samples Float32Array of audio samples (mono, any length)
   */
  process(samples: Float32Array): void {
    const rms = this.computeRMS(samples);
    this.rmsHistory.push(rms);
    if (this.rmsHistory.length > this.RMS_WINDOW_SIZE) {
      this.rmsHistory.shift();
    }

    const smoothedRMS = this.rmsHistory.reduce((a, b) => a + b, 0) / this.rmsHistory.length;
    const now = Date.now();
    this.lastProcessTime = now;

    if (!this.speaking) {
      // Transition to speaking when energy exceeds onset threshold
      if (smoothedRMS >= this.onsetThreshold) {
        this.speaking = true;
        this.silenceStartMs = null;
      }
    } else {
      // Currently speaking — check for offset
      if (smoothedRMS < this.offsetThreshold) {
        if (this.silenceStartMs === null) {
          this.silenceStartMs = now;
        }
      } else {
        // Energy came back — reset silence timer
        this.silenceStartMs = null;
      }

      // If silence has lasted long enough, transition to not speaking
      if (this.silenceStartMs !== null && (now - this.silenceStartMs) >= this.silenceTimeoutMs) {
        this.speaking = false;
        this.silenceStartMs = null;
      }
    }
  }

  /** Whether voice activity is currently detected */
  isSpeaking(): boolean {
    return this.speaking;
  }

  /** How many milliseconds of silence since last speech. 0 if currently speaking. */
  getSilenceDurationMs(): number {
    if (!this.silenceStartMs || this.speaking === false) return 0;
    return Date.now() - this.silenceStartMs;
  }

  /** Whether the silence timeout has been reached (end of utterance) */
  isEndOfUtterance(): boolean {
    if (this.silenceStartMs === null) return false;
    return (Date.now() - this.silenceStartMs) >= this.silenceTimeoutMs;
  }

  /** Reset all state */
  reset(): void {
    this.speaking = false;
    this.silenceStartMs = null;
    this.rmsHistory = [];
  }

  /** Compute Root Mean Square of a Float32 audio buffer */
  private computeRMS(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
