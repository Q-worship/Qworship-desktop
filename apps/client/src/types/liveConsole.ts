export type LiveConsoleSpeechMode = "offline" | "online";

export type BibleNavigationDirection = "next" | "previous";

export type BibleCommandType =
  | "lookup"
  | "version_change"
  | "verse_change"
  | "chapter_change"
  | "jump_to_verse"
  | "jump_relative"
  | "last_verse"
  | "sleep"
  | "wake";

export interface BibleVerseReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: string;
  formatted: string;
}

export interface BibleCommand {
  commandType: BibleCommandType;
  transcript: string;
  requestedVersion?: string;
  navigationDirection?: BibleNavigationDirection;
  reference?: BibleVerseReference;
  targetVerse?: number;
  offset?: number;
}

export interface BibleProjectionPayload {
  reference: string;
  text: string;
  version: string;
  book?: string;
  chapter?: number;
  verse?: number;
}

export interface SongProjectionPayload {
  title: string;
  sectionTitle?: string;
  lyrics: string;
}

export interface LiveConsoleProjectionEnvelope {
  kind: "bible" | "song" | "clear";
  bible?: BibleProjectionPayload;
  song?: SongProjectionPayload;
}
