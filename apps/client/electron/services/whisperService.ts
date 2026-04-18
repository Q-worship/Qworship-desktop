import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { VADDetector } from './vadDetector';

const require = createRequire(import.meta.url);
const { Whisper, manager } = require('smart-whisper');

const SAMPLE_RATE = 16_000;
const PARTIAL_WINDOW_MS = 500;
const MIN_PARTIAL_AUDIO_MS = 700;
const MAX_ROLLING_AUDIO_MS = 8_000;
const MAX_UTTERANCE_AUDIO_MS = 20_000;
const MODEL_FILE_NAME = 'ggml-small.en.bin';

const BIBLE_BOOKS_PROMPT = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
  'KJV',
  'NKJV',
  'NIV',
  'ESV',
  'AMP',
  'MSG',
  'King James Version',
  'New King James Version',
  'New International Version',
  'English Standard Version',
  'Amplified Bible',
  'The Message',
  'next verse',
  'previous verse',
  'next chapter',
  'previous chapter',
  'amen',
  'thank you',
].join(', ');

function getThreadCount() {
  return Math.max(1, Math.min(os.cpus().length, 4));
}

function clampSamples(samples: number[], maxSamples: number) {
  if (samples.length > maxSamples) {
    samples.splice(0, samples.length - maxSamples);
  }
}

function pcm16ToFloat32(buffer: ArrayBuffer) {
  const pcm = new Int16Array(buffer);
  const float32 = new Float32Array(pcm.length);

  for (let i = 0; i < pcm.length; i += 1) {
    float32[i] = Math.max(-1, Math.min(1, pcm[i] / 32768));
  }

  return float32;
}

function normalizeTranscript(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function extractTranscriptText(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return normalizeTranscript(payload);
  if (Array.isArray(payload)) {
    return normalizeTranscript(
      payload
        .map((segment: any) => (typeof segment === 'string' ? segment : segment?.text ?? ''))
        .join(' '),
    );
  }
  if (typeof payload.text === 'string') return normalizeTranscript(payload.text);
  if (Array.isArray(payload.segments)) {
    return normalizeTranscript(
      payload.segments
        .map((segment: any) => (typeof segment === 'string' ? segment : segment?.text ?? ''))
        .join(' '),
    );
  }
  if (Array.isArray(payload.result)) {
    return normalizeTranscript(
      payload.result
        .map((segment: any) => (typeof segment === 'string' ? segment : segment?.text ?? ''))
        .join(' '),
    );
  }
  return '';
}

export class WhisperService {
  private whisper: any = null;
  private modelPath: string | null = null;
  private isInitialized = false;
  private isListening = false;
  private rollingSamples: number[] = [];
  private utteranceSamples: number[] = [];
  private vad = new VADDetector({
    sampleRate: SAMPLE_RATE,
    onsetThreshold: 0.01,
    offsetThreshold: 0.006,
    silenceTimeoutMs: 900,
  });
  private partialQueued = false;
  private transcriptionChain: Promise<void> = Promise.resolve();
  private lastPartialAt = 0;

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.modelPath = await this.resolveModelPath();
      this.whisper = new Whisper(this.modelPath, { gpu: false });
      console.log(`[WhisperService] Loading model from ${this.modelPath}`);
      await this.whisper.load();
      this.isInitialized = true;
      console.log('[WhisperService] Model loaded successfully');
    } catch (error) {
      console.error('[WhisperService] Failed to initialize Whisper:', error);
      throw error;
    }
  }

  startListening(window: BrowserWindow) {
    if (!this.isInitialized || !this.whisper) {
      window.webContents.send('stt:status', 'error', 'Whisper model not initialized');
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    this.resetBuffers();
    window.webContents.send('stt:status', 'ready', 'Whisper listening');
    console.log('[WhisperService] Started listening');
  }

  stopListening(window: BrowserWindow) {
    if (!this.isListening) return;
    this.isListening = false;

    void this.enqueue(async () => {
      await this.emitFinalTranscript(window, true);
      this.resetBuffers();
      window.webContents.send('stt:status', 'idle');
      console.log('[WhisperService] Stopped listening');
    });
  }

  feedAudioChunk(window: BrowserWindow, arrayBuffer: ArrayBuffer) {
    if (!this.isListening || !this.isInitialized || !this.whisper) return;

    try {
      const float32 = pcm16ToFloat32(arrayBuffer);
      if (float32.length === 0) return;

      this.vad.process(float32);

      if (this.vad.isSpeaking() || this.utteranceSamples.length > 0) {
        this.appendSamples(this.rollingSamples, float32, SAMPLE_RATE * (MAX_ROLLING_AUDIO_MS / 1000));
        this.appendSamples(this.utteranceSamples, float32, SAMPLE_RATE * (MAX_UTTERANCE_AUDIO_MS / 1000));
      }

      const now = Date.now();
      if (
        this.vad.isSpeaking() &&
        this.rollingSamples.length >= SAMPLE_RATE * (MIN_PARTIAL_AUDIO_MS / 1000) &&
        now - this.lastPartialAt >= PARTIAL_WINDOW_MS &&
        !this.partialQueued
      ) {
        this.partialQueued = true;
        void this.enqueue(async () => {
          this.partialQueued = false;
          await this.emitPartialTranscript(window);
        });
      }

      if (this.vad.isEndOfUtterance()) {
        void this.enqueue(async () => {
          await this.emitFinalTranscript(window, false);
        });
      }
    } catch (error) {
      console.error('[WhisperService] Error processing audio chunk:', error);
      window.webContents.send('stt:status', 'error', 'Failed to process audio chunk');
    }
  }

  async destroy() {
    this.isListening = false;
    this.resetBuffers();

    await this.transcriptionChain.catch(() => undefined);

    try {
      if (this.whisper && typeof this.whisper.free === 'function') {
        await this.whisper.free();
      }
    } catch (error) {
      console.warn('[WhisperService] Whisper unload warning:', error);
    }

    this.whisper = null;
    this.isInitialized = false;
  }

  private appendSamples(target: number[], source: Float32Array, maxSamples: number) {
    for (let i = 0; i < source.length; i += 1) {
      target.push(source[i]);
    }
    clampSamples(target, maxSamples);
  }

  private resetBuffers() {
    this.rollingSamples = [];
    this.utteranceSamples = [];
    this.partialQueued = false;
    this.lastPartialAt = 0;
    this.vad.reset();
  }

  private enqueue(task: () => Promise<void>) {
    this.transcriptionChain = this.transcriptionChain
      .then(task)
      .catch((error) => {
        console.error('[WhisperService] Transcription task failed:', error);
      });

    return this.transcriptionChain;
  }

  private async emitPartialTranscript(window: BrowserWindow) {
    if (!this.isListening || this.rollingSamples.length === 0) return;

    const transcript = await this.transcribe(Float32Array.from(this.rollingSamples), true);
    this.lastPartialAt = Date.now();

    if (transcript && this.isListening) {
      window.webContents.send('stt:transcript:partial', transcript);
    }
  }

  private async emitFinalTranscript(window: BrowserWindow, forceFlush: boolean) {
    if (this.utteranceSamples.length === 0) return;

    const audio = Float32Array.from(this.utteranceSamples);
    this.utteranceSamples = [];
    this.rollingSamples = [];

    if (!forceFlush && audio.length < SAMPLE_RATE * 0.35) {
      return;
    }

    const transcript = await this.transcribe(audio, false);
    if (!transcript) return;

    window.webContents.send('stt:transcript:final', transcript);
    window.webContents.send('stt:command:final', transcript);
  }

  private async transcribe(audio: Float32Array, singleSegment: boolean) {
    if (!this.whisper) return '';

    const task = await this.whisper.transcribe(audio, {
      language: 'en',
      initial_prompt: BIBLE_BOOKS_PROMPT,
      single_segment: singleSegment,
      n_threads: getThreadCount(),
    });

    const result = await task.result;
    return extractTranscriptText(result);
  }

  private async resolveModelPath() {
    const bundledCandidates = app.isPackaged
      ? [
          path.join(process.resourcesPath, 'models', MODEL_FILE_NAME),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'models', MODEL_FILE_NAME),
        ]
      : [
          path.join(app.getAppPath(), 'models', MODEL_FILE_NAME),
          path.join(process.cwd(), 'apps', 'client', 'models', MODEL_FILE_NAME),
        ];

    for (const candidate of bundledCandidates) {
      if (fs.existsSync(candidate)) {
        console.log(`[WhisperService] Using bundled model at ${candidate}`);
        return candidate;
      }
    }

    if (app.isPackaged) {
      throw new Error(
        'Bundled Whisper model not found in packaged application resources. Rebuild the installer after running prepare:whisper-model.',
      );
    }

    try {
      const resolved = manager.resolve('small.en');
      if (resolved && fs.existsSync(resolved)) {
        console.log(`[WhisperService] Using cached smart-whisper model at ${resolved}`);
        return resolved;
      }
    } catch (error) {
      console.warn('[WhisperService] manager.resolve failed before download:', error);
    }

    console.log('[WhisperService] small.en model missing in development environment, downloading with smart-whisper manager...');
    await manager.download('small.en');

    const resolved = manager.resolve('small.en');
    if (!resolved || !fs.existsSync(resolved)) {
      throw new Error('smart-whisper model download completed but model path could not be resolved');
    }

    return resolved;
  }
}
