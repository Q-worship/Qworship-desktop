import { LiveOverlayLayer } from "./components/LiveOverlayLayer";
import { LiveSlideLayer } from "./components/LiveSlideLayer";
import { LiveBackgroundLayer } from "./components/LiveBackgroundLayer";
import { useLivePresentationState } from "./useLivePresentationState";
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
import { OBSControlPanel } from "@/features/dashboard/components/OBSControlPanel";
import { buildUrl, resolveMediaUrl } from "@/lib/queryClient";

import { OBSStatusBadge } from "@/features/dashboard/components/OBSStatusBadge";
import { obsService, OBSSettings } from "@/services/OBSConnectionService";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import AssetsPage from "@/features/dashboard/pages/AssetsPage";
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

const isWindowOpen = (win: any): boolean => {
  if (!win) return false;
  try {
    return !win.closed;
  } catch (e) {
    return true; 
  }
};

export const LivePresentationV2 = (): JSX.Element => {
  const stateProps = useLivePresentationState();
  const {
    serviceTitleSize,
    setIsSlideNavOpen,
    slideAlignment,
    setCurrentTime,
    setSocialHandlesSize,
    navigateToNextBibleVerse,
    isSlideNavOpen,
    setCurrentBiblePassage,
    setAnimationKey,
    setSlideBackgrounds,
    appliedBackgroundType,
    isInitialLoad,
    setAppliedBackgroundColor,
    slideTransition,
    facebookHandle,
    getLogoSizeClass,
    setCurrentBibleVerseIndex,
    customServiceTitle,
    logoPosition,
    applyBackgroundChanges,
    setHasLiveSettingsBackground,
    formatTimestamp,
    clearBibleProjection,
    setSlideTransition,
    setIsSongWidgetOpen,
    getLogoPositionClass,
    isInFullscreen,
    setIsFullscreen,
    instagramHandle,
    setBackgroundImage,
    isSettingsOpen,
    setCopyrightPosition,
    slideBackgrounds,
    getBackgroundStyle,
    getCurrentServiceTitle,
    settingsScreen,
    setLogoSize,
    setBackgroundVideo,
    currentSongProjection,
    showCopyrightInfo,
    isBackgroundPanelOpen,
    setShowFullscreenPrompt,
    setLogoPosition,
    setEditorState,
    displayTheme,
    showFullscreenPrompt,
    copyrightPosition,
    hasLiveSettingsBackground,
    setCustomServiceTitle,
    slideNumberPosition,
    logoSize,
    currentProjectedSong,
    setCurrentSongProjection,
    currentSongSectionIndex,
    navigateToPreviousBibleVerse,
    isBibleWidgetOpen,
    getServiceTitleSizeClass,
    navigateToNextSongSection,
    setContentFixedArea,
    setShowTimestamp,
    animationKey,
    setShowSocialHandles,
    socialHandlesSize,
    socialHandlesPosition,
    applySlideBackground,
    customLogo,
    getSlideTransitionClass,
    setSlideNumberPosition,
    setProjectionType,
    totalSlides,
    getTextSizeClass,
    assetsModalFilter,
    appliedBackgroundColor,
    appliedBackgroundVideo,
    setSocialHandlesPosition,
    setIsInFullscreen,
    setIsLogoAssetsModalOpen,
    autoAdvanceSlides,
    currentTime,
    getPositionClass,
    backgroundVideo,
    toggleFullscreen,
    setShowCopyrightInfo,
    projectionType,
    isLogoAssetsModalOpen,
    currentSlide,
    showServiceTitle,
    setShowAuthorInfo,
    setIsInitialLoad,
    setIsAssetsModalOpen,
    activeMode,
    slideTextSize,
    setIsBibleWidgetOpen,
    titleEditorState,
    isSongWidgetOpen,
    contentFixedArea,
    setIsSettingsOpen,
    setCurrentSlide,
    obsSettings,
    backgroundImage,
    isOBSPanelOpen,
    applyLiveSettings,
    setSlideAlignment,
    projectSong,
    isFullscreen,
    setSlideTextSize,
    setBackgroundColor,
    setTotalSlides,
    showSlideCounter,
    setAssetsModalFilter,
    setServiceTitleSize,
    isAssetsModalOpen,
    setCurrentProjectedSong,
    setAppliedBackgroundType,
    setIsBackgroundPanelOpen,
    setSocialHandlesColor,
    setInstagramHandle,
    projectToLiveScreen,
    setTitleEditorState,
    getSocialHandlesSizeClasses,
    setSettingsScreen,
    slides,
    setBackgroundType,
    timestampFormat,
    setFacebookHandle,
    setSlidesTransparent,
    showAuthorInfo,
    setTimestampFormat,
    getSocialHandlesPositionClass,
    showTimestamp,
    setCustomLogo,
    setDisplayTheme,
    navigateToPreviousSongSection,
    slidesTransparent,
    currentBibleVerseIndex,
    setAppliedBackgroundImage,
    setShowSlideCounter,
    setSlides,
    liveProjection,
    setShowServiceTitle,
    currentBiblePassage,
    appliedBackgroundImage,
    setObsSettings,
    setAutoAdvanceSlides,
    socialHandlesColor,
    getSlideStyle,
    setIsOBSPanelOpen,
    showSocialHandles,
    backgroundType,
    closeSettings,
    getSlideCounterText,
    editorState,
    backgroundColor,
    setLiveProjection,
    setAppliedBackgroundVideo,
    setCurrentSongSectionIndex,
    clearProjection,
  } = stateProps;
  const props = stateProps;


  return (
    <div
      className="bg-black w-full h-screen flex flex-col relative overflow-hidden"
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
      <LiveBackgroundLayer appliedBackgroundType={appliedBackgroundType as any} appliedBackgroundVideo={appliedBackgroundVideo} />
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

        <LiveSlideLayer {...props} />
        

        <LiveOverlayLayer {...props} />
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
                      if (window.opener && isWindowOpen(window.opener)) {
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
                          "*",
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
                        src={resolveMediaUrl(backgroundImage) || backgroundImage}
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
                        src={resolveMediaUrl(backgroundVideo) || backgroundVideo}
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
                  if (window.opener && isWindowOpen(window.opener)) {
                    window.opener.postMessage(
                      {
                        type: "LIVE_BACKGROUND_CLEARED",
                        data: {},
                      },
                      "*",
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
                if (window.opener && isWindowOpen(window.opener)) {
                  window.opener.postMessage(
                    {
                      type: "SHOW_TOAST",
                      title: "Background Selected",
                      description: `${assetsModalFilter === "video" ? "Video" : "Image"} background ready to apply - click Apply Background to activate`,
                    },
                    "*",
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
                if (window.opener && isWindowOpen(window.opener)) {
                  window.opener.postMessage(
                    {
                      type: "SHOW_TOAST",
                      title: "Logo Selected",
                      description:
                        "Logo ready to apply - click Apply Settings to activate",
                    },
                    "*",
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
