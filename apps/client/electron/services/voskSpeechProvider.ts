import { EventEmitter } from "node:events";
import { createRequire } from "node:module";

import { VADDetector } from "./vadDetector";
import { VoskModelManager } from "./voskModelManager";
import type {
  SpeechProvider,
  SpeechProviderDescriptor,
  SpeechProviderFactoryContext,
  SpeechStatusPayload,
  SpeechTranscriptPayload,
} from "./speechTypes";

const require = createRequire(import.meta.url);
type VoskModule = {
  Model: new (modelPath: string) => any;
  Recognizer: new (options: { model: any; sampleRate: number; grammar?: string[] }) => any;
  setLogLevel?: (level: number) => void;
};

let cachedVoskModule: VoskModule | null = null;

function getVoskModule(): VoskModule {
  if (!cachedVoskModule) {
    cachedVoskModule = require("vosk") as VoskModule;
  }

  return cachedVoskModule;
}

const SAMPLE_RATE = 16000;
const PARTIAL_EMIT_INTERVAL_MS = 100;
const TRANSCRIPT_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\b1st\b/gi, "first"],
  [/\b2nd\b/gi, "second"],
  [/\b3rd\b/gi, "third"],
  [/\bmathew\b/gi, "matthew"],
  [/\bmattew\b/gi, "matthew"],
  [/\blook\b/gi, "luke"],
  [/\bluck\b/gi, "luke"],
  [/\broman\b/gi, "romans"],
  [/\bromance\b/gi, "romans"],
  [/\bsalm\b/gi, "psalm"],
  [/\bsalms\b/gi, "psalms"],
  [/\bsams\b/gi, "psalms"],
  [/\bsawms\b/gi, "psalms"],
  [/\b(?:psalm|psalms|salms|sams|sawms)\s+twenty\s+three\b/gi, "psalms 23"],
  [/\b(?:psalm|psalms|salms|sams|sawms)\s+23\b/gi, "psalms 23"],
  [/\bphilipians\b/gi, "philippians"],
  // Galatians phonetic variants (Vosk mishearings)
  [/\bgalations\b/gi, "galatians"],
  [/\bgalatian\b/gi, "galatians"],
  [/\bgalashans\b/gi, "galatians"],
  [/\bgalayshans\b/gi, "galatians"],
  [/\bgalayshuns\b/gi, "galatians"],
  [/\bgalayshins\b/gi, "galatians"],
  [/\bgalations\b/gi, "galatians"],
  // Philippians phonetic variants
  [/\bphilippian\b/gi, "philippians"],
  [/\bphilipian\b/gi, "philippians"],
  [/\bphilippeans\b/gi, "philippians"],
  [/\bphilippians\b/gi, "philippians"],
  [/\bphilipeans\b/gi, "philippians"],
  [/\bphilippines\b/gi, "philippians"],
  [/\bphilipines\b/gi, "philippians"],
  // Colossians phonetic variants
  [/\bcolosians\b/gi, "colossians"],
  [/\bcolossian\b/gi, "colossians"],
  [/\bcolosian\b/gi, "colossians"],
  [/\bcoloshans\b/gi, "colossians"],
  [/\bcoloshuns\b/gi, "colossians"],
  [/\bcolosians\b/gi, "colossians"],
  // Thessalonians phonetic variants
  [/\bthessalonian\b/gi, "thessalonians"],
  [/\bthesalonians\b/gi, "thessalonians"],
  [/\bthesalonian\b/gi, "thessalonians"],
  [/\bthessaloneans\b/gi, "thessalonians"],
  [/\bthasalonians\b/gi, "thessalonians"],
  [/\bfirst thessalonian\b/gi, "first thessalonians"],
  [/\bsecond thessalonian\b/gi, "second thessalonians"],
  [/\bfirst thesalonians\b/gi, "first thessalonians"],
  [/\bsecond thesalonians\b/gi, "second thessalonians"],
  // Philemon phonetic variants
  [/\bphillemon\b/gi, "philemon"],
  [/\bphilamen\b/gi, "philemon"],
  [/\bphilamon\b/gi, "philemon"],
  [/\bphylemon\b/gi, "philemon"],
  [/\bfileman\b/gi, "philemon"],
  [/\bfilemon\b/gi, "philemon"],
  [/\bfirst john\b/gi, "first john"],
  [/\b1 john\b/gi, "first john"],
  [/\bsecond john\b/gi, "second john"],
  [/\b2 john\b/gi, "second john"],
  [/\bthird john\b/gi, "third john"],
  [/\b3 john\b/gi, "third john"],
  [/\bfirst corinthian\b/gi, "first corinthians"],
  [/\bsecond corinthian\b/gi, "second corinthians"],
  [/\b1 samuel\b/gi, "first samuel"],
  [/\b2 samuel\b/gi, "second samuel"],
  [/\b1 kings\b/gi, "first kings"],
  [/\b2 kings\b/gi, "second kings"],
  [/\b1 chronicles\b/gi, "first chronicles"],
  [/\b2 chronicles\b/gi, "second chronicles"],
  [/\b1 corinthians\b/gi, "first corinthians"],
  [/\b2 corinthians\b/gi, "second corinthians"],
  [/\b1 thessalonians\b/gi, "first thessalonians"],
  [/\b2 thessalonians\b/gi, "second thessalonians"],
  [/\b1 timothy\b/gi, "first timothy"],
  [/\b2 timothy\b/gi, "second timothy"],
  [/\b1 peter\b/gi, "first peter"],
  [/\b2 peter\b/gi, "second peter"],
  // ── QC10 Phonetic Alias Rules ─────────────────────────────────────────────
  // These aliases are short, phonetically simple words that Vosk can reliably
  // produce when the full book name is acoustically difficult. They are mapped
  // to the canonical book name here so the parser receives the correct name.
  // Alias matches are flagged for Confidence Queue routing (0.80 confidence).
  //
  // Zechariah aliases: "zach", "zack", "zacka"
  [/\bzacka\b/gi, "zechariah"],
  [/\bzack\b/gi, "zechariah"],
  [/\bzach\b/gi, "zechariah"],
  // Malachi aliases: "mal", "mali"
  [/\bmali\b/gi, "malachi"],
  [/\bmal\b/gi, "malachi"],
  // Nahum aliases: "nah" (in addition to "nahum" already in grammar)
  [/\bnah\b/gi, "nahum"],
  // Habakkuk aliases: "hab", "habba"
  [/\bhabba\b/gi, "habakkuk"],
  [/\bhab\b/gi, "habakkuk"],
  // Ecclesiastes aliases: "eccl", "eccles"
  [/\beccles\b/gi, "ecclesiastes"],
  [/\beccl\b/gi, "ecclesiastes"],
  // Obadiah aliases: "obad"
  [/\bobad\b/gi, "obadiah"],
  // Zephaniah aliases: "zeph"
  [/\bzeph\b/gi, "zephaniah"],
  // Philippians short alias: "phil" (only when followed by chapter/verse context)
  // Note: "phil" alone is ambiguous (Philemon vs Philippians) — the CGE will
  // route to Confidence Queue where the pastor can select the correct book.
  [/\bphil\b/gi, "philippians"],
  // ── End QC10 Phonetic Alias Rules ──────────────────────────────────────────
  [/\bshow me the amplified\b/gi, "show me the amplified bible"],
  [/\bshow me niv\b/gi, "show me the niv"],
  [/\bshow me kjv\b/gi, "show me the kjv"],
  [/\bshow me nkjv\b/gi, "show me the nkjv"],
  [/\bshow me esv\b/gi, "show me the esv"],
  [/\bshow me msg\b/gi, "show me the msg"],
];
const WEAK_TRANSCRIPT_PATTERNS = [
  /^show(?: me)?$/i,
  /^open$/i,
  /^read(?: me)?$/i,
  /^go to$/i,
  /^chapter$/i,
  /^verse(?:s)?$/i,
  /^book$/i,
  /^(?:show|open|read|bring|take|go)(?: me)?(?: to)?(?: the)? [a-z]+$/i,
];

const BIBLE_SIGNAL_REGEX = /\b(?:chapter|verse|verses|psalm|psalms|niv|kjv|nkjv|esv|amp|msg|message|amplified|bible|genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|proverbs|ecclesiastes|eccl|eccles|isaiah|jeremiah|ezekiel|daniel|hosea|joel|amos|obadiah|obad|jonah|micah|nahum|nah|habakkuk|hab|habba|zephaniah|zeph|haggai|zechariah|zach|zack|zacka|malachi|mal|mali|matthew|mark|luke|john|acts|romans|corinthians|galatians|galations|galatian|galashans|galayshans|ephesians|philippians|philipians|philippian|philippeans|philipeans|philippines|philipines|filipians|filipeans|phil|colossians|colosians|colossian|coloshans|coloshuns|thessalonians|thesalonians|thessalonian|thesalonian|thessaloneans|thasalonians|timothy|titus|philemon|phillemon|philamen|philamon|phylemon|fileman|filemon|hebrews|james|peter|jude|revelation|first|second|third|1|2|3)\b/i;
const BIBLE_GRAMMAR = [
  "genesis",
  "genesis chapter",
  "exodus",
  "exodus chapter",
  "leviticus",
  "leviticus chapter",
  "numbers",
  "deuteronomy",
  "deuteronomy chapter",
  "joshua",
  "joshua chapter",
  "judges",
  "ruth",
  "first samuel",
  "second samuel",
  "first kings",
  "second kings",
  "first chronicles",
  "second chronicles",
  "ezra",
  "nehemiah",
  "esther",
  "job",
  "psalm",
  "psalm chapter",
  "psalms",
  "psalms chapter",
  "psalm 23",
  "psalms 23",
  "psalm 23 verse 2",
  "psalms 23 verse 2",
  "psalm twenty three",
  "psalms twenty three",
  "psalm twenty three verse two",
  "psalms twenty three verse two",
  "salm",
  "salms",
  "salms 23",
  "salms 23 verse 2",
  "sams",
  "sams 23",
  "sams 23 verse 2",
  "sawms",
  "sawms 23",
  "sawms 23 verse 2",
  "proverbs",
  "ecclesiastes",
  "ecclesiastes chapter",
  "show me ecclesiastes",
  // QC10 Ecclesiastes aliases
  "eccl",
  "eccl chapter",
  "show me eccl",
  "eccles",
  "eccles chapter",
  "show me eccles",
  "song of solomon",
  "isaiah",
  "jeremiah",
  "lamentations",
  "ezekiel",
  "daniel",
  "hosea",
  "joel",
  "amos",
  "obadiah",
  // QC10 Obadiah aliases
  "obad",
  "obad chapter",
  "show me obad",
  "jonah",
  "micah",
  "nahum",
  "nahum chapter",
  "show me nahum",
  // QC10 Nahum aliases
  "nah",
  "nah chapter",
  "show me nah",
  "habakkuk",
  "habakkuk chapter",
  "show me habakkuk",
  // QC10 Habakkuk aliases
  "hab",
  "hab chapter",
  "show me hab",
  "habba",
  "habba chapter",
  "show me habba",
  "zephaniah",
  "zephaniah chapter",
  "show me zephaniah",
  // QC10 Zephaniah aliases
  "zeph",
  "zeph chapter",
  "show me zeph",
  "haggai",
  "haggai chapter",
  "show me haggai",
  "zechariah",
  "zechariah chapter",
  "show me zechariah",
  // QC10 Zechariah aliases
  "zach",
  "zach chapter",
  "show me zach",
  "zack",
  "zack chapter",
  "show me zack",
  "zacka",
  "zacka chapter",
  "show me zacka",
  "malachi",
  "malachi chapter",
  "show me malachi",
  // QC10 Malachi aliases
  "mal",
  "mal chapter",
  "show me mal",
  "mali",
  "mali chapter",
  "show me mali",
  "matthew",
  "matthew chapter",
  "mathew",
  "mattew",
  "matt",
  "mark",
  "mark chapter",
  "luke",
  "luke chapter",
  "look",
  "luck",
  "john",
  "john chapter",
  "acts",
  "romans",
  "romans chapter",
  "roman",
  "romance",
  "first corinthians",
  "first corinthians chapter",
  "1 corinthians",
  "1 corinthians chapter",
  "second corinthians",
  "second corinthians chapter",
  "2 corinthians",
  "2 corinthians chapter",
  "galatians",
  "galatians chapter",
  "show me galatians",
  "galations",
  "galations chapter",
  "show me galations",
  "galatian",
  "galashans",
  "galayshans",
  "galayshuns",
  "galayshins",
  "galatians chapter five",
  "galatians chapter five verse twenty two",
  "ephesians",
  "ephesians chapter",
  "show me ephesians",
  "philippians",
  "philipians",
  "philippians chapter",
  "show me philippians",
  // QC10 Philippians short alias
  "phil",
  "phil chapter",
  "show me phil",
  "show me philipians",
  "philippian",
  "philippeans",
  "philipeans",
  "philippines",
  "philipines",
  "filipians",
  "filipeans",
  "philippians chapter four",
  "philippians chapter four verse thirteen",
  "philippians chapter three",
  "philippians chapter three verse three",
  "colossians",
  "colossians chapter",
  "show me colossians",
  "colossian",
  "colosians",
  "colosians chapter",
  "show me colosians",
  "coloshans",
  "coloshuns",
  "colossians chapter three",
  "colossians chapter three verse twenty three",
  "first thessalonians",
  "first thessalonians chapter",
  "show me first thessalonians",
  "first thessalonian",
  "first thesalonians",
  "first thesalonian",
  "first thessaloneans",
  "first thasalonians",
  "first thessalonians chapter five",
  "first thessalonians chapter five verse sixteen",
  "second thessalonians",
  "second thessalonians chapter",
  "show me second thessalonians",
  "second thessalonian",
  "second thesalonians",
  "second thesalonian",
  "second thessaloneans",
  "second thasalonians",
  "second thessalonians chapter three",
  "second thessalonians chapter three verse three",
  "first timothy",
  "first timothy chapter",
  "show me first timothy",
  "second timothy",
  "second timothy chapter",
  "show me second timothy",
  "titus",
  "titus chapter",
  "show me titus",
  "philemon",
  "philemon chapter",
  "show me philemon",
  "philemon chapter one",
  "philemon chapter one verse sixteen",
  "phillemon",
  "phillemon chapter",
  "show me phillemon",
  "philamen",
  "philamon",
  "phylemon",
  "fileman",
  "filemon",
  "hebrews",
  "james",
  "first peter",
  "second peter",
  "first john",
  "first john chapter",
  "1 john",
  "1 john chapter",
  "second john",
  "second john chapter",
  "2 john",
  "2 john chapter",
  "third john",
  "third john chapter",
  "3 john",
  "3 john chapter",
  "jude",
  "revelation",
  "chapter",
  "verse",
  "verses",
  "show me",
  "show",
  "read",
  "read me",
  "open",
  "bring me",
  "bring up",
  "take me to",
  "go to",
  "project",
  "display",
  "switch to",
  "change to",
  "use",
  "to",
  "through",
  "next verse",
  "previous verse",
  "next chapter",
  "previous chapter",
  "king james version",
  "king james",
  "new king james version",
  "new king james",
  "new international version",
  "new international",
  "english standard version",
  "english standard",
  "amplified bible",
  "amplified",
  "the message",
  "message bible",
  "good news bible",
  "good news translation",
  "kjv",
  "nkjv",
  "niv",
  "esv",
  "amp",
  "msg",
  "show me the niv",
  "show me the kjv",
  "show me the nkjv",
  "show me the esv",
  "show me the amp",
  "show me the msg",
  "show me the amplified bible",
  "show me the english standard version",
  "show me the new international version",
  "show me the new king james version",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
  "hundred",
  "[unk]",
];

function normalizeTranscriptText(text: string): string {
  let normalized = text.trim().toLowerCase();
  for (const [pattern, replacement] of TRANSCRIPT_NORMALIZATION_RULES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/\s+/g, " ").trim();
}

function hasMeaningfulBibleSignal(text: string): boolean {
  if (!text) return false;
  if (WEAK_TRANSCRIPT_PATTERNS.some((pattern) => pattern.test(text))) return false;

  const normalized = normalizeTranscriptText(text);
  if (/\b(?:show me|open|read|bring me|take me to|go to) the (?:niv|kjv|nkjv|esv|amp|msg|amplified bible|message)\b/i.test(normalized)) {
    return true;
  }

  if (/\b(?:first|second|third|1|2|3)\s+(?:john|corinthians|samuel|kings|chronicles|thessalonians|timothy|peter)\b/i.test(normalized)) {
    return true;
  }

  return BIBLE_SIGNAL_REGEX.test(normalized);
}

export class VoskSpeechProvider extends EventEmitter implements SpeechProvider {
  readonly descriptor: SpeechProviderDescriptor = {
    id: "offline-vosk",
    label: "Offline Vosk",
    mode: "offline",
  };

  private readonly modelManager = new VoskModelManager();
  private readonly vad = new VADDetector({
    onsetThreshold: 0.00045,
    offsetThreshold: 0.00018,
    silenceTimeoutMs: 850,
    sampleRate: SAMPLE_RATE,
  });
  private readonly context: SpeechProviderFactoryContext;

  private model: any | null = null;
  private recognizer: any | null = null;
  private initialized = false;
  private listening = false;
  private lastPartialText = "";
  private lastPartialEmitAt = 0;
  private status: SpeechStatusPayload["status"] = "uninitialized";
  private lastStartListeningAt = 0;
  private readonly FLUSH_DURATION_MS = 500;

  constructor(context: SpeechProviderFactoryContext = {}) {
    super();
    this.context = context;
    try {
      getVoskModule().setLogLevel?.(-1);
    } catch (error) {
      console.warn("[VoskSpeechProvider] Vosk module is not ready yet", error);
    }
  }

  private emitStatus(status: SpeechStatusPayload["status"], message?: string) {
    this.status = status;
    const payload: SpeechStatusPayload = {
      status,
      message,
      provider: this.descriptor,
    };
    this.emit("status-change", payload);
  }

  private emitTranscript(text: string, isFinal: boolean) {
    const cleaned = normalizeTranscriptText(text);
    if (!cleaned) return;
    if (isFinal && !hasMeaningfulBibleSignal(cleaned)) return;

    const payload: SpeechTranscriptPayload = {
      text: cleaned,
      isFinal,
      provider: this.descriptor,
    };

    this.emit(isFinal ? "transcript-final" : "transcript-partial", payload);
  }

  private createRecognizer() {
    if (!this.model) {
      throw new Error("Vosk model has not been initialized.");
    }

    const vosk = getVoskModule();
    this.recognizer = new vosk.Recognizer({
      model: this.model,
      sampleRate: SAMPLE_RATE,
      grammar: BIBLE_GRAMMAR,
    });
  }

  private parseRecognizerResult(raw: unknown) {
    if (!raw) return "";

    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as { text?: string; partial?: string };
        return (parsed.text || parsed.partial || "").trim();
      } catch {
        return raw.trim();
      }
    }

    if (typeof raw === "object") {
      const parsed = raw as { text?: string; partial?: string };
      return (parsed.text || parsed.partial || "").trim();
    }

    return "";
  }

  private resetRecognizer() {
    try {
      this.recognizer?.free?.();
    } catch (error) {
      console.warn("[VoskSpeechProvider] Failed to free recognizer cleanly", error);
    }
    this.recognizer = null;
    this.createRecognizer();
    this.lastPartialText = "";
  }

  private finalizeCurrentUtterance() {
    if (!this.recognizer) return;

    const finalText = this.parseRecognizerResult(this.recognizer.finalResult());
    if (finalText) {
      this.emitTranscript(finalText, true);
    }
    this.resetRecognizer();
    this.emitStatus(this.listening ? "ready" : "uninitialized");
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.emitStatus("loading", "Loading offline Vosk model...");
    const vosk = getVoskModule();
    const modelPath = this.modelManager.ensureModelExists();
    this.model = new vosk.Model(modelPath);
    this.createRecognizer();
    this.initialized = true;
    this.emitStatus("ready", "Offline Vosk engine ready.");
  }

  startListening(): void {
    if (!this.initialized) {
      throw new Error("Offline Vosk provider is not initialized.");
    }

    this.listening = true;
    this.lastStartListeningAt = Date.now();
    this.vad.reset();
    this.lastPartialText = "";
    this.lastPartialEmitAt = 0;
    this.emitStatus("ready", "Listening with offline Vosk.");
  }

  async stopListening(): Promise<void> {
    if (!this.listening) return;
    this.listening = false;
    this.finalizeCurrentUtterance();
  }

  feedAudioChunk(pcm16: Int16Array): void {
    if (!this.listening || !this.recognizer) return;

    // Flush initial audio buffer to prevent "first command" errors caused by mic-on noise or stale data
    if (Date.now() - this.lastStartListeningAt < this.FLUSH_DURATION_MS) {
      return;
    }

    const float32 = new Float32Array(pcm16.length);
    let peak = 0;
    for (let index = 0; index < pcm16.length; index += 1) {
      const normalized = pcm16[index] / 32768;
      float32[index] = normalized;
      const abs = Math.abs(normalized);
      if (abs > peak) peak = abs;
    }

    this.vad.process(float32);

    const chunk = Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
    const completed = this.recognizer.acceptWaveform(chunk);

    if (completed) {
      const finalText = this.parseRecognizerResult(this.recognizer.result());
      if (finalText) {
        this.emitStatus("processing", "Resolving offline Bible command...");
        this.emitTranscript(finalText, true);
      }
      this.resetRecognizer();
      this.emitStatus("ready", "Listening with offline Vosk.");
      return;
    }

    if (this.vad.isSpeaking() || peak >= 0.00018) {
      this.emitStatus("processing", "Streaming offline transcript...");
      const now = Date.now();
      if (now - this.lastPartialEmitAt >= PARTIAL_EMIT_INTERVAL_MS) {
        const partialText = this.parseRecognizerResult(this.recognizer.partialResult());
        if (partialText && partialText !== this.lastPartialText) {
          this.lastPartialText = partialText;
          this.lastPartialEmitAt = now;
          this.emitTranscript(partialText, false);
        }
      }
    }

    if (this.vad.isEndOfUtterance()) {
      this.finalizeCurrentUtterance();
    }
  }

  getStatus() {
    return this.status;
  }

  async shutdown(): Promise<void> {
    this.listening = false;
    this.lastPartialText = "";
    try {
      this.recognizer?.free?.();
      this.model?.free?.();
    } catch (error) {
      console.warn("[VoskSpeechProvider] Failed to free Vosk resources cleanly", error);
    }
    this.recognizer = null;
    this.model = null;
    this.initialized = false;
    this.emitStatus("uninitialized");
  }
}
