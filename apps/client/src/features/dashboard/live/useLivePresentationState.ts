import { obsService, OBSSettings } from "@/services/OBSConnectionService";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBibleProjectionStore, requestSyncFromOtherWindows } from "@/stores/useBibleProjectionStore";
import { useDisplayModeStore, requestDisplayModeSync } from "@/stores/useDisplayModeStore";

export function useLivePresentationState() {
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
      case "image":
        return appliedBackgroundImage
          ? {
              backgroundImage: `url(${appliedBackgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : { backgroundColor: "#000000" };
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
    } catch (error: any) {
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
          setProjectionType("song");
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
      } catch (error: any) {
        console.error("Error loading OBS settings:", error);
      }
    };

    loadOBSSettings();

    // Cleanup: disconnect on unmount
    return () => {
      if (obsService.isConnected()) {
        console.log("🎥 OBS Disconnecting on component unmount");
        obsService.disconnect().catch((error: any) => {
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

      obsService.sendSlideUpdate(slideData as any).catch((error: any) => {
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
      obsService.setScene(obsSettings.sceneMappings.song).catch((error: any) => {
        console.error("Failed to switch to song scene:", error);
      });
    } else if (projectionType === "bible" && obsSettings.sceneMappings.bible) {
      console.log(
        "🎥 OBS Switching to bible scene:",
        obsSettings.sceneMappings.bible,
      );
      obsService.setScene(obsSettings.sceneMappings.bible).catch((error: any) => {
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

  return {
    logoSize,
    editorState,
    setShowServiceTitle,
    setSocialHandlesSize,
    contentFixedArea,
    setSlideTransition,
    setAppliedBackgroundColor,
    setShowCopyrightInfo,
    isSlideNavOpen,
    setCurrentSongSectionIndex,
    clearProjection,
    getSlideCounterText,
    setSlidesTransparent,
    projectionType,
    showAuthorInfo,
    setIsLogoAssetsModalOpen,
    getLogoPositionClass,
    isSongWidgetOpen,
    slideTransition,
    applySlideBackground,
    autoAdvanceSlides,
    setContentFixedArea,
    formatTimestamp,
    navigateToNextSongSection,
    setIsAssetsModalOpen,
    currentSongSectionIndex,
    setIsSongWidgetOpen,
    logoPosition,
    setCurrentBiblePassage,
    socialHandlesSize,
    setInstagramHandle,
    hasLiveSettingsBackground,
    setIsSettingsOpen,
    navigateToNextBibleVerse,
    slides,
    isBackgroundPanelOpen,
    currentProjectedSong,
    titleEditorState,
    facebookHandle,
    setTimestampFormat,
    setIsInitialLoad,
    setTitleEditorState,
    navigateToPreviousBibleVerse,
    setCustomLogo,
    slideAlignment,
    currentBiblePassage,
    setFacebookHandle,
    getSocialHandlesPositionClass,
    setSocialHandlesPosition,
    closeSettings,
    setSlideTextSize,
    setShowSocialHandles,
    projectSong,
    serviceTitleSize,
    slidesTransparent,
    showSlideCounter,
    showCopyrightInfo,
    setCurrentTime,
    assetsModalFilter,
    getServiceTitleSizeClass,
    isLogoAssetsModalOpen,
    currentSongProjection,
    setIsInFullscreen,
    navigateToPreviousSongSection,
    setSlideAlignment,
    displayTheme,
    setLiveProjection,
    socialHandlesColor,
    setAppliedBackgroundImage,
    setCustomServiceTitle,
    setDisplayTheme,
    applyLiveSettings,
    currentSlide,
    backgroundType,
    setCurrentSongProjection,
    isInitialLoad,
    setBackgroundColor,
    setShowTimestamp,
    currentTime,
    setLogoPosition,
    setBackgroundType,
    appliedBackgroundImage,
    copyrightPosition,
    setLogoSize,
    setAutoAdvanceSlides,
    setSlides,
    timestampFormat,
    setCurrentBibleVerseIndex,
    setObsSettings,
    setTotalSlides,
    getPositionClass,
    showTimestamp,
    isBibleWidgetOpen,
    setShowSlideCounter,
    getCurrentServiceTitle,
    getLogoSizeClass,
    slideBackgrounds,
    setCurrentSlide,
    toggleFullscreen,
    clearBibleProjection,
    activeMode,
    obsSettings,
    appliedBackgroundVideo,
    setCopyrightPosition,
    getSocialHandlesSizeClasses,
    animationKey,
    setAppliedBackgroundVideo,
    getBackgroundStyle,
    setBackgroundImage,
    setIsSlideNavOpen,
    setAnimationKey,
    totalSlides,
    currentBibleVerseIndex,
    isOBSPanelOpen,
    slideNumberPosition,
    isAssetsModalOpen,
    settingsScreen,
    getSlideStyle,
    setEditorState,
    setShowFullscreenPrompt,
    isInFullscreen,
    liveProjection,
    projectToLiveScreen,
    setProjectionType,
    applyBackgroundChanges,
    isSettingsOpen,
    setHasLiveSettingsBackground,
    setIsOBSPanelOpen,
    setServiceTitleSize,
    appliedBackgroundType,
    setIsFullscreen,
    backgroundColor,
    setAppliedBackgroundType,
    setSlideBackgrounds,
    setCurrentProjectedSong,
    setIsBibleWidgetOpen,
    showFullscreenPrompt,
    showServiceTitle,
    showSocialHandles,
    socialHandlesPosition,
    setAssetsModalFilter,
    setShowAuthorInfo,
    getTextSizeClass,
    appliedBackgroundColor,
    getSlideTransitionClass,
    isFullscreen,
    setBackgroundVideo,
    backgroundImage,
    setSlideNumberPosition,
    customServiceTitle,
    setIsBackgroundPanelOpen,
    customLogo,
    slideTextSize,
    setSettingsScreen,
    setSocialHandlesColor,
    backgroundVideo,
    instagramHandle,
  };
}
