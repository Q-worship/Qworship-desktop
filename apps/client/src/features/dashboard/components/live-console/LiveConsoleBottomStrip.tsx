import { useLiveConsoleStore } from "../../hooks/useLiveConsoleStore";
import { ChevronRight, ChevronLeft, Maximize } from "lucide-react";
import { useHFBStore } from "../../hooks/useHFBStore";

import { useMemo } from "react";

interface BottomStripProps {
  slides?: any[];
  currentSlide?: number;
  totalSlides?: number;
  serviceItems?: any[];
  onGoToSlide?: (idx: number) => void;
  onOpenSlides?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
}

// Distinct colors for service item grouping in slide strip
const ITEM_COLORS = [
  '#7c3aed', '#0ea5e9', '#16a34a', '#dc2626', '#d97706',
  '#0891b2', '#7c2d12', '#1d4ed8', '#be185d', '#065f46',
];

function getItemColor(index: number): string {
  return ITEM_COLORS[index % ITEM_COLORS.length];
}

const SECTION_LABELS: Record<string, string> = {
  'pre-service': 'Pre-service Items',
  'warm-up': 'Warm-up',
  'service': 'Service Item',
  'post-service': 'Post Service Loop',
};

function getSectionLabel(item: any): string {
  if (item.section && SECTION_LABELS[item.section]) {
    return SECTION_LABELS[item.section];
  }
  if (item.section) {
    return item.section.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  return item.title || 'Item';
}

export function LiveConsoleBottomStrip({
  slides = [],
  currentSlide = 0,
  totalSlides = 1,
  serviceItems = [],
  onGoToSlide,
  onOpenSlides,
  onPrevSlide,
  onNextSlide,
  liveWindow
}: BottomStripProps & { liveWindow?: Window | null }) {
  const store = useLiveConsoleStore();
  const hfbStore = useHFBStore();

  const itemColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIdx = 0;
    for (const slide of slides) {
      if (slide.itemId && !(slide.itemId in map)) {
        map[slide.itemId] = getItemColor(colorIdx++);
      }
    }
    return map;
  }, [slides]);

  const itemLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of serviceItems) {
      map[item.id] = getSectionLabel(item);
    }
    return map;
  }, [serviceItems]);

  const slideGroups = useMemo(() => {
    type SlideGroup = { itemId: string | null; color: string; label: string; slides: { slide: any; globalIndex: number }[] };
    const groups: SlideGroup[] = [];
    const seenItems = new Map<string | null, number>();
    slides.forEach((slide, i) => {
      const key = slide.itemId || null;
      if (!seenItems.has(key)) {
        seenItems.set(key, groups.length);
        const color = key ? (itemColorMap[key] || '#7c3aed') : '#7c3aed';
        const label = key ? (itemLabelMap[key] || 'Item') : 'Slides';
        groups.push({ itemId: key, color, label, slides: [] });
      }
      groups[seenItems.get(key)!].slides.push({ slide, globalIndex: i });
    });
    return groups;
  }, [slides, itemColorMap, itemLabelMap]);

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

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-1 py-1 flex min-w-0 slide-track-scroll items-center gap-0">
        {slides.length === 0 ? (
          <div className="text-gray-600 text-sm italic w-full text-center">No active slides projected</div>
        ) : (
          slideGroups.map((group, groupIndex) => {
            return (
              <div key={group.itemId || groupIndex} className="flex flex-col shrink-0 h-full relative" style={{ borderRight: `1px solid rgba(255,255,255,0.04)` }}>
                {group.itemId && (
                  <div className="absolute bottom-0 h-[3px] w-full" style={{ backgroundColor: group.color }} />
                )}
                <div className="flex gap-3 px-3 pt-4 pb-4 flex-1 items-center">
                  {group.slides.map(({ slide, globalIndex: idx }) => {
                    const isActive = currentSlide === idx + 1;
                    const slideLabel = slide.sectionLabel || slide.reference || slide.songTitle || slide.title || '';
                    return (
                      <div className="flex flex-col shrink-0" key={idx}>
                        <div
                          className="text-[9px] font-bold tracking-wider uppercase truncate mb-1.5 px-0.5"
                          style={{ color: isActive ? group.color : '#9ca3af' }}
                        >
                          {slideLabel || `Slide ${idx + 1}`}
                        </div>
                        <div 
                          onClick={() => onGoToSlide?.(idx + 1)}
                          className={`w-48 aspect-video rounded-lg flex-shrink-0 cursor-pointer overflow-hidden border-2 transition-all group relative ${
                            isActive
                              ? `scale-[1.02]`
                              : 'border-gray-800 hover:border-gray-600'
                          }`}
                          style={{
                            borderColor: isActive ? group.color : undefined,
                            boxShadow: isActive ? `0 0 15px ${group.color}4D` : undefined,
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
                                {typeof slide.content === 'string' ? slide.content : (slide.content?.text || slide.content?.lyrics || slide.title || '')}
                              </span>
                            )}
                          </div>
                          {/* Index Ribbon */}
                          <div className={`absolute top-0 left-0 px-2 py-0.5 rounded-br text-[9px] font-bold z-10 flex gap-1 items-center`} style={{ backgroundColor: isActive ? group.color : '#1f2937', color: isActive ? '#fff' : '#9ca3af' }}>
                            {idx + 1}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })
        )}
        {slides.length > 0 && <div className="w-4 shrink-0" />} {/* Right Padding */}
      </div>
    </div>
  );
}
