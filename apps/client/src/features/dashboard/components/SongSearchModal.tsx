import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: any) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  filteredSongs: any[];
  onSearch: () => void;
}

export function SongSearchModal({
  isOpen,
  onClose,
  onSelectSong,
  searchTerm,
  onSearchTermChange,
  filteredSongs,
  onSearch,
}: SongSearchModalProps) {
  const [showResults, setShowResults] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 3 && isOpen) {
      onSearch();
      setShowResults(true);
    } else if (debouncedSearchTerm.length < 3) {
      setShowResults(false);
    }
  }, [debouncedSearchTerm, isOpen, onSearch]);

  // Automatically show results if filteredSongs is provided when modal opens
  useEffect(() => {
    if (isOpen && filteredSongs.length > 0) {
      setShowResults(true);
    }
  }, [isOpen, filteredSongs]);

  const handleSearch = () => {
    onSearch();
    setShowResults(true);
  };

  const handleSelectSong = (song: any) => {
    onSelectSong(song);
    onClose();
    setShowResults(false);
  };

  const handleClose = () => {
    onClose();
    setShowResults(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-[#1a0f2e] border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center justify-between">
            Search Your Songbook
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Enter song title, lyrics, or artist (3+ characters)"
                  className="bg-[#2a1f3d] border-gray-600 text-white h-12 pl-10"
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchTerm.length >= 3) {
                      handleSearch();
                    }
                  }}
                />
              </div>
 
            </div>
            
            <p className="text-gray-400 text-sm">
              Search through your saved songs by title, lyrics, or artist name. Enter at least 3 characters to search.
            </p>
          </div>

          {/* Search Results Section */}
          {showResults && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">
                  Search Results ({filteredSongs.length} found)
                </h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Hide Results
                </button>
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-3 bg-[#0f0624] rounded-lg border border-gray-700 p-4">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map((song: any) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-4 bg-[#1a0f2e] rounded-lg border border-gray-600 hover:border-[#8356F3] cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => handleSelectSong(song)}
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-2">{song.title}</h4>
                        <div className="space-y-1">
                          <p className="text-gray-400 text-sm">
                            <span className="text-gray-500">Author:</span>{' '}
                            {song.authors?.length > 0 
                              ? song.authors.join(', ')
                              : song.artist || 'Unknown Artist'
                            }
                          </p>
                          {song.topics && song.topics.length > 0 && (
                            <p className="text-gray-400 text-sm">
                              <span className="text-gray-500">Topics:</span> {song.topics.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-[#8356F3] text-sm font-medium">
                          Click to Load
                        </div>
                        <div className="text-gray-500 text-xs">
                          ID: {song.id}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Search size={48} className="mx-auto mb-3 opacity-50" />
                    </div>
                    <p className="text-gray-400 text-lg mb-1">No songs found</p>
                    <p className="text-gray-500 text-sm">
                      No songs match "{searchTerm}". Try different keywords or check your songbook.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Text */}
          {!showResults && (
            <div className="bg-[#0f0624] rounded-lg border border-gray-700 p-4">
              <h4 className="text-white font-medium mb-2">How to Search</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Enter song title, partial lyrics, or artist name</li>
                <li>• Use at least 3 characters for accurate results</li>
                <li>• Search is case-insensitive and matches partial words</li>
                <li>• Click any result to load it into the editor</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}