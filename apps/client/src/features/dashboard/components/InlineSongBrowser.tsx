import { Search } from 'lucide-react';

interface InlineSongBrowserProps {
  songSearch: string;
  setSongSearch: (v: string) => void;
  songSearchResults: any[];
  songDropdownOpen: boolean;
  setSongDropdownOpen: (v: boolean) => void;
  allSongs: any[];
  currentSongData: any;
  recentSongs: any[];
  handleSelectSong: (song: any) => void;
}

export function InlineSongBrowser({
  songSearch,
  setSongSearch,
  songSearchResults,
  songDropdownOpen,
  setSongDropdownOpen,
  allSongs,
  currentSongData,
  recentSongs,
  handleSelectSong,
}: InlineSongBrowserProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Search bar */}
      <div className="px-2 pt-4 pb-4 shrink-0 relative">
        <div className="flex gap-0 rounded-lg overflow-hidden border border-[#2d2d4a] focus-within:border-[#7c3aed]">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Song: Amazing Grace"
              value={songSearch}
              onChange={e => setSongSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSongDropdownOpen(false)}
              className="w-full pl-8 pr-2 py-2.5 bg-[#0d0d1a] text-white text-xs placeholder-gray-600 focus:outline-none"
            />
          </div>
          <button
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center transition-colors shrink-0"
            style={{ width: '40px' }}
            onClick={() => setSongDropdownOpen(false)}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {songDropdownOpen && songSearchResults.length > 0 && (
          <div
            className="absolute left-2 right-2 top-full z-50 bg-[#12121e] border border-gray-700 rounded-lg overflow-hidden shadow-xl"
            style={{ marginTop: '2px' }}
          >
            {songSearchResults.slice(0, 8).map(song => (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="px-3 py-2 text-xs text-gray-200 hover:bg-[#1e1b4b] cursor-pointer transition-colors border-b border-gray-800/50 last:border-0"
              >
                <span className="font-semibold text-white">{song.title}</span>
                {song.artist && <span className="text-gray-400"> - {song.artist}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Songs label */}
      <div className="px-3 pb-2 shrink-0">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Songs</span>
      </div>

      {/* Scrollable song lists */}
      <div className="flex flex-col flex-1 overflow-y-auto min-h-0 px-3 gap-3 pb-3 custom-scrollbar">
        {/* Current Song */}
        <div className="rounded-lg border border-gray-700 overflow-hidden shrink-0">
          <div className="px-3 py-1.5 border-b border-gray-800">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
              Current Song
            </span>
          </div>
          <div className="px-3 py-3 min-h-[52px] flex items-center">
            {currentSongData ? (
              <div
                className="w-full bg-[#4c1d95]/60 border border-purple-800/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-[#5b21b6]/60 transition-colors"
                onClick={() => handleSelectSong(currentSongData)}
                title="Click to reload song"
              >
                <span className="text-xs text-white font-semibold">
                  {currentSongData.title}
                  {currentSongData.artist ? ` - ${currentSongData.artist}` : ''}
                </span>
              </div>
            ) : (
              <p className="text-[11px] italic text-gray-500">Search a song to display lyrics</p>
            )}
          </div>
        </div>

        {/* All Songs */}
        <div className="rounded-lg border border-gray-700 overflow-hidden flex flex-col" style={{ minHeight: '180px' }}>
          <div className="px-3 py-1.5 border-b border-gray-800 shrink-0">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
              All Songs
            </span>
          </div>
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '260px' }}>
            {allSongs.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px] text-gray-600">No songs in library</p>
              </div>
            ) : (
              allSongs.map(song => (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className={`px-3 py-2.5 border-b border-gray-800/40 cursor-pointer transition-colors ${
                    currentSongData?.id === song.id ? 'bg-[#1a1040]' : 'hover:bg-[#0f0f1c]'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">
                    {song.title}{song.artist ? ` - ${song.artist}` : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Songs */}
        {recentSongs.length > 0 && (
          <div className="rounded-lg border border-gray-700 overflow-hidden flex flex-col shrink-0">
            <div className="px-3 py-1.5 border-b border-gray-800 shrink-0">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#7c3aed' }}>
                Recent Songs
              </span>
            </div>
            <div>
              {recentSongs.map(song => (
                <div
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className={`px-3 py-2.5 border-b border-gray-800/40 cursor-pointer transition-colors ${
                    currentSongData?.id === song.id ? 'bg-[#1a1040]' : 'hover:bg-[#0f0f1c]'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">
                    {song.title}{song.artist ? ` - ${song.artist}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
