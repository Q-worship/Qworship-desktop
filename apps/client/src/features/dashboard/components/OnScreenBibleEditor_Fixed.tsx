import React, { useState, useEffect } from 'react';
import { SearchIcon, InfoIcon, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, ChevronDown, Palette } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface OnScreenBibleEditorProps {
  content: any;
  onUpdate: (updatedContent: any) => void;
}

export const OnScreenBibleEditor: React.FC<OnScreenBibleEditorProps> = ({
  content,
  onUpdate
}) => {
  const [activeVersion, setActiveVersion] = useState<string>(content?.version || 'KJV');
  const [searchInput, setSearchInput] = useState<string>(content?.reference || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasBibleContent, setHasBibleContent] = useState<boolean>(Boolean(content?.bibleVerses && content.bibleVerses.length > 0));
  const { toast } = useToast();

  // Update hasBibleContent when content changes
  useEffect(() => {
    const hasContent = Boolean(content?.bibleVerses && content.bibleVerses.length > 0);
    setHasBibleContent(hasContent);
  }, [content?.bibleVerses, content?.reference]);

  // Bible versions from your requirements
  const bibleVersions = ['KJV', 'NKJV', 'NIV', 'MSG', 'AMP'];

  // Display options
  const [showBibleReference, setShowBibleReference] = useState<string>(content?.referenceDisplay || 'every-slide');
  const [showBibleVersion, setShowBibleVersion] = useState<string>(content?.versionDisplay || 'every-slide');
  const [oneVersePerSlide, setOneVersePerSlide] = useState<boolean>(content?.oneVersePerSlide || true);
  const [includeVerseNumbers, setIncludeVerseNumbers] = useState<boolean>(content?.includeVerseNumbers || true);
  const [breakSlidesOnParagraphs, setBreakSlidesOnParagraphs] = useState<boolean>(content?.breakSlidesOnParagraphs || false);
  const [slideAnimation, setSlideAnimation] = useState<string>(content?.slideAnimation || 'fade');

  // SIMPLIFIED SEARCH FUNCTION
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast({
        title: "Enter Scripture Reference",
        description: "Please enter a Bible reference like John 3:16",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(searchInput.trim())}&version=${activeVersion.toLowerCase()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.success && data?.passage) {
          const result = data.passage;
          
          // Create bible verses array
          const bibleVerses = result.verses.map((v: any) => ({
            number: v.number,
            text: v.text
          }));
          
          // Create updated content
          const updatedContent = {
            ...content,
            reference: searchInput.trim(),
            version: activeVersion,
            bibleVerses: bibleVerses,
            title: searchInput.trim(),
            content: result.verses.map((v: any) => v.text).join(' ')
          };

          // Update state
          setHasBibleContent(true);
          
          // Call parent update
          onUpdate(updatedContent);
          
          toast({
            title: "Scripture Found",
            description: `${searchInput.trim()} (${activeVersion})`,
            className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white"
          });
        } else {
          throw new Error('Scripture not found');
        }
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      toast({
        title: "Scripture Not Found",
        description: `Could not find ${searchInput.trim()}. Please check the reference.`,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVersionChange = (version: string) => {
    setActiveVersion(version);
    if (content?.reference && searchInput.trim()) {
      setActiveVersion(version);
      setTimeout(() => handleSearch(), 100);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#4a3a6b]">
      {/* Bible Editor: Rich Text Editor Toolbar - Same as Song Editor 2 */}
      <div className="bg-[#2d1f4a] border-b border-gray-600 flex-shrink-0">
        
        {/* Formatting Toolbar - Single Responsive Row */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 overflow-x-auto">
          {/* Undo/Redo */}
          <div className="flex items-center">
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-6 bg-gray-600 mx-1"></div>

          {/* Text Formatting */}
          <div className="flex items-center">
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-6 bg-gray-600 mx-1"></div>

          {/* Text Alignment */}
          <div className="flex items-center">
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Vertical Separator */}
          <div className="w-px h-6 bg-gray-600 mx-1"></div>

          {/* Color */}
          <div className="flex items-center">
            <button 
              className="p-1.5 rounded transition-colors text-gray-500 cursor-not-allowed"
              disabled
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>

          {/* Bible Version Selector */}
          <div className="flex items-center ml-auto">
            <div className="flex space-x-1">
              {bibleVersions.map((version) => (
                <button
                  key={version}
                  onClick={() => handleVersionChange(version)}
                  className={`px-3 py-1 text-xs rounded ${
                    activeVersion === version
                      ? 'bg-[#8356F3] text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {version}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          
          {/* DEBUG INFO */}
          <div className="p-2 bg-red-900 text-white text-xs">
            FIXED COMPONENT - hasBibleContent={hasBibleContent.toString()}, 
            hasVerses={Boolean(content?.bibleVerses && content.bibleVerses.length > 0).toString()},
            searchInput="{searchInput}"
          </div>
          
          {/* Search Section */}
          <div className="p-4 border-b border-gray-600 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  // Clear Bible content when search input is cleared
                  if (!e.target.value.trim()) {
                    setHasBibleContent(false);
                    const clearedContent = {
                      ...content,
                      bibleVerses: null,
                      reference: '',
                      content: '',
                      slides: []
                    };
                    onUpdate(clearedContent);
                  }
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type scripture reference"
                className="w-full bg-[#1a1426] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 pr-10"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-purple-400 hover:text-white"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Examples: John 3:16, Matthew 7,7, John 3 16, John 8:12-17
            </div>
          </div>

          {/* Bible Content Display - Conditional */}
          {hasBibleContent && content?.bibleVerses && content.bibleVerses.length > 0 && (
            <div className="mx-4 mb-4 bg-gradient-to-b from-[#4a3564] to-[#392a4d] rounded-lg border border-purple-500/30 overflow-hidden">
              {/* Header */}
              <div className="bg-[#4a3564] px-4 py-3 border-b border-purple-500/30 flex items-center justify-between">
                <h3 className="text-white font-medium text-lg">
                  {content.reference || searchInput}, {activeVersion}
                </h3>
                <InfoIcon className="w-5 h-5 text-gray-300" />
              </div>
              
              {/* Content Area */}
              <div className="p-4 max-h-60 overflow-y-auto">
                {content.bibleVerses && content.bibleVerses.length > 0 ? (
                  <div className="space-y-3">
                    {content.bibleVerses.map((verse: any, index: number) => (
                      <div key={index} className="text-gray-200 leading-relaxed">
                        {includeVerseNumbers && (
                          <span className="text-purple-300 font-medium mr-2">
                            {verse.number}
                          </span>
                        )}
                        <span>{verse.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic text-center py-8">
                    Your Bible Content will appear here once you search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display Options */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Show Bible Reference and Version on same line */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">Show Bible reference on</label>
                <select 
                  value={showBibleReference} 
                  onChange={(e) => setShowBibleReference(e.target.value)}
                  className="w-full bg-[#1a1426] border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="every-slide">Every slide</option>
                  <option value="first-slide">First slide only</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 block mb-2">Show Bible version on</label>
                <select 
                  value={showBibleVersion} 
                  onChange={(e) => setShowBibleVersion(e.target.value)}
                  className="w-full bg-[#1a1426] border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="every-slide">Every slide</option>
                  <option value="first-slide">First slide only</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={oneVersePerSlide} 
                  onChange={(e) => setOneVersePerSlide(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600 focus:ring-purple-600"
                />
                <span>One verse per slide</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={includeVerseNumbers} 
                  onChange={(e) => setIncludeVerseNumbers(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600 focus:ring-purple-600"
                />
                <span>Include verse numbers</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={breakSlidesOnParagraphs} 
                  onChange={(e) => setBreakSlidesOnParagraphs(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600 focus:ring-purple-600"
                />
                <span>Break slides on paragraphs</span>
              </label>
            </div>

            {/* Slide animation */}
            <div>
              <label className="text-sm text-gray-300 block mb-2">Slide animation</label>
              <select 
                value={slideAnimation} 
                onChange={(e) => setSlideAnimation(e.target.value)}
                className="w-full bg-[#1a1426] border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="fade-in">Fade in</option>
                <option value="slide-up">Slide up</option>
                <option value="slide-down">Slide down</option>
                <option value="zoom-in">Zoom in</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};