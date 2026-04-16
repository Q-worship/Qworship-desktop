import { EventEmitter } from 'node:events';
import { fork, ChildProcess } from 'node:child_process';
import path from 'node:path';
import { app } from 'electron';
import { VADDetector } from './vadDetector';

export type WhisperStatus = 'uninitialized' | 'loading' | 'ready' | 'processing' | 'error';

export interface WhisperServiceEvents {
  'transcript-partial': (text: string) => void;
  'transcript-final': (text: string) => void;
  'status-change': (status: WhisperStatus, message?: string) => void;
}

export class WhisperService extends EventEmitter {
  private workerProcess: ChildProcess | null = null;
  private status: WhisperStatus = 'uninitialized';
  private modelPath: string = '';
  private vad: VADDetector;

  private audioBuffer: Float32Array;
  private bufferWritePos: number = 0;
  private readonly MAX_BUFFER_SAMPLES = 16000 * 30; // 30s max
  private readonly MIN_INFERENCE_SAMPLES = 16000 * 0.8;

  private isListening: boolean = false;
  private isProcessing: boolean = false;
  private _pendingInference: boolean = false;
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

  getStatus(): WhisperStatus {
    return this.status;
  }

  private setStatus(status: WhisperStatus, message?: string): void {
    this.status = status;
    this.emit('status-change', status, message);
  }

  private spawnWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const workerPath = app.isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'whisperWorker.cjs') 
            : path.join(app.getAppPath(), 'dist-electron', 'whisperWorker.cjs');
            
        this.workerProcess = fork(workerPath, [], {
          stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        });

        this.workerProcess.on('message', (msg: any) => {
          if (msg.type === 'ready') this.setStatus('ready');
          if (msg.type === 'transcript-partial') this.emit('transcript-partial', msg.text);
          if (msg.type === 'transcript-final') {
             this.emit('transcript-final', msg.text);
             this.finalizeInferenceLock();
          }
          if (msg.type === 'error') {
             console.error('[WhisperService] Worker Error:', msg.message);
             this.finalizeInferenceLock();
          }
        });

        resolve();

        this.workerProcess.on('exit', (code, signal) => {
          console.warn(`[WhisperService] Isolated target restarted... (exit code: ${code})`);
          this.workerProcess = null;
          this.isProcessing = false; // MUST unlock queue on restart!
          this._pendingInference = false;
          // Silent automatic recovery removes crash UI loop
          if (this.isListening) {
              this.spawnWorker().then(() => {
                this.workerProcess?.send({ type: 'init', modelPath: this.modelPath });
              });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async initialize(modelPath: string): Promise<void> {
    if (this.status === 'ready' || this.status === 'loading') return;
    this.setStatus('loading', `Loading model into isolated memory: ${modelPath}`);

    try {
      this.modelPath = modelPath;
      await this.spawnWorker();
      this.workerProcess?.send({ type: 'init', modelPath: this.modelPath });
      
      console.log('[WhisperService] Native addon securely sandboxed!');
    } catch (err: any) {
      this.setStatus('error', err.message);
    }
  }

  startListening(): void {
    if (this.status !== 'ready') return;
    
    this.isListening = true;
    this.bufferWritePos = 0;
    this.vad.reset();
    this.speechDetectedSinceLastInference = false;

    console.log('[WhisperService] Started isolated listening pipeline.');
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    if (this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
      await this.runInference(true);
    }
    this.bufferWritePos = 0;
    this.vad.reset();
  }

  feedAudioChunk(pcm16: Int16Array): void {
    if (!this.isListening) return;

    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
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
      if (this.isProcessing) {
        this._pendingInference = true;
      } else {
        this.tryRunInference(true);
      }
    }
  }

  private tryRunInference(isFinal: boolean): void {
    if (this.isProcessing) return;
    if (this.bufferWritePos < this.MIN_INFERENCE_SAMPLES) return;
    if (!this.speechDetectedSinceLastInference && !isFinal) return;
    this.runInference(isFinal);
  }

  private async runInference(isFinal: boolean): Promise<void> {
    if (!this.workerProcess || this.isProcessing) return;

    this.isProcessing = true;
    this.speechDetectedSinceLastInference = false;

    try {
      const audioData = new Float32Array(this.audioBuffer.buffer, 0, this.bufferWritePos);
      const audioCopy = new Float32Array(audioData);

      if (isFinal) {
        this.bufferWritePos = 0;
        this.vad.reset();
      }

      // Send to isolated worker via binary Buffer!
      this.workerProcess.send({
          type: 'transcribe',
          buffer: Buffer.from(audioCopy.buffer) 
      });

    } catch (err) {
      console.error('[WhisperService] Inference serialization failed:', err);
      this.finalizeInferenceLock();
    }
  }

  private finalizeInferenceLock() {
    this.isProcessing = false;
    if (this._pendingInference && this.bufferWritePos >= this.MIN_INFERENCE_SAMPLES) {
      this._pendingInference = false;
      this.tryRunInference(true);
    }
  }

  async shutdown(): Promise<void> {
    await this.stopListening();
    if (this.workerProcess) {
       this.workerProcess.send({ type: 'shutdown' });
       this.workerProcess = null;
    }
    this.setStatus('uninitialized');
  }
}
