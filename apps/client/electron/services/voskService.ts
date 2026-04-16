import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import * as vosk from './koffi-vosk';

export class VoskService {
  private model: vosk.Model | null = null;
  private commandRecognizer: vosk.Recognizer | null = null;
  private transcriptRecognizer: vosk.Recognizer | null = null;
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
      // Bible Books (Removed unknown vocab, added phonetic split words)
      "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
      "samuel", "kings", "chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "proverbs",
      "ecclesiastes", "song of solomon", "song of songs", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel",
      "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum", "zephaniah", 
      "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "corinthians",
      "ephesians", "timothy", "titus",
      "philemon", "hebrews", "james", "peter", "jude", "revelation",
      // Phonetic overrides for books missing from Vosk dictionary (habakkuk, haggai, zechariah, galatians, philippians, colossians, thessalonians)
      "have", "a", "cook", "hag", "eye", "zachariah", "gal", "asians", "filipinos", "phillip", "collisions", "tess", "salon", "ians",
      // Words that replace numbers in books
      "first", "second", "third",
      // Numbers (Spelled out)
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
      "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand",
      // Control Commands & Glue
      "go", "to", "verse", "chapter", "search", "hands", "free", "open", "sleep", "wake", "up", "stop", "listening",
      "pause", "be", "quiet", "shut", "mute", "resume", "listen", "start", "bible", "show", "me", "turn", "read",
      "next", "previous", "last", "jump", "forward", "back", "backward", "and", "through", "of", "the", "i", "m", "am",
      // English Translation Versions (Phonetic equivalents for kjv, nkjv, esv)
      "k", "j", "v", "n", "e", "s", "amp", "msg", "niv", "king", "james", "version", "amplified", "message", "english", "standard", "new", "international",
      // Out-of-vocabulary fallback to prevent crashes on sneezing
      "[unk]"
    ];

    // 1. Command Recognizer (Strict Grammar)
    this.commandRecognizer = new vosk.Recognizer({ 
        model: this.model, 
        sampleRate: 16000,
        grammar: VOSK_GRAMMAR 
    });

    // 2. Transcript Recognizer (Free-form)
    this.transcriptRecognizer = new vosk.Recognizer({ 
        model: this.model, 
        sampleRate: 16000 
    });
    
    this.isListening = true;
    window.webContents.send('stt:status', 'ready', 'Vosk listening');
    console.log('[VoskService] Started dual-stream listening');
  }

  stopListening(window: BrowserWindow) {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.commandRecognizer) {
      this.commandRecognizer.free();
      this.commandRecognizer = null;
    }

    if (this.transcriptRecognizer) {
      const finalRes = this.transcriptRecognizer.finalResult() as { text?: string };
      if (finalRes && finalRes.text) {
        window.webContents.send('stt:transcript:final', finalRes.text);
      }
      this.transcriptRecognizer.free();
      this.transcriptRecognizer = null;
    }
    
    window.webContents.send('stt:status', 'idle');
    console.log('[VoskService] Stopped listening');
  }

  feedAudioChunk(window: BrowserWindow, arrayBuffer: ArrayBuffer) {
    if (!this.isListening || !this.commandRecognizer || !this.transcriptRecognizer) return;

    try {
      const pcm16Buffer = Buffer.from(arrayBuffer);
      
      // Process Command Stream
      const isCommandFinal = this.commandRecognizer.acceptWaveform(pcm16Buffer);
      if (isCommandFinal) {
        const result = this.commandRecognizer.result() as { text?: string };
        if (result && result.text) {
          window.webContents.send('stt:command:final', result.text);
        }
      }

      // Process Transcript Stream
      const isTranscriptFinal = this.transcriptRecognizer.acceptWaveform(pcm16Buffer);
      if (isTranscriptFinal) {
        const result = this.transcriptRecognizer.result() as { text?: string };
        if (result && result.text) {
          window.webContents.send('stt:transcript:final', result.text);
        }
      } else {
        const partial = this.transcriptRecognizer.partialResult() as { partial?: string };
        if (partial && partial.partial) {
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
