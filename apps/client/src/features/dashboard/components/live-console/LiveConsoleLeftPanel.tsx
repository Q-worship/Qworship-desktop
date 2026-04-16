import { BookOpen, Music, X, Mic, MicOff } from "lucide-react";
import qworshipLogo from "@assets/Group 1_1753843572404.png";
import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { InlineBibleBrowser } from "../InlineBibleBrowser";
import { InlineSongBrowser } from "../InlineSongBrowser";
import { useHandsfreeBible } from "../../hooks/useHandsfreeBible";
import { MutableRefObject, useRef, useEffect } from "react";
import { useHFBStore } from "../../hooks/useHFBStore";

interface LeftPanelProps {
  bibleProps: any;
  songProps: any;
  liveWindow: Window | null;
  hfb?: any;
}

export function LiveConsoleLeftPanel({
  bibleProps,
  songProps,
  liveWindow,
  hfb: propsHfb,
}: LeftPanelProps) {
  const store = useLiveConsoleStore();

  // Use centralized HFB from props
  const hfb = propsHfb || {};

  const hfbStore = useHFBStore();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const detectedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [hfbStore.hfbTranscriptLines]);

  // Auto-scroll detections
  useEffect(() => {
    if (detectedEndRef.current) {
      detectedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [hfbStore.hfbDetectedVerses]);

  const handleBibleMode = () => {
    store.setIsBibleMode(true);
    store.setIsSongMode(false);
    store.setLeftPanelTab(null);
  };
  const handleSongMode = () => {
    store.setIsSongMode(true);
    store.setIsBibleMode(false);
    store.setLeftPanelTab(null);
  };

  return (
    <div
      className="flex flex-col bg-[#0a0a12] border-r border-gray-800 shrink-0 overflow-hidden"
      style={{
        width: store.leftPanelTab === "on-screen-bible" ? "640px" : "360px",
      }}
    >
      {/* Default Navigation Buttons (when no panel dominates) */}
      {store.leftPanelTab === null && (
        <div className="px-3 pt-3 pb-2 flex gap-2 shrink-0">
          <button
            onClick={handleBibleMode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#a5b4fc] text-xs font-semibold transition-colors"
            style={
              store.isBibleMode
                ? {
                    background: "#1e1b4b",
                    border: "1px solid rgba(99,102,241,0.8)",
                    boxShadow: "0 0 12px rgba(99,102,241,0.35)",
                  }
                : {
                    background: "#0d1020",
                    border: "1px solid rgba(99,102,241,0.45)",
                    boxShadow: "0 0 8px rgba(99,102,241,0.18)",
                  }
            }
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            Bible
          </button>
          <button
            onClick={() => store.setLeftPanelTab("hfb")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#d4b0f0] text-xs font-semibold transition-colors"
            style={{
              background: "linear-gradient(135deg,#1e0a2e,#150820)",
              border: "1px solid rgba(224,64,251,0.45)",
              boxShadow: "0 0 10px rgba(224,64,251,0.18)",
            }}
          >
            <img
              src={qworshipLogo}
              alt=""
              className="h-4 w-auto shrink-0 object-contain"
            />
            HFB
          </button>
          <button
            onClick={handleSongMode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#7dd3fc] text-xs font-semibold transition-colors"
            style={
              store.isSongMode
                ? {
                    background: "#0c2340",
                    border: "1px solid rgba(56,189,248,0.85)",
                    boxShadow: "0 0 12px rgba(56,189,248,0.35)",
                  }
                : {
                    background: "#0d1020",
                    border: "1px solid rgba(56,189,248,0.4)",
                    boxShadow: "0 0 8px rgba(56,189,248,0.14)",
                  }
            }
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            Songs
          </button>
        </div>
      )}

      {/* Default Tab Area -> Bible OR Songs */}
      {store.leftPanelTab === null && store.isBibleMode && (
        <InlineBibleBrowser {...bibleProps} />
      )}

      {store.leftPanelTab === null && store.isSongMode && (
        <InlineSongBrowser {...songProps} />
      )}

      {store.leftPanelTab === null &&
        !store.isBibleMode &&
        !store.isSongMode && (
          <div className="flex flex-col flex-1 p-4">
            <p className="text-[10px] text-gray-500">
              Select an item to get started
            </p>
            <div className="mt-4 flex-1 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-lg">
              <span className="text-gray-600 text-xs text-center px-4">
                Click Bible or Songs above to load content
              </span>
            </div>
          </div>
        )}

      {/* Hands-Free Bible Panel */}
      {store.leftPanelTab === "hfb" && (
        <div className="flex flex-col h-full bg-[#0a0a12] w-full border-r border-gray-800 shadow-2xl">
          <div className="px-3 py-2 bg-[#0d0d1a] border-b border-gray-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={qworshipLogo}
                alt=""
                className="h-4 w-auto object-contain"
              />
              <span className="text-[11px] font-bold tracking-widest uppercase text-purple-300">
                Hands-Free Bible
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={hfb.toggleMicrophone}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  hfb.isListeningMode
                    ? "bg-red-500/20 text-red-400 border border-red-600/40"
                    : "bg-purple-900/30 text-purple-300 border border-purple-700/40"
                }`}
              >
                {hfb.isListeningMode ? (
                  <MicOff className="w-3 h-3" />
                ) : (
                  <Mic className="w-3 h-3" />
                )}
                {hfb.isListeningMode ? "Stop" : "Listen"}
              </button>
              <button
                onClick={() => {
                  hfb.toggleHandsfreeBible();
                  store.setLeftPanelTab(null);
                }}
                className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded"
                title="Exit Hands-Free Bible"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mode-switch nav — lets user exit HFB or switch to Bible/Song without losing toolbar */}
          <div className="px-3 py-1.5 bg-[#08080f] border-b border-gray-800/60 shrink-0 flex items-center gap-1">
            <button
              onClick={handleBibleMode}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <BookOpen className="w-2.5 h-2.5" />
              Bible
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-purple-900/40 text-purple-300 border border-purple-700/50 transition-all"
            >
              <Mic className="w-2.5 h-2.5" />
              HFB
            </button>
            <button
              onClick={handleSongMode}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <Music className="w-2.5 h-2.5" />
              Song
            </button>
          </div>

          {/* LIVE TRANSCRIPT */}
          <div className="flex flex-col border-b border-gray-800/60 shrink-0" style={{ height: '150px' }}>
            <div className="px-3 py-1.5 shrink-0 bg-[#080810] border-b border-gray-800/40 flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest uppercase text-gray-600">Live Transcript</span>
              {hfb.isListeningMode && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[8px] text-red-400 font-semibold">WEB</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bible-nav-scroll">
              {hfbStore.hfbTranscriptLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center">
                  <MicOff className="w-4 h-4 text-gray-700" />
                  <p className="text-[9px] text-gray-700 italic">
                    {hfb.isListeningMode ? 'Listening...' : 'Press Listen to begin'}
                  </p>
                </div>
              ) : (
                hfbStore.hfbTranscriptLines.map((line, idx) => {
                  const isLatest = idx === hfbStore.hfbTranscriptLines.length - 1;
                  const looksLikeRef = /\b\d+:\d+|\bchapter\b|\bverse\b/i.test(line.text);
                  return (
                    <div key={line.id} className={`flex gap-1.5 items-start ${isLatest ? 'pl-1.5 border-l-2 border-cyan-500/50 -ml-0.5' : ''}`}>
                      <span className="text-[8px] text-gray-700 shrink-0 mt-0.5 whitespace-nowrap">{line.ts}</span>
                      <span className={`text-[10px] leading-snug ${
                        isLatest
                          ? 'text-white/90 font-medium'
                          : looksLikeRef
                            ? 'text-purple-400 italic'
                            : 'text-gray-400'
                      }`}>
                        {line.text}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* DETECTED VERSES */}
          <div
            className="flex flex-col border-b border-gray-800/60"
            style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
          >
            <div className="px-3 py-1.5 shrink-0 bg-[#080810] border-b border-gray-800/40 flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest uppercase text-gray-600">
                Detected Verses
                {hfbStore.hfbDetectedVerses.length > 0
                  ? ` (${hfbStore.hfbDetectedVerses.length})`
                  : ""}
              </span>
              {hfbStore.hfbDetectedVerses.length > 0 && (
                <button
                  onClick={() => {
                    hfbStore.setHfbDetectedVerses([]);
                    hfbStore.setHfbCurrentProjected(null);
                  }}
                  className="text-[8px] text-gray-700 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bible-nav-scroll px-2 py-1.5 space-y-1">
              {hfbStore.hfbDetectedVerses.length === 0 ? (
                <p className="text-[10px] text-gray-700 italic px-1">
                  No verses detected yet
                </p>
              ) : (
                [...hfbStore.hfbDetectedVerses].reverse().map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      // Fire projection and update store
                      if (liveWindow) {
                        liveWindow.postMessage(
                          {
                            type: "BIBLE_VERSE_DISPLAY",
                            data: {
                              book: v.book,
                              chapter: v.chapter,
                              verse: v.verseNum,
                              text: v.verseText,
                              version: v.version,
                              reference: v.reference,
                            },
                          },
                          "*",
                        );
                      }
                      hfbStore.setHfbCurrentProjected({
                        reference: v.reference,
                        text: v.verseText,
                        version: v.version,
                      });
                      hfbStore.setHfbDetectedVerses((prev) =>
                        prev.map((d) => ({ ...d, isActive: d.id === v.id })),
                      );
                      hfbStore.fetchHFBChapter(
                        v.book,
                        v.chapter,
                        v.version,
                        v.verseNum,
                      );
                    }}
                    className={`px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                      v.isActive
                        ? "bg-cyan-950/40 border border-cyan-800/50"
                        : "bg-[#0d0d1a] border border-gray-800/50 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-[11px] font-bold ${v.isActive ? "text-cyan-300" : "text-purple-300"}`}
                      >
                        {v.reference}
                      </span>
                      <span
                        className={`text-[8px] font-semibold ${v.isActive ? "text-cyan-600" : "text-gray-700"}`}
                      >
                        {v.version}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">
                      {v.verseText}
                    </p>
                    {v.isActive && (
                      <div className="mt-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                        <span className="text-[8px] text-cyan-600 font-semibold uppercase tracking-wider">
                          Live
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={detectedEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Detailed On-Screen Bible Panel Toggle */}
      {store.leftPanelTab === "on-screen-bible" && (
        <div className="flex flex-col h-full bg-[#0a0a12] w-full border-r border-gray-800 shadow-2xl">
          {/* Nav buttons — always accessible even when Bible panel is open */}
          <div className="px-3 pt-3 pb-2 flex gap-2 shrink-0 bg-[#0d0d1a]">
            <button
              onClick={() => store.setLeftPanelTab(null)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#a5b4fc] text-xs font-semibold transition-colors"
              style={{
                background: "#0d1020",
                border: "1px solid rgba(99,102,241,0.45)",
                boxShadow: "0 0 8px rgba(99,102,241,0.18)",
              }}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              Bible
            </button>
            <button
              onClick={() => store.setLeftPanelTab("hfb")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#d4b0f0] text-xs font-semibold transition-colors"
              style={{
                background: "linear-gradient(135deg,#1e0a2e,#150820)",
                border: "1px solid rgba(224,64,251,0.45)",
                boxShadow: "0 0 10px rgba(224,64,251,0.18)",
              }}
            >
              <img
                src={qworshipLogo}
                alt=""
                className="h-4 w-auto shrink-0 object-contain"
              />
              Bible
            </button>
            <button
              onClick={handleSongMode}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[#7dd3fc] text-xs font-semibold transition-colors"
              style={
                store.isSongMode
                  ? {
                      background: "#0c2340",
                      border: "1px solid rgba(56,189,248,0.85)",
                      boxShadow: "0 0 12px rgba(56,189,248,0.35)",
                    }
                  : {
                      background: "#0d1020",
                      border: "1px solid rgba(56,189,248,0.4)",
                      boxShadow: "0 0 8px rgba(56,189,248,0.14)",
                    }
              }
            >
              <Music className="w-3.5 h-3.5 shrink-0" />
              Songs
            </button>
            <button
              onClick={() => store.setLeftPanelTab(null)}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1.5 rounded shrink-0"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <InlineBibleBrowser {...bibleProps} />
          </div>
        </div>
      )}
    </div>
  );
}
