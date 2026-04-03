export interface BibleBook {
  id: number;
  name: string;
  aliases: string[];
  testament: 'old' | 'new';
}

export interface BibleReference {
  book: string;
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: BibleVersion;
}

export type BibleVersion = 'kjv' | 'nkjv' | 'niv' | 'esv' | 'amp' | 'msg' | 'gn';

export interface ParsedCommand {
  originalText: string;
  reference: BibleReference | null;
  commandType: 'lookup' | 'version_change' | 'navigation' | 'unknown';
  confidence: number;
}

export interface BibleSearchResult {
  book: string;
  chapter: number;
  verses: Array<{
    verse: number;
    text: string;
  }>;
  version: BibleVersion;
  formattedReference: string;
}

export interface FuzzyMatchResult {
  book: BibleBook;
  score: number;
}
