import React, { useState, useEffect } from 'react';
import { SearchIcon, XIcon, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";

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

export const BibleProjectionWidget: React.FC<BibleProjectionWidgetProps> = ({
  isVisible,
  onClose,
  onProjectVerse,
  onClearProjection
}) => {
  const { setMode: setDisplayMode } = useDisplayModeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("KJV");
  const [selectedPassage, setSelectedPassage] = useState<BiblePassage | null>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Center the modal on mount
  useEffect(() => {
    if (isVisible) {
      const modalWidth = 700;
      const modalHeight = 600;
      setPosition({
        x: (window.innerWidth - modalWidth) / 2,
        y: (window.innerHeight - modalHeight) / 2
      });
    }
  }, [isVisible]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const boundedX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        const boundedY = Math.max(0, Math.min(window.innerHeight - 100, newY));
        setPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const bibleVersions = [
    { id: 'KJV', name: 'King James Version' },
    { id: 'NKJV', name: 'New King James Version' },
    { id: 'NIV', name: 'New International Version' },
    { id: 'AMP', name: 'Amplified Bible' },
    { id: 'GN', name: 'Good News Translation' },
    { id: 'MSG', name: 'The Message' },
    { id: 'ESV', name: 'English Standard Version' }
  ];

  // Get the book and chapter from reference for verse button labels
  const getVerseLabel = (verseNumber: number) => {
    if (!selectedPassage) return `Verse ${verseNumber}`;
    const referenceMatch = selectedPassage.reference.match(/^(.+?)\s+(?:Chapter\s+)?(\d+)/);
    const bookName = referenceMatch ? referenceMatch[1] : selectedPassage.reference;
    const chapter = referenceMatch ? referenceMatch[2] : '';
    return `${bookName} ${chapter}:${verseNumber}`;
  };

  // Get full reference for current verse
  const getCurrentVerseReference = () => {
    if (!selectedPassage || !selectedPassage.verses.length) return '';
    const currentVerse = selectedPassage.verses[currentVerseIndex];
    return getVerseLabel(currentVerse.number);
  };

  // Project a specific verse by index
  const projectVerseByIndex = (index: number) => {
    if (!selectedPassage || !selectedPassage.verses.length) return;
    
    setCurrentVerseIndex(index);
    const verse = selectedPassage.verses[index];
    const verseText = `${verse.number} ${verse.text}`;
    const reference = getVerseLabel(verse.number);
    
    setDisplayMode('on-screen-bible');
    onProjectVerse(reference, verseText, selectedPassage.version, selectedPassage);
  };

  // Search Bible verses and auto-project first result
  const searchBible = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Please enter a Bible reference (e.g., John 3:16 or Genesis 1:1-5)");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(searchQuery.trim())}&version=${selectedVersion.toLowerCase()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.passage) {
          const passage: BiblePassage = {
            book: data.passage.book || "",
            chapter: data.passage.chapter || 0,
            verses: data.passage.verses,
            version: data.passage.version,
            reference: data.passage.reference
          };
          
          setSelectedPassage(passage);
          setCurrentVerseIndex(0);
          setSearchError(null);
          
          // Auto-project first verse immediately after search
          if (passage.verses.length > 0) {
            const firstVerse = passage.verses[0];
            const referenceMatch = passage.reference.match(/^(.+?)\s+(?:Chapter\s+)?(\d+)/);
            const bookName = referenceMatch ? referenceMatch[1] : passage.reference;
            const chapter = referenceMatch ? referenceMatch[2] : '';
            const reference = `${bookName} ${chapter}:${firstVerse.number}`;
            const verseText = `${firstVerse.number} ${firstVerse.text}`;
            
            setDisplayMode('on-screen-bible');
            onProjectVerse(reference, verseText, passage.version, passage);
          }
        } else {
          setSearchError(data?.message || "Scripture not found. Please check your reference.");
        }
      } else {
        setSearchError("Error searching Bible. Please try again.");
      }
    } catch (error) {
      console.error("Bible search error:", error);
      setSearchError("Error searching Bible. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle enter key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchBible();
    }
  };

  // Change Bible version and re-search if there's a passage
  const handleVersionChange = async (newVersion: string) => {
    setSelectedVersion(newVersion);
    
    // NOTE: We intentionally do NOT update the Zustand store here.
    // The On-screen Bible uses postMessage (PROJECT_BIBLE_VERSE) for communication,
    // while the Zustand store is for the Hands-free Bible widget.
    // Updating Zustand here would cause the HFB useEffect in LivePresentation to overwrite
    // the correct version with stale data from previous HFB sessions.
    
    // If we have a passage and search query, re-search with new version
    if (selectedPassage && searchQuery) {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(searchQuery.trim())}&version=${newVersion.toLowerCase()}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data?.success && data?.passage) {
            const passage: BiblePassage = {
              book: data.passage.book || "",
              chapter: data.passage.chapter || 0,
              verses: data.passage.verses,
              version: data.passage.version,
              reference: data.passage.reference
            };
            
            setSelectedPassage(passage);
            // Keep same verse index if possible
            const safeIndex = currentVerseIndex < passage.verses.length ? currentVerseIndex : 0;
            setCurrentVerseIndex(safeIndex);
            
            // Auto-project current verse with new version
            if (passage.verses.length > 0) {
              const verse = passage.verses[safeIndex];
              const referenceMatch = passage.reference.match(/^(.+?)\s+(?:Chapter\s+)?(\d+)/);
              const bookName = referenceMatch ? referenceMatch[1] : passage.reference;
              const chapter = referenceMatch ? referenceMatch[2] : '';
              const reference = `${bookName} ${chapter}:${verse.number}`;
              const verseText = `${verse.number} ${verse.text}`;
              
              setDisplayMode('on-screen-bible');
              onProjectVerse(reference, verseText, passage.version, passage);
            }
          }
        }
      } catch (error) {
        console.error("Error changing Bible version:", error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Clear screen function - clears projection and resets search
  const handleClearScreen = () => {
    setSelectedPassage(null);
    setSearchQuery("");
    setCurrentVerseIndex(0);
    setSearchError(null);
    onClearProjection?.();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedPassage || !isVisible) return;
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentVerseIndex > 0) {
          projectVerseByIndex(currentVerseIndex - 1);
        }
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
        
        {/* Draggable Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white">On-screen Bible</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-transparent"
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Bible Version Tabs */}
        <div className="px-6 pb-4">
          <div className="flex space-x-1 bg-[#2d2d4a] rounded-lg p-1 w-fit">
            {bibleVersions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleVersionChange(version.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  selectedVersion === version.id
                    ? 'bg-[#6366f1] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#3d3465]'
                }`}
              >
                {version.id}
              </button>
            ))}
          </div>
        </div>

        {/* Search Scripture Section */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-white mb-3">
            Search Scripture
          </label>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Genesis 4: 1 -7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 bg-[#2d2d4a] border-[#3d3465] text-white placeholder-gray-500 text-base py-6 rounded-lg"
              />
            </div>
            <Button
              onClick={searchBible}
              disabled={isSearching}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white font-medium px-8 py-6 rounded-lg"
            >
              {isSearching ? "..." : "Search"}
            </Button>
          </div>
          
          {/* Search Error */}
          {searchError && (
            <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* Scripture Preview Section */}
        <div className="px-6 pb-6">
          <p className="text-white font-medium mb-4">Your scripture will appear below</p>
          
          <div className="bg-[#252540] rounded-xl p-5 min-h-[280px]">
            {selectedPassage && selectedPassage.verses.length > 0 ? (
              <>
                {/* Version Label and Clear Button Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#f472b6] font-bold text-lg">{selectedVersion}</span>
                  <button
                    onClick={handleClearScreen}
                    className="px-4 py-1.5 bg-[#3d3d5c] hover:bg-[#4d4d6c] text-gray-300 text-sm rounded-md transition-colors"
                  >
                    Clear screen
                  </button>
                </div>

                {/* Verse Number Buttons */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {selectedPassage.verses.map((verse, index) => {
                    const isSelected = index === currentVerseIndex;
                    return (
                      <button
                        key={verse.number}
                        onClick={() => projectVerseByIndex(index)}
                        className={`relative px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-[#7c3aed] text-white'
                            : 'bg-[#3d3d5c] text-gray-300 hover:bg-[#4d4d6c]'
                        }`}
                      >
                        {getVerseLabel(verse.number)}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#252540]"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Verse Content Preview Box */}
                <div className="bg-[#1e1e35] rounded-xl p-5 relative">
                  {/* Live Scripture Preview Badge */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className="text-[#a855f7] text-sm font-medium">Live Scripture Preview</span>
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full"></span>
                  </div>

                  {/* Verse Reference */}
                  <p className="text-[#a855f7] text-sm mb-3">{getCurrentVerseReference()}</p>
                  
                  {/* Verse Text */}
                  <p className="text-white text-lg leading-relaxed pr-32">
                    {selectedPassage.verses[currentVerseIndex]?.text}
                  </p>

                  {/* Version Label Bottom Right */}
                  <p className="text-right text-[#6366f1] font-bold text-lg mt-4">{selectedVersion}</p>
                </div>
              </>
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center h-full min-h-[240px] text-gray-500">
                <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-center">
                  Enter a scripture reference above and click Search<br />
                  to display verses here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
