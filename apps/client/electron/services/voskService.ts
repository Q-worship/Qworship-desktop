import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import * as vosk from './koffi-vosk';

export class VoskService {
  private model: vosk.Model | null = null;
  private recognizer: vosk.Recognizer | null = null;
  private isListening = false;

  initialize() {
    vosk.setLogLevel(-1); // Silence vosk logs to avoid spam
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

    // "Smart Model" Grammar constraint to force 99% accuracy by limiting Vosk dictionary
    const VOSK_GRAMMAR = [
      // Bible Books
      "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
      "samuel", "kings", "chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "proverbs",
      "ecclesiastes", "song of solomon", "song of songs", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel",
      "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai",
      "zechariah", "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "corinthians",
      "galatians", "ephesians", "philippians", "colossians", "thessalonians", "timothy", "titus",
      "philemon", "hebrews", "james", "peter", "jude", "revelation",
      // Words that replace numbers in books
      "first", "second", "third",
      // Numbers (Spelled out)
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
      "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand",
      // Control Commands & Glue
      "go to", "verse", "chapter", "search", "hands free", "open", "sleep", "wake up", "stop listening",
      "pause", "be quiet", "shut up", "mute", "resume", "unmute", "listen", "start listening", "bible",
      "next", "previous", "last", "jump", "forward", "back", "backward", "and", "through", "to", "of", "the", "i", "m", "am",
      // English Translation Versions
      "kjv", "nkjv", "amp", "msg", "esv", "niv", "king james", "version", "amplified", "message", "english standard", "new international",
      // Out-of-vocabulary fallback to prevent crashes on sneezing
      "[unk]"
    ];

    this.recognizer = new vosk.Recognizer({ 
        model: this.model, 
        sampleRate: 16000,
        grammar: VOSK_GRAMMAR 
    });
    
    this.isListening = true;
    window.webContents.send('stt:status', 'ready', 'Vosk listening');
    console.log('[VoskService] Started listening');
  }

  stopListening(window: BrowserWindow) {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.recognizer) {
      const finalRes = this.recognizer.finalResult() as { text?: string };
      if (finalRes && finalRes.text) {
        window.webContents.send('stt:transcript:final', finalRes.text);
      }
      this.recognizer.free();
      this.recognizer = null;
    }
    
    window.webContents.send('stt:status', 'idle');
    console.log('[VoskService] Stopped listening');
  }

  feedAudioChunk(window: BrowserWindow, arrayBuffer: ArrayBuffer) {
    if (!this.isListening || !this.recognizer) return;

    try {
      const pcm16Buffer = Buffer.from(arrayBuffer);
      const isFinal = this.recognizer.acceptWaveform(pcm16Buffer);

      if (isFinal) {
        const result = this.recognizer.result() as { text?: string };
        if (result && result.text) {
          window.webContents.send('stt:transcript:final', result.text);
        }
      } else {
        const partial = this.recognizer.partialResult() as { partial?: string };
        if (partial && partial.partial) {
          window.webContents.send('stt:transcript:partial', partial.partial);
        }
      }
    } catch (err) {
      console.error('[VoskService] Error processing audio chunk:', err);
    }
  }

  destroy() {
    if (this.recognizer) {
      this.recognizer.free();
      this.recognizer = null;
    }
    if (this.model) {
      this.model.free();
      this.model = null;
    }
  }
}
