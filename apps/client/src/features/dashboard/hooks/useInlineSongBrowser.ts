import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../lib/queryClient';

export interface SongSection { title: string; content: string }

interface UseInlineSongBrowserProps {
  onProjectSong: (
    title: string,
    sectionTitle: string,
    lyrics: string,
    fullSongData?: any,
    pacingLineIdx?: number
  ) => void;
}

export function useInlineSongBrowser({ onProjectSong }: UseInlineSongBrowserProps) {
  const [isSongMode, setIsSongMode] = useState(false);
  const [songSearch, setSongSearch] = useState('');
  const [songSearchResults, setSongSearchResults] = useState<any[]>([]);
  const [songDropdownOpen, setSongDropdownOpen] = useState(false);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [currentSongData, setCurrentSongData] = useState<any>(null);
  const [currentSongSections, setCurrentSongSections] = useState<SongSection[]>([]);
  const [activeSongSectionIdx, setActiveSongSectionIdx] = useState(-1);
  const [recentSongs, setRecentSongs] = useState<any[]>([]);

  // Parse raw lyrics string into labelled sections [ [Verse 1], [Chorus], ... ]
  const parseLyricsIntoSections = (lyrics: string): SongSection[] => {
    const sections: SongSection[] = [];
    const lines = lyrics.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];
    for (const line of lines) {
      const headerMatch = line.match(/^\[([^\]]+)\]$/);
      if (headerMatch) {
        if (currentTitle && currentContent.join('').trim()) {
          sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
        }
        currentTitle = headerMatch[1];
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentTitle && currentContent.join('').trim()) {
      sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
    }
    if (sections.length === 0 && lyrics.trim()) {
      sections.push({ title: 'Verse 1', content: lyrics.trim() });
    }
    return sections;
  };

  const openSongMode = useCallback(() => setIsSongMode(true), []);

  const handleSelectSong = useCallback(async (song: any) => {
    setSongSearch('');
    setSongDropdownOpen(false);
    setActiveSongSectionIdx(-1);

    let fullSong = song;
    let sections: SongSection[] = [];

    if (song.id) {
      try {
        const res = await apiRequest('GET', `/api/songs/${song.id}`);
        const data = await res.json();
        if (data?.success && data?.song) {
          fullSong = data.song;
          if (Array.isArray(data.song.sections) && data.song.sections.length > 0) {
            sections = data.song.sections.map((s: any) => ({
              title: s.title || s.type || 'Section',
              content: s.content || '',
            }));
          }
        }
      } catch { /* network error – fall back below */ }
    }

    if (sections.length === 0) {
      sections = parseLyricsIntoSections(fullSong.lyrics || '');
    }

    setCurrentSongData(fullSong);
    setCurrentSongSections(sections);
    setRecentSongs(prev => {
      const filtered = prev.filter((s: any) => s.id !== fullSong.id);
      return [fullSong, ...filtered].slice(0, 10);
    });

    // Auto-project the first section to the live screen seamlessly!
    if (sections.length > 0) {
      setActiveSongSectionIdx(0);
      onProjectSong(fullSong.title, sections[0].title, sections[0].content, undefined, -1);
    }
  }, [onProjectSong]);

  // Project a section — called from the console UI
  const handleProjectSection = useCallback((
    section: SongSection,
    idx: number,
    isPacingPlaying = false
  ) => {
    setActiveSongSectionIdx(idx);
    if (currentSongData) {
      onProjectSong(
        currentSongData.title,
        section.title,
        section.content,
        undefined,
        isPacingPlaying ? 0 : -1
      );
    }
  }, [currentSongData, onProjectSong]);

  // Load all songs when song mode opens
  useEffect(() => {
    if (!isSongMode) return;
    apiRequest('GET', '/api/songs')
      .then(r => r.json())
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.songs ?? []);
        setAllSongs(list);
      })
      .catch(() => {});
  }, [isSongMode]);

  // Debounced search suggestions
  useEffect(() => {
    if (!songSearch.trim()) {
      setSongSearchResults([]);
      setSongDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest('POST', '/api/songs/search', { query: songSearch });
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.songs ?? data?.results ?? []);
        setSongSearchResults(list);
        setSongDropdownOpen(list.length > 0);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [songSearch]);

  return {
    isSongMode, setIsSongMode,
    songSearch, setSongSearch,
    songSearchResults, songDropdownOpen, setSongDropdownOpen,
    allSongs, currentSongData, currentSongSections,
    activeSongSectionIdx, setActiveSongSectionIdx,
    recentSongs,
    openSongMode, handleSelectSong, handleProjectSection,
  };
}
