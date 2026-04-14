import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { ChevronRight, Music, Timer, Mic } from "lucide-react";
import { useEffect, useRef } from "react";
import { useHFBStore } from "../../hooks/useHFBStore";

interface CenterStageProps {
  bibleProps: any;
  songProps: any;
  pacingProps: any;
  onClearProjection: () => void;
}

export function LiveConsoleCenterStage({ bibleProps, songProps, pacingProps, onClearProjection, liveWindow }: CenterStageProps & { liveWindow?: Window | null }) {
  const store = useLiveConsoleStore();
  const hfbStore = useHFBStore();
  const bibleActiveVerseRef = useRef<HTMLDivElement>(null);
  const hfbActiveVerseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active verse
  useEffect(() => {
    if (bibleActiveVerseRef.current && bibleProps.bibleVerseIndex >= 0) {
      bibleActiveVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [bibleProps.bibleVerseIndex]);

  const handleClearBibleProjection = () => {
    onClearProjection();
  };

  const handleClearSongProjection = () => {
    onClearProjection();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {store.isBibleMode && store.leftPanelTab === null ? (
        /* ── BIBLE STAGE: breadcrumbs + translations + 2-col verse grid ── */
        <div className="flex-1 flex flex-col overflow-hidden bg-[#08080f]">
          {/* Header row: breadcrumbs + version tabs + clear button */}
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-gray-800 bg-[#0d0d1a]">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 mb-2 text-gray-400 text-[11px]">
              <span className="text-gray-500">On-screen Bible</span>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-purple-300 font-semibold">{bibleProps.BIBLE_BOOKS[bibleProps.bibleBookIndex]?.name || 'Book'}</span>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-gray-300">Chapter {bibleProps.bibleChapterNum}</span>
              {bibleProps.biblePassage && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-400">Verse {bibleProps.biblePassage.verses[bibleProps.bibleVerseIndex]?.number ?? 1}</span>
                </>
              )}
              <span className="ml-auto text-gray-600 text-[10px]">{bibleProps.selBibleVersion}</span>
              <button
                onClick={handleClearBibleProjection}
                className="ml-2 text-[10px] text-red-500 hover:text-red-400 transition-colors"
              >
                Clear screen
              </button>
            </div>
            {/* Translation tabs — equal-width, full-row */}
            <div className="flex items-center gap-1.5">
              {bibleProps.BIBLE_VERSIONS.map((v: string) => (
                <button
                  key={v}
                  onClick={() => bibleProps.handleVersionChange(v)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all duration-150 tracking-wide ${
                    bibleProps.selBibleVersion === v
                      ? 'text-white'
                      : 'text-white hover:brightness-110'
                  }`}
                  style={bibleProps.selBibleVersion === v
                    ? { background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }
                    : { background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Verse list — 2-column grid */}
          <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
            {bibleProps.bibleIsLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading verses…</div>
            ) : !bibleProps.biblePassage || bibleProps.biblePassage.verses.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
                {bibleProps.bibleSearchError ?? 'Select a chapter to view verses'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {bibleProps.biblePassage.verses.map((verse: any, idx: number) => {
                  const isActive = idx === bibleProps.bibleVerseIndex;
                  return (
                    <div
                      key={verse.number}
                      ref={isActive ? bibleActiveVerseRef : undefined}
                      onClick={() => bibleProps.handleVerseClick(idx)}
                      className={`flex gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors group ${
                        isActive
                          ? 'bg-[#1e1540] ring-1 ring-[#4c1d95]/60'
                          : 'hover:bg-[#0f0f1e]'
                      }`}
                    >
                      <span className={`shrink-0 text-[11px] font-bold mt-0.5 w-4 text-right select-none ${isActive ? 'text-[#a78bfa]' : 'text-gray-600 group-hover:text-gray-400'}`}>
                        {verse.number}
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isActive ? 'text-[#c4b5fd] font-medium' : 'text-gray-300 group-hover:text-white'}`}>
                        {verse.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: passage info */}
          {bibleProps.biblePassage && (
            <div className="shrink-0 px-4 py-1.5 border-t border-gray-800 bg-[#0d0d1a] flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                {bibleProps.biblePassage.book} {bibleProps.biblePassage.chapter} &bull; {bibleProps.biblePassage.verses.length} verses &bull; {bibleProps.selBibleVersion}
              </span>
              <span className="ml-auto text-[10px] text-gray-600">Click any verse to project it live</span>
            </div>
          )}
        </div>
      ) : store.isSongMode && store.leftPanelTab === null ? (
        /* ── SONG STAGE: song title + section cards ── */
        <div className="flex-1 flex flex-col overflow-hidden bg-[#08080f]">
          {/* Header row */}
          <div className="shrink-0 px-4 pt-3 pb-3 border-b border-gray-800 bg-[#0d0d1a] flex items-center gap-3">
            {songProps.currentSongData ? (
              <>
                <Music className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-white font-semibold text-sm">{songProps.currentSongData.title}</span>
                {songProps.currentSongData.artist && <span className="text-gray-400 text-xs">— {songProps.currentSongData.artist}</span>}
              </>
            ) : (
              <span className="text-gray-500 text-sm">Select a song from the panel</span>
            )}
            {songProps.currentSongData && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    pacingProps.setIsPacingMode((m: boolean) => {
                      if (m) {
                        pacingProps.resetPacing();
                      }
                      return !m;
                    });
                  }}
                  className={`text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded transition-colors ${
                    pacingProps.isPacingMode
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-600/40'
                      : 'text-gray-500 hover:text-gray-300 border border-gray-700'
                  }`}
                  title="Toggle lyric pacing mode"
                >
                  <Timer size={13} />
                </button>
                <button
                  onClick={handleClearSongProjection}
                  className="text-[10px] text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear screen
                </button>
              </div>
            )}
          </div>

          {/* Pacing controls bar */}
          {songProps.currentSongData && pacingProps.isPacingMode && (
            <div className="shrink-0 px-4 py-2 border-b border-amber-900/20 bg-amber-950/10 flex items-center gap-3">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">Pace Mode</span>
              <label className="text-[10px] text-gray-400">BPM</label>
              <input
                type="number"
                value={pacingProps.pacingBpm}
                onChange={e => pacingProps.setPacingBpm(Math.max(40, Math.min(220, Number(e.target.value) || 80)))}
                className="w-14 text-xs text-white bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-center focus:outline-none focus:border-amber-600"
                min={40} max={220}
              />
              {(() => {
                const sec = songProps.currentSongSections[songProps.activeSongSectionIdx] || songProps.currentSongSections[0];
                if (!sec) return null;
                const lc = Math.max(1, sec.content.split('\n').length);
                const secs = Math.min(30, Math.max(4, (lc * 4 * 60) / pacingProps.pacingBpm)).toFixed(0);
                return <span className="text-[10px] text-gray-500">≈{secs}s / section</span>;
              })()}
              <button
                onClick={() => {
                  const isPlaying = pacingProps.isPacingPlaying;
                  if (!isPlaying) {
                    if (songProps.activeSongSectionIdx < 0 && songProps.currentSongSections.length > 0) {
                      songProps.handleProjectSection(songProps.currentSongSections[0], 0, true);
                    } else if (songProps.activeSongSectionIdx >= 0) {
                      songProps.handleProjectSection(songProps.currentSongSections[songProps.activeSongSectionIdx], songProps.activeSongSectionIdx, true);
                    }
                  } else {
                    if (songProps.activeSongSectionIdx >= 0) {
                      songProps.handleProjectSection(songProps.currentSongSections[songProps.activeSongSectionIdx], songProps.activeSongSectionIdx, false);
                    }
                  }
                  pacingProps.setIsPacingPlaying(!isPlaying);
                }}
                className={`ml-auto flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  pacingProps.isPacingPlaying
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-600/40 hover:bg-amber-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                {pacingProps.isPacingPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>
          )}

          {/* Song sections */}
          {songProps.currentSongData && songProps.currentSongSections.length > 0 ? (
            <div className="flex-1 overflow-y-auto py-3 px-4 custom-scrollbar">
              {songProps.currentSongSections.map((section: any, idx: number) => {
                const isActive = idx === songProps.activeSongSectionIdx;
                const sectionLines = section.content.split('\n');
                return (
                  <div
                    key={idx}
                    onClick={() => songProps.handleProjectSection(section, idx)}
                    className={`mb-3 rounded-lg border cursor-pointer transition-all select-none overflow-hidden ${
                      isActive
                        ? 'bg-[#1e1540] border-purple-700/50 ring-1 ring-purple-600/30'
                        : 'border-gray-800/60 hover:border-gray-700 hover:bg-[#0f0f1e]'
                    }`}
                  >
                    <div style={{ padding: '14px 16px 12px 16px' }}>
                      <div className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
                        {section.title}
                      </div>
                      {/* Line-by-line rendering with amber highlight when pacing is active */}
                      {isActive && pacingProps.isPacingMode ? (
                        <div className="text-sm leading-relaxed">
                          {sectionLines.map((line: string, lineIdx: number) => (
                            <div
                              key={lineIdx}
                              style={{
                                color: line.trim() === ''
                                  ? 'transparent'
                                  : lineIdx <= pacingProps.activePacingLineIdx
                                    ? '#fbbf24'
                                    : '#a78bfa',
                                minHeight: '1.4em',
                              }}
                            >
                              {line || '\u00A0'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-sm leading-relaxed whitespace-pre-line ${isActive ? 'text-purple-300' : 'text-white'}`}>
                          {section.content}
                        </div>
                      )}
                    </div>
                    {/* Progress bar at bottom of active section when pacing */}
                    {isActive && pacingProps.isPacingMode && (
                      <div className="h-[3px] w-full bg-gray-800/60">
                        <div
                          style={{
                            width: `${pacingProps.pacingProgress}%`,
                            height: '100%',
                            backgroundColor: '#fbbf24',
                            transition: 'width 0.1s linear',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div
                className="w-full flex items-center justify-center"
                style={{ maxWidth: '680px', aspectRatio: '16/9', border: '2px dashed #4c3d8f', borderRadius: '8px' }}
              >
                <span className="text-gray-500 text-sm italic">Your song lyrics will appear here</span>
              </div>
            </div>
          )}
        </div>
      ) : store.leftPanelTab === 'hfb' ? (
        /* ── HFB CENTER STAGE: Breadcrumbs + Translation Tabs + 2-Column Verses ── */
        <div className="flex-1 flex flex-col overflow-hidden bg-[#08080f]">
          {/* Version tabs + breadcrumb header */}
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-gray-800 bg-[#0d0d1a]">
            <div className="flex items-center gap-1 mb-2 text-[11px]">
              <span className="text-gray-600">Hands-Free Bible</span>
              <ChevronRight className="w-3 h-3 text-gray-700" />
              <span className="text-purple-300 font-semibold">{hfbStore.hfbBookName || '—'}</span>
              {hfbStore.hfbChapter > 0 && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-700" />
                  <span className="text-gray-400">Chapter {hfbStore.hfbChapter}</span>
                </>
              )}
              {hfbStore.hfbActiveVerseNum !== null && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-700" />
                  <span className="text-gray-500">Verse {hfbStore.hfbActiveVerseNum}</span>
                </>
              )}
              {hfbStore.hfbCurrentProjected && (
                <button
                  onClick={() => {
                    hfbStore.setHfbCurrentProjected(null);
                    onClearProjection();
                  }}
                  className="ml-auto text-[10px] text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear screen
                </button>
              )}
            </div>
            {/* Version tabs */}
            <div className="flex items-center gap-1.5">
              {['KJV','NKJV','NIV','MSG','ESV','AMP'].map(v => (
                <button
                  key={v}
                  onClick={() => {
                     hfbStore.setHfbVersion(v);
                     if (hfbStore.hfbBookName && hfbStore.hfbChapter) {
                        hfbStore.fetchHFBChapter(hfbStore.hfbBookName, hfbStore.hfbChapter, v, hfbStore.hfbActiveVerseNum ?? undefined).then(() => {
                           const state = useHFBStore.getState();
                           const activeNum = state.hfbActiveVerseNum;
                           if (activeNum !== null && liveWindow) {
                              const activeVerse = state.hfbChapterVerses.find((verse) => verse.number === activeNum);
                              if (activeVerse) {
                                 const ref = `${state.hfbBookName} ${state.hfbChapter}:${activeVerse.number}`;
                                 state.setHfbCurrentProjected({ reference: ref, text: activeVerse.text, version: v });
                                 liveWindow.postMessage({
                                   type: "BIBLE_VERSE_DISPLAY",
                                   data: { 
                                      book: state.hfbBookName, 
                                      chapter: state.hfbChapter, 
                                      verse: activeVerse.number, 
                                      text: activeVerse.text, 
                                      version: v, 
                                      reference: ref 
                                   }
                                 }, "*");
                              }
                           }
                        });
                     }
                  }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all tracking-wide ${
                    hfbStore.hfbVersion === v ? 'text-white' : 'text-gray-300 hover:brightness-110'
                  }`}
                  style={hfbStore.hfbVersion === v
                    ? { background: '#0e7490', boxShadow: '0 0 8px rgba(14,116,144,0.5)' }
                    : { background: '#0d1020', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Verse list */}
          <div className="flex-1 overflow-y-auto py-2 px-3 bible-nav-scroll">
            {hfbStore.hfbChapterLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>
            ) : !hfbStore.hfbBookName || hfbStore.hfbChapterVerses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-xl px-10 py-8"
                  style={{
                    border: '2px dashed rgba(8,145,178,0.25)',
                    background: 'rgba(8,145,178,0.04)',
                    width: '220px',
                  }}
                >
                  <Mic className="w-8 h-8" style={{ color: 'rgba(8,145,178,0.45)' }} />
                  <p className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(8,145,178,0.7)' }}>
                    Say a Bible reference<br />to load a chapter
                  </p>
                </div>
                <p className="text-gray-700 text-[10px] italic">"John 3" · "Romans 8:28" · "Psalms 23"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 align-start h-max">
                {hfbStore.hfbChapterVerses.map((verse) => {
                  const isActive = verse.number === hfbStore.hfbActiveVerseNum;
                  return (
                    <div
                      key={verse.number}
                      ref={isActive ? hfbActiveVerseRef : null}
                      onClick={() => {
                        const ref = `${hfbStore.hfbBookName} ${hfbStore.hfbChapter}:${verse.number}`;
                        hfbStore.setHfbActiveVerseNum(verse.number);
                        hfbStore.setHfbCurrentProjected({ reference: ref, text: verse.text, version: hfbStore.hfbVersion });
                        hfbStore.setHfbDetectedVerses(prev => prev.map(d => ({ ...d, isActive: false })));
                        
                        if (liveWindow) {
                           liveWindow.postMessage({
                             type: "BIBLE_VERSE_DISPLAY",
                             data: { 
                                book: hfbStore.hfbBookName, 
                                chapter: hfbStore.hfbChapter, 
                                verse: verse.number, 
                                text: verse.text, 
                                version: hfbStore.hfbVersion, 
                                reference: ref 
                             }
                           }, "*");
                        }
                      }}
                      className={`flex gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors group ${
                        isActive ? 'bg-[#082830] ring-1 ring-cyan-800/50' : 'hover:bg-[#0f0f1e]'
                      }`}
                    >
                      <span className={`shrink-0 text-[11px] font-bold mt-0.5 w-4 text-right select-none ${isActive ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                        {verse.number}
                      </span>
                      <span className={`text-[11px] leading-relaxed ${isActive ? 'text-cyan-200 font-medium' : 'text-gray-300 group-hover:text-white'}`}>
                        {verse.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {hfbStore.hfbBookName && hfbStore.hfbChapterVerses.length > 0 && (
            <div className="shrink-0 px-4 py-1.5 border-t border-gray-800 bg-[#0d0d1a] flex items-center gap-2">
              <span className="text-[10px] text-gray-600">
                {hfbStore.hfbBookName} {hfbStore.hfbChapter} &bull; {hfbStore.hfbChapterVerses.length} verses &bull; {hfbStore.hfbVersion}
              </span>
              <span className="ml-auto text-[10px] text-gray-700">Click any verse to project</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center overflow-auto p-6">
          {store.leftPanelTab === null ? (
            /* Default empty state: large dashed-border rectangle */
            <div
              className="w-full"
              style={{
                maxWidth: '680px',
                aspectRatio: '16/9',
                border: '2px dashed #4c3d8f',
                borderRadius: '8px',
              }}
            />
          ) : (
            /* Default fallback active panel */
            <div className="text-center text-gray-600">
               <p className="text-xs text-yellow-600">Panel Active: {store.leftPanelTab}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
