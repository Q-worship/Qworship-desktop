import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import * as vosk from './koffi-vosk';

export class VoskService {
  private model: vosk.Model | null = null;
  private commandRecognizer: vosk.Recognizer | null = null;
  private transcriptRecognizer: vosk.Recognizer | null = null;
  private isListening = false;
  private lastTranscriptPartial = '';
  private lastTranscriptFinal = '';
  private lastCommandPartial = '';
  private lastCommandFinal = '';

  initialize() {
    vosk.setLogLevel(-1);
    try {
      const modelPath = app.isPackaged
        ? path.join(process.resourcesPath, 'vosk-model')
        : path.join(app.getAppPath(), 'assets/vosk-model');

      if (!fs.existsSync(modelPath)) {
        throw new Error(`[VoskService] Model not found at ${modelPath}`);
      }

      console.log(`[VoskService] Loading model from ${modelPath}`);
      this.model = new vosk.Model(modelPath);
      console.log('[VoskService] Model loaded successfully');
    } catch (err) {
      console.error('[VoskService] Failed to load Vosk model:', err);
    }
  }

  startListening(window: BrowserWindow) {
    if (!this.model) {
      window.webContents.send('stt:status', 'error', 'Model not initialized');
      return;
    }

    if (this.isListening) return;

    this.commandRecognizer = new vosk.Recognizer({
      model: this.model,
      sampleRate: 16000,
    });

    this.transcriptRecognizer = new vosk.Recognizer({
      model: this.model,
      sampleRate: 16000,
    });

    this.lastTranscriptPartial = '';
    this.lastTranscriptFinal = '';
    this.lastCommandPartial = '';
    this.lastCommandFinal = '';
    this.isListening = true;
    window.webContents.send('stt:status', 'ready', 'Vosk listening');
    console.log('[VoskService] Started dual-stream listening');
  }

  stopListening(window: BrowserWindow) {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.commandRecognizer) {
      const commandFinal = this.commandRecognizer.finalResult() as { text?: string };
      if (commandFinal?.text && commandFinal.text !== this.lastCommandFinal) {
        this.lastCommandFinal = commandFinal.text;
        window.webContents.send('stt:command:final', commandFinal.text);
      }
      this.commandRecognizer.free();
      this.commandRecognizer = null;
    }

    if (this.transcriptRecognizer) {
      const transcriptFinal = this.transcriptRecognizer.finalResult() as { text?: string };
      if (transcriptFinal?.text && transcriptFinal.text !== this.lastTranscriptFinal) {
        this.lastTranscriptFinal = transcriptFinal.text;
        window.webContents.send('stt:transcript:final', transcriptFinal.text);
      }
      this.transcriptRecognizer.free();
      this.transcriptRecognizer = null;
    }

    this.lastTranscriptPartial = '';
    this.lastCommandPartial = '';
    window.webContents.send('stt:status', 'idle');
    console.log('[VoskService] Stopped listening');
  }

  feedAudioChunk(window: BrowserWindow, arrayBuffer: ArrayBuffer) {
    if (!this.isListening || !this.commandRecognizer || !this.transcriptRecognizer) return;

    try {
      const pcm16Buffer = Buffer.from(arrayBuffer);

      const isCommandFinal = this.commandRecognizer.acceptWaveform(pcm16Buffer);
      if (isCommandFinal) {
        const result = this.commandRecognizer.result() as { text?: string };
        if (result?.text && result.text !== this.lastCommandFinal) {
          this.lastCommandFinal = result.text;
          this.lastCommandPartial = '';
          window.webContents.send('stt:command:final', result.text);
        }
      } else {
        const partial = this.commandRecognizer.partialResult() as { partial?: string };
        if (partial?.partial && partial.partial !== this.lastCommandPartial) {
          this.lastCommandPartial = partial.partial;
          window.webContents.send('stt:command:partial', partial.partial);
        }
      }

      const isTranscriptFinal = this.transcriptRecognizer.acceptWaveform(pcm16Buffer);
      if (isTranscriptFinal) {
        const result = this.transcriptRecognizer.result() as { text?: string };
        if (result?.text && result.text !== this.lastTranscriptFinal) {
          this.lastTranscriptFinal = result.text;
          this.lastTranscriptPartial = '';
          window.webContents.send('stt:transcript:final', result.text);
        }
      } else {
        const partial = this.transcriptRecognizer.partialResult() as { partial?: string };
        if (partial?.partial && partial.partial !== this.lastTranscriptPartial) {
          this.lastTranscriptPartial = partial.partial;
          window.webContents.send('stt:transcript:partial', partial.partial);
        }
      }
    } catch (err) {
      console.error('[VoskService] Error processing audio chunk:', err);
    }
  }

  destroy() {
    if (this.commandRecognizer) {
      this.commandRecognizer.free();
      this.commandRecognizer = null;
    }
    if (this.transcriptRecognizer) {
      this.transcriptRecognizer.free();
      this.transcriptRecognizer = null;
    }
    if (this.model) {
      this.model.free();
      this.model = null;
    }
  }
}
