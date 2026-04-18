import React, { useState, useEffect } from 'react';
import { SearchIcon, XIcon, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";
import { searchOffline, type BibleVersion } from '@/lib/offlineBibleEngine';

interface BibleVerse {
  number: number;
  text: string;
}

interface BiblePassage {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  version: string;
  reference: string;
}

interface BibleProjectionWidgetProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectVerse: (reference: string, verses: string, version: string, passageData?: any) => void;
  onClearProjection?: () => void;
}

const bibleVersions: Array<{ id: BibleVersion | 'GN'; name: string }> = [
  { id: 'kjv', name: 'King James Version' },
  { id: 'nkjv', name: 'New King James Version' },
  { id: 'niv', name: 'New International Version' },
  { id: 'amp', name: 'Amplified Bible' },
  { id: 'msg', name: 'The Message' },
  { id: 'esv', name: 'English Standard Version' },
  { id: 'GN', name: 'Good News Translation' },
];

const normalizeVersion = (version: string): BibleVersion => {
  const lowered = version.trim().toLowerCase();
  if (lowered === 'gn') return 'kjv';
  return (['kjv', 'nkjv', 'niv', 'amp', 'msg', 'esv'].includes(lowered) ? lowered : 'kjv') as BibleVersion;
};

export const BibleProjectionWidget: React.FC<BibleProjectionWidgetProps> = ({
  isVisible,
  onClose,
  onProjectVerse,
  onClearProjection,
}) => {
  const { setMode: setDisplayMode } = useDisplayModeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [selectedPassage, setSelectedPassage] = useState<BiblePassage | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible) {
      const modalWidth = 700;
      const modalHeight = 600;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2,
      });
    }
  }, [isVisible]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const boundedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      const boundedY = Math.max(0, Math.min(window.innerHeight - 100, newY));
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const getVerseLabel = (verseNumber: number) => {
    if (!selectedPassage) return `Verse ${verseNumber}`;
    return `${selectedPassage.book} ${selectedPassage.chapter}:${verseNumber}`;
  };

  const projectVerseByIndex = (index: number) => {
    if (!selectedPassage || !selectedPassage.verses.length) return;
    setCurrentVerseIndex(index);
    const verse = selectedPassage.verses[index];
    const verseText = `${verse.number} ${verse.text}`;
    const reference = getVerseLabel(verse.number);
    setDisplayMode('on-screen-bible');
    onProjectVerse(reference, verseText, selectedPassage.version, selectedPassage);
  };

  const runOfflineSearch = async (reference: string, version: string) => {
    const result = await searchOffline(reference.trim(), normalizeVersion(version));
    if (!result || result.verses.length === 0) {
      throw new Error(`Could not find ${reference}. Please check the reference.`);
    }

    return {
      book: result.book,
      chapter: result.chapter,
      verses: result.verses,
      version: result.version.toUpperCase(),
      reference: result.formattedReference,
    } satisfies BiblePassage;
  };

  const searchBible = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a Bible reference (e.g., John 3:16 or Genesis 1:1-5)');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const passage = await runOfflineSearch(searchQuery, selectedVersion);
      setSelectedPassage(passage);
      setCurrentVerseIndex(0);
      if (passage.verses.length > 0) {
        const firstVerse = passage.verses[0];
        const reference = `${passage.book} ${passage.chapter}:${firstVerse.number}`;
        const verseText = `${firstVerse.number} ${firstVerse.text}`;
        setDisplayMode('on-screen-bible');
        onProjectVerse(reference, verseText, passage.version, passage);
      }
    } catch (error: any) {
      console.error('Offline Bible search error:', error);
      setSelectedPassage(null);
      setSearchError(error?.message || 'Offline Bible search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBible();
    }
  };

  const handleVersionChange = async (newVersion: string) => {
    setSelectedVersion(newVersion.toUpperCase());
    if (!selectedPassage || !searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const passage = await runOfflineSearch(searchQuery, newVersion);
      setSelectedPassage(passage);
      const safeIndex = currentVerseIndex < passage.verses.length ? currentVerseIndex : 0;
      setCurrentVerseIndex(safeIndex);
      if (passage.verses.length > 0) {
        const verse = passage.verses[safeIndex];
        const reference = `${passage.book} ${passage.chapter}:${verse.number}`;
        const verseText = `${verse.number} ${verse.text}`;
        setDisplayMode('on-screen-bible');
        onProjectVerse(reference, verseText, passage.version, passage);
      }
    } catch (error: any) {
      console.error('Offline Bible version change error:', error);
      setSearchError(error?.message || 'Could not reload this passage offline.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearScreen = () => {
    setSelectedPassage(null);
    setSearchQuery('');
    setCurrentVerseIndex(0);
    setSearchError(null);
    onClearProjection?.();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedPassage || !isVisible) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentVerseIndex > 0) projectVerseByIndex(currentVerseIndex - 1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentVerseIndex < selectedPassage.verses.length - 1) {
          projectVerseByIndex(currentVerseIndex + 1);
        }
      }
    };

    if (isVisible && selectedPassage) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, selectedPassage, currentVerseIndex]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[110]">
      <div
        className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-2xl shadow-2xl w-full max-w-[700px] overflow-hidden fixed"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center justify-between border-b border-[#2d2d4a] px-6 py-4 cursor-move" onMouseDown={handleDragStart}>
          <div className="flex items-center gap-3 text-white">
            <BookOpen className="h-5 w-5 text-[#6366f1]" />
            <div>
              <h3 className="font-semibold">Bible Projection</h3>
              <p className="text-xs text-slate-400">Offline-first desktop lookup</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-300 hover:text-white">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            {bibleVersions.map((version) => (
              <Button
                key={version.id}
                type="button"
                variant={selectedVersion.toLowerCase() === String(version.id).toLowerCase() ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => handleVersionChange(String(version.id))}
              >
                {String(version.id).toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter Bible reference (e.g., John 3:16)"
              className="bg-[#0f1020] text-white border-[#2d2d4a]"
            />
            <Button onClick={searchBible} disabled={isSearching} className="bg-[#6366f1] hover:bg-[#5558e3]">
              <SearchIcon className="mr-2 h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchError ? <div className="text-sm text-red-400">{searchError}</div> : null}

          {selectedPassage ? (
            <div className="space-y-4 rounded-xl border border-[#2d2d4a] bg-[#121327] p-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-slate-400">Current passage</div>
                  <div className="text-lg font-semibold">{selectedPassage.reference}</div>
                </div>
                <Button variant="outline" onClick={handleClearScreen}>Clear</Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedPassage.verses.map((verse, index) => (
                  <button
                    key={`${verse.number}-${index}`}
                    type="button"
                    onClick={() => projectVerseByIndex(index)}
                    className={`rounded-lg border p-3 text-left transition ${index === currentVerseIndex ? 'border-[#6366f1] bg-[#1b1d39]' : 'border-[#2d2d4a] bg-[#161830] hover:border-[#6366f1]/70'}`}
                  >
                    <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{getVerseLabel(verse.number)}</div>
                    <div className="text-sm leading-6 text-slate-100">{verse.text}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#2d2d4a] bg-[#101225] p-10 text-center text-slate-400">
              Search a reference to project Bible verses fully offline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
