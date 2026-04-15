import { useState, useEffect, useRef } from "react";
import { isWindowOpen } from "@/utils/windowUtils";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";

export interface UseLivePresentationProps {
  currentUser: any;
  slides: any[];
  totalSlides: number;
  titleEditorState: any;
  serviceItems: any[];
  itemBackgrounds: any;
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
  getItemBackground: (itemId: string) => any;
  getCurrentItemId: () => string;
  /** Called whenever a slide becomes live. Use this to push to lower-third / OBS overlay. */
  onSlideProjected?: (slide: any, parentItem: any) => void;
}

export const useLivePresentation = ({
  currentUser,
  slides,
  totalSlides,
  titleEditorState,
  serviceItems,
  itemBackgrounds,
  currentSlide,
  setCurrentSlide,
  getItemBackground,
  getCurrentItemId,
  onSlideProjected,
}: UseLivePresentationProps) => {
  const [isBuildMode, setIsBuildMode] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isInPreview, setIsInPreview] = useState(false);
  const [liveWindow, setLiveWindow] = useState<Window | null>(null);

  const { clearProjection: clearZustandProjection } = useBibleProjectionStore();
  const { setMode: setDisplayMode } = useDisplayModeStore();

  const goLive = () => {
    clearZustandProjection();
    setDisplayMode("slides");
    localStorage.removeItem("qworship-live-background");

    const newWindow = window.open(
      "#/live",
      "_blank",
      "fullscreen=yes,scrollbars=no,resizable=no",
    );

    if (newWindow) {
      setLiveWindow(newWindow);
      setIsLive(true);
      setIsInPreview(false);

      const sendInitialData = () => {
        if (slides.length === 0) {
          console.warn(
            "No slides found in serviceItems. Current serviceItems:",
            serviceItems,
          );
        }

        try {
          newWindow.postMessage(
            {
              type: "SLIDES_SYNC",
              data: {
                slides,
                totalSlides,
                titleEditorState,
                itemBackgrounds,
              },
            },
            "*",
          );

          const currentSlideData = slides[currentSlide - 1];
          const currentItemId =
            currentSlideData?.itemId || serviceItems[currentSlide - 1]?.id;
          const currentBackground = currentItemId
            ? itemBackgrounds[currentItemId]
            : null;

          newWindow.postMessage(
            {
              type: "SLIDE_CHANGE",
              data: {
                slideNumber: currentSlide,
                background: currentBackground,
                itemId: currentItemId,
              },
            },
            "*",
          );
        } catch (error) {
          console.error("Error sending messages to live window:", error);
        }
      };

      setTimeout(sendInitialData, 100);
      setTimeout(sendInitialData, 500);
      setTimeout(sendInitialData, 1000);
      setTimeout(sendInitialData, 2000);

      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          setDisplayMode("none");
          clearZustandProjection();
          setIsLive(false);
          setLiveWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    } else {
      console.error("Failed to open live presentation window - popup blocked?");
      alert("Please allow popups for this site to use live presentation mode");
    }
  };

  const exitLive = () => {
    if (liveWindow && isWindowOpen(liveWindow)) {
      liveWindow.postMessage({ type: "CLOSE_LIVE" }, "*");
      liveWindow.close();
    }

    localStorage.removeItem("qworship-live-background");
    setDisplayMode("none");
    clearZustandProjection();

    setIsLive(false);
    setLiveWindow(null);
    setIsInPreview(false);
    setIsBuildMode(true);
  };

  const togglePreview = () => {
    if (isLive) {
      exitLive();
    } else {
      setIsInPreview(!isInPreview);
      setIsBuildMode(isInPreview);
    }
  };

  const fetchSongData = async (songId: number, sourceWindow: Window) => {
    try {
      const songsResponse = await fetch("/api/songs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!songsResponse.ok) {
        throw new Error(`Failed to fetch songs list: ${songsResponse.status}`);
      }

      const songsData = await songsResponse.json();

      if (!songsData.success) {
        throw new Error(songsData.error || "Failed to fetch songs list");
      }

      const song = songsData.songs.find((s: any) => s.id === songId);

      if (!song) {
        throw new Error("Song not found in songs list");
      }

      let sections = [];

      try {
        const projectionResponse = await fetch("/api/songs/projection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            songId: songId,
          }),
        });

        if (projectionResponse.ok) {
          const projectionData = await projectionResponse.json();

          if (
            projectionData.success &&
            projectionData.song &&
            projectionData.song.sections
          ) {
            sections = projectionData.song.sections;
          } else {
            sections = [];
          }
        } else {
          sections = [];
        }

        if (sections.length === 0) {
          sections = [
            {
              id: "fallback-1",
              type: "verse",
              title: "Song Available",
              content: `${song.title}\n\nThis song is available in your songbook but doesn't have lyrics sections yet.\n\nTo add lyrics:\n1. Go to your Song Editor\n2. Select "${song.title}"\n3. Add verse and chorus sections`,
              number: 1,
            },
          ];
        }
      } catch (error) {
        sections = [
          {
            id: "error-1",
            type: "verse",
            title: "Connection Error",
            content: `Unable to load lyrics for "${song.title}"\n\nPlease check your connection and try again.`,
            number: 1,
          },
        ];
      }

      const songWithSections = {
        ...song,
        sections: sections,
      };

      sourceWindow.postMessage(
        {
          type: "SONG_DATA_RESPONSE",
          songId: songId,
          success: true,
          song: songWithSections,
          error: null,
        },
        "*",
      );
    } catch (error: any) {
      sourceWindow.postMessage(
        {
          type: "SONG_DATA_RESPONSE",
          songId: songId,
          success: false,
          error: error.message || "Failed to fetch song data",
        },
        "*",
      );
    }
  };

  // Ref to track last sent payload to prevent duplicate SLIDES_SYNC messages
  const lastSentSlidesRef = useRef<string>("");
  // Sync editor formatting state separately with debounce (changes frequently during typing)
  const editorSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize slides and backgrounds with live window whenever they change
  useEffect(() => {
    if (isLive && liveWindow && isWindowOpen(liveWindow)) {
      // Create a stable hash of the full payload for comparison
      const payloadKey = JSON.stringify({
        slides: slides.map((s) => ({
          id: s.id,
          content: s.content,
          title: s.title,
          type: s.type,
          sectionLabel: s.sectionLabel,
          itemId: s.itemId,
          location: s.location,
          eventDate: s.eventDate,
          eventTime: s.eventTime,
          contact: s.contact,
        })),
        itemBackgrounds,
      });

      // Only send if payload has actually changed
      if (payloadKey !== lastSentSlidesRef.current) {
        lastSentSlidesRef.current = payloadKey;
        try {
          liveWindow.postMessage(
            {
              type: "SLIDES_SYNC",
              data: {
                slides,
                totalSlides,
                titleEditorState,
                itemBackgrounds,
              },
            },
            "*",
          );
        } catch (error) {
          console.error("Error syncing slides to live window:", error);
        }
      }
    }
  }, [
    isLive,
    liveWindow,
    slides,
    totalSlides,
    titleEditorState,
    itemBackgrounds,
  ]);

  // Sync editor formatting state separately with debounce
  useEffect(() => {
    if (isLive && liveWindow && isWindowOpen(liveWindow)) {
      if (editorSyncDebounceRef.current) {
        clearTimeout(editorSyncDebounceRef.current);
      }

      editorSyncDebounceRef.current = setTimeout(() => {
        try {
          liveWindow.postMessage(
            {
              type: "EDITOR_STATE_SYNC",
              data: {
                titleEditorState,
                // If there's component-local editorState, it should be passed in Props
              },
            },
            "*",
          );
        } catch (error) {
          console.error("Error syncing editor state to live window:", error);
        }
      }, 500);
    }
  }, [isLive, liveWindow, titleEditorState]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin &&
        event.origin !== "file://" &&
        event.origin !== "null"
      )
        return;

      const { type, data } = event.data;

      switch (type) {
        case "SLIDE_CHANGE_FROM_LIVE": {
          setCurrentSlide(data.slideNumber);

          const changeSlideIndex = data.slideNumber - 1;
          const changedSlide = slides[changeSlideIndex];

          if (
            liveWindow &&
            isWindowOpen(liveWindow) &&
            slides.length > 0 &&
            changedSlide
          ) {
            const parentItem = serviceItems.find(
              (item) =>
                item.slides &&
                item.slides.some((s: any) => s.id === changedSlide.id),
            );

            if (parentItem) {
              // ── Push to lower-third / OBS overlay ──────────────────────
              onSlideProjected?.(changedSlide, parentItem);

              const slideItemBackground = getItemBackground(parentItem.id);
              liveWindow.postMessage(
                {
                  type: "BACKGROUND_UPDATE",
                  data: {
                    background: slideItemBackground,
                    itemId: parentItem.id,
                  },
                },
                "*",
              );
            }
          }
          break;
        }
        case "LIVE_STATE_UPDATE": {
          // GO_TO_SLIDE (presenter controls) → LivePresentation responds with
          // LIVE_STATE_UPDATE containing currentSlide. Sync it back to the
          // dashboard so the lower-third watcher in QworshipHome fires.
          if (data.currentSlide !== undefined) {
            setCurrentSlide(data.currentSlide);
          }
          break;
        }
        case "VIDEO_ENDED_NEXT_SLIDE": {
          if (currentSlide < slides.length) {
            const nextSlideNum = currentSlide + 1;
            setCurrentSlide(nextSlideNum);

            if (liveWindow && isWindowOpen(liveWindow)) {
              liveWindow.postMessage(
                {
                  type: "SLIDE_CHANGE",
                  data: { slideNumber: nextSlideNum },
                },
                "*",
              );
            }
          }
          break;
        }
        case "LIVE_SETTINGS_UPDATE":
          break;
        case "LIVE_READY":
          if (liveWindow && isWindowOpen(liveWindow)) {
            liveWindow.postMessage(
              {
                type: "SLIDES_SYNC",
                data: {
                  slides,
                  totalSlides,
                  titleEditorState,
                },
              },
              "*",
            );

            liveWindow.postMessage(
              {
                type: "SLIDE_CHANGE",
                data: { slideNumber: currentSlide },
              },
              "*",
            );

            const currentItemId = getCurrentItemId();
            const currentBackground = getItemBackground(currentItemId);

            liveWindow.postMessage(
              {
                type: "BACKGROUND_UPDATE",
                data: {
                  background: currentBackground,
                  itemId: currentItemId,
                },
              },
              "*",
            );
          }
          break;
        case "REQUEST_SONG_DATA":
          if (data.songId && event.source) {
            fetchSongData(data.songId, event.source as Window);
          }
          break;
        case "REQUEST_BACKGROUND_SYNC":
          if (liveWindow && isWindowOpen(liveWindow)) {
            const currentItemId = getCurrentItemId();
            const currentBackground = getItemBackground(currentItemId);

            liveWindow.postMessage(
              {
                type: "BACKGROUND_UPDATE",
                data: {
                  background: currentBackground,
                  itemId: currentItemId,
                },
              },
              "*",
            );
          }
          break;
        case "REQUEST_BIBLE_SYNC":
          if (liveWindow && isWindowOpen(liveWindow)) {
            const bibleStore = useBibleProjectionStore.getState();

            if (bibleStore.currentVerse && bibleStore.isProjecting) {
              const versionKey = bibleStore.bibleVersion.toLowerCase() as
                | "kjv"
                | "nkjv"
                | "niv"
                | "amp"
                | "gn"
                | "msg"
                | "esv";
              const text =
                bibleStore.currentVerse[versionKey] ||
                bibleStore.currentVerse.kjv ||
                "";

              liveWindow.postMessage(
                {
                  type: "BIBLE_VERSE_DISPLAY",
                  data: {
                    book: bibleStore.currentVerse.book,
                    chapter: bibleStore.currentVerse.chapter,
                    verse: bibleStore.currentVerse.verse,
                    text: text,
                    version: bibleStore.bibleVersion,
                    reference: bibleStore.formattedReference,
                  },
                },
                "*",
              );
            }
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    liveWindow,
    slides,
    currentSlide,
    serviceItems,
    titleEditorState,
    itemBackgrounds,
    setCurrentSlide,
    getItemBackground,
    getCurrentItemId,
  ]);

  return {
    isBuildMode,
    setIsBuildMode,
    isLive,
    setIsLive,
    isInPreview,
    setIsInPreview,
    liveWindow,
    setLiveWindow,
    goLive,
    exitLive,
    togglePreview,
    fetchSongData,
  };
};
