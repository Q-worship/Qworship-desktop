import React from "react";
import { OBSStatusBadge } from "@/features/dashboard/components/OBSStatusBadge";
import facebookIcon from "@assets/R (2)_1756733484236.png";
import instagramIcon from "@assets/1658586823instagram-logo-transparent_1756733484234.png";

import { buildUrl, resolveMediaUrl } from "@/lib/queryClient";


export interface LiveConsolePreviewProps {
  activeMode: string;
  appliedBackgroundType: string;
  appliedBackgroundColor: string;
  appliedBackgroundImage: string | null;
  appliedBackgroundVideo: string | null;
  previewProjectionType: string | null;
  previewSongProjection: { title: string; sectionTitle: string; lyrics: string } | null;
  previewBibleProjection: { reference: string; text: string; version: string } | null;
  previewSlides: any[];
  slidesProp: any[];
  previewCurrentSlide: number;
  currentSlide: number;
  liveWindow: Window | null;
  customLogo: string;
  logoSize: string;
  logoPosition: string;
  showServiceTitle: boolean;
  serviceTitleSize: string;
  customServiceTitle: string;
  showTimestamp: boolean;
  previewTimestamp: string;
  showSlideCounter: boolean;
  totalSlides: number;
  slideNumberPosition: string;
  showSocialHandles: boolean;
  socialHandlesPosition: string;
  facebookHandle: string;
  instagramHandle: string;
  socialHandlesSize: string;
  socialHandlesColor: string;
}

export function LiveConsolePreview(props: LiveConsolePreviewProps) {
  const {
    activeMode,
    appliedBackgroundType,
    appliedBackgroundColor,
    appliedBackgroundImage,
    appliedBackgroundVideo,
    previewProjectionType,
    previewSongProjection,
    previewBibleProjection,
    previewSlides,
    slidesProp,
    previewCurrentSlide,
    currentSlide,
    liveWindow,
    customLogo,
    logoSize,
    logoPosition,
    showServiceTitle,
    serviceTitleSize,
    customServiceTitle,
    showTimestamp,
    previewTimestamp,
    showSlideCounter,
    totalSlides,
    slideNumberPosition,
    showSocialHandles,
    socialHandlesPosition,
    facebookHandle,
    instagramHandle,
    socialHandlesSize,
    socialHandlesColor,
  } = props;

  return (
    <div
      className="bg-black rounded-lg overflow-hidden border border-gray-700 flex-1 relative"
      style={{
        aspectRatio: "16/9",
        maxHeight: "380px",
        minHeight: "280px",
      }}
    >
      {/* Background Layer */}
      {appliedBackgroundType === "color" && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: appliedBackgroundColor }}
        />
      )}
      {appliedBackgroundType === "image" && appliedBackgroundImage && (
        <img
          src={resolveMediaUrl(appliedBackgroundImage)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {appliedBackgroundType === "video" && appliedBackgroundVideo && (
        <video
          src={resolveMediaUrl(appliedBackgroundVideo)}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* OBS Status Badge - Positioned in top right of preview */}
      <div className="absolute top-2 right-2 z-30 scale-75 origin-top-right">
        <OBSStatusBadge />
      </div>

      {/* Content Layer - Mirrors Live Screen based on activeMode */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Song Projection - only show when activeMode is 'song' */}
        {activeMode === "song" &&
          previewProjectionType === "song" &&
          previewSongProjection && (
            <div className="text-center w-full">
              <div className="text-purple-300 text-[7px] font-semibold mb-0.5">
                {previewSongProjection.title}
              </div>
              <div className="text-white/70 text-[6px] uppercase tracking-wider mb-1">
                {previewSongProjection.sectionTitle}
              </div>
              <div
                className="text-white font-medium leading-relaxed text-[9px] whitespace-pre-line"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
              >
                {previewSongProjection.lyrics}
              </div>
            </div>
          )}

        {/* Bible Projection - show when activeMode is 'hfb-bible' or 'on-screen-bible' */}
        {(activeMode === "hfb-bible" || activeMode === "on-screen-bible") &&
          previewProjectionType === "bible" &&
          previewBibleProjection && (
            <div className="text-center w-full px-2">
              <div className="text-purple-300 text-[8px] font-semibold mb-1">
                {previewBibleProjection.reference} ({previewBibleProjection.version})
              </div>
              <div
                className="text-white font-medium leading-relaxed text-[8px]"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
              >
                {previewBibleProjection.text}
              </div>
            </div>
          )}

        {/* Slide Content - Show when activeMode is 'slides' */}
        {(() => {
          const displaySlides = previewSlides.length > 0 ? previewSlides : slidesProp;
          const displayCurrentSlide = previewSlides.length > 0 ? previewCurrentSlide : currentSlide;
          const currentSlideData = displaySlides[displayCurrentSlide - 1];

          if (activeMode !== "slides" || displaySlides.length === 0 || !currentSlideData) {
            return null;
          }

          // Media slides render OUTSIDE the text container to fill the entire preview
          if (currentSlideData.type === "media") {
            return (
              <>
                {(currentSlideData as any).subtype === "video" ? (
                  <video
                    src={resolveMediaUrl(currentSlideData.content)}
                    autoPlay={(currentSlideData as any).videoSettings?.autoPlay ?? true}
                    loop={(currentSlideData as any).videoSettings?.endAction === "loop"}
                    muted
                    playsInline
                    className={(currentSlideData as any).videoSettings?.displayMode === "center" ? "absolute inset-0 w-full h-full object-contain z-10" : "absolute inset-0 w-full h-full object-cover z-10"}
                    onTimeUpdate={(e) => {
                        const videoSettings = (currentSlideData as any).videoSettings;
                        if (!videoSettings) return;
                        
                        const videoEle = e.currentTarget;
                        const endTime = videoSettings.endTime;
                        const startTime = videoSettings.startTime || 0;
                        
                        // Enforce startTime if video somehow jumps before it
                        if (videoEle.currentTime < startTime - 0.5) {
                            videoEle.currentTime = startTime;
                        }
                        
                        // Enforce endTime
                        if (endTime && videoEle.currentTime >= endTime) {
                            if (videoSettings.endAction === "loop") {
                                videoEle.currentTime = startTime;
                                videoEle.play().catch(console.error);
                            } else {
                                videoEle.pause();
                                if (videoSettings.endAction === "advance") {
                                    window.postMessage({ type: 'VIDEO_ENDED_NEXT_SLIDE' }, window.location.origin);
                                }
                            }
                        }
                    }}
                    onEnded={() => {
                        const endAction = (currentSlideData as any).videoSettings?.endAction;
                        if (endAction === "advance") {
                            window.postMessage({ type: 'VIDEO_ENDED_NEXT_SLIDE' }, window.location.origin);
                        }
                    }}
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(currentSlideData.content) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                    alt={currentSlideData.title || "Media slide"}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                  />
                )}
              </>
            );
          }

          return (
            <div className="text-center w-full px-2 bg-black/40 rounded-lg p-2">
              {currentSlideData.type === "verse" || currentSlideData.type === "chorus" ? (
                <>
                  <div className="text-purple-300 text-[7px] font-semibold mb-0.5">
                    {currentSlideData.songTitle || currentSlideData.title}
                  </div>
                  <div className="text-white/70 text-[6px] uppercase tracking-wider mb-1">
                    {currentSlideData.sectionLabel ||
                      (currentSlideData.type === "verse" ? "VERSE" : "CHORUS")}
                  </div>
                  <div
                    className="text-white font-medium leading-relaxed text-[8px] whitespace-pre-line"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {currentSlideData.content}
                  </div>
                </>
              ) : currentSlideData.type === "bible" ? (
                <>
                  <div className="text-purple-300 text-[8px] font-semibold mb-1">
                    {currentSlideData.title}
                  </div>
                  <div
                    className="text-white font-medium leading-relaxed text-[8px] whitespace-pre-line"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {currentSlideData.content}
                  </div>
                </>
              ) : currentSlideData.type === "announcement" ? (
                <>
                  <div className="text-orange-300 text-[8px] font-bold mb-0.5" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                    {currentSlideData.title || "Announcement"}
                  </div>
                  {(currentSlideData.eventDate || currentSlideData.eventTime || currentSlideData.location || currentSlideData.contact) && (
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {(currentSlideData.eventDate || currentSlideData.eventTime) && (
                        <span className="text-orange-200/70 text-[6px]">
                          📅 {currentSlideData.eventDate || ""}{currentSlideData.eventDate && currentSlideData.eventTime ? " · " : ""}{currentSlideData.eventTime || ""}
                        </span>
                      )}
                      {currentSlideData.location && (
                        <span className="text-purple-200/70 text-[6px]">
                          📍 {currentSlideData.location}
                        </span>
                      )}
                      {currentSlideData.contact && (
                        <span className="text-blue-200/70 text-[6px]">
                          📞 {currentSlideData.contact}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className="text-white font-medium leading-relaxed text-[7px] whitespace-pre-line"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {typeof currentSlideData.content === "string"
                      ? currentSlideData.content
                      : ""}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-white text-[8px] font-semibold mb-1">
                    {currentSlideData.title}
                  </div>
                  <div
                    className="text-white/90 text-[7px] whitespace-pre-line"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {currentSlideData.content}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Ready for content - No active mode selected */}
        {activeMode === "none" && liveWindow && !liveWindow.closed && (
          <div className="text-center text-gray-500">
            <p className="text-xs">Ready for content</p>
            <p className="text-[10px] text-gray-600 mt-1">Select a mode to project</p>
          </div>
        )}

        {(!liveWindow || liveWindow.closed) && (
          <div className="text-center text-gray-600">
            <span className="text-xs">No live screen connected</span>
            <p className="text-[10px] mt-1">Click "GO LIVE" to start</p>
          </div>
        )}
      </div>

      {/* Logo Overlay (if set) */}
      {customLogo && (
        <div
          className={`absolute ${
            logoPosition === "center"
              ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              : logoPosition === "top-left"
                ? "top-2 left-2"
                : logoPosition === "top-right"
                  ? "top-2 right-2"
                  : logoPosition === "bottom-left"
                    ? "bottom-2 left-2"
                    : "bottom-2 right-2"
          }`}
        >
          <img
            src={customLogo}
            alt="Logo"
            className={`${
              logoSize === "small"
                ? "w-6 h-6"
                : logoSize === "medium"
                  ? "w-8 h-8"
                  : "w-10 h-10"
            } object-contain opacity-80`}
          />
        </div>
      )}

      {/* Service Title Overlay */}
      {showServiceTitle && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
          <span
            className={`text-white font-semibold ${
              serviceTitleSize === "small"
                ? "text-[6px]"
                : serviceTitleSize === "medium"
                  ? "text-[7px]"
                  : serviceTitleSize === "large"
                    ? "text-[8px]"
                    : "text-[9px]"
            }`}
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {customServiceTitle || "Sunday Service"}
          </span>
        </div>
      )}

      {/* Timestamp Overlay */}
      {showTimestamp && (
        <div className="absolute top-1 right-1">
          <span
            className="text-white text-[6px]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {previewTimestamp}
          </span>
        </div>
      )}

      {/* Slide Counter Overlay */}
      {showSlideCounter && totalSlides > 0 && (
        <div
          className={`absolute ${
            slideNumberPosition === "top-left"
              ? "top-1 left-1"
              : slideNumberPosition === "top-right"
                ? "top-1 right-1"
                : slideNumberPosition === "bottom-left"
                  ? "bottom-1 left-1"
                  : "bottom-1 right-1"
          }`}
        >
          <span
            className="text-white text-[6px]"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
          >
            {currentSlide}/{totalSlides}
          </span>
        </div>
      )}

      {/* Social Handles Overlay */}
      {showSocialHandles && (facebookHandle || instagramHandle) && (
        <div
          className={`absolute flex items-center gap-1 ${
            socialHandlesPosition === "top-left"
              ? "top-1 left-1"
              : socialHandlesPosition === "top-right"
                ? "top-1 right-1"
                : socialHandlesPosition === "bottom-left"
                  ? "bottom-1 left-1"
                  : socialHandlesPosition === "bottom-center"
                    ? "bottom-1 left-1/2 transform -translate-x-1/2"
                    : "bottom-1 right-1"
          }`}
        >
          {facebookHandle && (
            <div className="flex items-center gap-0.5">
              <img
                src={facebookIcon}
                alt="Facebook"
                className={`${
                  socialHandlesSize === "small"
                    ? "w-2 h-2"
                    : socialHandlesSize === "medium"
                      ? "w-2.5 h-2.5"
                      : "w-3 h-3"
                } object-contain`}
              />
              <span
                className={`${
                  socialHandlesSize === "small"
                    ? "text-[5px]"
                    : socialHandlesSize === "medium"
                      ? "text-[6px]"
                      : "text-[7px]"
                }`}
                style={{
                  color: socialHandlesColor,
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {facebookHandle}
              </span>
            </div>
          )}
          {instagramHandle && (
            <div className="flex items-center gap-0.5">
              <img
                src={instagramIcon}
                alt="Instagram"
                className={`${
                  socialHandlesSize === "small"
                    ? "w-2 h-2"
                    : socialHandlesSize === "medium"
                      ? "w-2.5 h-2.5"
                      : "w-3 h-3"
                } object-contain`}
              />
              <span
                className={`${
                  socialHandlesSize === "small"
                    ? "text-[5px]"
                    : socialHandlesSize === "medium"
                      ? "text-[6px]"
                      : "text-[7px]"
                }`}
                style={{
                  color: socialHandlesColor,
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {instagramHandle}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
