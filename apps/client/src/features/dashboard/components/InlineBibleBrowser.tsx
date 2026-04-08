import { Search } from 'lucide-react';
import type { useInlineBibleBrowser } from '../hooks/useInlineBibleBrowser';

type BibleBrowserProps = ReturnType<typeof useInlineBibleBrowser>;

export function InlineBibleBrowser({
  BIBLE_BOOKS,
  bibleBookIndex,
  bibleChapterNum,
  bibleVerseIndex,
  biblePassage,
  bibleIsLoading,
  bibleSearch,
  setBibleSearch,
  bibleSearchError,
  bibleBookListRef,
  bibleChapterListRef,
  bibleVerseListRef,
  handleBookSelect,
  handleChapterSelect,
  handleVerseClick,
  handleBibleSearch,
}: BibleBrowserProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Search bar */}
      <div className="px-2 pt-4 pb-4 shrink-0">
        <div className="flex gap-0 rounded-lg overflow-hidden border border-[#2d2d4a] focus-within:border-[#6366f1]">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter Reference: John 3:16"
              value={bibleSearch}
              onChange={e => setBibleSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleBibleSearch(); }}
              className="w-full pl-8 pr-2 py-2.5 bg-[#0d0d1a] text-white text-xs placeholder-gray-600 focus:outline-none"
            />
          </div>
          <button
            onClick={handleBibleSearch}
            disabled={bibleIsLoading}
            className="bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0"
            style={{ width: '40px' }}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {bibleSearchError && (
          <p className="text-red-400 text-[10px] mt-1">{bibleSearchError}</p>
        )}
      </div>

      {/* 3-column navigator */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0 border-t border-gray-800">
        {/* Column headers */}
        <div className="flex shrink-0 bg-[#0a0a12] border-b border-gray-800">
          <div className="flex-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase px-3 py-2">BOOK</div>
          <div className="shrink-0 text-[10px] font-bold tracking-widest text-gray-500 uppercase text-center py-2 border-l border-gray-800" style={{ width: '66px' }}>CHAP</div>
          <div className="shrink-0 text-[10px] font-bold tracking-widest text-gray-500 uppercase text-center py-2 border-l border-gray-800" style={{ width: '58px' }}>VRS</div>
        </div>

        {/* 3 scrollable columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* BOOK */}
          <div ref={bibleBookListRef} className="flex-1 overflow-y-auto min-w-0 custom-scrollbar">
            {BIBLE_BOOKS.map((book, idx) => (
              <div
                key={book.name}
                onClick={() => handleBookSelect(idx)}
                className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  bibleBookIndex === idx
                    ? 'bg-[#4c1d95] text-white font-semibold'
                    : 'text-gray-300 hover:bg-[#1a1a2e] hover:text-white'
                }`}
              >
                {book.name}
              </div>
            ))}
          </div>

          {/* CHAPTER */}
          <div
            ref={bibleChapterListRef}
            className="shrink-0 overflow-y-auto border-l border-gray-800 custom-scrollbar"
            style={{ width: '66px' }}
          >
            {Array.from({ length: BIBLE_BOOKS[bibleBookIndex].chapters }, (_, i) => i + 1).map(ch => (
              <div
                key={ch}
                onClick={() => handleChapterSelect(ch)}
                className={`text-center py-1.5 text-xs cursor-pointer transition-colors ${
                  bibleChapterNum === ch
                    ? 'bg-[#4c1d95] text-white font-semibold'
                    : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                }`}
              >
                {ch}
              </div>
            ))}
          </div>

          {/* VERSE */}
          <div
            ref={bibleVerseListRef}
            className="shrink-0 overflow-y-auto border-l border-gray-800 custom-scrollbar"
            style={{ width: '58px' }}
          >
            {bibleIsLoading ? (
              <div className="text-gray-600 text-center py-2 text-[10px]">…</div>
            ) : (
              (biblePassage?.verses ?? []).map((v, idx) => (
                <div
                  key={v.number}
                  onClick={() => handleVerseClick(idx)}
                  className={`text-center py-1.5 text-xs cursor-pointer transition-colors ${
                    bibleVerseIndex === idx
                      ? 'bg-[#4c1d95] text-white font-semibold'
                      : 'text-gray-400 hover:bg-[#1a1a2e] hover:text-white'
                  }`}
                >
                  {v.number}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
