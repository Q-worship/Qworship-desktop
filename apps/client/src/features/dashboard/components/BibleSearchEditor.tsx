import React, { useState } from 'react';
import { XIcon, SearchIcon, InfoIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BibleSearchEditorProps {
  isVisible: boolean;
  onClose: () => void;
  selectedSectionId: string | number | null;
  selectedBibleItemId?: number;
}

interface BibleVerse {
  number: number;
  text: string;
}

interface BiblePassage {
  reference: string;
  version: string;
  verses: BibleVerse[];
}

export const BibleSearchEditor: React.FC<BibleSearchEditorProps> = ({
  isVisible,
  onClose,
  selectedSectionId,
  selectedBibleItemId,
}) => {
  const [activeVersion, setActiveVersion] = useState<string>('KJV');
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedPassage, setSelectedPassage] = useState<BiblePassage | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Display options state (as specified in requirements)
  const [showBibleReference, setShowBibleReference] = useState<'every-slide' | 'first-slide' | 'none'>('every-slide');
  const [showBibleVersion, setShowBibleVersion] = useState<'every-slide' | 'first-slide' | 'none'>('every-slide');
  const [oneVersePerSlide, setOneVersePerSlide] = useState<boolean>(true);
  const [includeVerseNumbers, setIncludeVerseNumbers] = useState<boolean>(true);
  const [breakSlidesOnParagraphs, setBreakSlidesOnParagraphs] = useState<boolean>(false);
  const [slideAnimation, setSlideAnimation] = useState<string>('fade');

  // Bible versions (as specified in requirements)
  const bibleVersions = [
    { id: 'KJV', name: 'KJV' },
    { id: 'NKJV', name: 'NKJV' },
    { id: 'NIV', name: 'NIV' },
    { id: 'AMP', name: 'AMP' },
    { id: 'GN', name: 'GN' },
    { id: 'MSG', name: 'MSG' },
    { id: 'ESV', name: 'ESV' },
  ];

  // Search Bible function
  const searchBible = async (reference: string, version: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/bible/search?reference=${encodeURIComponent(reference)}&version=${version}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search Bible');
      }
      const data = await response.json();
      if (data?.passage) {
        setSelectedPassage(data.passage);
        
        // Auto-apply the Scripture to the service (no manual "Add to Service" step needed)
        console.log('🔍 Auto-apply check - selectedBibleItemId:', selectedBibleItemId);
        if (selectedBibleItemId) {
          console.log('✅ Auto-applying Bible content to service item');
          // Generate slides inline since the function is defined later
          const slides = [];
          
          if (oneVersePerSlide) {
            data.passage.verses.forEach((verse: any, index: number) => {
              slides.push({
                id: `bible-slide-${index + 1}`,
                type: 'bible',
                title: data.passage.reference,
                content: includeVerseNumbers ? `${verse.number} ${verse.text}` : verse.text,
                slideNumber: index + 1,
                reference: showBibleReference !== 'none' ? data.passage.reference : '',
                version: showBibleVersion !== 'none' ? data.passage.version : ''
              });
            });
          } else {
            const content = data.passage.verses.map((v: any) => 
              includeVerseNumbers ? `${v.number} ${v.text}` : v.text
            ).join(' ');
            
            slides.push({
              id: 'bible-slide-1',
              type: 'bible',
              title: data.passage.reference,
              content,
              slideNumber: 1,
              reference: showBibleReference !== 'none' ? data.passage.reference : '',
              version: showBibleVersion !== 'none' ? data.passage.version : ''
            });
          }
          
          const updateData = {
            title: data.passage.reference,
            bibleReference: data.passage.reference,
            bibleVersion: data.passage.version,
            bibleVerses: JSON.stringify(data.passage.verses),
            content: data.passage.verses.map((v: any) => v.text).join(' '),
            slides: JSON.stringify(slides)
          };
          console.log('📤 Sending Bible update:', updateData);
          console.log('📤 Generated slides count:', slides.length);
          updateBibleItem.mutate(updateData);
        } else {
          console.log('❌ Not auto-applying: selectedBibleItemId is', selectedBibleItemId);
        }
        
        toast({
          title: "Scripture Found",
          description: `${data.passage.reference} (${data.passage.version})`,
          className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white"
        });
      }
    } catch (error: any) {
      toast({
        title: "Scripture Not Found",
        description: error.message || "Please check your reference format (e.g., John 3:16)",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Update service item with Bible data
  const updateBibleItem = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/service-items/${selectedBibleItemId}`, 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-sections'] });
      toast({
        title: "Bible Item Updated",
        description: "Scripture has been added to your service",
        className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white"
      });
      onClose();
    },
  });

  const handleSearch = () => {
    if (!searchInput.trim()) {
      toast({
        title: "Enter Scripture Reference",
        description: "Please enter a Bible reference like John 3:16",
        variant: "destructive"
      });
      return;
    }

    searchBible(searchInput.trim(), activeVersion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVersionChange = (version: string) => {
    setActiveVersion(version);
    if (selectedPassage && searchInput.trim()) {
      // Re-query same passage with new version
      searchBible(searchInput.trim(), version);
    }
  };

  const handleApplyToService = () => {
    if (!selectedPassage || !selectedBibleItemId) {
      toast({
        title: "No Scripture Selected",
        description: "Please search and select a Bible passage first",
        variant: "destructive"
      });
      return;
    }

    // Generate slides based on options
    const slides = generateSlides(selectedPassage);

    updateBibleItem.mutate({
      title: selectedPassage.reference,
      bibleReference: selectedPassage.reference,
      bibleVersion: selectedPassage.version,
      bibleVerses: JSON.stringify(selectedPassage.verses),
      content: selectedPassage.verses.map(v => v.text).join(' '),
      slides: JSON.stringify(slides)
    });
  };

  const generateSlides = (passage: BiblePassage) => {
    const parentItemId = selectedBibleItemId || `bible-${Date.now()}`;
    const slides: any[] = [];
    
    if (oneVersePerSlide) {
      // One verse per slide (priority 1 according to requirements)
      passage.verses.forEach((verse, index) => {
        slides.push({
          id: `slide-${parentItemId}-${index + 1}`,
          itemId: parentItemId,
          type: 'bible',
          title: passage.reference,
          content: includeVerseNumbers ? `${verse.number} ${verse.text}` : verse.text,
          slideNumber: index + 1,
          reference: showBibleReference !== 'none' ? passage.reference : '',
          version: showBibleVersion !== 'none' ? passage.version : ''
        });
      });
    } else if (breakSlidesOnParagraphs) {
      // Group by paragraphs (priority 2 according to requirements)
      // For now, treat each verse as a paragraph - this could be enhanced
      const content = passage.verses.map(v => 
        includeVerseNumbers ? `${v.number} ${v.text}` : v.text
      ).join(' ');
      
      slides.push({
        id: `slide-${parentItemId}-1`,
        itemId: parentItemId,
        type: 'bible',
        title: passage.reference,
        content,
        slideNumber: 1,
        reference: showBibleReference !== 'none' ? passage.reference : '',
        version: showBibleVersion !== 'none' ? passage.version : ''
      });
    } else {
      // Auto-fit: all verses on one slide (priority 3 according to requirements)
      const content = passage.verses.map(v => 
        includeVerseNumbers ? `${v.number} ${v.text}` : v.text
      ).join(' ');
      
      slides.push({
        id: `slide-${parentItemId}-1`,
        itemId: parentItemId,
        type: 'bible',
        title: passage.reference,
        content,
        slideNumber: 1,
        reference: showBibleReference !== 'none' ? passage.reference : '',
        version: showBibleVersion !== 'none' ? passage.version : ''
      });
    }

    return slides;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a0f2e] via-[#0f0920] to-[#2d1b4e] border border-purple-500/30 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h2 className="text-xl font-semibold text-white">On screen Bible</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Bible Version Tabs (as specified in requirements) */}
        <div className="flex items-center px-6 py-4 border-b border-purple-500/20 bg-purple-900/20">
          <div className="flex space-x-1 bg-purple-900/30 rounded-lg p-1">
            {bibleVersions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleVersionChange(version.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeVersion === version.id
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'text-purple-300 hover:text-white hover:bg-purple-700/50'
                }`}
              >
                {version.name}
              </button>
            ))}
            <button className="px-4 py-2 text-sm font-medium text-purple-300 hover:text-white hover:bg-purple-700/50 rounded-md transition-all">
              + Add more
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* Left Panel - Search & Options */}
          <div className="w-1/2 border-r border-purple-500/30 p-6 overflow-y-auto">
            
            {/* Search Input (as specified in requirements) */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type scripture reference"
                  className="bg-purple-900/30 border-purple-500/30 text-white placeholder-purple-300 pr-10 text-lg"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700"
                >
                  <SearchIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Help text with accepted formats (from requirements) */}
              <div className="flex items-center mt-2 text-xs text-purple-300">
                <InfoIcon className="w-3 h-3 mr-1" />
                Examples: John 3:16, Matthew 7,7, John 3 16, John 8:12-17
              </div>
            </div>

            {/* Display Options (as specified in requirements) */}
            <div className="space-y-4">
              
              {/* Show Bible reference on */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">Show Bible reference on</label>
                <Select value={showBibleReference} onValueChange={(value: any) => setShowBibleReference(value)}>
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-purple-500/30">
                    <SelectItem value="every-slide" className="text-white">Every slide</SelectItem>
                    <SelectItem value="first-slide" className="text-white">First slide only</SelectItem>
                    <SelectItem value="none" className="text-white">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show Bible version on */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">Show Bible version on</label>
                <Select value={showBibleVersion} onValueChange={(value: any) => setShowBibleVersion(value)}>
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-purple-500/30">
                    <SelectItem value="every-slide" className="text-white">Every slide</SelectItem>
                    <SelectItem value="first-slide" className="text-white">First slide only</SelectItem>
                    <SelectItem value="none" className="text-white">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes (as specified in requirements) */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oneVersePerSlide}
                    onChange={(e) => setOneVersePerSlide(e.target.checked)}
                    className="rounded border-purple-500/30 bg-purple-900/30 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">One verse per slide</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeVerseNumbers}
                    onChange={(e) => setIncludeVerseNumbers(e.target.checked)}
                    className="rounded border-purple-500/30 bg-purple-900/30 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">Include verse numbers</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={breakSlidesOnParagraphs}
                    onChange={(e) => setBreakSlidesOnParagraphs(e.target.checked)}
                    className="rounded border-purple-500/30 bg-purple-900/30 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-white">Break slides on paragraphs</span>
                </label>
              </div>

              {/* Slide Animation (as specified in requirements) */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">Slide animation</label>
                <Select value={slideAnimation} onValueChange={setSlideAnimation}>
                  <SelectTrigger className="bg-purple-900/30 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0f2e] border-purple-500/30">
                    <SelectItem value="fade" className="text-white">Fade in</SelectItem>
                    <SelectItem value="slide" className="text-white">Slide</SelectItem>
                    <SelectItem value="none" className="text-white">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview (as specified in requirements) */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
            
            {isSearching ? (
              <div className="text-center text-purple-300 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                Searching Bible...
              </div>
            ) : selectedPassage ? (
              <div className="space-y-4">
                
                {/* Scripture Reference Display */}
                <Card className="bg-purple-900/20 border border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="text-white font-semibold text-lg">
                      {selectedPassage.reference} • {selectedPassage.version}
                    </div>
                  </CardContent>
                </Card>

                {/* Live Preview */}
                <Card className="bg-purple-900/20 border border-purple-500/30">
                  <CardContent className="p-4">
                    <h4 className="text-white font-semibold mb-3">Live Preview</h4>
                    <div className="text-white space-y-2">
                      {selectedPassage.verses.map((verse, index) => (
                        <div key={index} className="leading-relaxed text-lg">
                          {includeVerseNumbers && (
                            <span className="text-purple-400 font-medium mr-2 text-sm">{verse.number}</span>
                          )}
                          {verse.text}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Slides Preview */}
                <Card className="bg-purple-900/20 border border-purple-500/30">
                  <CardContent className="p-4">
                    <h4 className="text-white font-semibold mb-3">
                      Slides ({generateSlides(selectedPassage).length} slides)
                    </h4>
                    <div className="space-y-2">
                      {generateSlides(selectedPassage).map((slide, index) => (
                        <div key={slide.id} className="p-3 bg-purple-800/30 rounded border border-purple-500/20">
                          <div className="text-xs text-purple-300 mb-1">
                            Slide {slide.slideNumber}
                            {slide.reference && ` • ${slide.reference}`}
                            {slide.version && ` • ${slide.version}`}
                          </div>
                          <div className="text-white text-sm">{slide.content}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-purple-300 py-8">
                <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Enter a Bible reference to see preview</p>
                <div className="text-sm opacity-75 space-y-1">
                  <p>Supported formats:</p>
                  <p>John 3:16 • Matthew 7,7 • John 3 16</p>
                  <p>John 8:12-17 • Matthew 7,7-10</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-purple-500/30 p-6 bg-gradient-to-r from-purple-900/20 to-purple-800/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-purple-300">
              {selectedPassage ? (
                `Ready to add ${selectedPassage.reference} (${generateSlides(selectedPassage).length} slides)`
              ) : (
                'Search for a Bible passage to add to your service'
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose} className="border-purple-500/30 text-purple-300 hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleApplyToService}
                disabled={!selectedPassage || updateBibleItem.isPending}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
              >
                {updateBibleItem.isPending ? 'Adding...' : 'Add to Service'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};