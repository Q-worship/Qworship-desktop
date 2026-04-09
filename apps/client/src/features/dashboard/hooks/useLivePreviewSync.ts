import { useEffect } from "react";

export function useLivePreviewSync({
  ltEnabled,
  ltProjectLyric,
  ltProjectScripture,
  ltProjectAnnouncement,
  ltClear,
  mpEnabled,
  mpProjectLyric,
  mpProjectScripture,
  mpProjectAnnouncement,
  mpClear,
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
}: {
  [key: string]: any;
}) {
  // Listen for state updates from live screen to keep preview in sync
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, data } = event.data || {};

      // Guard against undefined data
      if (!type) return;

      switch (type) {
        case "LIVE_STATE_UPDATE":
          // Sync all state from live screen to preview
          if (!data) break;

          // Forward the live screen's authoritative projection to the Lower Third
          // AND Main Presentation OBS overlays.
          // projectionType is always present when songProjection/bibleProjection change, so
          // this covers every projection path: Live Console widgets AND main editor slide clicks.
          if (data.projectionType !== undefined) {
            if (data.projectionType === "song" && data.songProjection) {
              const lyrics = data.songProjection.lyrics ?? "";
              const sectionTitle = data.songProjection.sectionTitle ?? "";
              const title = data.songProjection.title ?? "";
              if (ltEnabled) ltProjectLyric(lyrics, sectionTitle, title);
              if (mpEnabled) mpProjectLyric(lyrics, sectionTitle, title);
            } else if (
              data.projectionType === "bible" &&
              data.bibleProjection
            ) {
              const text = data.bibleProjection.text ?? "";
              const reference = data.bibleProjection.reference ?? "";
              const version = data.bibleProjection.version ?? "KJV";
              if (ltEnabled) ltProjectScripture(text, reference, version);
              if (mpEnabled) mpProjectScripture(text, reference, version);
            } else if (
              data.projectionType === "announcement" &&
              data.announcementProjection
            ) {
              const announcementText = data.announcementProjection.text ?? "";
              const category = data.announcementProjection.category ?? "";
              const subtitle = data.announcementProjection.subtitle ?? "";
              if (ltEnabled) ltProjectAnnouncement(announcementText, category, subtitle);
              if (mpEnabled) mpProjectAnnouncement(announcementText, category, subtitle);
            } else if (data.projectionType === null) {
              if (ltEnabled) ltClear();
              if (mpEnabled) mpClear();
            }
          }

          if (data.songProjection !== undefined) {
            setPreviewSongProjection(data.songProjection);
          }
          if (data.bibleProjection !== undefined) {
            setPreviewBibleProjection(data.bibleProjection);
          }
          if (data.projectionType !== undefined) {
            setPreviewProjectionType(data.projectionType);
          }
          if (data.background) {
            setAppliedBackgroundType(data.background.type || "color");
            setAppliedBackgroundColor(data.background.color || "#000000");
            setAppliedBackgroundImage(data.background.image || null);
            setAppliedBackgroundVideo(data.background.video || null);
          }
          if (data.logo) {
            setCustomLogo(data.logo.url || "");
            setLogoSize(data.logo.size || "medium");
            setLogoPosition(data.logo.position || "center");
          }
          // Sync display settings from live screen
          if (data.displaySettings) {
            const ds = data.displaySettings;
            if (ds.showTimestamp !== undefined)
              setShowTimestamp(ds.showTimestamp);
            if (ds.timestampFormat !== undefined)
              setTimestampFormat(ds.timestampFormat);
            if (ds.showSlideCounter !== undefined)
              setShowSlideCounter(ds.showSlideCounter);
            if (ds.slideNumberPosition !== undefined)
              setSlideNumberPosition(ds.slideNumberPosition);
            if (ds.showServiceTitle !== undefined)
              setShowServiceTitle(ds.showServiceTitle);
            if (ds.customServiceTitle !== undefined)
              setCustomServiceTitle(ds.customServiceTitle);
            if (ds.serviceTitleSize !== undefined)
              setServiceTitleSize(ds.serviceTitleSize);
            if (ds.showCopyrightInfo !== undefined)
              setShowCopyrightInfo(ds.showCopyrightInfo);
            if (ds.copyrightPosition !== undefined)
              setCopyrightPosition(ds.copyrightPosition);
            if (ds.showAuthorInfo !== undefined)
              setShowAuthorInfo(ds.showAuthorInfo);
            if (ds.showSocialHandles !== undefined)
              setShowSocialHandles(ds.showSocialHandles);
            if (ds.facebookHandle !== undefined)
              setFacebookHandle(ds.facebookHandle);
            if (ds.instagramHandle !== undefined)
              setInstagramHandle(ds.instagramHandle);
            if (ds.socialHandlesColor !== undefined)
              setSocialHandlesColor(ds.socialHandlesColor);
            if (ds.socialHandlesPosition !== undefined)
              setSocialHandlesPosition(ds.socialHandlesPosition);
            if (ds.socialHandlesSize !== undefined)
              setSocialHandlesSize(ds.socialHandlesSize);
            // Sync slide settings from live screen
            if (ds.slidesTransparent !== undefined)
              setSlidesTransparent(ds.slidesTransparent);
            if (ds.slideTextSize !== undefined)
              setSlideTextSize(ds.slideTextSize);
            if (ds.slideAlignment !== undefined)
              setSlideAlignment(ds.slideAlignment);
            if (ds.contentFixedArea !== undefined)
              setContentFixedArea(ds.contentFixedArea);
            if (ds.slideTransition !== undefined)
              setSlideTransition(ds.slideTransition);
            if (ds.autoAdvanceSlides !== undefined)
              setAutoAdvanceSlides(ds.autoAdvanceSlides);
            if (ds.displayTheme !== undefined) setDisplayTheme(ds.displayTheme);
          }
          // Sync slides from live screen
          // NOTE: SLIDES_SYNC responses intentionally omit currentSlide (data-only updates)
          // Only GO_TO_SLIDE and explicit slide changes should update previewCurrentSlide
          if (data.slides !== undefined) {
            const newSlides = data.slides || [];
            setPreviewSlides(newSlides);
            // Only update previewCurrentSlide if we're not in a debounce period from local navigation
            const now = Date.now();
            const isDebouncing = now - navigationDebounceRef.current < 500; // 500ms debounce window
            if (!isDebouncing) {
              // Clamp current slide to valid range when slides change
              if (data.currentSlide !== undefined) {
                const validSlide = Math.max(
                  1,
                  Math.min(data.currentSlide, newSlides.length || 1),
                );
                setPreviewCurrentSlide(validSlide);
              } else {
                // Data-only update: ensure we're in bounds without changing position
                setPreviewCurrentSlide((prev: number) =>
                  Math.max(1, Math.min(prev, newSlides.length || 1)),
                );
              }
            }
          } else if (data.currentSlide !== undefined) {
            // Only update if not debouncing
            const now = Date.now();
            const isDebouncing = now - navigationDebounceRef.current < 500;
            if (!isDebouncing) {
              setPreviewCurrentSlide(data.currentSlide);
            }
          }
          if (data.slideBackgrounds !== undefined) {
            setPreviewSlideBackgrounds(data.slideBackgrounds || {});
            // Apply background for current slide using local previewCurrentSlide (not data.currentSlide which may be undefined)
            // This handles data-only updates from SLIDES_SYNC where currentSlide is intentionally omitted
            const slideIndexToUse =
              data.currentSlide !== undefined
                ? data.currentSlide
                : previewCurrentSlide;
            const currentSlideData = data.slides?.[slideIndexToUse - 1];
            if (
              currentSlideData?.itemId &&
              data.slideBackgrounds[currentSlideData.itemId]
            ) {
              const bg = data.slideBackgrounds[currentSlideData.itemId];
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
          }
          break;
        case "SLIDE_CHANGE_FROM_LIVE":
          // Slide changed from live screen - update slide counter in preview
          if (!data) break;
          console.log(
            "Live Console: Received slide change from live screen",
            data,
          );
          // Check debounce to prevent overriding locally-initiated changes
          const slideChangeNow = Date.now();
          const slideChangeIsDebouncing =
            slideChangeNow - navigationDebounceRef.current < 500;
          if (data.slides !== undefined) {
            const newSlides = data.slides || [];
            setPreviewSlides(newSlides);
            // Only update previewCurrentSlide if not debouncing
            if (!slideChangeIsDebouncing && data.slideNumber !== undefined) {
              const validSlide = Math.max(
                1,
                Math.min(data.slideNumber, newSlides.length || 1),
              );
              setPreviewCurrentSlide(validSlide);
            }
          } else if (
            !slideChangeIsDebouncing &&
            data.slideNumber !== undefined
          ) {
            setPreviewCurrentSlide(data.slideNumber);
          }
          if (data.slideBackgrounds !== undefined) {
            setPreviewSlideBackgrounds(data.slideBackgrounds || {});
          }
          // Apply background from slide or from explicit background
          if (data.slideBackgrounds && data.slides) {
            const currentSlideData = data.slides[data.slideNumber - 1];
            if (
              currentSlideData?.itemId &&
              data.slideBackgrounds[currentSlideData.itemId]
            ) {
              const bg = data.slideBackgrounds[currentSlideData.itemId];
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
            } else if (data.background) {
              setAppliedBackgroundType(data.background.type || "color");
              setAppliedBackgroundColor(data.background.color || "#000000");
              setAppliedBackgroundImage(data.background.image || null);
              setAppliedBackgroundVideo(data.background.video || null);
            }
          } else if (data.background) {
            setAppliedBackgroundType(data.background.type || "color");
            setAppliedBackgroundColor(data.background.color || "#000000");
            setAppliedBackgroundImage(data.background.image || null);
            setAppliedBackgroundVideo(data.background.video || null);
          }
          break;
        case "SHOW_TOAST":
          // Display toast notification from live screen in the Live Console
          if (!data) break;
          toast({
            title: data.title || "Notification",
            description: data.description || "",
            className:
              "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white",
            duration: 3000,
          });
          break;
        case "LIVE_BACKGROUND_CLEARED":
          // Background was cleared from live screen
          setAppliedBackgroundType("color");
          setAppliedBackgroundColor("#000000");
          setAppliedBackgroundImage(null);
          setAppliedBackgroundVideo(null);
          setHasLiveSettingsBackground(false);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
}
