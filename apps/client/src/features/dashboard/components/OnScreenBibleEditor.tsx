import React, { useState, useEffect } from 'react';
import { SearchIcon, InfoIcon, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, ChevronDown, Palette } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { searchOffline, type BibleVersion } from '../../../lib/offlineBibleEngine';
import { useBibleRAMCache } from '../hooks/useBibleRAMCache';

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

  // Update activeVersion when content version changes
  useEffect(() => {
    if (content?.version && content.version !== activeVersion) {
      setActiveVersion(content.version);
    }
  }, [content?.version]);

  // Update searchInput when content reference changes  
  useEffect(() => {
    if (content?.reference && content.reference !== searchInput) {
      setSearchInput(content.reference);
    }
  }, [content?.reference]);

  // Bible versions from your requirements
  const bibleVersions = ['KJV', 'NKJV', 'NIV', 'AMP', 'GN', 'MSG', 'ESV'];

  // Display options
  const [showBibleReference, setShowBibleReference] = useState<string>(content?.referenceDisplay || 'every-slide');
  const [showBibleVersion, setShowBibleVersion] = useState<string>(content?.versionDisplay || 'every-slide');
  const [oneVersePerSlide, setOneVersePerSlide] = useState<boolean>(content?.oneVersePerSlide || true);
  const [includeVerseNumbers, setIncludeVerseNumbers] = useState<boolean>(content?.includeVerseNumbers || true);
  const [breakSlidesOnParagraphs, setBreakSlidesOnParagraphs] = useState<boolean>(content?.breakSlidesOnParagraphs || false);
  const [slideAnimation, setSlideAnimation] = useState<string>(content?.slideAnimation || 'fade');

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
      let bibleVerses: any[] = [];
      let combinedText = '';

      // Ensure the requested version is in RAM before searching
      await useBibleRAMCache.getState().ensureVersionLoaded(activeVersion.toLowerCase());

      // 1. Try Zero Latency Offline RAM Engine
      const offlinePassage = await searchOffline(searchInput.trim(), activeVersion.toLowerCase() as BibleVersion);
      
      if (offlinePassage && offlinePassage.verses && offlinePassage.verses.length > 0) {
          bibleVerses = offlinePassage.verses.map(v => ({ number: v.number, text: v.text }));
          combinedText = offlinePassage.verses.map(v => v.text).join(' ');
      } else {
          // 2. Fallback to Cloud 
          const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(searchInput.trim())}&version=${activeVersion.toLowerCase()}`);
          if (response.ok) {
            const data = await response.json();
            if (data?.success && data?.passage && data.passage.verses) {
                bibleVerses = data.passage.verses.map((v: any) => ({ number: v.number, text: v.text }));
                combinedText = data.passage.verses.map((v: any) => v.text).join(' ');
            }
          }
      }

      if (bibleVerses.length > 0) {
          
          // Generate slides first
          const parentItemId = content?.id || `bible-${Date.now()}`;
          const slides: any[] = [];
          if (oneVersePerSlide) {
            bibleVerses.forEach((verse: any, index: number) => {
              slides.push({
                id: `slide-${parentItemId}-${index + 1}`,
                itemId: parentItemId,
                type: 'bible',
                title: searchInput.trim(),
                content: includeVerseNumbers ? `${verse.number} ${verse.text}` : verse.text,
                slideNumber: index + 1,
                reference: showBibleReference !== 'none' ? searchInput.trim() : '',
                version: showBibleVersion !== 'none' ? activeVersion : '',
                bibleReference: searchInput.trim(),
                bibleVersion: activeVersion
              });
            });
          } else {
            const allContent = bibleVerses.map((v: any) => 
              includeVerseNumbers ? `${v.number} ${v.text}` : v.text
            ).join(' ');
            
            slides.push({
              id: `slide-${parentItemId}-1`,
              itemId: parentItemId,
              type: 'bible',
              title: searchInput.trim(),
              content: allContent,
              slideNumber: 1,
              reference: showBibleReference !== 'none' ? searchInput.trim() : '',
              version: showBibleVersion !== 'none' ? activeVersion : '',
              bibleReference: searchInput.trim(),
              bibleVersion: activeVersion
            });
          }

          // Create updated content with all necessary fields
          const updatedContent = {
            id: parentItemId,
            type: 'bible',
            reference: searchInput.trim(),
            version: activeVersion,
            bibleVerses: bibleVerses,
            title: searchInput.trim(),
            content: combinedText,
            referenceDisplay: showBibleReference,
            versionDisplay: showBibleVersion,
            oneVersePerSlide,
            includeVerseNumbers,
            breakSlidesOnParagraphs,
            slideAnimation,
            slides: slides
          };
          
          // Update component state first
          setHasBibleContent(true);
          
          // Call parent update with the complete content
          onUpdate(updatedContent);
          
          // Force re-render by updating state after parent update
          setTimeout(() => {
            setHasBibleContent(true);
          }, 100);
          
          // Show success toast
          toast({
            title: "Scripture Found",
            description: `${searchInput.trim()} (${activeVersion})`,
            className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white"
          });
        } else {
          throw new Error('Scripture not found locally or in cloud.');
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

  const handleVersionChange = async (version: string) => {
    setActiveVersion(version);
    
    // If we have content, re-search with new version to get updated Bible text
    if (content?.reference && searchInput.trim()) {
      setIsSearching(true);
      
      try {
        let bibleVerses: any[] = [];
        let combinedText = '';
  
        // Ensure the requested version is in RAM before searching
        await useBibleRAMCache.getState().ensureVersionLoaded(version.toLowerCase());

        // 1. Try Zero Latency Offline RAM Engine
        const offlinePassage = await searchOffline(searchInput.trim(), version.toLowerCase() as BibleVersion);
        
        if (offlinePassage && offlinePassage.verses && offlinePassage.verses.length > 0) {
            bibleVerses = offlinePassage.verses.map(v => ({ number: v.number, text: v.text }));
            combinedText = offlinePassage.verses.map(v => v.text).join(' ');
        } else {
            // 2. Fallback to Cloud 
            const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(searchInput.trim())}&version=${version.toLowerCase()}`);
            if (response.ok) {
              const data = await response.json();
              if (data?.success && data?.passage && data.passage.verses) {
                  bibleVerses = data.passage.verses.map((v: any) => ({ number: v.number, text: v.text }));
                  combinedText = data.passage.verses.map((v: any) => v.text).join(' ');
              }
            }
        }

        if (bibleVerses.length > 0) {
            const parentItemId = content?.id || `bible-${Date.now()}`;
            const slides: any[] = [];
            if (oneVersePerSlide) {
              bibleVerses.forEach((verse: any, index: number) => {
                slides.push({
                  id: `slide-${parentItemId}-${index + 1}`,
                  itemId: parentItemId,
                  type: 'bible',
                  title: searchInput.trim(),
                  content: includeVerseNumbers ? `${verse.number} ${verse.text}` : verse.text,
                  slideNumber: index + 1,
                  reference: showBibleReference !== 'none' ? searchInput.trim() : '',
                  version: showBibleVersion !== 'none' ? version : '',
                  bibleReference: searchInput.trim(),
                  bibleVersion: version
                });
              });
            } else {
              const allContent = bibleVerses.map((v: any) => 
                includeVerseNumbers ? `${v.number} ${v.text}` : v.text
              ).join(' ');
              
              slides.push({
                id: `slide-${parentItemId}-1`,
                itemId: parentItemId,
                type: 'bible',
                title: searchInput.trim(),
                content: allContent,
                slideNumber: 1,
                reference: showBibleReference !== 'none' ? searchInput.trim() : '',
                version: showBibleVersion !== 'none' ? version : '',
                bibleReference: searchInput.trim(),
                bibleVersion: version
              });
            }

            // Create updated content with new version and verses
            const updatedContent = {
              id: parentItemId,
              type: 'bible',
              reference: searchInput.trim(),
              version: version,
              bibleVerses: bibleVerses,
              title: searchInput.trim(),
              content: combinedText,
              referenceDisplay: showBibleReference,
              versionDisplay: showBibleVersion,
              oneVersePerSlide,
              includeVerseNumbers,
              breakSlidesOnParagraphs,
              slideAnimation,
              slides: slides
            };
            
            // Update component state
            setHasBibleContent(true);
            
            // Call parent update with updated content and slides
            onUpdate(updatedContent);
            
            // Show version change success
            toast({
              title: "Translation Updated",
              description: `Changed to ${version} translation`,
              className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white"
            });
          } else {
            toast({
              title: "Translation Unavailable",
              description: `Could not load the ${version} translation locally or from cloud.`,
              variant: "destructive"
            });
          }
      } catch (error) {
        console.error('Error changing Bible version:', error);
        toast({
          title: "Version Change Error",
          description: "Could not update Bible translation",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }
  };

  const generateSlides = () => {
    if (!content?.bibleVerses) return [];
    
    const parentItemId = content.id || `bible-${Date.now()}`;
    const slides: any[] = [];
    
    if (oneVersePerSlide) {
      content.bibleVerses.forEach((verse: any, index: number) => {
        slides.push({
          id: `slide-${parentItemId}-${index + 1}`,
          itemId: parentItemId,
          type: 'bible',
          title: content.reference,
          content: includeVerseNumbers ? `${verse.number} ${verse.text}` : verse.text,
          slideNumber: index + 1,
          reference: showBibleReference !== 'none' ? content.reference : '',
          version: showBibleVersion !== 'none' ? activeVersion : ''
        });
      });
    } else {
      const allContent = content.bibleVerses.map((v: any) => 
        includeVerseNumbers ? `${v.number} ${v.text}` : v.text
      ).join(' ');
      
      slides.push({
        id: `slide-${parentItemId}-1`,
        itemId: parentItemId,
        type: 'bible',
        title: content.reference,
        content: allContent,
        slideNumber: 1,
        reference: showBibleReference !== 'none' ? content.reference : '',
        version: showBibleVersion !== 'none' ? activeVersion : ''
      });
    }

    return slides;
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

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Font Selection */}
          <div className="flex items-center space-x-1">
            <select className="bg-[#1a1426] text-white text-sm border border-gray-600 rounded px-2 py-1">
              <option>Lufgord</option>
              <option>Arial</option>
              <option>Helvetica</option>
            </select>
          </div>

          {/* Heading Selection */}
          <div className="flex items-center space-x-1">
            <select className="bg-[#1a1426] text-white text-sm border border-gray-600 rounded px-2 py-1">
              <option>Heading 1</option>
              <option>Heading 2</option>
              <option>Paragraph</option>
            </select>
          </div>

          {/* Styles */}
          <div className="flex items-center space-x-1">
            <button className="flex items-center space-x-1 bg-[#1a1426] text-white text-sm border border-gray-600 rounded px-2 py-1">
              <span>Styles</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Text Formatting */}
          <div className="flex items-center">
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Bold (Ctrl+B)">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Italic (Ctrl+I)">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Underline (Ctrl+U)">
              <Underline className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Strikethrough">
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Text Alignment */}
          <div className="flex items-center">
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Align Left">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Align Center">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Align Right">
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600"></div>

          {/* Color */}
          <button className="flex items-center space-x-1 p-1.5 rounded transition-colors text-white hover:bg-white/10" title="Text Color">
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full Width Layout - Bible Search & Options */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Full Width Panel - Bible Search & Options */}
        <div className="w-full flex flex-col h-full">
          {/* Bible Version Tabs - Moved from above */}
          <div className="px-4 py-2 border-b border-gray-600 flex-shrink-0">
            <div className="flex items-center space-x-1">
              {bibleVersions.map((version) => (
                <button
                  key={version}
                  onClick={() => handleVersionChange(version)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-all ${
                    activeVersion === version
                      ? 'bg-[#8356F3] text-white'
                      : 'text-purple-300 hover:text-white hover:bg-purple-700/50'
                  }`}
                >
                  {version}
                </button>
              ))}
              <button className="px-3 py-1 text-sm font-medium text-purple-300 hover:text-white hover:bg-purple-700/50 rounded transition-all">
                Add more
              </button>
            </div>
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
                    // Clear the content completely
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
              <div 
                className="p-4 max-h-60 overflow-y-auto bible-content-scroll"
                style={{
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#8356F3 #4a3564'
                }}
                onWheel={(e) => {
                  const container = e.currentTarget;
                  container.scrollTop += e.deltaY * 0.5;
                }}
              >
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

          {/* Display Options - Single Scrollable Area */}
          <div 
            className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0 relative bible-editor-scroll"
            style={{
              scrollBehavior: 'smooth',
              // Custom scrollbar styling for Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: '#8356F3 #4a3a6b'
            }}
            onWheel={(e) => {
              // Enable smooth mouse wheel scrolling
              const container = e.currentTarget;
              container.scrollTop += e.deltaY * 0.5; // Adjust scroll speed
            }}
          >
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

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={oneVersePerSlide}
                  onChange={(e) => setOneVersePerSlide(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600"
                />
                <span className="text-sm text-gray-300">One verse per slide</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeVerseNumbers}
                  onChange={(e) => setIncludeVerseNumbers(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600"
                />
                <span className="text-sm text-gray-300">Include verse numbers</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={breakSlidesOnParagraphs}
                  onChange={(e) => setBreakSlidesOnParagraphs(e.target.checked)}
                  className="rounded border-gray-600 bg-[#1a1426] text-purple-600"
                />
                <span className="text-sm text-gray-300">Break slides on paragraphs</span>
              </label>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <label className="text-sm text-gray-300 block mb-2">Slide animation</label>
              <select 
                value={slideAnimation} 
                onChange={(e) => setSlideAnimation(e.target.value)}
                className="w-full bg-[#1a1426] border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="fade">Fade in</option>
                <option value="slide">Slide</option>
                <option value="none">None</option>
              </select>
              <div className="flex items-center mt-2 text-xs text-blue-400">
                <InfoIcon className="w-3 h-3 mr-1" />
                <span>Enter a Bible reference to fetch text or simple give voice command</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};