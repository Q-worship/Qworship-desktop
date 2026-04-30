import { create } from 'zustand';

export interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  kjv?: string;
  nkjv?: string;
  niv?: string;
  amp?: string;
  gn?: string;
  msg?: string;
  esv?: string;
}

export interface BibleProjectionState {
  currentVerse: VerseData | null;
  formattedReference: string;
  bibleVersion: string;
  isProjecting: boolean;
  lastUpdated: number;
  setVerse: (verse: VerseData | null, reference: string) => void;
  setBibleVersion: (version: string) => void;
  clearProjection: () => void;
  setProjecting: (isProjecting: boolean) => void;
}

const BROADCAST_CHANNEL_NAME = 'qworship-bible-projection';

let broadcastChannel: BroadcastChannel | null = null;

const getBroadcastChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined') return null;
  
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
      return null;
    }
  }
  return broadcastChannel;
};

export const useBibleProjectionStore = create<BibleProjectionState>((set, get) => {
  const channel = getBroadcastChannel();
  
  if (channel) {
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'SET_VERSE':
          set({
            currentVerse: payload.verse,
            formattedReference: payload.reference,
            isProjecting: true,
            lastUpdated: Date.now(),
          });
          break;
        case 'SET_VERSION':
          set({ bibleVersion: payload.version, lastUpdated: Date.now() });
          break;
        case 'CLEAR_PROJECTION':
          set({
            currentVerse: null,
            formattedReference: '',
            isProjecting: false,
            lastUpdated: Date.now(),
          });
          break;
        case 'SET_PROJECTING':
          set({ isProjecting: payload.isProjecting, lastUpdated: Date.now() });
          break;
        case 'SYNC_REQUEST': {
          const state = get();
          channel.postMessage({
            type: 'SYNC_RESPONSE',
            payload: {
              currentVerse: state.currentVerse,
              formattedReference: state.formattedReference,
              bibleVersion: state.bibleVersion,
              isProjecting: state.isProjecting,
            },
          });
          break;
        }
        case 'SYNC_RESPONSE':
          set({
            currentVerse: payload.currentVerse,
            formattedReference: payload.formattedReference,
            bibleVersion: payload.bibleVersion,
            isProjecting: payload.isProjecting,
            lastUpdated: Date.now(),
          });
          break;
      }
    };
  }

  return {
    currentVerse: null,
    formattedReference: '',
    bibleVersion: 'KJV',
    isProjecting: false,
    lastUpdated: Date.now(),

    setVerse: (verse, reference) => {
      set({
        currentVerse: verse,
        formattedReference: reference,
        isProjecting: true,
        lastUpdated: Date.now(),
      });
      
      const ch = getBroadcastChannel();
      ch?.postMessage({
        type: 'SET_VERSE',
        payload: { verse, reference },
      });
    },

    setBibleVersion: (version) => {
      set({ bibleVersion: version, lastUpdated: Date.now() });
      
      const ch = getBroadcastChannel();
      ch?.postMessage({
        type: 'SET_VERSION',
        payload: { version },
      });
    },

    clearProjection: () => {
      set({
        currentVerse: null,
        formattedReference: '',
        isProjecting: false,
        lastUpdated: Date.now(),
      });
      
      const ch = getBroadcastChannel();
      ch?.postMessage({ type: 'CLEAR_PROJECTION' });
    },

    setProjecting: (isProjecting) => {
      set({ isProjecting, lastUpdated: Date.now() });
      
      const ch = getBroadcastChannel();
      ch?.postMessage({
        type: 'SET_PROJECTING',
        payload: { isProjecting },
      });
    },
  };
});

export const requestSyncFromOtherWindows = () => {
  const channel = getBroadcastChannel();
  channel?.postMessage({ type: 'SYNC_REQUEST' });
};
