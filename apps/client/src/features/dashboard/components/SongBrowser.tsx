import React, { useState } from 'react';
import { Search, Music, Play, Clock, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  key?: string;
  tempo?: number;
  tags: string[];
}

interface SongBrowserProps {
  isVisible: boolean;
  onClose: () => void;
  onSongSelected: (song: Song) => void;
}

export const SongBrowser: React.FC<SongBrowserProps> = ({
  isVisible,
  onClose,
  onSongSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all songs
  const { data: songsData, isLoading } = useQuery({
    queryKey: ['/api/songs'],
    enabled: isVisible,
  });

  // Search songs when query changes
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/songs/search', searchQuery],
    queryFn: () => apiRequest('POST', '/api/songs/search', { query: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const songs = searchQuery ? (searchResults?.songs || []) : (songsData?.songs || []);

  const handleSongSelect = (song: Song) => {
    onSongSelected(song);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gray-800/50 border border-gray-600 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white">Browse My Songs</h4>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search songs by title, artist, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Song List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading || isSearching ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading songs...
          </div>
        ) : songs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchQuery ? 'No songs found matching your search' : 'No songs in your library'}</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Add songs to your library to get started'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {songs.map((song) => (
              <Card
                key={song.id}
                className="bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 cursor-pointer transition-colors"
                onClick={() => handleSongSelect(song)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-white">{song.title}</h5>
                      <p className="text-sm text-gray-400">{song.artist}</p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        {song.key && (
                          <div className="flex items-center text-xs text-gray-400">
                            <Hash className="w-3 h-3 mr-1" />
                            {song.key}
                          </div>
                        )}
                        {song.tempo && (
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {song.tempo} BPM
                          </div>
                        )}
                      </div>
                      
                      {song.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {song.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-gray-600 text-gray-300"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {song.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-300">
                              +{song.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 ml-4"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Add Song
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-600 p-3">
        <p className="text-xs text-gray-400">
          Step 4: Click "Add Song" to add it to your service section. 
          Each verse and chorus will become individual slides.
        </p>
      </div>
    </div>
  );
};