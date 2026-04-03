import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Music,
  BookOpen,
  Image,
  Mic,
  Monitor,
  Palette,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { OBSControlPanel } from "@/features/dashboard/components/OBSControlPanel";
import { OBSStatusBadge } from "@/features/dashboard/components/OBSStatusBadge";
import { SongProjectionWidget } from "@/features/dashboard/components/SongProjectionWidget";
import { BibleProjectionWidget } from "@/features/dashboard/components/BibleProjectionWidget";
import { useLivePreviewSync } from "../hooks/useLivePreviewSync";
import { useModalDragging } from "@/features/dashboard/hooks/useModalDragging";
import { LiveConsolePreview } from "@/features/dashboard/components/LiveConsolePreview";
import { LiveConsoleSettingsModal } from "@/features/dashboard/components/LiveConsoleSettingsModal";
import { AssetsPage } from "@/features/web/pages/AssetsPage";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import {
  useDisplayModeStore,
  DISPLAY_MODE_LABELS,
  type DisplayMode,
  requestDisplayModeSync,
} from "@/stores/useDisplayModeStore";
import qworshipLogo from "@assets/Group 1_1753843572404.png";
import facebookIcon from "@assets/R (2)_1756733484236.png";
import instagramIcon from "@assets/1658586823instagram-logo-transparent_1756733484234.png";

interface LiveConsoleProps {
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
  onOpenOBS: () => void;
  onOpenSettings: () => void;
  onOpenHandsfreeBible: () => void;
  slides?: any[]; // Flattened slides array for display
  serviceItems?: any[]; // Full service items (kept for backward compatibility)
  itemBackgrounds?: Record<string, any>; // Background data for items
  onGoToSlide?: (slideNumber: number) => void;
}

export function LiveConsole({
  isOpen,
  onClose,
  liveWindow,
  currentSlide,
  totalSlides,
  onPrevSlide,
  onNextSlide,
  onOpenHandsfreeBible,
  slides: slidesProp = [],
  serviceItems = [],
  itemBackgrounds: itemBackgroundsProp = {},
  onGoToSlide,
}: LiveConsoleProps) {
  const [, navigate] = useLocation();
  const {
    position,
    modalWidth,
    modalHeight,
    backgroundModalPos,
    obsModalPos,
    settingsModalPos,
    slidesModalPos,
    handleMouseDown,
    handleResizeStart,
    startModalDrag,
  } = useModalDragging();
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal states for separate tool modals (matching Editor view behavior)
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isOBSModalOpen, setIsOBSModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSlideNavOpen, setIsSlideNavOpen] = useState(false);

  // Zustand store subscription for cross-window Bible projection sync (read-only - HFB Editor in parent handles updates)
  const {
    currentVerse,
    formattedReference,
    bibleVersion,
    isProjecting,
    clearProjection: clearZustandProjection,
    lastUpdated,
  } = useBibleProjectionStore();

  // Lower Third store — wires live projections to OBS browser source overlay
  const {
    projectScripture: ltProjectScripture,
    projectLyric: ltProjectLyric,
    clearActiveData: ltClear,
    enabled: ltEnabled,
  } = useLowerThirdStore();

  // Display mode store for unified content display control
  const { activeMode, setMode } = useDisplayModeStore();

  // Request display mode sync from other windows on mount
  useEffect(() => {
    requestDisplayModeSync();
  }, []);

  // Sync Zustand store to preview display when Bible verses change from HFB Editor
  useEffect(() => {
    if (isProjecting && currentVerse && formattedReference) {
      const versionKey = bibleVersion.toLowerCase() as
        | "kjv"
        | "nkjv"
        | "niv"
        | "amp"
        | "gn"
        | "msg"
        | "esv";
      const text = currentVerse[versionKey] || currentVerse.kjv || "";

      console.log(
        "LiveControlCentre: Zustand store updated - updating preview:",
        formattedReference,
      );
      setPreviewBibleProjection({
        reference: formattedReference,
        text: text,
        version: bibleVersion,
      });
      setPreviewSongProjection(null);
      setPreviewProjectionType("bible");
    }
  }, [
    currentVerse,
    formattedReference,
    bibleVersion,
    isProjecting,
    lastUpdated,
  ]);

  // Background state (matching Editor view exactly)
  const [backgroundType, setBackgroundType] = useState<
    "color" | "image" | "video"
  >("color");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [hasLiveSettingsBackground, setHasLiveSettingsBackground] =
    useState(false);
  const [appliedBackgroundType, setAppliedBackgroundType] = useState<
    "color" | "image" | "video"
  >("color");
  const [appliedBackgroundColor, setAppliedBackgroundColor] =
    useState("#000000");
  const [appliedBackgroundImage, setAppliedBackgroundImage] = useState<
    string | null
  >(null);
  const [appliedBackgroundVideo, setAppliedBackgroundVideo] = useState<
    string | null
  >(null);


  // Settings state (matching Editor view exactly)
  const [settingsScreen, setSettingsScreen] = useState<
    "main" | "slide" | "customization" | "display"
  >("main");
  const [slidesTransparent, setSlidesTransparent] = useState(false);
  const [slideTextSize, setSlideTextSize] = useState<
    | "small"
    | "medium"
    | "large"
    | "extra-large"
    | "2x-extra-large"
    | "3x-extra-large"
    | "4x-extra-large"
    | "5x-extra-large"
    | "6x-extra-large"
  >("medium");
  const [slideAlignment, setSlideAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [contentFixedArea, setContentFixedArea] = useState(false);
  const [slideTransition, setSlideTransition] = useState<
    | "none"
    | "fade"
    | "slide"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
    | "zoom"
    | "flipX"
    | "flipY"
    | "dissolve"
    | "wipe"
  >("slide");
  const [autoAdvanceSlides, setAutoAdvanceSlides] = useState(false);
  const [customLogo, setCustomLogo] = useState("");
  const [logoSize, setLogoSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [logoPosition, setLogoPosition] = useState<
    "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("center");
  const [displayTheme, setDisplayTheme] = useState<
    "default" | "minimal" | "classic"
  >("default");
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [timestampFormat, setTimestampFormat] = useState<"12-hour" | "24-hour">(
    "12-hour",
  );
  const [showSlideCounter, setShowSlideCounter] = useState(false);
  const [slideNumberPosition, setSlideNumberPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("bottom-right");
  const [showServiceTitle, setShowServiceTitle] = useState(false);
  const [customServiceTitle, setCustomServiceTitle] = useState("");
  const [serviceTitleSize, setServiceTitleSize] = useState<
    "small" | "medium" | "large" | "extra-large"
  >("medium");
  const [showCopyrightInfo, setShowCopyrightInfo] = useState(false);
  const [copyrightPosition, setCopyrightPosition] = useState<
    "bottom-left" | "bottom-center" | "bottom-right"
  >("bottom-left");
  const [showAuthorInfo, setShowAuthorInfo] = useState(false);
  const [showSocialHandles, setShowSocialHandles] = useState(false);
  const [facebookHandle, setFacebookHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [socialHandlesColor, setSocialHandlesColor] = useState("#ffffff");
  const [socialHandlesPosition, setSocialHandlesPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center"
  >("bottom-right");
  const [socialHandlesSize, setSocialHandlesSize] = useState<
    "small" | "medium" | "large"
  >("medium");

  // Logo assets modal state (matching Editor view)
  const [isLogoAssetsModalOpen, setIsLogoAssetsModalOpen] = useState(false);

  // Background assets modal state
  const [isBackgroundAssetsModalOpen, setIsBackgroundAssetsModalOpen] =
    useState(false);
  const [backgroundAssetType, setBackgroundAssetType] = useState<
    "image" | "video"
  >("image");

  // Live preview state - mirrors what's on the live screen
  const [previewSongProjection, setPreviewSongProjection] = useState<{
    title: string;
    sectionTitle: string;
    lyrics: string;
  } | null>(null);
  const [previewBibleProjection, setPreviewBibleProjection] = useState<{
    reference: string;
    text: string;
    version: string;
  } | null>(null);
  const [previewProjectionType, setPreviewProjectionType] = useState<
    "song" | "bible" | null
  >(null);
  const [previewTimestamp, setPreviewTimestamp] = useState("");
  const [previewSlides, setPreviewSlides] = useState<any[]>([]);
  const [previewCurrentSlide, setPreviewCurrentSlide] = useState(1);
  const [previewSlideBackgrounds, setPreviewSlideBackgrounds] = useState<
    Record<string, any>
  >({});
  // Debounce ref to prevent incoming state updates from overriding locally-initiated slide changes
  const navigationDebounceRef = useRef<number>(0);

  // Toast hook
  const { toast } = useToast();

  // Update timestamp for preview
  useEffect(() => {
    if (showTimestamp) {
      const updateTime = () => {
        const now = new Date();
        if (timestampFormat === "12-hour") {
          setPreviewTimestamp(
            now.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          );
        } else {
          setPreviewTimestamp(
            now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          );
        }
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimestamp, timestampFormat]);

  // Keep slide counter in valid bounds when slides change
  useEffect(() => {
    if (
      previewSlides.length > 0 &&
      previewCurrentSlide > previewSlides.length
    ) {
      setPreviewCurrentSlide(previewSlides.length);
    } else if (previewSlides.length > 0 && previewCurrentSlide < 1) {
      setPreviewCurrentSlide(1);
    }
  }, [previewSlides.length, previewCurrentSlide]);

  // Helper function to apply slide background for preview
  const applySlideBackgroundForPreview = (slideNumber: number) => {
    if (previewSlides.length === 0) return;
    const slideData = previewSlides[slideNumber - 1];
    if (slideData?.itemId && previewSlideBackgrounds[slideData.itemId]) {
      const bg = previewSlideBackgrounds[slideData.itemId];
      if (bg.type === "fill" || bg.type === "gradient") {
        setAppliedBackgroundType("color");
        setAppliedBackgroundColor(bg.value || "#000000");
        setAppliedBackgroundImage(null);
        setAppliedBackgroundVideo(null);
      } else if (bg.type === "image") {
        setAppliedBackgroundType("image");
        setAppliedBackgroundImage(bg.value);
        setAppliedBackgroundVideo(null);
      } else if (bg.type === "video") {
        setAppliedBackgroundType("video");
        setAppliedBackgroundVideo(bg.value);
        setAppliedBackgroundImage(null);
      }
    }
  };

    useLivePreviewSync({
    ltEnabled,
    ltProjectLyric,
    ltProjectScripture,
    ltClear,
    toast,
    navigationDebounceRef,
    previewCurrentSlide,
    setPreviewSongProjection,
    setPreviewBibleProjection,
    setPreviewProjectionType,
    setAppliedBackgroundType,
    setAppliedBackgroundColor,
    setAppliedBackgroundImage,
    setAppliedBackgroundVideo,
    setCustomLogo,
    setLogoSize,
    setLogoPosition,
    setShowTimestamp,
    setTimestampFormat,
    setShowSlideCounter,
    setSlideNumberPosition,
    setShowServiceTitle,
    setCustomServiceTitle,
    setServiceTitleSize,
    setShowCopyrightInfo,
    setCopyrightPosition,
    setShowAuthorInfo,
    setShowSocialHandles,
    setFacebookHandle,
    setInstagramHandle,
    setSocialHandlesColor,
    setSocialHandlesPosition,
    setSocialHandlesSize,
    setSlidesTransparent,
    setSlideTextSize,
    setSlideAlignment,
    setContentFixedArea,
    setSlideTransition,
    setAutoAdvanceSlides,
    setDisplayTheme,
    setPreviewSlides,
    setPreviewCurrentSlide,
    setPreviewSlideBackgrounds,
    setHasLiveSettingsBackground
  });

  // Request state sync from live window when Live Console opens
  useEffect(() => {
    if (isOpen && liveWindow && !liveWindow.closed) {
      sendCommand("REQUEST_STATE_SYNC", {});
    }
  }, [isOpen, liveWindow]);

  // Send commands to live window
  const sendCommand = (type: string, data?: any) => {
    if (liveWindow && !liveWindow.closed) {
      liveWindow.postMessage({ type, data }, window.location.origin);
    }
  };

  // Project song to live screen (called from SongProjectionWidget)
  const handleProjectSong = (
    songTitle: string,
    sectionTitle: string,
    lyrics: string,
    fullSongData?: any,
  ) => {
    sendCommand("PROJECT_SONG", {
      title: songTitle,
      sectionTitle: sectionTitle,
      lyrics: lyrics,
      fullSongData: fullSongData,
    });
    // Update preview to mirror live screen
    setPreviewSongProjection({ title: songTitle, sectionTitle, lyrics });
    setPreviewBibleProjection(null);
    setPreviewProjectionType("song");
    // Automatically set display mode to song when projecting
    setMode("song");
    // Forward to Lower Third overlay (OBS browser source) using the saved lyric template
    if (ltEnabled) ltProjectLyric(lyrics, sectionTitle, songTitle);
  };

  // Clear song projection
  const handleClearSongProjection = () => {
    sendCommand("CLEAR_PROJECTION");
    // Clear preview
    setPreviewSongProjection(null);
    setPreviewBibleProjection(null);
    setPreviewProjectionType(null);
    // Clear lower third overlay
    ltClear();
  };

  // Project Bible verse to live screen (called from BibleProjectionWidget)
  const handleProjectBibleVerse = (
    reference: string,
    text: string,
    version: string,
    passageData?: any,
  ) => {
    sendCommand("PROJECT_BIBLE_VERSE", {
      reference: reference,
      text: text,
      version: version,
      passageData: passageData,
    });
    // Update preview to mirror live screen
    setPreviewBibleProjection({ reference, text, version });
    setPreviewSongProjection(null);
    setPreviewProjectionType("bible");
    // Forward to Lower Third overlay (OBS browser source) using the saved scripture template
    if (ltEnabled) ltProjectScripture(text, reference, version);
  };

  // Clear Bible projection
  const handleClearBibleProjection = () => {
    sendCommand("CLEAR_PROJECTION");
    // Clear Zustand store for cross-window sync
    clearZustandProjection();
    // Clear preview
    setPreviewSongProjection(null);
    setPreviewBibleProjection(null);
    setPreviewProjectionType(null);
    // Clear lower third overlay
    ltClear();
  };

  // Apply background changes to live screen (matching Editor view)
  const applyBackgroundChanges = () => {
    setAppliedBackgroundType(backgroundType);
    setAppliedBackgroundColor(backgroundColor);
    setAppliedBackgroundImage(backgroundImage);
    setAppliedBackgroundVideo(backgroundVideo);
    setHasLiveSettingsBackground(true);

    sendCommand("BACKGROUND_UPDATE", {
      background: {
        type: backgroundType,
        color: backgroundColor,
        image: backgroundImage,
        video: backgroundVideo,
      },
    });

    setIsBackgroundModalOpen(false);
  };

  // Clear live background
  const clearLiveBackground = () => {
    setHasLiveSettingsBackground(false);
    setAppliedBackgroundType("color");
    setAppliedBackgroundColor("#000000");
    setAppliedBackgroundImage(null);
    setAppliedBackgroundVideo(null);

    sendCommand("LIVE_BACKGROUND_CLEARED", {});
    setIsBackgroundModalOpen(false);
  };

  // Close settings and reset to main
  const closeSettings = () => {
    setIsSettingsModalOpen(false);
    setSettingsScreen("main");
  };

  // Sync settings to live screen
  const syncSettingsToLive = () => {
    sendCommand("SETTINGS_UPDATE", {
      slidesTransparent,
      slideTextSize,
      slideAlignment,
      contentFixedArea,
      slideTransition,
      autoAdvanceSlides,
      customLogo,
      logoSize,
      logoPosition,
      displayTheme,
      showTimestamp,
      timestampFormat,
      showSlideCounter,
      slideNumberPosition,
      showServiceTitle,
      customServiceTitle,
      serviceTitleSize,
      showCopyrightInfo,
      copyrightPosition,
      showAuthorInfo,
      showSocialHandles,
      facebookHandle,
      instagramHandle,
      socialHandlesColor,
      socialHandlesPosition,
      socialHandlesSize,
    });
  };

  // Send settings updates when they change
  useEffect(() => {
    syncSettingsToLive();
  }, [
    slidesTransparent,
    slideTextSize,
    slideAlignment,
    contentFixedArea,
    slideTransition,
    autoAdvanceSlides,
    customLogo,
    logoSize,
    logoPosition,
    displayTheme,
    showTimestamp,
    timestampFormat,
    showSlideCounter,
    slideNumberPosition,
    showServiceTitle,
    customServiceTitle,
    serviceTitleSize,
    showCopyrightInfo,
    copyrightPosition,
    showAuthorInfo,
    showSocialHandles,
    facebookHandle,
    instagramHandle,
    socialHandlesColor,
    socialHandlesPosition,
    socialHandlesSize,
  ]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Live Console Modal */}
      <div
        ref={modalRef}
        className="fixed z-[100] bg-[#0a0a12] border border-gray-700 rounded-lg shadow-2xl select-none flex flex-col"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
        }}>
        {/* Header - Draggable */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-move border-b border-gray-800 shrink-0"
          onMouseDown={handleMouseDown}>
          <h2 className="text-purple-400 font-semibold text-lg">
            Live Console
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-400 text-sm">Screen 1</div>
            {liveWindow && !liveWindow.closed && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 text-xs">LIVE</span>
              </div>
            )}
          </div>
          <LiveConsolePreview
            activeMode={activeMode}
            appliedBackgroundType={appliedBackgroundType}
            appliedBackgroundColor={appliedBackgroundColor}
            appliedBackgroundImage={appliedBackgroundImage}
            appliedBackgroundVideo={appliedBackgroundVideo}
            previewProjectionType={previewProjectionType}
            previewSongProjection={previewSongProjection}
            previewBibleProjection={previewBibleProjection}
            previewSlides={previewSlides}
            slidesProp={slidesProp}
            previewCurrentSlide={previewCurrentSlide}
            currentSlide={currentSlide}
            liveWindow={liveWindow}
            customLogo={customLogo}
            logoSize={logoSize}
            logoPosition={logoPosition}
            showServiceTitle={showServiceTitle}
            serviceTitleSize={serviceTitleSize}
            customServiceTitle={customServiceTitle}
            showTimestamp={showTimestamp}
            previewTimestamp={previewTimestamp}
            showSlideCounter={showSlideCounter}
            totalSlides={totalSlides}
            slideNumberPosition={slideNumberPosition}
            showSocialHandles={showSocialHandles}
            socialHandlesPosition={socialHandlesPosition}
            facebookHandle={facebookHandle}
            instagramHandle={instagramHandle}
            socialHandlesSize={socialHandlesSize}
            socialHandlesColor={socialHandlesColor}
          />

          {/* Instruction Text */}


          {/* Instruction Text */}
          <p className="text-gray-400 text-sm mt-4 mb-3 shrink-0">
            Select an option below to make changes to the live screen
          </p>

          {/* Control Bar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Slide Navigation - Dark gray with white elements */}
            <button
              onClick={() => {
                const slidesTotal =
                  previewSlides.length > 0 ? previewSlides.length : totalSlides;
                const currentSlideNum =
                  previewSlides.length > 0 ? previewCurrentSlide : currentSlide;
                if (currentSlideNum > 1) {
                  const newSlideNumber = currentSlideNum - 1;
                  // Set debounce timestamp to prevent incoming state updates from overriding this change
                  navigationDebounceRef.current = Date.now();
                  setPreviewCurrentSlide(newSlideNumber);
                  applySlideBackgroundForPreview(newSlideNumber);

                  // Automatically switch to slides mode when navigating slides
                  setMode("slides");

                  // Send GO_TO_SLIDE directly to liveWindow (fixes stale closure issue)
                  console.log(
                    "🎯 Nav Prev: liveWindow exists:",
                    !!liveWindow,
                    "closed:",
                    liveWindow?.closed,
                  );
                  if (liveWindow && !liveWindow.closed) {
                    const slideData = previewSlides[newSlideNumber - 1];
                    const itemId =
                      slideData?.itemId || serviceItems[newSlideNumber - 1]?.id;
                    const background = itemId
                      ? previewSlideBackgrounds[itemId]
                      : null;

                    console.log(
                      "🎯 Nav Prev: Sending GO_TO_SLIDE to liveWindow:",
                      { slideIndex: newSlideNumber - 1, background, itemId },
                    );
                    liveWindow.postMessage(
                      {
                        type: "GO_TO_SLIDE",
                        data: {
                          slideIndex: newSlideNumber - 1,
                          background: background,
                          itemId: itemId,
                        },
                      },
                      window.location.origin,
                    );
                  } else {
                    console.log(
                      "❌ Nav Prev: liveWindow is null or closed - message NOT sent",
                    );
                  }

                  // Also call callback for parent state update
                  onGoToSlide?.(newSlideNumber);
                }
              }}
              disabled={
                (previewSlides.length > 0
                  ? previewCurrentSlide
                  : currentSlide) <= 1
              }
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                (previewSlides.length > 0
                  ? previewCurrentSlide
                  : currentSlide) <= 1
                  ? "bg-[#1a1d21] text-gray-500 cursor-not-allowed"
                  : "bg-[#1a1d21] hover:bg-[#2a2d31] text-white"
              }`}>
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="bg-[#1a1d21] text-white text-sm font-semibold px-4 py-2.5 rounded-lg min-w-[110px] text-center">
              Slide{" "}
              {previewSlides.length > 0 ? previewCurrentSlide : currentSlide} of{" "}
              {previewSlides.length > 0 ? previewSlides.length : totalSlides}
            </div>

            <button
              onClick={() => {
                const slidesTotal =
                  previewSlides.length > 0 ? previewSlides.length : totalSlides;
                const currentSlideNum =
                  previewSlides.length > 0 ? previewCurrentSlide : currentSlide;
                if (currentSlideNum < slidesTotal) {
                  const newSlideNumber = currentSlideNum + 1;
                  // Set debounce timestamp to prevent incoming state updates from overriding this change
                  navigationDebounceRef.current = Date.now();
                  setPreviewCurrentSlide(newSlideNumber);
                  applySlideBackgroundForPreview(newSlideNumber);

                  // Automatically switch to slides mode when navigating slides
                  setMode("slides");

                  // Send GO_TO_SLIDE directly to liveWindow (fixes stale closure issue)
                  console.log(
                    "🎯 Nav Next: liveWindow exists:",
                    !!liveWindow,
                    "closed:",
                    liveWindow?.closed,
                  );
                  if (liveWindow && !liveWindow.closed) {
                    const slideData = previewSlides[newSlideNumber - 1];
                    const itemId =
                      slideData?.itemId || serviceItems[newSlideNumber - 1]?.id;
                    const background = itemId
                      ? previewSlideBackgrounds[itemId]
                      : null;

                    console.log(
                      "🎯 Nav Next: Sending GO_TO_SLIDE to liveWindow:",
                      { slideIndex: newSlideNumber - 1, background, itemId },
                    );
                    liveWindow.postMessage(
                      {
                        type: "GO_TO_SLIDE",
                        data: {
                          slideIndex: newSlideNumber - 1,
                          background: background,
                          itemId: itemId,
                        },
                      },
                      window.location.origin,
                    );
                  } else {
                    console.log(
                      "❌ Nav Next: liveWindow is null or closed - message NOT sent",
                    );
                  }

                  // Also call callback for parent state update
                  onGoToSlide?.(newSlideNumber);
                }
              }}
              disabled={
                (previewSlides.length > 0
                  ? previewCurrentSlide
                  : currentSlide) >=
                (previewSlides.length > 0 ? previewSlides.length : totalSlides)
              }
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                (previewSlides.length > 0
                  ? previewCurrentSlide
                  : currentSlide) >=
                (previewSlides.length > 0 ? previewSlides.length : totalSlides)
                  ? "bg-[#1a1d21] text-gray-500 cursor-not-allowed"
                  : "bg-[#1a1d21] hover:bg-[#2a2d31] text-white"
              }`}>
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-gray-600 mx-1"></div>

            {/* Display Mode Indicator (read-only, auto-updated by actions) */}
            <div
              className={`text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 ${
                activeMode !== "none"
                  ? "bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 ring-1 ring-amber-500/50"
                  : "bg-[#1a1d21] text-gray-400"
              }`}>
              <Monitor className="w-4 h-4" />
              {activeMode !== "none"
                ? DISPLAY_MODE_LABELS[activeMode]
                : "Display"}
            </div>

            {/* Slides Button - Dark green with green text */}
            <button
              onClick={() => setIsSlideNavOpen(true)}
              className="bg-[#0a2618] hover:bg-[#0d3320] text-[#4ade80] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              Slides
            </button>

            {/* Q Bible Button - Triggers HFB Editor in parent via callback */}
            <button
              onClick={onOpenHandsfreeBible}
              className="bg-[#2d1f3d] hover:bg-[#3d2a52] text-[#c4a5de] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <img src={qworshipLogo} alt="" className="w-5 h-5" />
              Bible
            </button>

            {/* Songs Button - Dark blue with light blue text */}
            <button
              onClick={() => setIsSongModalOpen(true)}
              className="bg-[#0f1729] hover:bg-[#162038] text-[#7dd3fc] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <Music className="w-4 h-4" />
              Songs
            </button>

            {/* Bible Button - Dark blue/purple with light purple text */}
            <button
              onClick={() => setIsBibleModalOpen(true)}
              className="bg-[#1a1a2e] hover:bg-[#24243d] text-[#a5b4fc] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <BookOpen className="w-4 h-4" />
              Bible
            </button>

            {/* Background Button - Dark brown with orange/tan text */}
            <button
              onClick={() => setIsBackgroundModalOpen(true)}
              className="bg-[#291c10] hover:bg-[#3a2815] text-[#f5c77e] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <Image className="w-4 h-4" />
              Background
            </button>

            {/* OBS Button - Dark maroon with pink text and camera icon */}
            <button
              onClick={() => setIsOBSModalOpen(true)}
              className="bg-[#2a1215] hover:bg-[#3a191d] text-[#f5a5a5] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                <circle cx="8" cy="12" r="1" fill="currentColor" />
              </svg>
              OBS
            </button>

            {/* Settings Button - Dark gray/black with white gear icon */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1a1d21] hover:bg-[#2a2d31] text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}>
          <div className="absolute right-1 bottom-1 w-2 h-2 border-r-2 border-b-2 border-gray-500"></div>
        </div>
      </div>

      {/* Song Projection Widget Modal - Same as Editor View */}
      <SongProjectionWidget
        isVisible={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onProjectSong={handleProjectSong}
        onClearProjection={handleClearSongProjection}
      />

      {/* Bible Projection Widget Modal - Same as Editor View */}
      <BibleProjectionWidget
        isVisible={isBibleModalOpen}
        onClose={() => setIsBibleModalOpen(false)}
        onProjectVerse={handleProjectBibleVerse}
        onClearProjection={handleClearBibleProjection}
      />

      {/* Slide Navigation Panel - Exact Editor View Design */}
      {isSlideNavOpen && (
        <div
          className="fixed right-0 top-0 w-80 h-full bg-black/95 backdrop-blur-md border-l border-gray-700 z-[110] flex flex-col shadow-2xl transform transition-transform duration-300"
          onClick={(e) => e.stopPropagation()}>
          {/* Compact Header */}
          <div className="p-2 border-b border-gray-700 flex items-center justify-between bg-black/50">
            <h3 className="text-white font-medium text-sm">
              Presenter Controls
            </h3>
            <div className="flex items-center space-x-1">
              <span className="text-gray-400 text-xs">ESC to hide</span>
              <button
                onClick={() => setIsSlideNavOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Use previewSlides (from LIVE_STATE_UPDATE) or fallback to slidesProp (passed from parent) */}
            {(() => {
              const displaySlides =
                previewSlides.length > 0 ? previewSlides : slidesProp;
              const displayCurrentSlide =
                previewSlides.length > 0 ? previewCurrentSlide : currentSlide;

              return displaySlides.length > 0 ? (
                displaySlides.map((slide, index) => {
                  const slideNumber = index + 1;
                  const isCurrentSlide = slideNumber === displayCurrentSlide;

                  return (
                    <div
                      key={slide.id || index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Set debounce timestamp to prevent incoming state updates from overriding this change
                        navigationDebounceRef.current = Date.now();
                        setPreviewCurrentSlide(slideNumber);
                        applySlideBackgroundForPreview(slideNumber);

                        // Automatically switch to slides mode when clicking on a slide
                        setMode("slides");

                        // Send GO_TO_SLIDE directly to liveWindow (fixes stale closure issue)
                        if (liveWindow && !liveWindow.closed) {
                          const slideData =
                            previewSlides[slideNumber - 1] ||
                            slidesProp[slideNumber - 1];
                          const itemId = slideData?.itemId;
                          const background = itemId
                            ? previewSlideBackgrounds[itemId] ||
                              itemBackgroundsProp[itemId]
                            : null;

                          liveWindow.postMessage(
                            {
                              type: "GO_TO_SLIDE",
                              data: {
                                slideIndex: slideNumber - 1,
                                background: background,
                                itemId: itemId,
                              },
                            },
                            window.location.origin,
                          );
                        }

                        // Also call callback for parent state update
                        onGoToSlide?.(slideNumber);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-purple-400 ${
                        isCurrentSlide
                          ? "border-purple-500 bg-purple-600/20 shadow-lg"
                          : "border-gray-600 bg-gray-800/30 hover:bg-gray-700/50"
                      }`}>
                      {/* Slide Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              isCurrentSlide
                                ? "bg-purple-500 text-white"
                                : "bg-gray-600 text-gray-300"
                            }`}>
                            {slideNumber}
                          </span>
                          {slide.type && (
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                slide.type === "VERSE" || slide.type === "verse"
                                  ? "bg-blue-600/30 text-blue-300"
                                  : slide.type === "CHORUS" ||
                                      slide.type === "chorus"
                                    ? "bg-green-600/30 text-green-300"
                                    : slide.type === "BRIDGE"
                                      ? "bg-orange-600/30 text-orange-300"
                                      : slide.type === "BIBLE" ||
                                          slide.type === "bible"
                                        ? "bg-purple-600/30 text-purple-300"
                                        : "bg-gray-600/30 text-gray-300"
                              }`}>
                              {slide.type === "verse"
                                ? "VERSE"
                                : slide.type === "chorus"
                                  ? "CHORUS"
                                  : slide.type === "bible"
                                    ? "BIBLE"
                                    : slide.type}
                            </span>
                          )}
                        </div>
                        {isCurrentSlide && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        )}
                      </div>

                      {/* Slide Content Preview */}
                      <div className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                        {slide.content ||
                          slide.lyrics ||
                          slide.text ||
                          "No content"}
                      </div>

                      {/* Slide Title if available */}
                      {(slide.title || slide.songTitle) && (
                        <div className="mt-2 text-xs text-gray-400 font-medium">
                          {slide.songTitle || slide.title}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    No slides available
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Load content from the dashboard to see slides here
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer with slide counter */}
          <div className="p-4 border-t border-gray-600 bg-gray-900/50">
            <div className="text-center text-sm text-gray-400">
              Slide{" "}
              {previewSlides.length > 0 ? previewCurrentSlide : currentSlide} of{" "}
              {previewSlides.length > 0 ? previewSlides.length : totalSlides}
            </div>
          </div>
        </div>
      )}

      {/* Background Customization Panel - Updated Purple/Slate Theme */}
      {isBackgroundModalOpen && (
        <div
          className="fixed z-[110] w-80 bg-[#2d2a3e] rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
          style={{ left: backgroundModalPos.x, top: backgroundModalPos.y }}
          onClick={(e) => e.stopPropagation()}>
          {/* Draggable Header */}
          <div
            className="p-5 pb-4 cursor-move select-none"
            onMouseDown={(e) => startModalDrag("background", e)}>
            <div className="flex items-center justify-between">
              <h3 className="text-[#c4b5fd] text-xl font-semibold flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Background</span>
              </h3>
              <button
                onClick={() => setIsBackgroundModalOpen(false)}
                className="text-[#c4b5fd] hover:text-white transition-colors p-1 hover:bg-[#4a4560] rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Background Type Selector */}
          <div className="px-5 pb-4">
            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium mb-3 block">
                Background Type
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setBackgroundType("color")}
                  className={`flex-1 px-3 py-2.5 text-sm rounded-lg transition-all font-medium ${
                    backgroundType === "color"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#3a3550] text-[#c4b5fd] hover:bg-[#4a4560] border border-[#5a5575]"
                  }`}>
                  Color
                </button>
                <button
                  onClick={() => setBackgroundType("image")}
                  className={`flex-1 px-3 py-2.5 text-sm rounded-lg transition-all font-medium ${
                    backgroundType === "image"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#3a3550] text-[#c4b5fd] hover:bg-[#4a4560] border border-[#5a5575]"
                  }`}>
                  Image
                </button>
                <button
                  onClick={() => setBackgroundType("video")}
                  className={`flex-1 px-3 py-2.5 text-sm rounded-lg transition-all font-medium ${
                    backgroundType === "video"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#3a3550] text-[#c4b5fd] hover:bg-[#4a4560] border border-[#5a5575]"
                  }`}>
                  Video
                </button>
              </div>
            </div>
          </div>

          {/* Background Content */}
          <div className="px-5 pb-4 space-y-4">
            {backgroundType === "color" && (
              <>
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-3 block">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border-2 border-[#5a5575] bg-transparent cursor-pointer hover:border-[#a78bfa] transition-colors"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-sm focus:border-[#a78bfa] focus:outline-none transition-all"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Preset Colors */}
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-3 block">
                    Quick Colors
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      "#000000",
                      "#1a1a1a",
                      "#2d2d2d",
                      "#4a4a4a",
                      "#1e3a8a",
                      "#7c3aed",
                      "#dc2626",
                      "#059669",
                      "#d97706",
                      "#ffffff",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                          backgroundColor === color
                            ? "border-[#a78bfa] ring-2 ring-[#a78bfa]/50"
                            : "border-[#5a5575] hover:border-[#a78bfa]"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {backgroundType === "image" && (
              <>
                {/* Q-worship Cloud Storage */}
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Q-worship Cloud Storage
                  </label>
                  <p className="text-[#9ca3af] text-xs mb-3">
                    Access your uploaded images from Q-worship cloud
                  </p>
                  <button
                    onClick={() => {
                      setBackgroundAssetType("image");
                      setIsBackgroundAssetsModalOpen(true);
                    }}
                    className="w-full px-3 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-sm font-medium transition-all">
                    Browse My Assets
                  </button>
                </div>

                {/* Local File Upload */}
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-3 block">
                    Upload from Computer
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setBackgroundImage(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#8b5cf6] file:text-white file:cursor-pointer hover:border-[#a78bfa] transition-all"
                  />
                  {backgroundImage && (
                    <div className="mt-3">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="w-full h-20 object-cover rounded-lg border border-[#5a5575]"
                      />
                      <button
                        onClick={() => {
                          setBackgroundImage(null);
                          setBackgroundType("color");
                          setBackgroundColor("#000000");
                        }}
                        className="mt-2 text-red-400 hover:text-red-300 text-xs hover:underline transition-all">
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {backgroundType === "video" && (
              <>
                {/* Q-worship Cloud Storage */}
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-2 block">
                    Q-worship Cloud Storage
                  </label>
                  <p className="text-[#9ca3af] text-xs mb-3">
                    Access your uploaded videos from Q-worship cloud
                  </p>
                  <button
                    onClick={() => {
                      setBackgroundAssetType("video");
                      setIsBackgroundAssetsModalOpen(true);
                    }}
                    className="w-full px-3 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-sm font-medium transition-all">
                    Browse My Assets
                  </button>
                </div>

                {/* Local File Upload */}
                <div className="p-4 bg-[#4a4560] rounded-xl">
                  <label className="text-white text-sm font-medium mb-3 block">
                    Upload from Computer
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setBackgroundVideo(url);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#8b5cf6] file:text-white file:cursor-pointer hover:border-[#a78bfa] transition-all"
                  />
                  {backgroundVideo && (
                    <div className="mt-3">
                      <video
                        src={backgroundVideo}
                        className="w-full h-20 object-cover rounded-lg border border-[#5a5575]"
                        muted
                      />
                      <button
                        onClick={() => {
                          setBackgroundVideo(null);
                          setBackgroundType("color");
                          setBackgroundColor("#000000");
                        }}
                        className="mt-2 text-red-400 hover:text-red-300 text-xs hover:underline transition-all">
                        Remove Video
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Apply and Clear Buttons */}
          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={applyBackgroundChanges}
              className="w-full px-4 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl transition-all font-medium">
              Apply Background
            </button>

            {hasLiveSettingsBackground && (
              <button
                onClick={clearLiveBackground}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium">
                Clear Live Background
              </button>
            )}
          </div>
        </div>
      )}

      {/* OBS Control Modal - Updated Purple/Slate Theme */}
      {isOBSModalOpen && (
        <div
          className="fixed z-[110] w-[500px] bg-[#2d2a3e] rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
          style={{ left: obsModalPos.x, top: obsModalPos.y }}>
          {/* Draggable Header */}
          <div
            className="p-5 pb-4 cursor-move select-none"
            onMouseDown={(e) => startModalDrag("obs", e)}>
            <div className="flex items-center justify-between">
              <h3 className="text-[#c4b5fd] text-xl font-semibold flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>OBS Studio Controls</span>
              </h3>
              <button
                onClick={() => setIsOBSModalOpen(false)}
                className="text-[#c4b5fd] hover:text-white transition-colors p-1 hover:bg-[#4a4560] rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-5 pb-5 max-h-[60vh] overflow-y-auto">
            <OBSControlPanel />
          </div>
        </div>
      )}

            {/* Live Settings Panel - Refactored */}
      <LiveConsoleSettingsModal
        isSettingsModalOpen={isSettingsModalOpen}
        settingsModalPos={settingsModalPos}
        startModalDrag={startModalDrag}
        settingsScreen={settingsScreen}
        setSettingsScreen={setSettingsScreen}
        closeSettings={closeSettings}
        navigate={navigate}
        slidesTransparent={slidesTransparent}
        setSlidesTransparent={setSlidesTransparent}
        slideTextSize={slideTextSize}
        setSlideTextSize={setSlideTextSize}
        slideAlignment={slideAlignment}
        setSlideAlignment={setSlideAlignment}
        contentFixedArea={contentFixedArea}
        setContentFixedArea={setContentFixedArea}
        slideTransition={slideTransition}
        setSlideTransition={setSlideTransition}
        autoAdvanceSlides={autoAdvanceSlides}
        setAutoAdvanceSlides={setAutoAdvanceSlides}
        customLogo={customLogo}
        setCustomLogo={setCustomLogo}
        logoSize={logoSize}
        setLogoSize={setLogoSize}
        logoPosition={logoPosition}
        setLogoPosition={setLogoPosition}
        setIsLogoAssetsModalOpen={setIsLogoAssetsModalOpen}
        displayTheme={displayTheme}
        setDisplayTheme={setDisplayTheme}
        showTimestamp={showTimestamp}
        setShowTimestamp={setShowTimestamp}
        timestampFormat={timestampFormat}
        setTimestampFormat={setTimestampFormat}
        showSlideCounter={showSlideCounter}
        setShowSlideCounter={setShowSlideCounter}
        slideNumberPosition={slideNumberPosition}
        setSlideNumberPosition={setSlideNumberPosition}
        showServiceTitle={showServiceTitle}
        setShowServiceTitle={setShowServiceTitle}
        customServiceTitle={customServiceTitle}
        setCustomServiceTitle={setCustomServiceTitle}
        serviceTitleSize={serviceTitleSize}
        setServiceTitleSize={setServiceTitleSize}
        showCopyrightInfo={showCopyrightInfo}
        setShowCopyrightInfo={setShowCopyrightInfo}
        copyrightPosition={copyrightPosition}
        setCopyrightPosition={setCopyrightPosition}
        showAuthorInfo={showAuthorInfo}
        setShowAuthorInfo={setShowAuthorInfo}
        showSocialHandles={showSocialHandles}
        setShowSocialHandles={setShowSocialHandles}
        facebookHandle={facebookHandle}
        setFacebookHandle={setFacebookHandle}
        instagramHandle={instagramHandle}
        setInstagramHandle={setInstagramHandle}
        socialHandlesColor={socialHandlesColor}
        setSocialHandlesColor={setSocialHandlesColor}
        socialHandlesPosition={socialHandlesPosition}
        setSocialHandlesPosition={setSocialHandlesPosition}
        socialHandlesSize={socialHandlesSize}
        setSocialHandlesSize={setSocialHandlesSize}
      />

      {/* Logo Assets Modal - Same as Editor View */}
      {isLogoAssetsModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900">
          {/* Modal Header with Close Button */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-500/30 flex items-center justify-between px-6 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-purple-900 font-bold text-sm">Q</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Select Logo from My Assets
              </h1>
            </div>
            <button
              onClick={() => setIsLogoAssetsModalOpen(false)}
              className="p-2 hover:bg-purple-700/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Assets Page Content */}
          <div className="pt-16 h-full">
            <AssetsPage
              onAssetSelect={(assetUrl: string, assetType: string) => {
                console.log("Logo selected from assets:", assetUrl, assetType);

                // Set the selected asset as custom logo
                setCustomLogo(assetUrl);

                // Close the modal
                setIsLogoAssetsModalOpen(false);

                // Show success toast
                toast({
                  title: "Logo Selected",
                  description:
                    "Logo ready to apply - click Apply Settings to activate",
                  className:
                    "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white",
                });
              }}
              isModal={true}
              filterType="all"
            />
          </div>
        </div>
      )}

      {/* Background Assets Modal - Same as Editor View */}
      {isBackgroundAssetsModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900">
          {/* Modal Header with Close Button */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-500/30 flex items-center justify-between px-6 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-purple-900 font-bold text-sm">Q</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Select {backgroundAssetType === "image" ? "Image" : "Video"}{" "}
                Background
              </h1>
            </div>
            <button
              onClick={() => setIsBackgroundAssetsModalOpen(false)}
              className="p-2 hover:bg-purple-700/50 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Assets Page Content */}
          <div className="pt-16 h-full">
            <AssetsPage
              onAssetSelect={(assetUrl: string, assetType: string) => {
                console.log(
                  "Background selected from assets:",
                  assetUrl,
                  assetType,
                );

                // Set the selected asset as background based on type
                if (backgroundAssetType === "image") {
                  setBackgroundImage(assetUrl);
                  setBackgroundType("image");
                } else {
                  setBackgroundVideo(assetUrl);
                  setBackgroundType("video");
                }

                // Close the modal
                setIsBackgroundAssetsModalOpen(false);

                // Show success toast
                toast({
                  title: `${backgroundAssetType === "image" ? "Image" : "Video"} Selected`,
                  description:
                    "Background ready to apply - click Apply Background to activate",
                  className:
                    "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white",
                });
              }}
              isModal={true}
              filterType={backgroundAssetType === "video" ? "video" : "all"}
            />
          </div>
        </div>
      )}

    </>
  );
}
