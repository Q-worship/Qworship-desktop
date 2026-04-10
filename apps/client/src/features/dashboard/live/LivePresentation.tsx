import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  Mic,
  Music,
  Maximize2,
  Minimize2,
  Palette,
  User,
  Settings,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import qworshipLogo from "@assets/Group 1_1754122708985.png";
import facebookIcon from "@assets/R (2)_1756733484236.png";
import instagramIcon from "@assets/1658586823instagram-logo-transparent_1756733484234.png";
import { SongProjectionWidget } from "@/features/dashboard/components/SongProjectionWidget";
import { BibleProjectionWidget } from "@/features/dashboard/components/BibleProjectionWidget";

const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  
  // Exact placeholder matches
  if (url === "Worship background image" || url === "Inspirational worship video" || url === "Background Image" || url === "Ready for content") return undefined;
  
  // Valid URL prefixes
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  
  // Relative API paths
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (url.startsWith('/api') && API_BASE.endsWith('/api')) {
      return API_BASE.slice(0, -4) + url;
    }
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return API_BASE.replace(/\/$/, '') + normalizedPath;
  }
  
  // If it doesn't match any known valid prefix, it's likely a generic string/placeholder
  return undefined;
};
import { OBSControlPanel } from "@/features/dashboard/components/OBSControlPanel";
import { OBSStatusBadge } from "@/features/dashboard/components/OBSStatusBadge";
import { obsService, OBSSettings } from "@/services/OBSConnectionService";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { AssetsPage } from "@/features/web/pages/AssetsPage";
import {
  useBibleProjectionStore,
  requestSyncFromOtherWindows,
} from "@/stores/useBibleProjectionStore";
import {
  useDisplayModeStore,
  requestDisplayModeSync,
  type DisplayMode,
} from "@/stores/useDisplayModeStore";
// Restored original Classic UI for live presentation

// Live Timestamp Component
const LiveTimestamp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-30 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
      <div className="text-white text-sm font-medium">
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
      <div className="text-gray-300 text-xs">
        {currentTime.toLocaleDateString()}
      </div>
    </div>
  );
};

export const LivePresentation = (): JSX.Element => {
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slides, setSlides] = useState<any[]>([]);
  const [totalSlides, setTotalSlides] = useState(0);
  const [slideBackgrounds, setSlideBackgrounds] = useState<Record<string, any>>(
    {},
  );
  const [titleEditorState, setTitleEditorState] = useState<any>({});
  const [editorState, setEditorState] = useState<any>({});
  const [liveProjection, setLiveProjection] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  // Song projection state
  const [isSongWidgetOpen, setIsSongWidgetOpen] = useState(false);
  const [isBibleWidgetOpen, setIsBibleWidgetOpen] = useState(false);
  const [currentSongProjection, setCurrentSongProjection] = useState<{
    title: string;
    sectionTitle: string;
    lyrics: string;
  } | null>(null);
  const [projectionType, setProjectionType] = useState<"bible" | "song" | null>(
    null,
  );
  // Pacing/teleprompter: index of the currently highlighted lyric line (-1 = none)
  const [pacingLineIdx, setPacingLineIdx] = useState(-1);

  // Enhanced song projection state for navigation
  const [currentProjectedSong, setCurrentProjectedSong] = useState<{
    title: string;
    artist?: string;
    sections: Array<{
      id: string;
      type: string;
      title: string;
      content: string;
      number: number;
    }>;
  } | null>(null);
  const [currentSongSectionIndex, setCurrentSongSectionIndex] = useState(0);

  // Slide navigation panel state
  const [isSlideNavOpen, setIsSlideNavOpen] = useState(false);

  // Track fullscreen state properly
  const [isInFullscreen, setIsInFullscreen] = useState(false);

  // Background customization state
  const [isBackgroundPanelOpen, setIsBackgroundPanelOpen] = useState(false);
  const [backgroundType, setBackgroundType] = useState<
    "color" | "image" | "video"
  >("color");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);

  // Applied background state - initialize from localStorage if available
  const [appliedBackgroundType, setAppliedBackgroundType] = useState<
    "color" | "image" | "video"
  >(() => {
    try {
      const saved = localStorage.getItem("qworship-live-background");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.type || "color";
      }
    } catch (e) {}
    return "color";
  });
  const [appliedBackgroundColor, setAppliedBackgroundColor] = useState(() => {
    try {
      const saved = localStorage.getItem("qworship-live-background");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.color || "#000000";
      }
    } catch (e) {}
    return "#000000";
  });
  const [appliedBackgroundImage, setAppliedBackgroundImage] = useState<
    string | null
  >(() => {
    try {
      const saved = localStorage.getItem("qworship-live-background");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.image || null;
      }
    } catch (e) {}
    return null;
  });
  const [appliedBackgroundVideo, setAppliedBackgroundVideo] = useState<
    string | null
  >(() => {
    try {
      const saved = localStorage.getItem("qworship-live-background");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.video || null;
      }
    } catch (e) {}
    return null;
  });

  // Track if Live Settings background is active (overrides slide backgrounds)
  // Initialize from localStorage - use saved hasLiveSettings flag, or infer from background content
  const [hasLiveSettingsBackground, setHasLiveSettingsBackground] = useState(
    () => {
      try {
        const saved = localStorage.getItem("qworship-live-background");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Use the saved flag if available, otherwise infer from having a non-default background
          if (typeof parsed.hasLiveSettings === "boolean") {
            return parsed.hasLiveSettings;
          }
          return parsed.image ||
            parsed.video ||
            (parsed.color && parsed.color !== "#000000")
            ? true
            : false;
        }
      } catch (e) {}
      return false;
    },
  );

  // Live Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
  >("large");
  const [slideAlignment, setSlideAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [contentFixedArea, setContentFixedArea] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>("");
  const [logoSize, setLogoSize] = useState<"small" | "medium" | "large">(
    "medium",
  );
  const [logoPosition, setLogoPosition] = useState<
    "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("bottom-right");
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [autoAdvanceSlides, setAutoAdvanceSlides] = useState(false);
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
  >("fade");

  // Additional Display Settings
  const [showSlideCounter, setShowSlideCounter] = useState(false);
  const [showServiceTitle, setShowServiceTitle] = useState(false);
  const [showCopyrightInfo, setShowCopyrightInfo] = useState(true);
  const [showAuthorInfo, setShowAuthorInfo] = useState(false);
  const [slideNumberPosition, setSlideNumberPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("bottom-right");
  const [timestampFormat, setTimestampFormat] = useState<"12-hour" | "24-hour">(
    "12-hour",
  );
  const [copyrightPosition, setCopyrightPosition] = useState<
    "bottom-left" | "bottom-right" | "bottom-center"
  >("bottom-center");
  const [displayTheme, setDisplayTheme] = useState<
    "default" | "minimal" | "classic"
  >("default");

  // Service Title customization
  const [customServiceTitle, setCustomServiceTitle] = useState("");
  const [serviceTitleSize, setServiceTitleSize] = useState<
    "small" | "medium" | "large" | "extra-large"
  >("medium");

  // Social Handles settings
  const [showSocialHandles, setShowSocialHandles] = useState(false);
  const [facebookHandle, setFacebookHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [socialHandlesColor, setSocialHandlesColor] = useState("#ffffff");
  const [socialHandlesPosition, setSocialHandlesPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center"
  >("bottom-left");
  const [socialHandlesSize, setSocialHandlesSize] = useState<
    "small" | "medium" | "large" | "extra-large"
  >("medium");

  // Animation key to trigger re-renders for transitions
  const [animationKey, setAnimationKey] = useState(0);

  // Current time for timestamp display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Assets modal state
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  const [assetsModalFilter, setAssetsModalFilter] = useState<"all" | "video">(
    "all",
  );

  // Logo assets modal state
  const [isLogoAssetsModalOpen, setIsLogoAssetsModalOpen] = useState(false);

  // Persist background state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "qworship-live-background",
        JSON.stringify({
          type: appliedBackgroundType,
          color: appliedBackgroundColor,
          image: appliedBackgroundImage,
          video: appliedBackgroundVideo,
          hasLiveSettings: hasLiveSettingsBackground,
        }),
      );
      console.log(
        "LivePresentation: Background state persisted to localStorage",
      );
    } catch (e) {
      console.warn("Failed to persist background state:", e);
    }
  }, [
    appliedBackgroundType,
    appliedBackgroundColor,
    appliedBackgroundImage,
    appliedBackgroundVideo,
    hasLiveSettingsBackground,
  ]);

  // Zustand store subscription for cross-window Bible sync via BroadcastChannel
  const {
    currentVerse,
    formattedReference,
    bibleVersion,
    isProjecting,
    lastUpdated,
    clearProjection: clearBibleProjection,
  } = useBibleProjectionStore();

  // Display mode store for unified content display control
  const { activeMode } = useDisplayModeStore();

  // Request display mode sync from other windows on mount
  useEffect(() => {
    requestDisplayModeSync();
  }, []);

  // Subscribe to Zustand store changes and update slide content (for Hands-free Bible ONLY)
  // NOTE: This useEffect is for the Hands-free Bible widget which uses the Zustand store.
  // The On-screen Bible (BibleProjectionWidget) uses postMessage (PROJECT_BIBLE_VERSE) instead.
  // We must NOT let this useEffect override On-screen Bible projections.
  useEffect(() => {
    // GUARD: Only handle HFB projections, not On-screen Bible projections
    // When activeMode is 'on-screen-bible', the PROJECT_BIBLE_VERSE handler has already set the correct state
    const currentMode = useDisplayModeStore.getState().activeMode;
    if (currentMode === "on-screen-bible") {
      console.log(
        "LivePresentation: Skipping Zustand update - On-screen Bible is active",
      );
      return;
    }

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
        "LivePresentation: Zustand store updated (HFB) - projecting verse as slide content:",
        formattedReference,
      );

      // Display as slide content (like songs) instead of modal overlay
      setCurrentSongProjection({
        title: formattedReference,
        sectionTitle: bibleVersion,
        lyrics: text,
      });
      setProjectionType("bible");

      // Set display mode to hfb-bible when a Bible verse is projected
      // Gate: only switch from 'none', 'slides', or already 'hfb-bible' to avoid overriding active song projections
      // This is critical for new session reliability - ensures verses always display on audience screen
      const displayModeStore = useDisplayModeStore.getState();
      if (
        currentMode === "none" ||
        currentMode === "slides" ||
        currentMode === "hfb-bible"
      ) {
        console.log(
          "LivePresentation: Setting display mode to hfb-bible (from:",
          currentMode,
          ")",
        );
        displayModeStore.setMode("hfb-bible");
      } else {
        console.log(
          "LivePresentation: Not overriding active mode:",
          currentMode,
          "- keeping current projection",
        );
      }
    } else if (!isProjecting && currentVerse === null) {
      // Clear projection when store is cleared
      console.log(
        "LivePresentation: Zustand store cleared - clearing Bible slide content",
      );
      // Only clear if current projection is Bible type
      setProjectionType((prev) => {
        if (prev === "bible") {
          setCurrentSongProjection(null);
          return null;
        }
        return prev;
      });
    }
  }, [
    currentVerse,
    formattedReference,
    bibleVersion,
    isProjecting,
    lastUpdated,
    activeMode,
  ]);

  // Request sync from other windows on mount
  useEffect(() => {
    console.log("LivePresentation: Requesting sync from other windows");
    requestSyncFromOtherWindows();

    // Also request background and Bible sync from parent window
    if (window.opener && !window.opener.closed) {
      console.log(
        "LivePresentation: Requesting background sync from parent window",
      );
      window.opener.postMessage(
        { type: "REQUEST_BACKGROUND_SYNC" },
        window.location.origin,
      );

      // Request Bible projection sync after a brief delay to ensure listeners are ready
      // This ensures new sessions receive any active Bible projection from the parent
      setTimeout(() => {
        if (window.opener && !window.opener.closed) {
          console.log(
            "LivePresentation: Requesting Bible projection sync from parent window",
          );
          window.opener.postMessage(
            { type: "REQUEST_BIBLE_SYNC" },
            window.location.origin,
          );
        }
      }, 500);
    }
  }, []);

  // Current verse context for next/previous navigation
  const currentVerseContextRef = useRef<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);

  // Bible passage navigation state
  const [currentBiblePassage, setCurrentBiblePassage] = useState<{
    reference: string;
    version: string;
    verses: Array<{ number: number; text: string }>;
  } | null>(null);
  const [currentBibleVerseIndex, setCurrentBibleVerseIndex] = useState(0);

  // OBS integration state
  const [obsSettings, setObsSettings] = useState<OBSSettings | null>(null);
  const [isOBSPanelOpen, setIsOBSPanelOpen] = useState(false);

  // Function to apply background immediately for a specific slide
  const applySlideBackground = (slideNumber: number) => {
    if (hasLiveSettingsBackground) {
      // Don't change background if Live Settings background is active
      return;
    }

    const slideIndex = slideNumber - 1;
    const slide = slides[slideIndex];

    if (slide && slide.itemId && slideBackgrounds[slide.itemId]) {
      const background = slideBackgrounds[slide.itemId];

      switch (background.type) {
        case "fill":
        case "gradient":
          setAppliedBackgroundType("color");
          setAppliedBackgroundColor(background.value);
          setAppliedBackgroundImage(null);
          setAppliedBackgroundVideo(null);
          break;
        case "image":
          setAppliedBackgroundType("image");
          setAppliedBackgroundImage(background.value);
          setAppliedBackgroundVideo(null);
          break;
        case "video":
          setAppliedBackgroundType("video");
          setAppliedBackgroundVideo(background.value);
          setAppliedBackgroundImage(null);
          break;
        case "none":
          setAppliedBackgroundType("color");
          setAppliedBackgroundColor("#000000");
          setAppliedBackgroundImage(null);
          setAppliedBackgroundVideo(null);
          break;
      }
    }
  };

  // Function to generate background style
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (appliedBackgroundType) {
      case "color":
        return { backgroundColor: appliedBackgroundColor };
      case "image": {
        const resolvedImageUrl = resolveMediaUrl(appliedBackgroundImage);
        return resolvedImageUrl
          ? {
              backgroundImage: `url(${resolvedImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : { backgroundColor: "#000000" };
      }
      case "video":
        return { backgroundColor: "#000000" }; // Video will be handled separately with a video element
      default:
        return { backgroundColor: "#000000" };
    }
  };

  // Function to apply background changes
  const applyBackgroundChanges = () => {
    console.log("Applying background changes:", {
      backgroundType,
      backgroundColor,
      backgroundImage,
      backgroundVideo,
    });

    setAppliedBackgroundType(backgroundType);
    setAppliedBackgroundColor(backgroundColor);
    setAppliedBackgroundImage(backgroundImage);
    setAppliedBackgroundVideo(backgroundVideo);
    setIsBackgroundPanelOpen(false);

    // Mark that Live Settings background is now active (overrides slide backgrounds)
    setHasLiveSettingsBackground(true);

    console.log(
      "🎨 LIVE SETTINGS BACKGROUND APPLIED - This will override all slide backgrounds",
    );
    console.log("🔒 Background type:", backgroundType);
    console.log(
      "🔒 Background value:",
      backgroundColor || backgroundImage || backgroundVideo,
    );

    // Send message to dashboard about background change
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "BACKGROUND_CHANGE_FROM_LIVE",
          data: {
            backgroundType,
            backgroundColor,
            backgroundImage,
            backgroundVideo,
          },
        },
        window.location.origin,
      );
    }
  };

  // Function to close settings and reset to main screen
  const closeSettings = () => {
    setIsSettingsOpen(false);
    setSettingsScreen("main");
  };

  // Function to apply live settings to presentation
  const applyLiveSettings = (settingChanged?: string) => {
    // Send settings to dashboard for synchronization
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "LIVE_SETTINGS_UPDATE",
          data: {
            slidesTransparent,
            slideTextSize,
            slideAlignment,
            contentFixedArea,
            customLogo,
            logoSize,
            logoPosition,
            showTimestamp,
            autoAdvanceSlides,
            slideTransition,
            showSlideCounter,
            showServiceTitle,
            showCopyrightInfo,
            showAuthorInfo,
            slideNumberPosition,
            timestampFormat,
            copyrightPosition,
            displayTheme,
            customServiceTitle,
            serviceTitleSize,
            showSocialHandles,
            facebookHandle,
            instagramHandle,
            socialHandlesColor,
            socialHandlesPosition,
            socialHandlesSize,
          },
        },
        window.location.origin,
      );
    }

    // Send toast notification to Live Console instead of showing on live screen
    const getSettingDescription = () => {
      if (settingChanged) return settingChanged;
      return "Live presentation settings have been applied successfully.";
    };

    // Notify Live Console to show toast (audience shouldn't see toasts)
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: "SHOW_TOAST",
          title: "Settings Saved",
          description: getSettingDescription(),
        },
        window.location.origin,
      );
    }
  };

  // Track if this is initial load to avoid showing toast on page load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Apply settings whenever they change
  useEffect(() => {
    if (!isInitialLoad) {
      applyLiveSettings();
    }
  }, [
    slidesTransparent,
    slideTextSize,
    slideAlignment,
    contentFixedArea,
    customLogo,
    logoSize,
    logoPosition,
    showTimestamp,
    autoAdvanceSlides,
    slideTransition,
    showSlideCounter,
    showServiceTitle,
    showCopyrightInfo,
    showAuthorInfo,
    slideNumberPosition,
    timestampFormat,
    copyrightPosition,
    displayTheme,
    customServiceTitle,
    serviceTitleSize,
    showSocialHandles,
    facebookHandle,
    instagramHandle,
    socialHandlesColor,
    socialHandlesPosition,
    socialHandlesSize,
    isInitialLoad,
  ]);

  // Mark initial load as complete after first render
  useEffect(() => {
    setIsInitialLoad(false);
  }, []);

  // Trigger animation key update when slides change or transition type changes
  useEffect(() => {
    if (slideTransition !== "none") {
      setAnimationKey((prev) => prev + 1);
    }
  }, [currentSlide, slideTransition]);

  // Update timestamp every second
  useEffect(() => {
    if (showTimestamp) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showTimestamp]);

  // Get slide style with transparency support
  const getSlideStyle = (): React.CSSProperties => {
    const baseStyle = getBackgroundStyle();
    if (slidesTransparent) {
      return { backgroundColor: "transparent", backgroundImage: "none" };
    }
    return baseStyle;
  };

  // Get text size class based on setting
  const getTextSizeClass = () => {
    switch (slideTextSize) {
      case "small":
        return "text-2xl";
      case "medium":
        return "text-3xl";
      case "large":
        return "text-4xl";
      case "extra-large":
        return "text-5xl";
      case "2x-extra-large":
        return "text-6xl";
      case "3x-extra-large":
        return "text-7xl";
      case "4x-extra-large":
        return "text-8xl";
      case "5x-extra-large":
        return "text-9xl";
      case "6x-extra-large":
        return "text-[10rem]"; // Custom size for very large text
      default:
        return "text-4xl";
    }
  };

  // Get logo size class
  const getLogoSizeClass = () => {
    switch (logoSize) {
      case "small":
        return "w-16 h-16";
      case "medium":
        return "w-24 h-24";
      case "large":
        return "w-32 h-32";
      default:
        return "w-24 h-24";
    }
  };

  // Get logo position class
  const getLogoPositionClass = () => {
    switch (logoPosition) {
      case "center":
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  // Get slide transition class
  const getSlideTransitionClass = () => {
    switch (slideTransition) {
      case "none":
        return "";
      case "fade":
        return "transition-opacity duration-700 ease-in-out";
      case "slide":
        return "transition-transform duration-500 ease-in-out";
      case "slideUp":
        return "transition-transform duration-600 ease-out slide-up";
      case "slideDown":
        return "transition-transform duration-600 ease-out slide-down";
      case "slideLeft":
        return "transition-transform duration-600 ease-out slide-left";
      case "slideRight":
        return "transition-transform duration-600 ease-out slide-right";
      case "zoom":
        return "transition-transform duration-800 ease-in-out zoom-transition";
      case "flipX":
        return "transition-transform duration-700 ease-in-out flip-x";
      case "flipY":
        return "transition-transform duration-700 ease-in-out flip-y";
      case "dissolve":
        return "transition-all duration-900 ease-in-out dissolve-transition";
      case "wipe":
        return "transition-all duration-600 ease-in wipe-transition";
      default:
        return "transition-opacity duration-700 ease-in-out";
    }
  };

  // Function to format timestamp based on current setting
  const formatTimestamp = () => {
    if (timestampFormat === "24-hour") {
      return currentTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return currentTime.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  // Function to get slide counter text
  const getSlideCounterText = () => {
    return `${currentSlide} / ${slides.length}`;
  };

  // Function to get current song title for service title display
  const getCurrentServiceTitle = () => {
    // Use custom title if provided
    if (customServiceTitle.trim()) {
      return customServiceTitle.trim();
    }

    // Otherwise use automatic detection
    if (currentSongProjection?.title) {
      return currentSongProjection.title;
    }
    if (slides.length > 0 && slides[currentSlide - 1]) {
      const slide = slides[currentSlide - 1];
      if (slide.type === "verse" || slide.type === "chorus") {
        return slide.title || "Song";
      }
      if (slide.type === "bible-verse") {
        return slide.reference || "Scripture";
      }
    }
    return "Q-worship Presentation";
  };

  // Function to get service title size class
  const getServiceTitleSizeClass = () => {
    switch (serviceTitleSize) {
      case "small":
        return "text-base";
      case "medium":
        return "text-lg";
      case "large":
        return "text-xl";
      case "extra-large":
        return "text-2xl";
      default:
        return "text-lg";
    }
  };

  // Function to get social handles position class
  const getSocialHandlesPositionClass = () => {
    switch (socialHandlesPosition) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      default:
        return "bottom-4 left-4";
    }
  };

  // Function to get social handles size classes
  const getSocialHandlesSizeClasses = () => {
    switch (socialHandlesSize) {
      case "small":
        return {
          icon: "w-4 h-4",
          text: "text-xs",
          spacing: "space-x-2",
          padding: "px-3 py-1",
        };
      case "medium":
        return {
          icon: "w-5 h-5",
          text: "text-sm",
          spacing: "space-x-2",
          padding: "px-4 py-2",
        };
      case "large":
        return {
          icon: "w-6 h-6",
          text: "text-base",
          spacing: "space-x-3",
          padding: "px-5 py-3",
        };
      case "extra-large":
        return {
          icon: "w-8 h-8",
          text: "text-lg",
          spacing: "space-x-4",
          padding: "px-6 py-4",
        };
      default:
        return {
          icon: "w-5 h-5",
          text: "text-sm",
          spacing: "space-x-2",
          padding: "px-4 py-2",
        };
    }
  };

  // Function to get position classes for various overlay elements
  const getPositionClass = (position: string) => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      default:
        return "bottom-4 right-4";
    }
  };

  // Auto advance slides functionality
  useEffect(() => {
    if (
      !autoAdvanceSlides ||
      !currentSlide ||
      isInFullscreen ||
      slides.length === 0
    )
      return;

    const timer = setTimeout(() => {
      const nextSlide = currentSlide >= slides.length ? 1 : currentSlide + 1;
      setCurrentSlide(nextSlide);
    }, 8000); // Auto advance every 8 seconds

    return () => clearTimeout(timer);
  }, [currentSlide, autoAdvanceSlides, slides.length, isInFullscreen]);

  // Bible versions
  const bibleVersions = ["KJV", "NKJV", "AMP", "MSG", "GN", "ESV"];

  // Robust fullscreen toggle function with browser compatibility
  const toggleFullscreen = async () => {
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        console.log("Exiting fullscreen...");

        // Exit fullscreen with browser compatibility
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } else {
        console.log("Entering fullscreen...");

        // Enter fullscreen with browser compatibility
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle error:", error);
    }
  };

  // Listen for messages from the main dashboard
  useEffect(() => {
    console.log("Live presentation: Setting up message listener");

    // Send ready signal to parent window
    const sendReadySignal = () => {
      if (window.opener) {
        console.log("Live presentation: Sending ready signal to dashboard");
        window.opener.postMessage(
          {
            type: "LIVE_READY",
            data: {},
          },
          window.location.origin,
        );
      }
    };

    // Send ready signal when component mounts
    setTimeout(sendReadySignal, 100);

    const handleMessage = (event: MessageEvent) => {
      console.log("Live presentation: Received message", event.data);

      if (event.origin !== window.location.origin) {
        console.log(
          "Live presentation: Rejecting message from wrong origin:",
          event.origin,
        );
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case "SLIDE_CHANGE":
          setCurrentSlide(data.slideNumber);

          // Switch display mode to 'slides' when navigating slides
          // This ensures we return to slide display after HFB Bible or Song projections
          useDisplayModeStore.getState().setMode("slides");

          // Clear any song/bible projection to show slide content
          setCurrentSongProjection(null);
          setProjectionType(null);

          // Store background data if provided
          if (data.background && data.itemId) {
            setSlideBackgrounds((prev) => ({
              ...prev,
              [data.itemId]: data.background,
            }));
          }

          // Apply background immediately for instant synchronization
          applySlideBackground(data.slideNumber);

          // Apply slide-specific background only if no Live Settings background is active
          if (data.background && !hasLiveSettingsBackground) {
            const background = data.background;
            console.log(
              "✅ APPLYING slide-specific background (no Live Settings background active):",
              background,
            );

            switch (background.type) {
              case "fill":
                console.log("Applying fill background:", background.value);
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.value);
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              case "gradient":
                console.log("Applying gradient background:", background.value);
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.value);
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              case "image":
                console.log("Applying image background:", background.value);
                setAppliedBackgroundType("image");
                setAppliedBackgroundImage(background.value);
                setAppliedBackgroundVideo(null);
                break;
              case "video":
                console.log("Applying video background:", background.value);
                setAppliedBackgroundType("video");
                setAppliedBackgroundVideo(background.value);
                setAppliedBackgroundImage(null);
                break;
              case "none":
                console.log("Removing background");
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor("#000000");
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              default:
                console.log("Using default background (fill black)");
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor("#000000");
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
            }
          } else if (data.background && hasLiveSettingsBackground) {
            console.log(
              "🔒 SLIDE BACKGROUND BLOCKED - Live Settings background is active and takes priority",
            );
            console.log(
              "🔒 Current Live Settings background maintained - ignoring:",
              data.background,
            );
            console.log("🔒 Applied background type:", appliedBackgroundType);
            console.log(
              "🔒 Applied background value:",
              appliedBackgroundColor ||
                appliedBackgroundImage ||
                appliedBackgroundVideo,
            );
          } else if (!data.background && hasLiveSettingsBackground) {
            console.log(
              "🔒 NO SLIDE BACKGROUND - Live Settings background remains active",
            );
          } else if (!data.background && !hasLiveSettingsBackground) {
            console.log(
              "⚠️ NO SLIDE BACKGROUND DATA and no Live Settings background - using default black",
            );
            setAppliedBackgroundType("color");
            setAppliedBackgroundColor("#000000");
            setAppliedBackgroundImage(null);
            setAppliedBackgroundVideo(null);
          }

          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  currentSlide: data.slideNumber,
                  background: {
                    type: appliedBackgroundType,
                    color: appliedBackgroundColor,
                    image: appliedBackgroundImage,
                    video: appliedBackgroundVideo,
                  },
                },
              },
              window.location.origin,
            );
          }
          break;
        case "SLIDES_SYNC":
          // Sync core slide data only (editorState handled by EDITOR_STATE_SYNC)
          if (data.slides && data.slides.length > 0) {
            setSlides(data.slides);
            setTotalSlides(data.totalSlides || data.slides.length);

            // Automatically switch to slides display mode when slides data arrives during initial GO LIVE
            // Switch if current mode is 'none' or 'slides' (from sync), but don't override active projections
            // This fixes the timing issue where display mode was set before slide data arrived
            const displayModeStore = useDisplayModeStore.getState();
            if (
              displayModeStore.activeMode === "none" ||
              displayModeStore.activeMode === "slides"
            ) {
              displayModeStore.setMode("slides");
            }

            // Store background data if provided
            if (data.itemBackgrounds) {
              setSlideBackgrounds(data.itemBackgrounds);
              // Apply background for current slide immediately
              applySlideBackground(currentSlide);
            }

            // Send state update to Live Console for preview sync
            // NOTE: Do NOT include currentSlide to avoid resetting slide position in LiveControlCentre
            // SLIDES_SYNC is for data sync (slides array, backgrounds), not for slide position sync
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "LIVE_STATE_UPDATE",
                  data: {
                    slides: data.slides,
                    // currentSlide intentionally omitted to prevent position reset
                    slideBackgrounds: data.itemBackgrounds || {},
                    background: {
                      type: appliedBackgroundType,
                      color: appliedBackgroundColor,
                      image: appliedBackgroundImage,
                      video: appliedBackgroundVideo,
                    },
                  },
                },
                window.location.origin,
              );
            }
          }
          break;
        case "EDITOR_STATE_SYNC":
          // Separate handler for editor formatting state (debounced in QworshipHome)
          if (data.titleEditorState !== undefined) {
            setTitleEditorState(data.titleEditorState);
          }
          if (data.editorState !== undefined) {
            setEditorState(data.editorState);
          }
          break;
        case "CLOSE_LIVE":
          window.close();
          break;
        case "BACKGROUND_UPDATE":
          const { background, itemId } = data;

          // Store background data for this item
          if (background && itemId) {
            setSlideBackgrounds((prev) => ({
              ...prev,
              [itemId]: background,
            }));
          }

          // Check if this is from Live Console (has color/image/video format)
          if (
            background &&
            background.type &&
            (background.color !== undefined ||
              background.image !== undefined ||
              background.video !== undefined)
          ) {
            // Live Console format - apply directly as Live Settings background
            console.log("Live Console: Applying background", background);
            setHasLiveSettingsBackground(true);
            switch (background.type) {
              case "color":
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.color || "#000000");
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                setBackgroundType("color");
                setBackgroundColor(background.color || "#000000");
                break;
              case "image":
                setAppliedBackgroundType("image");
                setAppliedBackgroundImage(background.image);
                setAppliedBackgroundVideo(null);
                setBackgroundType("image");
                setBackgroundImage(background.image);
                break;
              case "video":
                setAppliedBackgroundType("video");
                setAppliedBackgroundVideo(background.video);
                setAppliedBackgroundImage(null);
                setBackgroundType("video");
                setBackgroundVideo(background.video);
                break;
            }
            // Send state update back to Live Console for preview sync with applied values
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "LIVE_STATE_UPDATE",
                  data: {
                    background: {
                      type: background.type,
                      color:
                        background.type === "color"
                          ? background.color || "#000000"
                          : null,
                      image:
                        background.type === "image" ? background.image : null,
                      video:
                        background.type === "video" ? background.video : null,
                    },
                  },
                },
                window.location.origin,
              );
            }
          }
          // Dashboard format (slide-specific backgrounds)
          else if (background && !hasLiveSettingsBackground) {
            switch (background.type) {
              case "fill":
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.value);
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              case "gradient":
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.value);
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              case "image":
                setAppliedBackgroundType("image");
                setAppliedBackgroundImage(background.value);
                setAppliedBackgroundVideo(null);
                break;
              case "video":
                setAppliedBackgroundType("video");
                setAppliedBackgroundVideo(background.value);
                setAppliedBackgroundImage(null);
                break;
              case "none":
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor("#000000");
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
            }
            // Send state update back to Live Console for preview sync (Dashboard format)
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "LIVE_STATE_UPDATE",
                  data: {
                    background: {
                      type:
                        background.type === "fill" ||
                        background.type === "gradient" ||
                        background.type === "none"
                          ? "color"
                          : background.type,
                      color:
                        background.type === "fill" ||
                        background.type === "gradient"
                          ? background.value
                          : background.type === "none"
                            ? "#000000"
                            : null,
                      image:
                        background.type === "image" ? background.value : null,
                      video:
                        background.type === "video" ? background.value : null,
                    },
                  },
                },
                window.location.origin,
              );
            }
          }
          break;
        case "ASSET_SELECTED_FOR_BACKGROUND":
          console.log(
            "Live presentation: Received background asset:",
            event.data,
          );
          // Access assetUrl directly from the message data
          const url = event.data.assetUrl;
          if (url) {
            const extension = url.split(".").pop()?.toLowerCase();
            if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
              console.log("Setting video background:", url);
              setBackgroundType("video");
              setBackgroundVideo(url);
              // Send state update back to Live Console for preview sync
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                  {
                    type: "LIVE_STATE_UPDATE",
                    data: {
                      background: {
                        type: "video",
                        color: null,
                        image: null,
                        video: url,
                      },
                    },
                  },
                  window.location.origin,
                );
              }
            } else if (
              ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
            ) {
              console.log("Setting image background:", url);
              setBackgroundType("image");
              setBackgroundImage(url);
              // Send state update back to Live Console for preview sync
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                  {
                    type: "LIVE_STATE_UPDATE",
                    data: {
                      background: {
                        type: "image",
                        color: null,
                        image: url,
                        video: null,
                      },
                    },
                  },
                  window.location.origin,
                );
              }
            }
          }
          break;
        case "BIBLE_VERSE_DISPLAY":
          console.log(
            "Live presentation: Received Bible verse from voice command:",
            data,
          );
          // Display the Bible verse as slide content (like songs)
          setCurrentSongProjection({
            title: data.reference,
            sectionTitle: data.version,
            lyrics: data.text,
          });
          setProjectionType("bible");

          // Switch display mode to hfb-bible so content actually displays on audience screen
          // This is critical - without this, the rendering condition activeMode === 'hfb-bible' won't be true
          {
            const displayModeStore = useDisplayModeStore.getState();
            displayModeStore.setMode("hfb-bible");
          }

          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  songProjection: {
                    title: data.reference,
                    sectionTitle: data.version,
                    lyrics: data.text,
                  },
                  bibleProjection: {
                    reference: data.reference,
                    text: data.text,
                    version: data.version,
                  },
                  projectionType: "bible",
                },
              },
              window.location.origin,
            );
          }
          break;

        case "GO_TO_SLIDE":
          console.log(
            "🎯🎯🎯 LivePresentation: RECEIVED GO_TO_SLIDE - slideIndex:",
            data.slideIndex,
            "background:",
            data.background,
            "itemId:",
            data.itemId,
          );
          const goToSlideNumber = data.slideIndex + 1;
          setCurrentSlide(goToSlideNumber);

          // Switch display mode to 'slides' when navigating slides
          // This ensures we return to slide display after HFB Bible or Song projections
          useDisplayModeStore.getState().setMode("slides");

          // Clear song/bible projection to show slide content
          setCurrentSongProjection(null);
          setProjectionType(null);

          // Clear Bible projection when navigating to slides (after voice command projection)
          clearBibleProjection();

          // Store background data if provided
          if (data.background && data.itemId) {
            setSlideBackgrounds((prev) => ({
              ...prev,
              [data.itemId]: data.background,
            }));
          }

          // Apply background immediately if provided and no Live Settings background is active
          if (data.background && !hasLiveSettingsBackground) {
            const background = data.background;
            console.log("GO_TO_SLIDE: Applying slide background:", background);

            switch (background.type) {
              case "fill":
              case "gradient":
                setAppliedBackgroundType("color");
                setAppliedBackgroundColor(background.value || "#000000");
                setAppliedBackgroundImage(null);
                setAppliedBackgroundVideo(null);
                break;
              case "image":
                setAppliedBackgroundType("image");
                setAppliedBackgroundImage(background.value);
                setAppliedBackgroundVideo(null);
                break;
              case "video":
                setAppliedBackgroundType("video");
                setAppliedBackgroundVideo(background.value);
                setAppliedBackgroundImage(null);
                break;
              default:
                applySlideBackground(goToSlideNumber);
            }
          } else {
            applySlideBackground(goToSlideNumber);
          }

          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  currentSlide: goToSlideNumber,
                  slides: slides,
                  slideBackgrounds: slideBackgrounds,
                },
              },
              window.location.origin,
            );
          }
          break;
        case "PROJECT_SONG":
          console.log("Live Console: Projecting song", data);
          setCurrentSongProjection({
            title: data.title,
            sectionTitle: data.sectionTitle,
            lyrics: data.lyrics,
          });
          if (data.fullSongData) {
            setCurrentProjectedSong(data.fullSongData);
          }
          // Pacing: accept initial line index from the console
          if (typeof data.pacingLineIdx === "number") {
            setPacingLineIdx(data.pacingLineIdx);
          } else {
            setPacingLineIdx(-1);
          }
          setProjectionType("song");
          useDisplayModeStore.getState().setMode("song");
          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  songProjection: {
                    title: data.title,
                    sectionTitle: data.sectionTitle,
                    lyrics: data.lyrics,
                  },
                  bibleProjection: null,
                  projectionType: "song",
                },
              },
              window.location.origin,
            );
          }
          break;
        case "PACING_LINE_UPDATE":
          if (typeof data?.lineIdx === "number") {
            setPacingLineIdx(data.lineIdx);
          }
          break;
        case "PROJECT_BIBLE_VERSE":
          console.log("Live Console: Projecting Bible verse", data);
          // Display as slide content (like songs)
          setCurrentSongProjection({
            title: data.reference,
            sectionTitle: data.version,
            lyrics: data.text,
          });
          setProjectionType("bible");

          // Set display mode to on-screen-bible so content actually displays on audience screen
          useDisplayModeStore.getState().setMode("on-screen-bible");

          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  songProjection: {
                    title: data.reference,
                    sectionTitle: data.version,
                    lyrics: data.text,
                  },
                  bibleProjection: {
                    reference: data.reference,
                    text: data.text,
                    version: data.version,
                  },
                  projectionType: "bible",
                },
              },
              window.location.origin,
            );
          }
          break;
        case "CLEAR_PROJECTION":
          console.log("Live Console: Clearing all projections");
          setCurrentSongProjection(null);
          setCurrentProjectedSong(null);
          setProjectionType(null);
          useDisplayModeStore.getState().setMode("none");
          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  songProjection: null,
                  bibleProjection: null,
                  projectionType: null,
                },
              },
              window.location.origin,
            );
          }
          break;
        case "REQUEST_STATE_SYNC":
          console.log("Live Console: Requesting state sync");
          // Send full state back to Live Console
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  songProjection: currentSongProjection,
                  bibleProjection: null,
                  projectionType: projectionType,
                  background: {
                    type: appliedBackgroundType,
                    color: appliedBackgroundColor,
                    image: appliedBackgroundImage,
                    video: appliedBackgroundVideo,
                  },
                  logo: {
                    url: customLogo,
                    size: logoSize,
                    position: logoPosition,
                  },
                  slides: slides,
                  currentSlide: currentSlide,
                  slideBackgrounds: slideBackgrounds,
                  displaySettings: {
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
                    slidesTransparent,
                    slideTextSize,
                    slideAlignment,
                    contentFixedArea,
                    slideTransition,
                    autoAdvanceSlides,
                    displayTheme,
                  },
                },
              },
              window.location.origin,
            );
          }
          break;
        case "TOGGLE_FULLSCREEN":
          console.log("Live Console: Toggling fullscreen");
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          break;
        case "SETTINGS_UPDATE":
          console.log("Live Console: Updating settings", data);
          // Apply all settings from Live Console (do NOT set hasLiveSettingsBackground here - only BACKGROUND_UPDATE should do that)
          if (data.slidesTransparent !== undefined)
            setSlidesTransparent(data.slidesTransparent);
          if (data.slideTextSize !== undefined)
            setSlideTextSize(data.slideTextSize);
          if (data.slideAlignment !== undefined)
            setSlideAlignment(data.slideAlignment);
          if (data.contentFixedArea !== undefined)
            setContentFixedArea(data.contentFixedArea);
          if (data.slideTransition !== undefined)
            setSlideTransition(data.slideTransition);
          if (data.autoAdvanceSlides !== undefined)
            setAutoAdvanceSlides(data.autoAdvanceSlides);
          if (data.customLogo !== undefined) setCustomLogo(data.customLogo);
          if (data.logoSize !== undefined) setLogoSize(data.logoSize);
          if (data.logoPosition !== undefined)
            setLogoPosition(data.logoPosition);
          if (data.displayTheme !== undefined)
            setDisplayTheme(data.displayTheme);
          if (data.showTimestamp !== undefined)
            setShowTimestamp(data.showTimestamp);
          if (data.timestampFormat !== undefined)
            setTimestampFormat(data.timestampFormat);
          if (data.showSlideCounter !== undefined)
            setShowSlideCounter(data.showSlideCounter);
          if (data.slideNumberPosition !== undefined)
            setSlideNumberPosition(data.slideNumberPosition);
          if (data.showServiceTitle !== undefined)
            setShowServiceTitle(data.showServiceTitle);
          if (data.customServiceTitle !== undefined)
            setCustomServiceTitle(data.customServiceTitle);
          if (data.serviceTitleSize !== undefined)
            setServiceTitleSize(data.serviceTitleSize);
          if (data.showCopyrightInfo !== undefined)
            setShowCopyrightInfo(data.showCopyrightInfo);
          if (data.copyrightPosition !== undefined)
            setCopyrightPosition(data.copyrightPosition);
          if (data.showAuthorInfo !== undefined)
            setShowAuthorInfo(data.showAuthorInfo);
          if (data.showSocialHandles !== undefined)
            setShowSocialHandles(data.showSocialHandles);
          if (data.facebookHandle !== undefined)
            setFacebookHandle(data.facebookHandle);
          if (data.instagramHandle !== undefined)
            setInstagramHandle(data.instagramHandle);
          if (data.socialHandlesColor !== undefined)
            setSocialHandlesColor(data.socialHandlesColor);
          if (data.socialHandlesPosition !== undefined)
            setSocialHandlesPosition(data.socialHandlesPosition);
          if (data.socialHandlesSize !== undefined)
            setSocialHandlesSize(data.socialHandlesSize);
          // Send state update back to Live Console for preview sync with all displaySettings and slideSettings
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  displaySettings: {
                    showTimestamp: data.showTimestamp,
                    timestampFormat: data.timestampFormat,
                    showSlideCounter: data.showSlideCounter,
                    slideNumberPosition: data.slideNumberPosition,
                    showServiceTitle: data.showServiceTitle,
                    customServiceTitle: data.customServiceTitle,
                    serviceTitleSize: data.serviceTitleSize,
                    showCopyrightInfo: data.showCopyrightInfo,
                    copyrightPosition: data.copyrightPosition,
                    showAuthorInfo: data.showAuthorInfo,
                    showSocialHandles: data.showSocialHandles,
                    facebookHandle: data.facebookHandle,
                    instagramHandle: data.instagramHandle,
                    socialHandlesColor: data.socialHandlesColor,
                    socialHandlesPosition: data.socialHandlesPosition,
                    socialHandlesSize: data.socialHandlesSize,
                    slidesTransparent: data.slidesTransparent,
                    slideTextSize: data.slideTextSize,
                    slideAlignment: data.slideAlignment,
                    contentFixedArea: data.contentFixedArea,
                    slideTransition: data.slideTransition,
                    autoAdvanceSlides: data.autoAdvanceSlides,
                    displayTheme: data.displayTheme,
                  },
                  logo: {
                    url: data.customLogo,
                    size: data.logoSize,
                    position: data.logoPosition,
                  },
                },
              },
              window.location.origin,
            );
          }
          break;
        case "LIVE_BACKGROUND_CLEARED":
          console.log("Live Console: Clearing live background");
          // Reset both internal state and applied state to default black
          setBackgroundType("color");
          setBackgroundColor("#000000");
          setBackgroundImage(null);
          setBackgroundVideo(null);
          setAppliedBackgroundType("color");
          setAppliedBackgroundColor("#000000");
          setAppliedBackgroundImage(null);
          setAppliedBackgroundVideo(null);
          setHasLiveSettingsBackground(false);
          // Send state update back to Live Console for preview sync
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              {
                type: "LIVE_STATE_UPDATE",
                data: {
                  background: {
                    type: "color",
                    color: "#000000",
                    image: null,
                    video: null,
                  },
                },
              },
              window.location.origin,
            );
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // OBS: Load settings from API (without password for security)
  useEffect(() => {
    const loadOBSSettings = async () => {
      try {
        const response = await fetch("/api/obs/settings");
        const data = await response.json();

        if (data.success && data.settings) {
          setObsSettings(data.settings);

          // Note: Auto-connect requires manual password entry for security
          // Users must manually connect via the OBS Control Panel
          if (data.settings.autoConnect && !data.settings.hasPassword) {
            // Send toast to Live Console instead of showing on live screen
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "SHOW_TOAST",
                  title: "OBS Setup Required",
                  description:
                    "Set your OBS password in Settings to enable auto-connect.",
                },
                window.location.origin,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error loading OBS settings:", error);
      }
    };

    loadOBSSettings();

    // Cleanup: disconnect on unmount
    return () => {
      if (obsService.isConnected()) {
        console.log("🎥 OBS Disconnecting on component unmount");
        obsService.disconnect().catch((error) => {
          console.error("Error disconnecting from OBS:", error);
        });
      }
    };
  }, []);

  // OBS: Send slide updates when content changes
  useEffect(() => {
    if (!obsService.isConnected()) return;

    // Send slide update for current song projection
    if (currentSongProjection && projectionType) {
      const slideData = {
        type: projectionType,
        title: currentSongProjection.title,
        sectionTitle: currentSongProjection.sectionTitle,
        content: currentSongProjection.lyrics,
        textColor: editorState.styleColor || editorState.textColor || "#ffffff",
        fontFamily:
          editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
        fontSize: getTextSizeClass(),
        textAlign: slideAlignment,
        backgroundColor: appliedBackgroundColor,
        backgroundImage: appliedBackgroundImage || undefined,
        backgroundVideo: appliedBackgroundVideo || undefined,
      };

      obsService.sendSlideUpdate(slideData as any).catch((error) => {
        console.error("Failed to send slide update to OBS:", error);
      });
    }
  }, [
    currentSongProjection,
    projectionType,
    appliedBackgroundColor,
    appliedBackgroundImage,
    appliedBackgroundVideo,
  ]);

  // OBS: Automatic scene switching based on content type
  useEffect(() => {
    if (!obsService.isConnected() || !obsSettings?.sceneMappings) return;

    if (projectionType === "song" && obsSettings.sceneMappings.song) {
      console.log(
        "🎥 OBS Switching to song scene:",
        obsSettings.sceneMappings.song,
      );
      obsService.setScene(obsSettings.sceneMappings.song).catch((error) => {
        console.error("Failed to switch to song scene:", error);
      });
    } else if (projectionType === "bible" && obsSettings.sceneMappings.bible) {
      console.log(
        "🎥 OBS Switching to bible scene:",
        obsSettings.sceneMappings.bible,
      );
      obsService.setScene(obsSettings.sceneMappings.bible).catch((error) => {
        console.error("Failed to switch to bible scene:", error);
      });
    }
  }, [projectionType, obsSettings]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is currently typing in an input field
      const isTypingInInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as Element)?.getAttribute("contenteditable") === "true";

      switch (event.key) {
        case "Escape":
          // Priority order: 1) Exit fullscreen 2) Close slide nav 3) Close window
          if (isInFullscreen) {
            console.log("ESC pressed - exiting fullscreen");
            toggleFullscreen();
          } else if (isSlideNavOpen) {
            setIsSlideNavOpen(false);
          } else {
            window.close();
          }
          break;
        case "ArrowLeft":
          // Don't interfere with input field navigation
          if (isTypingInInput) break;

          // Don't interfere with song navigation when a song is projected
          if (currentProjectedSong && projectionType === "song") {
            console.log(
              "🎵 MAIN NAVIGATION - Skipping slide navigation, song is being navigated",
            );
            break;
          }

          // Don't interfere with Bible navigation when Bible content is projected
          if (currentBiblePassage && projectionType === "bible") {
            console.log(
              "📖 MAIN NAVIGATION - Skipping slide navigation, Bible is being navigated",
            );
            break;
          }

          event.preventDefault();
          if (currentSlide > 1) {
            const newSlideNumber = currentSlide - 1;
            setCurrentSlide(newSlideNumber);
            // Apply background immediately for instant synchronization
            applySlideBackground(newSlideNumber);
            // Compute the new background for the message (since state update is async)
            const newSlide = slides[newSlideNumber - 1];
            let newBg = {
              type: appliedBackgroundType,
              color: appliedBackgroundColor,
              image: appliedBackgroundImage,
              video: appliedBackgroundVideo,
            };
            if (
              !hasLiveSettingsBackground &&
              newSlide?.itemId &&
              slideBackgrounds[newSlide.itemId]
            ) {
              const bg = slideBackgrounds[newSlide.itemId];
              if (bg.type === "fill" || bg.type === "gradient") {
                newBg = {
                  type: "color",
                  color: bg.value,
                  image: null,
                  video: null,
                };
              } else if (bg.type === "image") {
                newBg = {
                  type: "image",
                  color: "#000000",
                  image: bg.value,
                  video: null,
                };
              } else if (bg.type === "video") {
                newBg = {
                  type: "video",
                  color: "#000000",
                  image: null,
                  video: bg.value,
                };
              }
            }
            // Notify dashboard of slide change with full state
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "SLIDE_CHANGE_FROM_LIVE",
                  data: {
                    slideNumber: newSlideNumber,
                    slides: slides,
                    slideBackgrounds: slideBackgrounds,
                    background: newBg,
                  },
                },
                window.location.origin,
              );
            }
          }
          break;
        case "ArrowRight":
        case " ":
          // Don't interfere with input field navigation or space typing
          if (isTypingInInput) break;

          // Don't interfere with song navigation when a song is projected
          if (currentProjectedSong && projectionType === "song") {
            console.log(
              "🎵 MAIN NAVIGATION - Skipping slide navigation, song is being navigated",
            );
            break;
          }

          // Don't interfere with Bible navigation when Bible content is projected
          if (currentBiblePassage && projectionType === "bible") {
            console.log(
              "📖 MAIN NAVIGATION - Skipping slide navigation, Bible is being navigated",
            );
            break;
          }

          event.preventDefault();
          if (currentSlide < totalSlides) {
            const newSlideNumber = currentSlide + 1;
            setCurrentSlide(newSlideNumber);
            // Apply background immediately for instant synchronization
            applySlideBackground(newSlideNumber);
            // Compute the new background for the message (since state update is async)
            const newSlide = slides[newSlideNumber - 1];
            let newBg = {
              type: appliedBackgroundType,
              color: appliedBackgroundColor,
              image: appliedBackgroundImage,
              video: appliedBackgroundVideo,
            };
            if (
              !hasLiveSettingsBackground &&
              newSlide?.itemId &&
              slideBackgrounds[newSlide.itemId]
            ) {
              const bg = slideBackgrounds[newSlide.itemId];
              if (bg.type === "fill" || bg.type === "gradient") {
                newBg = {
                  type: "color",
                  color: bg.value,
                  image: null,
                  video: null,
                };
              } else if (bg.type === "image") {
                newBg = {
                  type: "image",
                  color: "#000000",
                  image: bg.value,
                  video: null,
                };
              } else if (bg.type === "video") {
                newBg = {
                  type: "video",
                  color: "#000000",
                  image: null,
                  video: bg.value,
                };
              }
            }
            // Notify dashboard of slide change with full state
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(
                {
                  type: "SLIDE_CHANGE_FROM_LIVE",
                  data: {
                    slideNumber: newSlideNumber,
                    slides: slides,
                    slideBackgrounds: slideBackgrounds,
                    background: newBg,
                  },
                },
                window.location.origin,
              );
            }
          }
          break;
        case "s":
        case "S":
          // Don't interfere with typing, but allow Ctrl+S
          if (isTypingInInput && !(event.ctrlKey || event.metaKey)) break;
          // Toggle slide navigation with 'S' key
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setIsSlideNavOpen(!isSlideNavOpen);
          }
          break;
        case "F5":
          // Toggle fullscreen for audience view
          event.preventDefault();
          console.log(
            "F5 pressed, current fullscreen:",
            !!document.fullscreenElement,
          );
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentSlide,
    totalSlides,
    isSlideNavOpen,
    currentProjectedSong,
    projectionType,
  ]);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      console.log("Fullscreen state changed:", isFullscreen);
      setIsInFullscreen(isFullscreen);
    };

    // Listen to all fullscreen change events (browser compatibility)
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  // Project scripture to live screen
  const projectToLiveScreen = (content: string) => {
    setLiveProjection(content);

    // Store in localStorage for potential external screen sync
    localStorage.setItem(
      "qworship-live-projection",
      JSON.stringify({
        content,
        timestamp: Date.now(),
        type: "scripture",
      }),
    );

    // Clear song projection
    setCurrentSongProjection(null);
    setProjectionType("bible");

    console.log("Scripture projected to live screen:", content);
  };

  // Project song to main screen - updated to support full song navigation
  const projectSong = (
    songTitle: string,
    sectionTitle: string,
    lyrics: string,
    fullSongData?: any,
  ) => {
    setCurrentSongProjection({
      title: songTitle,
      sectionTitle,
      lyrics,
    });

    // If full song data is provided, store it for navigation
    if (fullSongData && fullSongData.sections) {
      setCurrentProjectedSong({
        title: fullSongData.title,
        artist: fullSongData.artist,
        sections: fullSongData.sections,
      });

      // Find the current section index
      const sectionIndex = fullSongData.sections.findIndex(
        (section: any) =>
          section.title === sectionTitle || section.content === lyrics,
      );
      setCurrentSongSectionIndex(sectionIndex >= 0 ? sectionIndex : 0);

      console.log("🎵 LIVE - Projected song with navigation data:", {
        title: songTitle,
        currentSection: sectionIndex,
        totalSections: fullSongData.sections.length,
      });
    } else {
      // Fallback for single section projection
      setCurrentProjectedSong(null);
      setCurrentSongSectionIndex(0);
    }

    setLiveProjection(""); // Clear Bible projection
    setProjectionType("song");

    // Store in localStorage for potential external screen sync
    localStorage.setItem(
      "qworship-live-projection",
      JSON.stringify({
        songTitle,
        sectionTitle,
        lyrics,
        timestamp: Date.now(),
        type: "song",
      }),
    );

    console.log("Song projected to live screen:", { songTitle, sectionTitle });
  };

  // Clear all projections
  const clearProjection = () => {
    setLiveProjection("");
    setCurrentSongProjection(null);
    setCurrentProjectedSong(null);
    setCurrentSongSectionIndex(0);
    setProjectionType(null);

    localStorage.removeItem("qworship-live-projection");
    console.log("Projection cleared");
  };

  // Song section navigation functions for live presentation
  const navigateToNextSongSection = () => {
    if (!currentProjectedSong || !currentProjectedSong.sections) return;

    const nextIndex = currentSongSectionIndex + 1;
    if (nextIndex < currentProjectedSong.sections.length) {
      const nextSection = currentProjectedSong.sections[nextIndex];
      setCurrentSongSectionIndex(nextIndex);

      // Update the current projection
      setCurrentSongProjection({
        title: currentProjectedSong.title,
        sectionTitle: nextSection.title,
        lyrics: nextSection.content,
      });

      console.log(
        "🎵 LIVE NAVIGATION - Next section:",
        nextSection.title,
        `(${nextIndex + 1}/${currentProjectedSong.sections.length})`,
      );
    }
  };

  const navigateToPreviousSongSection = () => {
    if (!currentProjectedSong || !currentProjectedSong.sections) return;

    const prevIndex = currentSongSectionIndex - 1;
    if (prevIndex >= 0) {
      const prevSection = currentProjectedSong.sections[prevIndex];
      setCurrentSongSectionIndex(prevIndex);

      // Update the current projection
      setCurrentSongProjection({
        title: currentProjectedSong.title,
        sectionTitle: prevSection.title,
        lyrics: prevSection.content,
      });

      console.log(
        "🎵 LIVE NAVIGATION - Previous section:",
        prevSection.title,
        `(${prevIndex + 1}/${currentProjectedSong.sections.length})`,
      );
    }
  };

  // Bible verse navigation functions for live presentation
  const navigateToNextBibleVerse = () => {
    if (!currentBiblePassage || !currentBiblePassage.verses.length) return;

    const nextIndex = currentBibleVerseIndex + 1;
    if (nextIndex < currentBiblePassage.verses.length) {
      const nextVerse = currentBiblePassage.verses[nextIndex];
      setCurrentBibleVerseIndex(nextIndex);

      // Extract book and chapter from reference for individual verse display
      const referenceMatch = currentBiblePassage.reference.match(
        /^(.+?)\s+(?:Chapter\s+)?(\d+)(?:\s+verses?\s+(\d+)(?:\s+to\s+\d+)?)?/,
      );
      const bookName = referenceMatch
        ? referenceMatch[1]
        : currentBiblePassage.reference;
      const chapter = referenceMatch ? referenceMatch[2] : "";
      const verseReference = `${bookName} ${chapter}:${nextVerse.number}`;

      const verseText = `${nextVerse.number} ${nextVerse.text}`;

      // Update the current projection
      setCurrentSongProjection({
        title: verseReference,
        sectionTitle: "",
        lyrics: `${verseText}\n\n— ${currentBiblePassage.version}`,
      });

      console.log(
        "📖 BIBLE NAVIGATION - Next verse:",
        verseReference,
        `(${nextIndex + 1}/${currentBiblePassage.verses.length})`,
      );
    }
  };

  const navigateToPreviousBibleVerse = () => {
    if (!currentBiblePassage || !currentBiblePassage.verses.length) return;

    const prevIndex = currentBibleVerseIndex - 1;
    if (prevIndex >= 0) {
      const prevVerse = currentBiblePassage.verses[prevIndex];
      setCurrentBibleVerseIndex(prevIndex);

      // Extract book and chapter from reference for individual verse display
      const referenceMatch = currentBiblePassage.reference.match(
        /^(.+?)\s+(?:Chapter\s+)?(\d+)(?:\s+verses?\s+(\d+)(?:\s+to\s+\d+)?)?/,
      );
      const bookName = referenceMatch
        ? referenceMatch[1]
        : currentBiblePassage.reference;
      const chapter = referenceMatch ? referenceMatch[2] : "";
      const verseReference = `${bookName} ${chapter}:${prevVerse.number}`;

      const verseText = `${prevVerse.number} ${prevVerse.text}`;

      // Update the current projection
      setCurrentSongProjection({
        title: verseReference,
        sectionTitle: "",
        lyrics: `${verseText}\n\n— ${currentBiblePassage.version}`,
      });

      console.log(
        "📖 BIBLE NAVIGATION - Previous verse:",
        verseReference,
        `(${prevIndex + 1}/${currentBiblePassage.verses.length})`,
      );
    }
  };

  // Keyboard navigation for song sections on live screen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation when a song with sections is projected
      if (
        !currentProjectedSong ||
        !currentProjectedSong.sections ||
        projectionType !== "song"
      )
        return;

      // Prevent default behavior for navigation keys
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();

        // Navigate based on key pressed
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          navigateToPreviousSongSection();
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          navigateToNextSongSection();
        }
      }
    };

    // Add event listener when a song is projected
    if (currentProjectedSong && projectionType === "song") {
      document.addEventListener("keydown", handleKeyDown);
      console.log(
        "🎵 LIVE KEYBOARD - Added keyboard navigation for projected song",
      );
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      console.log(
        "🎵 LIVE KEYBOARD - Removed keyboard navigation for projected song",
      );
    };
  }, [currentProjectedSong, projectionType, currentSongSectionIndex]); // Re-run when song projection changes

  // Keyboard navigation for Bible verses on live screen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation when Bible content with multiple verses is projected
      if (
        !currentBiblePassage ||
        !currentBiblePassage.verses.length ||
        currentBiblePassage.verses.length <= 1
      )
        return;

      // Check if this is a Bible projection by checking localStorage
      const storedProjection = localStorage.getItem("qworship-live-projection");
      if (!storedProjection) return;

      try {
        const projectionData = JSON.parse(storedProjection);
        if (projectionData.type !== "bible") return;
      } catch {
        return;
      }

      // Prevent default behavior for navigation keys
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();

        // Navigate based on key pressed
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          navigateToPreviousBibleVerse();
        } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          navigateToNextBibleVerse();
        }
      }
    };

    // Add event listener when Bible passage is projected
    if (currentBiblePassage && currentBiblePassage.verses.length > 1) {
      document.addEventListener("keydown", handleKeyDown);
      console.log(
        "📖 BIBLE KEYBOARD - Added keyboard navigation for projected Bible passage",
      );
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      console.log(
        "📖 BIBLE KEYBOARD - Removed keyboard navigation for projected Bible passage",
      );
    };
  }, [currentBiblePassage, currentBibleVerseIndex]); // Re-run when Bible projection changes

  // Request fullscreen on load and maintain it
  useEffect(() => {
    // Check if user has seen fullscreen prompt before
    const hasSeenPrompt = localStorage.getItem(
      "qworship-fullscreen-prompt-seen",
    );
    if (!hasSeenPrompt) {
      setShowFullscreenPrompt(true);
      localStorage.setItem("qworship-fullscreen-prompt-seen", "true");
    }

    // Set body and html styles for true fullscreen
    const originalBodyStyle = {
      margin: document.body.style.margin,
      padding: document.body.style.padding,
      overflow: document.body.style.overflow,
    };

    const originalHtmlStyle = {
      margin: document.documentElement.style.margin,
      padding: document.documentElement.style.padding,
      overflow: document.documentElement.style.overflow,
    };

    // Apply fullscreen styles
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.overflow = "hidden";

    const requestFullscreen = async () => {
      try {
        // Force fullscreen mode with cross-browser support
        const element = document.documentElement;

        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen request failed:", err);
      }
    };

    // Handle fullscreen change events to maintain fullscreen
    const handleFullscreenChange = () => {
      const fullscreenElement = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(fullscreenElement);

      // Hide the prompt once fullscreen is achieved
      if (fullscreenElement && showFullscreenPrompt) {
        setShowFullscreenPrompt(false);
      }

      if (!fullscreenElement) {
        // If user accidentally exits fullscreen, re-enter it
        setTimeout(requestFullscreen, 100);
      }
    };

    // Add event listeners for all browsers
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Immediate fullscreen request
    requestFullscreen();

    // Also try again after a short delay in case first attempt fails
    const timer = setTimeout(requestFullscreen, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );

      // Restore original styles when component unmounts
      document.body.style.margin = originalBodyStyle.margin;
      document.body.style.padding = originalBodyStyle.padding;
      document.body.style.overflow = originalBodyStyle.overflow;
      document.documentElement.style.margin = originalHtmlStyle.margin;
      document.documentElement.style.padding = originalHtmlStyle.padding;
      document.documentElement.style.overflow = originalHtmlStyle.overflow;
    };
  }, []);

  return (
    <div
      className="bg-black w-full h-screen flex flex-col relative overflow-hidden transition-all duration-1000 ease-in-out"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        margin: 0,
        padding: 0,
        ...getBackgroundStyle(),
      }}
      onClick={async () => {
        // Try to enter fullscreen on any click if not already fullscreen
        if (
          !document.fullscreenElement &&
          !(document as any).webkitFullscreenElement &&
          !(document as any).mozFullScreenElement &&
          !(document as any).msFullscreenElement
        ) {
          try {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            }
          } catch (e) {
            console.log("Fullscreen request failed on click:", e);
          }
        }
      }}>
      {/* Background Video Element - Only rendered when video background is applied */}
      {appliedBackgroundType === "video" && appliedBackgroundVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={resolveMediaUrl(appliedBackgroundVideo)}
          onLoadStart={() =>
            console.log("Video loading started:", appliedBackgroundVideo)
          }
          onCanPlay={() =>
            console.log("Video can play:", appliedBackgroundVideo)
          }
          onError={(e) =>
            console.error("Video error:", e, "src:", appliedBackgroundVideo)
          }
          onLoadedData={() =>
            console.log("Video loaded data:", appliedBackgroundVideo)
          }
        />
      )}
      {/* Full Screen Content - What the audience sees */}
      <div className="w-full h-full flex items-center justify-center relative z-10">
        {/* Fullscreen Prompt - Shows only first time and when not in fullscreen */}
        {!isFullscreen && showFullscreenPrompt && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg shadow-xl border border-red-400 z-50 animate-pulse">
            <p className="text-center font-medium">
              Click anywhere to enter fullscreen for audience presentation
            </p>
          </div>
        )}

        <div
          className={`text-center max-w-6xl relative ${contentFixedArea ? "h-[85vh] max-h-[85vh] flex flex-col justify-center overflow-hidden" : ""}`}>
          {/* Content is conditionally rendered based on activeMode from display mode store */}
          {/* Song/Bible Projection - only show when mode matches */}
          {currentSongProjection &&
          ((activeMode === "song" && projectionType === "song") ||
            (activeMode === "hfb-bible" && projectionType === "bible") ||
            (activeMode === "on-screen-bible" &&
              projectionType === "bible")) ? (
            /* Live Song/Bible Projection for Congregation */
            <div
              key={`song-projection-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/60 backdrop-blur-sm"} rounded-2xl p-12 ${slidesTransparent ? "" : "border border-white/10 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}
              style={
                slidesTransparent
                  ? { backgroundColor: "transparent", backgroundImage: "none" }
                  : {}
              }>
              {/* Title and section - for songs, show section below title; for Bible, show only title */}
              <div className="mb-6" style={{ textAlign: slideAlignment }}>
                <h2
                  className={`text-white mb-2 font-bold ${getTextSizeClass()}`}>
                  {currentSongProjection.title}
                </h2>
                {projectionType !== "bible" && (
                  <h3
                    className={`text-blue-300 font-medium ${getTextSizeClass()}`}>
                    {currentSongProjection.sectionTitle}
                  </h3>
                )}
              </div>
              {/* Content text (lyrics or scripture) */}
              <div
                className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                style={{
                  fontFamily:
                    editorState.styleFontFamily ||
                    editorState.selectedFont ||
                    "Lufgord",
                  color:
                    editorState.styleColor ||
                    editorState.textColor ||
                    "#ffffff",
                  fontWeight: editorState.isBold ? "bold" : "normal",
                  fontStyle: editorState.isItalic ? "italic" : "normal",
                  textDecoration:
                    `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                    "none",
                  textShadow: editorState.styleTextShadow || "",
                  letterSpacing: editorState.styleLetterSpacing || "",
                  textTransform: (editorState.styleTextTransform as any) || "",
                  textAlign: slideAlignment,
                }}>
                {currentSongProjection.lyrics.split("\n").map((line, idx) => {
                  const isHighlighted = pacingLineIdx >= 0 && idx === pacingLineIdx;
                  return (
                    <span
                      key={idx}
                      style={{
                        display: "block",
                        color: isHighlighted ? "#fbbf24" : "inherit",
                        background: isHighlighted ? "rgba(251,191,36,0.08)" : "transparent",
                        borderRadius: isHighlighted ? "4px" : undefined,
                        padding: isHighlighted ? "0 4px" : undefined,
                        transition: "color 0.2s, background 0.2s",
                      }}
                    >
                      {line || "\u00A0"}
                    </span>
                  );
                })}
              </div>
              {/* For Bible projections, show version below the scripture text */}
              {projectionType === "bible" &&
                currentSongProjection.sectionTitle && (
                  <div className="mt-6" style={{ textAlign: slideAlignment }}>
                    <span
                      className={`text-blue-300 font-medium ${getTextSizeClass()}`}>
                      {currentSongProjection.sectionTitle}
                    </span>
                  </div>
                )}
            </div>
          ) : liveProjection &&
            (activeMode === "hfb-bible" || activeMode === "on-screen-bible") ? (
            /* Live Scripture Projection for Congregation - only when Bible mode is active */
            <div
              key={`scripture-projection-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/40 backdrop-blur-sm"} rounded-3xl p-16 ${slidesTransparent ? "" : "border border-white/20 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}
              style={getSlideStyle()}>
              <div
                className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                style={{
                  fontFamily:
                    editorState.styleFontFamily ||
                    editorState.selectedFont ||
                    "Lufgord",
                  color:
                    editorState.styleColor ||
                    editorState.textColor ||
                    "#ffffff",
                  fontWeight: editorState.isBold ? "bold" : "normal",
                  fontStyle: editorState.isItalic ? "italic" : "normal",
                  textDecoration:
                    `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                    "none",
                  textShadow: editorState.styleTextShadow || "",
                  letterSpacing: editorState.styleLetterSpacing || "",
                  textTransform: (editorState.styleTextTransform as any) || "",
                  textAlign: slideAlignment,
                }}>
                {liveProjection}
              </div>
            </div>
          ) : slides.length > 0 &&
            slides[currentSlide - 1] &&
            activeMode === "slides" ? (
            /* Display Current Slide from Dashboard - only when activeMode is 'slides' */
            <div
              key={`slide-${currentSlide}-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/40 backdrop-blur-sm"} rounded-3xl p-16 ${slidesTransparent ? "" : "border border-white/20 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}>
              {slides[currentSlide - 1].type === "verse" ||
              slides[currentSlide - 1].type === "chorus" ? (
                <>
                  <h1
                    className={`text-white mb-6 ${getTextSizeClass()}`}
                    style={{
                      fontFamily: titleEditorState.selectedFont || "Lufgord",
                      color: titleEditorState.textColor || "#ffffff",
                      textAlign: slideAlignment,
                      fontWeight: titleEditorState.isBold ? "bold" : "normal",
                      fontStyle: titleEditorState.isItalic
                        ? "italic"
                        : "normal",
                      textDecoration:
                        `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                        "none",
                    }}>
                    {slides[currentSlide - 1].songTitle ||
                      slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-purple-400 font-medium mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].sectionLabel ||
                      (slides[currentSlide - 1].type === "verse"
                        ? "VERSE"
                        : "CHORUS")}
                  </div>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              ) : slides[currentSlide - 1].type === "bible" ? (
                <>
                  <h1
                    className={`text-white font-bold mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              ) : slides[currentSlide - 1].type === "media" ? (
                <>
                  {/* Media content (the video/image) renders natively in the background via getBackgroundStyle()!
                      No text or title overlay - images fill the entire screen. */}
                </>
              ) : (
                <>
                  <h1
                    className={`text-white font-bold mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Default Live Service Display */
            <>
              <h1 className="text-white text-8xl font-bold mb-12">
                Live Service
              </h1>
              <p className="text-gray-300 text-4xl mb-8">
                Now presenting live to congregation
              </p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-2xl font-medium">LIVE</span>
              </div>
              <div className="mt-8 text-gray-400 text-lg">
                Slide {currentSlide} of {totalSlides}
              </div>
            </>
          )}
        </div>

        {/* Custom Logo Overlay */}
        {customLogo && (
          <div className={`absolute z-30 ${getLogoPositionClass()}`}>
            <img
              src={customLogo}
              alt="Custom Logo"
              className={`object-contain ${getLogoSizeClass()}`}
            />
          </div>
        )}

        {/* Service Title Overlay */}
        {showServiceTitle && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <span
                className={`text-white font-medium ${getServiceTitleSizeClass()}`}>
                {getCurrentServiceTitle()}
              </span>
            </div>
          </div>
        )}

        {/* Slide Counter Overlay */}
        {showSlideCounter && slides.length > 0 && (
          <div
            className={`absolute z-30 ${getPositionClass(slideNumberPosition)}`}>
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
              <span className="text-white text-sm font-medium">
                {getSlideCounterText()}
              </span>
            </div>
          </div>
        )}

        {/* Author Info Overlay */}
        {showAuthorInfo &&
          slides.length > 0 &&
          slides[currentSlide - 1] &&
          (slides[currentSlide - 1].type === "verse" ||
            slides[currentSlide - 1].type === "chorus") &&
          slides[currentSlide - 1].author && (
            <div className="absolute top-4 right-4 z-30">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                <span className="text-white text-sm">
                  By: {slides[currentSlide - 1].author}
                </span>
              </div>
            </div>
          )}

        {/* Copyright Info Overlay */}
        {showCopyrightInfo &&
          slides.length > 0 &&
          slides[currentSlide - 1] &&
          (slides[currentSlide - 1].type === "verse" ||
            slides[currentSlide - 1].type === "chorus") &&
          slides[currentSlide - 1].copyright && (
            <div
              className={`absolute z-30 ${getPositionClass(copyrightPosition)}`}>
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                <span className="text-white text-xs opacity-80">
                  © {slides[currentSlide - 1].copyright}
                </span>
              </div>
            </div>
          )}

        {/* Live Timestamp Overlay */}
        {showTimestamp && (
          <div className="absolute bottom-4 left-4 z-30">
            <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
              <span className="text-white text-sm font-medium">
                {formatTimestamp()}
              </span>
            </div>
          </div>
        )}

        {/* Social Handles Overlay */}
        {showSocialHandles && (facebookHandle || instagramHandle) && (
          <div className={`absolute z-30 ${getSocialHandlesPositionClass()}`}>
            <div
              className={`bg-black/60 backdrop-blur-sm ${getSocialHandlesSizeClasses().padding} rounded-lg border border-white/20`}>
              <div
                className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                {facebookHandle && (
                  <div
                    className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                    <img
                      src={facebookIcon}
                      alt="Facebook"
                      className={getSocialHandlesSizeClasses().icon}
                    />
                    <span
                      className={`${getSocialHandlesSizeClasses().text} font-medium`}
                      style={{ color: socialHandlesColor }}>
                      {facebookHandle}
                    </span>
                  </div>
                )}
                {instagramHandle && (
                  <div
                    className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                    <img
                      src={instagramIcon}
                      alt="Instagram"
                      className={getSocialHandlesSizeClasses().icon}
                    />
                    <span
                      className={`${getSocialHandlesSizeClasses().text} font-medium`}
                      style={{ color: socialHandlesColor }}>
                      {instagramHandle}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Presenter Controls removed - Now using Live Console in dashboard for audience-only view */}
      {/* Song Projection Widget */}
      <SongProjectionWidget
        isVisible={isSongWidgetOpen}
        onClose={() => setIsSongWidgetOpen(false)}
        onProjectSong={projectSong}
        onClearProjection={clearProjection}
      />

      {/* Bible Projection Widget */}
      <BibleProjectionWidget
        isVisible={isBibleWidgetOpen}
        onClose={() => setIsBibleWidgetOpen(false)}
        onClearProjection={clearProjection}
        onProjectVerse={(
          reference: string,
          verses: string,
          version: string,
          passageData?: any,
        ) => {
          // Format Bible content exactly like song lyrics with version at bottom
          setCurrentSongProjection({
            title: reference,
            sectionTitle: "", // Clear section title
            lyrics: `${verses}\n\n— ${version}`, // Put version at bottom with attribution style
          });

          // Store Bible passage for navigation if multiple verses are available
          if (
            passageData &&
            passageData.verses &&
            passageData.verses.length > 1
          ) {
            setCurrentBiblePassage({
              reference: passageData.reference,
              version: passageData.version,
              verses: passageData.verses,
            });
            // Set current verse index based on the projected verse
            const projectedVerseNumber = passageData.verses[0]?.number;
            if (projectedVerseNumber) {
              const verseIndex = passageData.verses.findIndex(
                (v: any) => v.number === projectedVerseNumber,
              );
              setCurrentBibleVerseIndex(verseIndex >= 0 ? verseIndex : 0);
            } else {
              setCurrentBibleVerseIndex(0);
            }
            console.log(
              "Bible passage stored for keyboard navigation:",
              passageData.verses.length,
              "verses",
            );
          } else {
            setCurrentBiblePassage(null);
            setCurrentBibleVerseIndex(0);
          }

          // Clear other projections
          setCurrentProjectedSong(null);
          setCurrentSongSectionIndex(0);
          setLiveProjection("");
          setProjectionType("song"); // Use 'song' type so it displays with same formatting

          // Store in localStorage for potential external screen sync
          localStorage.setItem(
            "qworship-live-projection",
            JSON.stringify({
              songTitle: reference,
              sectionTitle: version,
              lyrics: verses,
              timestamp: Date.now(),
              type: "bible",
            }),
          );

          console.log("Bible verse projected using song display format:", {
            reference,
            verses,
            version,
          });
        }}
      />

      {/* OBS Control Panel */}
      {isOBSPanelOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setIsOBSPanelOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-purple-700/50 rounded-lg transition-colors text-white">
              <XIcon className="w-5 h-5" />
            </button>
            <OBSControlPanel />
          </div>
        </div>
      )}

      {/* Slide Navigation Panel - Only show in windowed mode, hide in fullscreen for audience */}
      {isSlideNavOpen && !isInFullscreen && (
        <div
          className="fixed right-0 top-0 w-80 h-full bg-black/95 backdrop-blur-md border-l border-gray-700 z-50 flex flex-col shadow-2xl transform transition-transform duration-300"
          onClick={(e) => e.stopPropagation()} // Prevent fullscreen trigger when clicking panel
        >
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
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slide List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slides.length > 0 ? (
              slides.map((slide, index) => {
                const slideNumber = index + 1;
                const isCurrentSlide = slideNumber === currentSlide;

                return (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Prevent fullscreen trigger
                      setCurrentSlide(slideNumber);
                      // Apply background for the new slide
                      applySlideBackground(slideNumber);

                      // Switch display mode to 'slides' — mirrors GO_TO_SLIDE.
                      // Without this, the display stays in hfb-bible / on-screen-bible / song mode
                      // even after a slide is selected, so nothing appears to change on screen.
                      useDisplayModeStore.getState().setMode("slides");

                      // Clear any active projection overlay so the slide can render
                      setCurrentSongProjection(null);
                      setProjectionType(null);
                      clearBibleProjection();

                      // Compute the new background for the message (since state update is async)
                      const clickedSlide = slides[slideNumber - 1];
                      let newBg = {
                        type: appliedBackgroundType,
                        color: appliedBackgroundColor,
                        image: appliedBackgroundImage,
                        video: appliedBackgroundVideo,
                      };
                      if (
                        !hasLiveSettingsBackground &&
                        clickedSlide?.itemId &&
                        slideBackgrounds[clickedSlide.itemId]
                      ) {
                        const bg = slideBackgrounds[clickedSlide.itemId];
                        if (bg.type === "fill" || bg.type === "gradient") {
                          newBg = {
                            type: "color",
                            color: bg.value,
                            image: null,
                            video: null,
                          };
                        } else if (bg.type === "image") {
                          newBg = {
                            type: "image",
                            color: "#000000",
                            image: bg.value,
                            video: null,
                          };
                        } else if (bg.type === "video") {
                          newBg = {
                            type: "video",
                            color: "#000000",
                            image: null,
                            video: bg.value,
                          };
                        }
                      }
                      // Notify dashboard of slide change with full state
                      if (window.opener && !window.opener.closed) {
                        window.opener.postMessage(
                          {
                            type: "SLIDE_CHANGE_FROM_LIVE",
                            data: {
                              slideNumber,
                              slides: slides,
                              slideBackgrounds: slideBackgrounds,
                              background: newBg,
                            },
                          },
                          window.location.origin,
                        );
                      }
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
                              slide.type === "VERSE"
                                ? "bg-blue-600/30 text-blue-300"
                                : slide.type === "CHORUS"
                                  ? "bg-green-600/30 text-green-300"
                                  : slide.type === "BRIDGE"
                                    ? "bg-orange-600/30 text-orange-300"
                                    : slide.type === "BIBLE"
                                      ? "bg-purple-600/30 text-purple-300"
                                      : "bg-gray-600/30 text-gray-300"
                            }`}>
                            {slide.type}
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
                    {slide.title && (
                      <div className="mt-2 text-xs text-gray-400 font-medium">
                        {slide.title}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No slides available</div>
                <div className="text-gray-500 text-xs mt-1">
                  Load content from the dashboard to see slides here
                </div>
              </div>
            )}
          </div>

          {/* Footer with slide counter */}
          <div className="p-4 border-t border-gray-600 bg-gray-900/50">
            <div className="text-center text-sm text-gray-400">
              Slide {currentSlide} of {totalSlides}
            </div>
          </div>
        </div>
      )}
      {/* Background Customization Panel */}
      {isBackgroundPanelOpen && (
        <div
          className="fixed top-20 right-4 z-40 w-80 bg-gradient-to-br from-purple-900/95 via-black/95 to-purple-900/95 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()} // Prevent fullscreen trigger when clicking panel
        >
          {/* Header */}
          <div className="p-4 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-purple-600/20 to-purple-700/20">
            <h3 className="text-white font-semibold flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <span>Live Background Settings</span>
            </h3>
            <button
              onClick={() => setIsBackgroundPanelOpen(false)}
              className="text-purple-300 hover:text-white transition-colors p-1 rounded hover:bg-purple-600/30">
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Background Type Selector */}
          <div className="p-4 border-b border-purple-500/30">
            <label className="text-purple-200 text-sm font-medium mb-3 block">
              Background Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setBackgroundType("color")}
                className={`px-3 py-2 text-xs rounded-lg transition-all font-medium ${
                  backgroundType === "color"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                    : "bg-purple-800/30 text-purple-300 hover:bg-purple-700/40 border border-purple-600/30 hover:border-purple-500/50"
                }`}>
                Color
              </button>
              <button
                onClick={() => setBackgroundType("image")}
                className={`px-3 py-2 text-xs rounded-lg transition-all font-medium ${
                  backgroundType === "image"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                    : "bg-purple-800/30 text-purple-300 hover:bg-purple-700/40 border border-purple-600/30 hover:border-purple-500/50"
                }`}>
                Image
              </button>
              <button
                onClick={() => setBackgroundType("video")}
                className={`px-3 py-2 text-xs rounded-lg transition-all font-medium ${
                  backgroundType === "video"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                    : "bg-purple-800/30 text-purple-300 hover:bg-purple-700/40 border border-purple-600/30 hover:border-purple-500/50"
                }`}>
                Video
              </button>
            </div>
          </div>

          {/* Background Content */}
          <div className="p-4">
            {backgroundType === "color" && (
              <div className="space-y-4">
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-8 rounded border-2 border-purple-500/50 bg-transparent cursor-pointer hover:border-purple-400 transition-colors"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded text-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Preset Colors */}
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
                    Quick Colors
                  </label>
                  <div className="grid grid-cols-6 gap-2">
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
                        className="w-8 h-8 rounded border-2 border-purple-500/30 hover:border-purple-400 transition-all hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {backgroundType === "image" && (
              <div className="space-y-4">
                {/* Q-worship Cloud Storage */}
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
                    Q-worship Cloud Storage
                  </label>
                  <div className="p-3 border border-purple-500/30 rounded-lg bg-purple-900/20 backdrop-blur-sm">
                    <p className="text-purple-300 text-xs mb-2">
                      Access your uploaded images from Q-worship cloud
                    </p>
                    <button
                      onClick={() => {
                        setAssetsModalFilter("all");
                        setIsAssetsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-500/30 rounded text-sm hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/20">
                      Browse My Assets
                    </button>
                  </div>
                </div>

                {/* Local File Upload */}
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
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
                    className="w-full px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-purple-700 file:text-white file:cursor-pointer hover:border-purple-400 transition-all"
                  />
                  {backgroundImage && (
                    <div className="mt-3">
                      <img
                        src={resolveMediaUrl(backgroundImage) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                        alt="Background preview"
                        className="w-full h-20 object-cover rounded border border-purple-500/30 shadow-lg"
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
              </div>
            )}

            {backgroundType === "video" && (
              <div className="space-y-4">
                {/* Q-worship Cloud Storage */}
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
                    Q-worship Cloud Storage
                  </label>
                  <div className="p-3 border border-purple-500/30 rounded-lg bg-purple-900/20 backdrop-blur-sm">
                    <p className="text-purple-300 text-xs mb-2">
                      Access your uploaded videos from Q-worship cloud
                    </p>
                    <button
                      onClick={() => {
                        setAssetsModalFilter("video");
                        setIsAssetsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white border border-purple-500/30 rounded text-sm hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/20">
                      Browse My Assets
                    </button>
                  </div>
                </div>

                {/* Local File Upload */}
                <div>
                  <label className="text-purple-200 text-sm font-medium mb-2 block">
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
                    className="w-full px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-purple-700 file:text-white file:cursor-pointer hover:border-purple-400 transition-all"
                  />
                  {backgroundVideo && (
                    <div className="mt-3">
                      <video
                        src={resolveMediaUrl(backgroundVideo)}
                        className="w-full h-20 object-cover rounded border border-purple-500/30 shadow-lg"
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
              </div>
            )}
          </div>

          {/* Apply and Clear Buttons */}
          <div className="p-4 border-t border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-purple-800/20 space-y-2">
            <button
              onClick={applyBackgroundChanges}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-[1.02]">
              Apply Background
            </button>

            {hasLiveSettingsBackground && (
              <button
                onClick={() => {
                  // Clear the Live Settings background to allow slide backgrounds
                  setHasLiveSettingsBackground(false);
                  setAppliedBackgroundType("color");
                  setAppliedBackgroundColor("#000000");
                  setAppliedBackgroundImage(null);
                  setAppliedBackgroundVideo(null);
                  setIsBackgroundPanelOpen(false);

                  console.log(
                    "🔓 CLEARED LIVE SETTINGS BACKGROUND - Slide backgrounds can now take effect",
                  );

                  // Send message to dashboard
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage(
                      {
                        type: "LIVE_BACKGROUND_CLEARED",
                        data: {},
                      },
                      window.location.origin,
                    );
                  }
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-[1.02]">
                Clear Live Background (Allow Slide Backgrounds)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Settings Panel */}
      {isSettingsOpen && !isInFullscreen && (
        <div
          className="fixed top-20 right-4 z-40 w-96 bg-gradient-to-br from-purple-900/95 via-black/95 to-purple-900/95 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20"
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-purple-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settingsScreen !== "main" && (
                  <button
                    onClick={() => setSettingsScreen("main")}
                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-purple-600/30 rounded">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                )}
                <h3 className="text-white text-lg font-medium">
                  {settingsScreen === "main"
                    ? "Live Settings"
                    : settingsScreen === "slide"
                      ? "Slide Settings"
                      : settingsScreen === "customization"
                        ? "Customization"
                        : "Display Settings"}
                </h3>
              </div>
              <button
                onClick={closeSettings}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-purple-600/30 rounded">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div
            className={`p-6 ${settingsScreen === "display" ? "max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800" : ""}`}>
            {settingsScreen === "main" && (
              /* Main Settings Menu */
              <div className="space-y-4">
                <button
                  onClick={() => setSettingsScreen("slide")}
                  className="w-full p-4 bg-gradient-to-r from-purple-800/30 to-purple-700/30 hover:from-purple-700/40 hover:to-purple-600/40 rounded-lg border border-purple-500/30 text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        Slide Settings
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Transparency, text size, transitions
                      </p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => setSettingsScreen("customization")}
                  className="w-full p-4 bg-gradient-to-r from-purple-800/30 to-purple-700/30 hover:from-purple-700/40 hover:to-purple-600/40 rounded-lg border border-purple-500/30 text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        Customization
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Logo upload, positioning, branding
                      </p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => setSettingsScreen("display")}
                  className="w-full p-4 bg-gradient-to-r from-purple-800/30 to-purple-700/30 hover:from-purple-700/40 hover:to-purple-600/40 rounded-lg border border-purple-500/30 text-left transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        Display Settings
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">
                        Timestamp, overlay options
                      </p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>
            )}

            {settingsScreen === "slide" && (
              /* Slide Settings */
              <div className="space-y-6">
                {/* Transparent Slides */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Transparent Slides
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Remove slide background for overlay effect
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slidesTransparent}
                      onChange={(e) => setSlidesTransparent(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        slidesTransparent
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {slidesTransparent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Text Size */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Text Size
                  </label>
                  <select
                    value={slideTextSize}
                    onChange={(e) => setSlideTextSize(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                    <option value="2x-extra-large">2 Extra Large</option>
                    <option value="3x-extra-large">3 Extra Large</option>
                    <option value="4x-extra-large">4 Extra Large</option>
                    <option value="5x-extra-large">5 Extra Large</option>
                    <option value="6x-extra-large">6 Extra Large</option>
                  </select>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Alignment
                  </label>
                  <select
                    value={slideAlignment}
                    onChange={(e) => setSlideAlignment(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Set content to fixed area */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={contentFixedArea}
                        onChange={(e) => setContentFixedArea(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          contentFixedArea
                            ? "bg-purple-600 border-purple-600"
                            : "border-purple-400/50 group-hover:border-purple-300"
                        }`}>
                        {contentFixedArea && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-white text-sm font-medium">
                        Set content to fixed area
                      </span>
                      <p className="text-gray-400 text-xs mt-1">
                        Prevents text from extending beyond visible display area
                      </p>
                    </div>
                  </label>
                </div>

                {/* Slide Transition */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Slide Transition
                  </label>
                  <select
                    value={slideTransition}
                    onChange={(e) => setSlideTransition(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="none">None</option>
                    <option value="fade">Fade In/Out</option>
                    <option value="slide">Slide (Default)</option>
                    <option value="slideUp">Slide Up</option>
                    <option value="slideDown">Slide Down</option>
                    <option value="slideLeft">Slide Left</option>
                    <option value="slideRight">Slide Right</option>
                    <option value="zoom">Zoom In/Out</option>
                    <option value="flipX">Flip Horizontal</option>
                    <option value="flipY">Flip Vertical</option>
                    <option value="dissolve">Dissolve</option>
                    <option value="wipe">Wipe</option>
                  </select>
                </div>

                {/* Auto Advance */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Auto Advance Slides
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Automatically move to next slide
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAdvanceSlides}
                      onChange={(e) => setAutoAdvanceSlides(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        autoAdvanceSlides
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {autoAdvanceSlides && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {settingsScreen === "customization" && (
              /* Customization Settings */
              <div className="space-y-6">
                {/* Custom Logo Upload */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Custom Logo
                  </label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setCustomLogo(url);
                      }
                    }}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-purple-700 file:text-white file:cursor-pointer focus:border-purple-300 focus:bg-gray-700/80 hover:border-purple-400 transition-all shadow-lg"
                  />
                  {customLogo && (
                    <div className="mt-3">
                      <img
                        src={customLogo}
                        className="w-20 h-20 object-contain rounded border border-purple-500/30 shadow-lg bg-white/10"
                        alt="Custom logo"
                      />
                      <button
                        onClick={() => setCustomLogo("")}
                        className="mt-2 text-red-400 hover:text-red-300 text-xs hover:underline transition-all">
                        Remove Logo
                      </button>
                    </div>
                  )}

                  {/* Browse My Assets Button */}
                  <button
                    onClick={() => setIsLogoAssetsModalOpen(true)}
                    className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-blue-600/30 to-blue-700/30 hover:from-blue-600/50 hover:to-blue-700/50 text-blue-300 rounded border border-blue-500/30 text-sm transition-all">
                    Browse My Assets
                  </button>
                </div>

                {/* Logo Size */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Logo Size
                  </label>
                  <select
                    value={logoSize}
                    onChange={(e) => setLogoSize(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Logo Position */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Logo Position
                  </label>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}

            {settingsScreen === "display" && (
              /* Display Settings */
              <div className="space-y-6">
                {/* Display Theme */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">
                    Display Theme
                  </label>
                  <select
                    value={displayTheme}
                    onChange={(e) => setDisplayTheme(e.target.value as any)}
                    className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                    <option value="default">Default</option>
                    <option value="minimal">Minimal</option>
                    <option value="classic">Classic</option>
                  </select>
                  <p className="text-gray-400 text-xs mt-1">
                    Choose the overall presentation style
                  </p>
                </div>

                {/* Show Timestamp */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Show Timestamp
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display current time on presentation
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTimestamp}
                      onChange={(e) => setShowTimestamp(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showTimestamp
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showTimestamp && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Timestamp Format - only show if timestamp is enabled */}
                {showTimestamp && (
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">
                      Timestamp Format
                    </label>
                    <select
                      value={timestampFormat}
                      onChange={(e) =>
                        setTimestampFormat(e.target.value as any)
                      }
                      className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                      <option value="12-hour">12-Hour (2:30 PM)</option>
                      <option value="24-hour">24-Hour (14:30)</option>
                    </select>
                  </div>
                )}

                {/* Show Slide Counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Show Slide Counter
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display current slide number (e.g., "3 / 12")
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSlideCounter}
                      onChange={(e) => setShowSlideCounter(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showSlideCounter
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showSlideCounter && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Slide Number Position - only show if slide counter is enabled */}
                {showSlideCounter && (
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">
                      Slide Number Position
                    </label>
                    <select
                      value={slideNumberPosition}
                      onChange={(e) =>
                        setSlideNumberPosition(e.target.value as any)
                      }
                      className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                )}

                {/* Show Service Title */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Show Service Title
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display title of current song or section
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showServiceTitle}
                      onChange={(e) => setShowServiceTitle(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showServiceTitle
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showServiceTitle && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Service Title customization - only show if service title is enabled */}
                {showServiceTitle && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                    {/* Custom Service Title Text */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Custom Title Text
                      </label>
                      <input
                        type="text"
                        value={customServiceTitle}
                        onChange={(e) => setCustomServiceTitle(e.target.value)}
                        placeholder="Leave empty for auto-detection"
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg placeholder-gray-400"
                        autoComplete="off"
                        spellCheck="false"
                        data-testid="input-custom-service-title"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        Enter custom text or leave empty to auto-detect from
                        current content
                      </p>
                    </div>

                    {/* Service Title Size */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Title Size
                      </label>
                      <select
                        value={serviceTitleSize}
                        onChange={(e) =>
                          setServiceTitleSize(e.target.value as any)
                        }
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Show Copyright Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Show Copyright Info
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display copyright information for songs
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCopyrightInfo}
                      onChange={(e) => setShowCopyrightInfo(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showCopyrightInfo
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showCopyrightInfo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Copyright Position - only show if copyright is enabled */}
                {showCopyrightInfo && (
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">
                      Copyright Position
                    </label>
                    <select
                      value={copyrightPosition}
                      onChange={(e) =>
                        setCopyrightPosition(e.target.value as any)
                      }
                      className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                )}

                {/* Show Author Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Show Author Info
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display song author/composer information
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAuthorInfo}
                      onChange={(e) => setShowAuthorInfo(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showAuthorInfo
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showAuthorInfo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Show Social Handles */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-white text-sm font-medium">
                      Social Handles
                    </label>
                    <p className="text-gray-400 text-xs mt-1">
                      Display Facebook and Instagram handles with icons
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSocialHandles}
                      onChange={(e) => setShowSocialHandles(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative w-6 h-6 rounded border-2 transition-all ${
                        showSocialHandles
                          ? "bg-purple-600 border-purple-600"
                          : "bg-transparent border-gray-400 hover:border-purple-400"
                      }`}>
                      {showSocialHandles && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Social Handles customization - only show if social handles are enabled */}
                {showSocialHandles && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                    {/* Facebook Handle */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Facebook Handle
                      </label>
                      <input
                        type="text"
                        value={facebookHandle}
                        onChange={(e) => setFacebookHandle(e.target.value)}
                        placeholder="@yourchurch or yourchurch"
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg placeholder-gray-400"
                        autoComplete="off"
                        spellCheck="false"
                        data-testid="input-facebook-handle"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        Enter your Facebook page handle or username
                      </p>
                    </div>

                    {/* Instagram Handle */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="@yourchurch or yourchurch"
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg placeholder-gray-400"
                        autoComplete="off"
                        spellCheck="false"
                        data-testid="input-instagram-handle"
                      />
                      <p className="text-gray-400 text-xs mt-1">
                        Enter your Instagram handle or username
                      </p>
                    </div>

                    {/* Text Color Picker */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Text Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={socialHandlesColor}
                          onChange={(e) =>
                            setSocialHandlesColor(e.target.value)
                          }
                          className="w-12 h-12 bg-transparent border-2 border-purple-400/50 rounded-lg cursor-pointer"
                          data-testid="input-social-handles-color"
                        />
                        <input
                          type="text"
                          value={socialHandlesColor}
                          onChange={(e) =>
                            setSocialHandlesColor(e.target.value)
                          }
                          placeholder="#ffffff"
                          className="flex-1 px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg placeholder-gray-400"
                        />
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        Choose the color for your social handles text
                      </p>
                    </div>

                    {/* Position Selection */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Position
                      </label>
                      <select
                        value={socialHandlesPosition}
                        onChange={(e) =>
                          setSocialHandlesPosition(e.target.value as any)
                        }
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-center">Bottom Center</option>
                      </select>
                      <p className="text-gray-400 text-xs mt-1">
                        Choose where to display the social handles on screen
                      </p>
                    </div>

                    {/* Display Size Selection */}
                    <div>
                      <label className="text-white text-sm font-medium block mb-3">
                        Display Size
                      </label>
                      <select
                        value={socialHandlesSize}
                        onChange={(e) =>
                          setSocialHandlesSize(e.target.value as any)
                        }
                        className="w-full px-3 py-3 bg-gray-800/80 border border-purple-400/50 rounded-lg text-white text-base font-medium focus:border-purple-300 focus:bg-gray-700/80 focus:outline-none transition-all shadow-lg">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                      <p className="text-gray-400 text-xs mt-1">
                        Choose the size of the social handles and icons
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apply Button - Only on main screen */}
          {settingsScreen === "main" && (
            <div className="p-4 border-t border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-purple-800/20">
              <button
                onClick={closeSettings}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-[1.02]">
                Apply Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Assets Modal */}
      {isAssetsModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900">
          {/* Modal Header with Close Button */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-500/30 flex items-center justify-between px-6 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-purple-900 font-bold text-sm">Q</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Select {assetsModalFilter === "video" ? "Video" : "Media"} for
                Live Background
              </h1>
            </div>
            <button
              onClick={() => setIsAssetsModalOpen(false)}
              className="p-2 hover:bg-purple-700/50 rounded-lg transition-colors">
              <XIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Assets Page Content */}
          <div className="pt-16 h-full">
            <AssetsPage
              onAssetSelect={(assetUrl: string, assetType: string) => {
                console.log(
                  "Asset selected for background:",
                  assetUrl,
                  assetType,
                );

                // Determine if this is an image or video and set the appropriate background
                if (assetsModalFilter === "video" || assetType === "video") {
                  setBackgroundVideo(assetUrl);
                  console.log("Setting video background from modal:", assetUrl);
                } else {
                  setBackgroundImage(assetUrl);
                  console.log("Setting image background from modal:", assetUrl);
                }

                // Close the modal
                setIsAssetsModalOpen(false);

                // Send toast to Live Console instead of showing on live screen
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage(
                    {
                      type: "SHOW_TOAST",
                      title: "Background Selected",
                      description: `${assetsModalFilter === "video" ? "Video" : "Image"} background ready to apply - click Apply Background to activate`,
                    },
                    window.location.origin,
                  );
                }
              }}
              isModal={true}
              filterType={assetsModalFilter}
            />
          </div>
        </div>
      )}

      {/* Logo Assets Modal */}
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
              <XIcon className="w-6 h-6 text-white" />
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

                // Send toast to Live Console instead of showing on live screen
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage(
                    {
                      type: "SHOW_TOAST",
                      title: "Logo Selected",
                      description:
                        "Logo ready to apply - click Apply Settings to activate",
                    },
                    window.location.origin,
                  );
                }
              }}
              isModal={true}
              filterType="all"
            />
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
};
