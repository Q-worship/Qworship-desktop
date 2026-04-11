import { useState, useRef, useEffect, useCallback } from 'react';
import type { SongSection } from './useInlineSongBrowser';

export const PACING_COLOUR = '#fbbf24'; // amber-400

interface UsePacingModeProps {
  currentSongSections: SongSection[];
  activeSongSectionIdx: number;
  setActiveSongSectionIdx: (idx: number) => void;
  liveWindow: Window | null;
  /** Called when pacing auto-advances to the next section */
  onProjectNextSection: (title: string, sectionTitle: string, lyrics: string, fullSongData?: any, pacingLineIdx?: number) => void;
  currentSongDataRef: React.MutableRefObject<any>;
}

export function usePacingMode({
  currentSongSections,
  activeSongSectionIdx,
  setActiveSongSectionIdx,
  liveWindow,
  onProjectNextSection,
  currentSongDataRef,
}: UsePacingModeProps) {
  const [isPacingMode, setIsPacingMode] = useState(false);
  const [pacingBpm, setPacingBpm] = useState(80);
  const [isPacingPlaying, setIsPacingPlaying] = useState(false);
  const [pacingProgress, setPacingProgress] = useState(0);
  const [activePacingLineIdx, setActivePacingLineIdx] = useState(-1);

  // Keep a ref to liveWindow so the timer closure always has the latest one
  const liveWindowRef = useRef<Window | null>(null);
  useEffect(() => { liveWindowRef.current = liveWindow; }, [liveWindow]);

  // Keep stable ref to the project callback
  const onProjectRef = useRef(onProjectNextSection);
  useEffect(() => { onProjectRef.current = onProjectNextSection; }, [onProjectNextSection]);

  // BPM-driven pacing timer
  useEffect(() => {
    if (!isPacingPlaying || !isPacingMode) return;
    if (activeSongSectionIdx < 0 || !currentSongSections[activeSongSectionIdx]) return;

    const section = currentSongSections[activeSongSectionIdx];
    const lines = section.content.split('\n');
    const lineCount = Math.max(1, lines.length);
    // Seconds for this section: capped between 4s and 30s
    const secsPerSection = Math.min(30, Math.max(4, (lineCount * 4 * 60) / pacingBpm));
    const totalMs = secsPerSection * 1000;
    let elapsed = 0;

    setPacingProgress(0);
    setActivePacingLineIdx(0);

    const timerId = setInterval(() => {
      elapsed += 100;
      const frac = Math.min(1, elapsed / totalMs);
      const progress = Math.round(frac * 100);
      const lineIdx = Math.min(lineCount - 1, Math.floor(frac * lineCount));
      setPacingProgress(progress);
      setActivePacingLineIdx(lineIdx);

      // Lightweight update to audience screen (no ProjectSong overhead)
      const win = liveWindowRef.current;
      if (win && !win.closed) {
        win.postMessage(
          { type: 'PACING_LINE_UPDATE', data: { lineIdx } }, "*"
        );
      }

      if (frac >= 1) {
        clearInterval(timerId);
        const nextIdx = activeSongSectionIdx + 1;
        if (nextIdx >= currentSongSections.length) {
          // End of song — stop
          setIsPacingPlaying(false);
          setPacingProgress(0);
          setActivePacingLineIdx(-1);
          if (win && !win.closed) {
            win.postMessage({ type: 'PACING_LINE_UPDATE', data: { lineIdx: -1 } }, "*");
          }
        } else {
          // Advance to next section
          const nextSection = currentSongSections[nextIdx];
          const songData = currentSongDataRef.current;
          if (songData) {
            onProjectRef.current(songData.title, nextSection.title, nextSection.content, undefined, 0);
          }
          setActiveSongSectionIdx(nextIdx);
        }
      }
    }, 100);

    return () => clearInterval(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPacingPlaying, isPacingMode, activeSongSectionIdx, pacingBpm, currentSongSections]);

  const resetPacing = useCallback(() => {
    setIsPacingPlaying(false);
    setPacingProgress(0);
    setActivePacingLineIdx(-1);
  }, []);

  return {
    isPacingMode, setIsPacingMode,
    pacingBpm, setPacingBpm,
    isPacingPlaying, setIsPacingPlaying,
    pacingProgress,
    activePacingLineIdx, setActivePacingLineIdx,
    resetPacing,
  };
}
