import { useState, useEffect, useRef } from "react";
import { isWindowOpen } from "@/utils/windowUtils";
import { LiveConsoleHeader } from "./live-console/LiveConsoleHeader";
import { LiveConsoleLeftPanel } from "./live-console/LiveConsoleLeftPanel";
import { LiveConsoleCenterStage } from "./live-console/LiveConsoleCenterStage";
import { LiveConsoleRightPanel } from "./live-console/LiveConsoleRightPanel";
import { LiveConsoleBottomStrip } from "./live-console/LiveConsoleBottomStrip";
import { LiveConsoleModals } from "./live-console/LiveConsoleModals";
import { useLiveConsoleStore } from "../hooks/useLiveConsoleStore";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useInlineBibleBrowser } from "../hooks/useInlineBibleBrowser";
import { useInlineSongBrowser } from "../hooks/useInlineSongBrowser";
import { usePacingMode } from "../hooks/usePacingMode";
import { useLivePreviewSync } from "../hooks/useLivePreviewSync";
import qworshipLogo from "@assets/Group 1_1753843572404.png";
import { Maximize2, X } from "lucide-react";

export interface LiveConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  liveWindow: Window | null;
  currentSlide: number;
  totalSlides: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onOpenSlides: () => void;
  onOpenBible: () => void;
  onOpenSongs: () => void;
  onOpenBackground: () => void;
  slides: any[];
  itemBackgrounds: Record<string, any>;
  serviceItems: any[];
  onOpenHandsfreeBible?: () => void;
  onOpenOBS?: () => void;
  onOpenSettings?: () => void;
  onGoToSlide?: (slideIndex: number) => void;
  hfb: any;
}

export function LiveControlCentre(props: LiveConsoleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const state = useLiveConsoleStore();
  
  const sendCommand = (type: string, data?: unknown) => {
    if (props.liveWindow && isWindowOpen(props.liveWindow)) {
      props.liveWindow.postMessage({ type, data }, "*");
    }
  };

  useLivePreviewSync({
    ltEnabled: false,
    ltProjectLyric: () => {},
    ltProjectScripture: () => {},
    ltProjectAnnouncement: () => {},
    ltClear: () => {},
    mpEnabled: false,
    mpProjectLyric: () => {},
    mpProjectScripture: () => {},
    mpProjectAnnouncement: () => {},
    mpClear: () => {},
    toast: () => {},
    navigationDebounceRef: useRef(0),
    previewCurrentSlide: props.currentSlide,
    setPreviewSongProjection: state.setPreviewSongProjection,
    setPreviewBibleProjection: state.setPreviewBibleProjection,
    setPreviewProjectionType: state.setPreviewProjectionType,
    setAppliedBackgroundType: state.setAppliedBackgroundType,
    setAppliedBackgroundColor: state.setAppliedBackgroundColor,
    setAppliedBackgroundImage: state.setAppliedBackgroundImage,
    setAppliedBackgroundVideo: state.setAppliedBackgroundVideo,
    setCustomLogo: state.setCustomLogo,
    setLogoSize: state.setLogoSize,
    setLogoPosition: state.setLogoPosition,
    setShowTimestamp: state.setShowTimestamp,
    setTimestampFormat: () => {},
    setShowSlideCounter: () => {},
    setSlideNumberPosition: () => {},
    setShowServiceTitle: state.setShowServiceTitle,
    setCustomServiceTitle: state.setCustomServiceTitle,
    setServiceTitleSize: state.setServiceTitleSize,
    setShowCopyrightInfo: () => {},
    setCopyrightPosition: () => {},
    setShowAuthorInfo: () => {},
    setShowSocialHandles: state.setShowSocialHandles,
    setFacebookHandle: () => {},
    setInstagramHandle: () => {},
    setSocialHandlesColor: () => {},
    setSocialHandlesPosition: () => {},
    setSocialHandlesSize: () => {},
    setSlidesTransparent: () => {},
    setSlideTextSize: () => {},
    setSlideAlignment: () => {},
    setContentFixedArea: () => {},
    setSlideTransition: () => {},
    setAutoAdvanceSlides: () => {},
    setDisplayTheme: () => {},
    setPreviewSlides: () => {},
    setPreviewCurrentSlide: () => {},
    setPreviewSlideBackgrounds: () => {},
    setHasLiveSettingsBackground: state.setHasLiveSettingsBackground
  });

  // Lifted hooks so Center Stage and Left Panel can share them
  const bibleProps = useInlineBibleBrowser({
    onProjectVerse: (ref, text, version, passageData) => {
      sendCommand('PROJECT_BIBLE_VERSE', { reference: ref, text, version });
      
      const verseMatch = typeof text === 'string' ? text.match(/^(\d+)\s+(.+)$/) : null;
      let bookName = ref;
      let chap = 1;
      try {
        const parts = ref.split(':');
        const bookChap = parts[0];
        const lastSpace = bookChap.lastIndexOf(' ');
        if (lastSpace > 0) {
           bookName = bookChap.substring(0, lastSpace);
           chap = parseInt(bookChap.substring(lastSpace + 1));
        }
      } catch (error) {
        console.warn('[LiveControlCentre] Failed to parse projected Bible reference', error);
      }

      useBibleProjectionStore.getState().setVerse({
         book: passageData?.book || bookName,
         chapter: passageData?.chapter || chap,
         verse: parseInt(verseMatch ? verseMatch[1] : '1'),
         [version.toLowerCase()]: verseMatch ? verseMatch[2] : text
      }, ref);
      
      state.setPreviewBibleProjection({ reference: ref, text, version });
      state.setPreviewSongProjection(null);
      state.setPreviewProjectionType('bible');
      state.setActiveMode('bible');
    }
  });

  const songProps = useInlineSongBrowser({
    onProjectSong: (title, sectionTitle, lyrics, fullSongData, pacingLineIdx) => {
      sendCommand('PROJECT_SONG', { title, sectionTitle, lyrics, fullSongData, pacingLineIdx });
      
      state.setPreviewSongProjection({ title, sectionTitle, lyrics });
      state.setPreviewBibleProjection(null);
      state.setPreviewProjectionType('song');
      state.setActiveMode('song');
    }
  });

  const currentSongDataRef = useRef(songProps.currentSongData);
  useEffect(() => { currentSongDataRef.current = songProps.currentSongData; }, [songProps.currentSongData]);

  const handleClearProjection = () => {
    sendCommand('CLEAR_PROJECTION');
    state.setPreviewSongProjection(null);
    state.setPreviewBibleProjection(null);
    state.setPreviewProjectionType(null);
    state.setActiveMode('none');
  };

  const pacingProps = usePacingMode({
    currentSongSections: songProps.currentSongSections,
    activeSongSectionIdx: songProps.activeSongSectionIdx,
    setActiveSongSectionIdx: songProps.setActiveSongSectionIdx,
    liveWindow: props.liveWindow,
    currentSongDataRef,
    onProjectNextSection: (title, sectionTitle, lyrics, fullSongData, pacingLineIdx) => {
      sendCommand('PROJECT_SONG', { title, sectionTitle, lyrics, fullSongData, pacingLineIdx });
      state.setPreviewSongProjection({ title, sectionTitle, lyrics });
      state.setPreviewBibleProjection(null);
      state.setPreviewProjectionType('song');
      state.setActiveMode('song');
    }
  });

  useEffect(() => {
    // Automatically open bible mode on mount, like what the Replit implementation did.
    bibleProps.openBibleMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!props.isOpen) return null;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between px-5 select-none"
        style={{ height: '48px', background: '#0d0d1a', borderTop: '1px solid rgba(124,58,237,0.5)', boxShadow: '0 -4px 24px rgba(124,58,237,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <img src={qworshipLogo} alt="Qworship" className="w-6 h-6 object-contain" />
          <span className="text-purple-300 font-bold text-sm tracking-wide">Qworship Live Console</span>
          {props.liveWindow && isWindowOpen(props.liveWindow) && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-[10px] font-semibold">LIVE</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition-all text-xs font-medium"
            style={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Restore
          </button>
          <button
            onClick={props.onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:text-white transition-all"
            style={{ background: '#1a1a2e' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Full-Screen Console Overlay */}
      <div className="fixed inset-0 z-[100] bg-[#0a0a12] flex flex-col select-none overflow-hidden">
        <LiveConsoleHeader liveWindow={props.liveWindow} onClose={props.onClose} setIsMinimized={setIsMinimized} />

        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <LiveConsoleLeftPanel bibleProps={bibleProps} songProps={songProps} liveWindow={props.liveWindow} hfb={props.hfb} />
          <LiveConsoleCenterStage bibleProps={bibleProps} songProps={songProps} pacingProps={pacingProps} onClearProjection={handleClearProjection} liveWindow={props.liveWindow} />
          <LiveConsoleRightPanel liveWindow={props.liveWindow} />
        </div>

        <LiveConsoleBottomStrip 
           slides={props.slides} 
           currentSlide={props.currentSlide}
           totalSlides={props.totalSlides} 
           serviceItems={props.serviceItems}
           onGoToSlide={props.onGoToSlide} 
           onOpenSlides={props.onOpenSlides} 
           onPrevSlide={props.onPrevSlide}
           onNextSlide={props.onNextSlide}
           liveWindow={props.liveWindow}
        />
      </div>

      <LiveConsoleModals />
    </>
  );
}
