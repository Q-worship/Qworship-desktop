import { create } from 'zustand';

interface BibleVerseData {
  verse: number;
  kjv: string;
  nkjv: string;
  amp: string;
  msg: string;
  esv: string;
  niv: string;
}

interface BibleState {
  // Active editing content for the OnScreenBibleEditor
  activeContent: any | null;
  setActiveContent: (content: any) => void;

  // Hands-free widget state
  isListeningMode: boolean;
  toggleListeningMode: () => void;
  selectedBibleVersion: string;
  setSelectedBibleVersion: (version: string) => void;
  detectedCommands: string;
  setDetectedCommands: (cmd: string) => void;
  
  // Widget data
  verseData: BibleVerseData[] | null;
  setVerseData: (data: BibleVerseData[] | null) => void;
  formattedReference: string | null;
  setFormattedReference: (ref: string | null) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  activeContent: null,
  setActiveContent: (content) => set({ activeContent: content }),

  isListeningMode: false,
  toggleListeningMode: () => set((state) => ({ isListeningMode: !state.isListeningMode })),
  
  selectedBibleVersion: 'KJV',
  setSelectedBibleVersion: (version) => set({ selectedBibleVersion: version }),
  
  detectedCommands: '',
  setDetectedCommands: (cmd) => set({ detectedCommands: cmd }),

  verseData: null,
  setVerseData: (data) => set({ verseData: data }),
  
  formattedReference: null,
  setFormattedReference: (ref) => set({ formattedReference: ref }),
}));
