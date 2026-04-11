import React, { useState, useEffect } from "react";
import { SearchIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import type { Song } from "@/types";
type SongSection = any;

interface SongProjectionWidgetProps {
  onProjectSong: (songTitle: string, sectionTitle: string, lyrics: string, fullSongData?: any) => void;
  onClearProjection: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export const SongProjectionWidget: React.FC<SongProjectionWidgetProps> = ({
  onProjectSong,
  onClearProjection,
  isVisible,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<(Song & { sections: SongSection[] }) | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Center the modal on mount
  useEffect(() => {
    if (isVisible) {
      const modalWidth = 672; // max-w-2xl = 42rem = 672px
      const modalHeight = 600; // approximate height
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

  // Search songs as user types
  useEffect(() => {
    const searchSongs = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      console.log('🎵 FRONTEND - Starting search for:', searchQuery);
      setIsSearching(true);
      try {
        const response = await apiRequest("POST", "/api/songs/search", {
          query: searchQuery
        });
        const data = await response.json();
        
        console.log('🎵 FRONTEND - Search response:', data);
        if (data.success) {
          setSearchResults(data.songs);
          console.log('🎵 FRONTEND - Search results:', data.songs);
        } else {
          console.log('🎵 FRONTEND - Search failed:', data.error);
        }
      } catch (error) {
        console.error("🎵 FRONTEND - Song search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchSongs, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Check if we're running in a Live Presentation window (opened via window.open)
  const isInLiveWindow = window.opener !== null;

  // Load song details
  const loadSong = async (songId: number | string) => {
    console.log('🎵 FRONTEND - Loading song with ID:', songId);
    setIsLoadingSong(true);
    
    try {
      if (isInLiveWindow && window.opener) {
        // If we're in Live Presentation window, request data from parent window
        console.log('🎵 FRONTEND - Requesting song data from parent window');
        console.log('🎵 FRONTEND - Parent window exists:', !!window.opener);
        console.log('🎵 FRONTEND - Song ID to load:', songId);
        console.log('🎵 FRONTEND - Origin:', "*");
        
        // Send message to parent window to fetch song data
        const message = {
          type: 'REQUEST_SONG_DATA',
          data: {
            songId: songId
          }
        };
        console.log('🎵 FRONTEND - Sending message:', message);
        window.opener.postMessage(message, "*");
        
        // Listen for response from parent window
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin && event.origin !== "file://" && event.origin !== "null") return;
          
          console.log('🎵 FRONTEND - Received message from parent:', event.data);
          
          if (event.data.type === 'SONG_DATA_RESPONSE' && event.data.songId === songId) {
            console.log('🎵 FRONTEND - Processing song data response');
            console.log('🎵 FRONTEND - Success:', event.data.success);
            console.log('🎵 FRONTEND - Song data:', event.data.song);
            
            if (event.data.success && event.data.song) {
              console.log('🎵 FRONTEND - Setting selected song');
              console.log('🎵 FRONTEND - Song sections:', event.data.song.sections);
              console.log('🎵 FRONTEND - Section count:', event.data.song.sections?.length || 0);
              setSelectedSong(event.data.song);
              setCurrentSectionIndex(0);
              setSearchResults([]); // Clear search results
              setSearchQuery(""); // Clear search
            } else {
              console.error('🎵 FRONTEND - Failed to load song from parent:', event.data.error);
            }
            
            setIsLoadingSong(false);
            window.removeEventListener('message', handleMessage);
            
            // Clear the timeout since we got a response
            if ((handleMessage as any).timeoutId) {
              clearTimeout((handleMessage as any).timeoutId);
              console.log('🎵 FRONTEND - Cleared timeout - song loaded successfully');
            }
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Timeout after 10 seconds
        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          setIsLoadingSong(false);
          console.error('🎵 FRONTEND - Song loading timeout');
        }, 10000);
        
        // Store timeout ID so it can be cleared in the message handler
        (handleMessage as any).timeoutId = timeoutId;
        
      } else {
        // Normal API call for main window
        const response = await apiRequest("GET", `/api/songs/${songId}`);
        const data = await response.json();
        
        console.log('🎵 FRONTEND - Load song response:', data);
        
        if (data.success) {
          console.log('🎵 FRONTEND - Song loaded successfully:', data.song);
          setSelectedSong(data.song);
          setCurrentSectionIndex(0);
          setSearchResults([]); // Clear search results
          setSearchQuery(""); // Clear search
        } else {
          console.error('🎵 FRONTEND - Failed to load song:', data.error);
        }
        setIsLoadingSong(false);
      }
    } catch (error) {
      console.error("🎵 FRONTEND - Song load error:", error);
      setIsLoadingSong(false);
    }
  };

  // Project current section
  const projectCurrentSection = () => {
    if (!selectedSong || !selectedSong.sections.length) return;
    
    const currentSection = selectedSong.sections[currentSectionIndex];
    
    // Pass the full song data for navigation support
    onProjectSong(selectedSong.title, currentSection.title, currentSection.content, selectedSong);
  };

  // Navigation functions
  const previousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const nextSection = () => {
    if (selectedSong && currentSectionIndex < selectedSong.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  // Back to search
  const backToSearch = () => {
    setSelectedSong(null);
    setCurrentSectionIndex(0);
  };

  // Keyboard navigation for song sections
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation when a song is selected and visible
      if (!selectedSong || !isVisible) return;
      
      // Prevent default behavior for navigation keys
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || 
          event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        
        // Navigate based on key pressed
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          previousSection();
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextSection();
        }
      }
    };

    // Add event listener when component is visible and song is selected
    if (isVisible && selectedSong) {
      document.addEventListener('keydown', handleKeyDown);
      console.log('🎵 KEYBOARD - Added keyboard navigation for song sections');
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log('🎵 KEYBOARD - Removed keyboard navigation for song sections');
    };
  }, [isVisible, selectedSong, currentSectionIndex]); // Re-run when visibility, song, or section changes

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[110]">
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden fixed"
        style={{ left: position.x, top: position.y }}
      >
        {/* Draggable Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-700 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <h3 className="text-lg font-semibold text-white">
            {selectedSong ? `${selectedSong.title} - ${selectedSong.artist}` : "Song Projection"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          {!selectedSong ? (
            // Search Mode
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search songs by title, artist, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8 text-gray-400">
                    Searching songs...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((song) => (
                      <div
                        key={song.id}
                        className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={async () => {
                          console.log('🎵 FRONTEND - Clicked on song:', song.title, 'ID:', song.id);
                          console.log('🎵 FRONTEND - Song object full:', song);
                          try {
                            console.log('🎵 FRONTEND - About to call loadSong');
                            await loadSong(song.id);
                            console.log('🎵 FRONTEND - loadSong completed successfully');
                          } catch (error) {
                            console.error('🎵 FRONTEND - Error calling loadSong:', error);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{song.title}</h4>
                            {song.artist && (
                              <p className="text-sm text-gray-400">{song.artist}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-400">
                            {song.key && <div>Key: {song.key}</div>}
                            {song.tags && song.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {song.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-600 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8 text-gray-400">
                    No songs found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Start typing to search for songs
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Song Display Mode
            <div className="space-y-4">
              {isLoadingSong ? (
                <div className="text-center py-8 text-gray-400">
                  Loading song...
                </div>
              ) : (
                <>
                  {/* Song Info */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={backToSearch}
                      className="text-gray-400 hover:text-white"
                    >
                      ← Back to search
                    </Button>
                    <div className="text-sm text-gray-400">
                      {selectedSong.key && `Key: ${selectedSong.key}`}
                      {selectedSong.tempo && ` • ${selectedSong.tempo} BPM`}
                    </div>
                  </div>

                  {/* Section Navigation */}
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={previousSection}
                      disabled={currentSectionIndex === 0}
                      className="text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="text-center">
                      <div className="text-white font-medium">
                        {selectedSong.sections[currentSectionIndex]?.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        {currentSectionIndex + 1} of {selectedSong.sections.length}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextSection}
                      disabled={currentSectionIndex >= selectedSong.sections.length - 1}
                      className="text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Lyrics Preview */}
                  <div className="bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <div className="text-white whitespace-pre-line text-center leading-relaxed">
                      {selectedSong.sections[currentSectionIndex]?.content}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={projectCurrentSection}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Project This Section
                    </Button>
                    <Button
                      onClick={onClearProjection}
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Clear Screen
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};