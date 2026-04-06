import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { ChevronRight, ChevronLeft, Maximize } from "lucide-react";
import { useHFBStore } from "../../hooks/useHFBStore";

interface BottomStripProps {
  slides?: any[];
  currentSlide?: number;
  totalSlides?: number;
  onGoToSlide?: (idx: number) => void;
  onOpenSlides?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
}

export function LiveConsoleBottomStrip({
  slides = [],
  currentSlide = 0,
  totalSlides = 1,
  onGoToSlide,
  onOpenSlides,
  onPrevSlide,
  onNextSlide,
  liveWindow
}: BottomStripProps & { liveWindow?: Window | null }) {
  const store = useLiveConsoleStore();
  const hfbStore = useHFBStore();

  // Replit logic primarily showed a tape of slides in the bottom strip
  return store.leftPanelTab === 'hfb' ? (
    <div className="shrink-0 border-t border-gray-800 flex flex-col overflow-hidden" style={{ height: '90px', background: '#080810' }}>
      <div className="flex items-center justify-between px-4 py-1.5 shrink-0 border-b border-gray-800/50">
        <span className="text-[9px] font-bold tracking-widest uppercase text-gray-600">Recent Detections</span>
        <span className="text-[8px] text-gray-700">{hfbStore.hfbDetectedVerses.length} verse{hfbStore.hfbDetectedVerses.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="flex items-center h-full gap-2 px-4 pb-2">
          {hfbStore.hfbDetectedVerses.length === 0 ? (
            <p className="text-[10px] text-gray-800 italic whitespace-nowrap mt-3">No verses detected yet — speak a Bible reference to begin</p>
          ) : (
            [...hfbStore.hfbDetectedVerses].reverse().map(v => (
              <div
                key={v.id}
                onClick={() => {
                  if (liveWindow) {
                    liveWindow.postMessage({
                      type: "BIBLE_VERSE_DISPLAY",
                      data: { book: v.book, chapter: v.chapter, verse: v.verseNum, text: v.verseText, version: v.version, reference: v.reference }
                    }, window.location.origin);
                  }
                  hfbStore.setHfbCurrentProjected({ reference: v.reference, text: v.verseText, version: v.version });
                  hfbStore.setHfbDetectedVerses(prev => prev.map(d => ({ ...d, isActive: d.id === v.id })));
                  hfbStore.setHfbActiveVerseNum(v.verseNum);
                  hfbStore.fetchHFBChapter(v.book, v.chapter, v.version, v.verseNum);
                }}
                className={`shrink-0 px-3 py-1.5 mt-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
                  v.isActive
                    ? 'bg-cyan-950/50 border border-cyan-700/60'
                    : 'bg-[#0d0d1a] border border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold whitespace-nowrap ${v.isActive ? 'text-cyan-300' : 'text-purple-300'}`}>{v.reference}</span>
                  <span className={`text-[8px] ${v.isActive ? 'text-cyan-700' : 'text-gray-700'}`}>{v.version}</span>
                </div>
                {v.isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="shrink-0 border-t border-gray-800 flex flex-col overflow-hidden" style={{ height: '230px', background: '#0a0a12' }}>
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#0d0d1a]">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300">
          <button 
            onClick={onPrevSlide}
            disabled={currentSlide <= 0}
            className="text-indigo-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Slide {Math.max(1, currentSlide)} of {Math.max(1, slides.length || totalSlides)}
          </span>
          <button 
            onClick={onNextSlide}
            disabled={currentSlide >= (slides.length || totalSlides)}
            className="text-indigo-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={onOpenSlides}
          className="text-gray-400 hover:text-white transition-colors"
          title="Fullscreen Track"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-5 py-4 flex gap-4 min-w-0 slide-track-scroll items-center">
        {slides.length === 0 ? (
          <div className="text-gray-600 text-sm italic w-full text-center">No active slides projected</div>
        ) : (
          slides.map((slide, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div 
                key={idx}
                onClick={() => onGoToSlide?.(idx)}
                className={`w-48 aspect-video rounded-lg flex-shrink-0 cursor-pointer overflow-hidden border-2 transition-all group relative ${
                  isActive
                    ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-2 ring-indigo-500/50 scale-[1.02]'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
                style={{
                  backgroundColor: store.appliedBackgroundType === 'color' ? store.appliedBackgroundColor : 'black',
                  backgroundImage: store.appliedBackgroundType === 'image' && store.appliedBackgroundImage ? `url(${store.appliedBackgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                {/* Text */}
                <div className="absolute inset-0 flex items-center justify-center p-3 text-center pointer-events-none">
                  {slide.type === 'image' ? (
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Image Slide</span>
                  ) : slide.type === 'video' ? (
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Video Slide</span>
                  ) : (
                    <span className="text-white text-[11px] font-bold leading-tight line-clamp-4 font-serif text-shadow-lg">
                      {slide.content?.text || slide.content}
                    </span>
                  )}
                </div>
                {/* Index Ribbon */}
                <div className={`absolute top-0 left-0 px-2 py-0.5 rounded-br text-[9px] font-bold z-10 ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-gray-300'
                }`}>
                  {idx + 1}
                </div>
              </div>
            )
          })
        )}
        {slides.length > 0 && <div className="w-4 shrink-0" />} {/* Right Padding */}
      </div>
    </div>
  );
}
