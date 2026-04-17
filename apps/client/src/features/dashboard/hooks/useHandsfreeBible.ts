import React, {
  useState,
  useEffect,
  useRef,
  MutableRefObject,
  useCallback,
} from "react";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useLocalWhisper } from "@/hooks/useLocalWhisper";
import { useRawAudioStream } from "@/hooks/useRawAudioStream";
import { useToast } from "@/hooks/use-toast";
import { useHFBStore } from "./useHFBStore";
import { db } from "@/lib/db";
import type { BibleVersion } from "@/lib/offlineBibleEngine";

const ALL_VERSIONS: BibleVersion[] = [
  "kjv",
  "nkjv",
  "niv",
  "esv",
  "amp",
  "msg",
  "gn",
];

const isWindowOpen = (win: Window | null) => {
  if (!win) return false;
  try {
    return !win.closed;
  } catch (e) {
    // Cross-origin proxy throws error but it implies the window is active/open
    return true;
  }
};

/**
 * Fetch ALL Bible versions for a given book+chapter+verse range from IndexedDB.
 * Returns multi-version verse objects: [{ verse, kjv, nkjv, niv, ... }]
 * Used for offline navigation so we don't need a server roundtrip.
 */
async function fetchMultiVersionVerses(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
) {
  const allVersionData = await Promise.all(
    ALL_VERSIONS.map(async (v) => {
      const verses = await db.verses
        .where("[version+book+chapter]")
        .equals([v, book, chapter])
        .sortBy("verse");
      return { version: v, verses };
    }),
  );

  const anyVerses =
    allVersionData.find((d) => d.verses.length > 0)?.verses || [];
  const relevantVerseNums = anyVerses
    .filter(
      (v) =>
        v.verse >= verseStart &&
        (verseEnd ? v.verse <= verseEnd : v.verse === verseStart),
    )
    .map((v) => v.verse);

  if (relevantVerseNums.length === 0) return [];

  return relevantVerseNums.map((verseNum) => {
    const entry: Record<string, any> = { verse: verseNum };
    for (const { version, verses } of allVersionData) {
      const found = verses.find((v) => v.verse === verseNum);
      entry[version] = found?.text || "";
    }
    return entry;
  });
}

interface UseHandsfreeBibleProps {
  liveWindow: Window | null;
  handsfreeBibleButtonRef: MutableRefObject<HTMLElement | null>;
}

export const useHandsfreeBible = ({
  liveWindow,
  handsfreeBibleButtonRef,
}: UseHandsfreeBibleProps) => {
  const { toast } = useToast();
  // Store actions
  const { setMode: setDisplayMode } = useDisplayModeStore();
  const {
    setVerse: setZustandVerse,
    setBibleVersion: setZustandBibleVersion,
    clearProjection: clearZustandProjection,
  } = useBibleProjectionStore();

  // Hands-free Bible widget state
  const [isHandsfreeBibleOpen, setIsHandsfreeBibleOpen] = useState(false);
  const [selectedBibleVersion, setSelectedBibleVersion] = useState("KJV");
  const [detectedCommands, setDetectedCommands] = useState(
    "No commands detected",
  );
  const [widgetPosition, setWidgetPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [microphoneStatus, setMicrophoneStatus] = useState("Idle");

  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false);
  const [isSleepMode, setIsSleepMode] = useState(false);

  // Multi-version verse data for widget display
  const [widgetVerseData, setWidgetVerseData] = useState<
    | {
        verse: number;
        kjv: string;
        nkjv: string;
        amp: string;
        msg: string;
        esv: string;
        niv: string;
      }[]
    | null
  >(null);
  const [widgetFormattedReference, setWidgetFormattedReference] = useState<
    string | null
  >(null);

  // Refs to avoid stale closures
  const currentVerseContextRef = useRef<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);
  const liveWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    liveWindowRef.current = liveWindow;
  }, [liveWindow]);

  // Handle Socket Events
  const handleBibleMatch = (data: any) => {
    if (data.success === false) {
      setDetectedCommands(data.error || "Command not recognized");
      return;
    }

    const { book, chapter, verses } = data.result;
    const verseData = verses?.[0];
    const verseNum = verseData?.verse;

    if (data.commandType === "version_change" && data.requestedVersion) {
      const newVersion = data.requestedVersion.toUpperCase();
      setSelectedBibleVersion(newVersion);
      useHFBStore.getState().setHfbVersion(newVersion);
    }

    const effectiveVersion =
      data.commandType === "version_change" && data.requestedVersion
        ? data.requestedVersion.toUpperCase()
        : selectedBibleVersion;
    const versionKey = effectiveVersion.toLowerCase();
    const text = verseData?.[versionKey] || verseData?.kjv || "";

    const currentVerseContext = { book, chapter, verse: verseNum };
    currentVerseContextRef.current = currentVerseContext;
    setWidgetVerseData(verses || null);
    setWidgetFormattedReference(`${book} ${chapter}:${verseNum}`);
    setDetectedCommands(`${book} ${chapter}:${verseNum}`);

    const verseForStore = verseData
      ? {
          book,
          chapter,
          verse: verseNum,
          kjv: verseData.kjv,
          nkjv: verseData.nkjv,
          niv: verseData.niv,
          amp: verseData.amp,
          gn: verseData.gn,
          msg: verseData.msg,
          esv: verseData.esv,
        }
      : null;
    setZustandVerse(verseForStore, `${book} ${chapter}:${verseNum}`);
    setZustandBibleVersion(effectiveVersion);

    // Integrate with HFB layout store
    useHFBStore.getState().addHfbDetectedVerse({
      id: Date.now(),
      reference: `${book} ${chapter}:${verseNum}`,
      verseText: text,
      version: effectiveVersion,
      isActive: true,
      verseNum: verseNum,
      book,
      chapter,
    });

    // Set all other detected verses to inactive
    useHFBStore
      .getState()
      .setHfbDetectedVerses((prev) =>
        prev.map((d) => ({ ...d, isActive: d.id === Date.now() })),
      );
    useHFBStore
      .getState()
      .setHfbCurrentProjected({
        reference: `${book} ${chapter}:${verseNum}`,
        text,
        version: effectiveVersion,
      });

    // Asynchronously fetch and display the whole chapter in Center Stage
    useHFBStore
      .getState()
      .fetchHFBChapter(book, chapter, effectiveVersion, verseNum);

    if (isHandsfreeBibleOpen) {
      setDisplayMode("hfb-bible");
    }

    const currentLiveWindow = liveWindowRef.current;
    if (isWindowOpen(currentLiveWindow)) {
      currentLiveWindow!.postMessage(
        {
          type: "BIBLE_VERSE_DISPLAY",
          data: {
            book,
            chapter,
            verse: verseNum,
            text,
            version: effectiveVersion,
            reference: `${book} ${chapter}:${verseNum}`,
          },
        },
        "*",
      );
    }
  };

  // Offline navigation: compute next/prev verse/chapter and look up from IndexedDB
  // (No server roundtrip needed for navigation commands)
  const executeNavigation = async (
    commandType: string,
    direction: "next" | "previous" | undefined,
    targetVerse?: number,
    offset?: number,
  ) => {
    let commandText = "";
    if (commandType === "chapter_change") {
      commandText = direction
        ? `${direction === "next" ? "Next" : "Previous"} chapter`
        : "Change chapter";
    } else if (commandType === "verse_change") {
      commandText = direction
        ? `${direction === "next" ? "Next" : "Previous"} verse`
        : "Change verse";
    } else if (commandType === "jump_to_verse") {
      commandText = `Jump to verse ${targetVerse}`;
    } else if (commandType === "last_verse") {
      commandText = `Last verse`;
    } else if (commandType === "jump_relative") {
      commandText = `Jump ${offset! > 0 ? `forward ${offset}` : `back ${-offset!}`} verses`;
    }

    setDetectedCommands(commandText);

    const currentContext = currentVerseContextRef.current;
    console.log("[HandsfreeBible] executeNavigation triggered", {
      commandType,
      direction,
      targetVerse,
      offset,
      currentContext,
    });

    if (
      !currentContext ||
      !currentContext.book ||
      !currentContext.chapter ||
      !currentContext.verse
    ) {
      console.warn("[HandsfreeBible] No current verse context for navigation");
      return;
    }

    let newBook = currentContext.book;
    let newChapter = currentContext.chapter;
    let newVerse = currentContext.verse;

    if (commandType === "verse_change") {
      newVerse =
        direction === "next" ? newVerse + 1 : Math.max(1, newVerse - 1);
    } else if (commandType === "chapter_change") {
      newChapter =
        direction === "next" ? newChapter + 1 : Math.max(1, newChapter - 1);
      newVerse = 1;
    } else if (commandType === "jump_to_verse" && targetVerse) {
      newVerse = targetVerse;
    } else if (commandType === "jump_relative" && offset) {
      newVerse = Math.max(1, newVerse + offset);
    } else if (commandType === "last_verse") {
      const vKey = selectedBibleVersion.toLowerCase();
      const chapterVerses = await db.verses
        .where("[version+book+chapter]")
        .equals([vKey, newBook, newChapter])
        .sortBy("verse");
      if (chapterVerses.length > 0) {
        newVerse = chapterVerses[chapterVerses.length - 1].verse;
      }
    }

    console.log("[HandsfreeBible] Navigating offline to:", {
      newBook,
      newChapter,
      newVerse,
    });

    try {
      const multiVersionVerses = await fetchMultiVersionVerses(
        newBook,
        newChapter,
        newVerse,
      );
      if (multiVersionVerses.length > 0) {
        handleBibleMatch({
          result: {
            book: newBook,
            chapter: newChapter,
            verses: multiVersionVerses,
          },
          commandType: "lookup",
        });
      } else {
        console.warn(
          "[HandsfreeBible] No verses found for navigation target:",
          { newBook, newChapter, newVerse },
        );
      }
    } catch (error) {
      console.error(
        "[HandsfreeBible] Error executing offline navigation:",
        error,
      );
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Audio capture via getUserMedia (works in Electron)
  // ──────────────────────────────────────────────────────────────
  const { isRecording, startRecording, stopRecording } = useRawAudioStream();

  // Inactivity Timer
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setIsListeningMode(false);
      setIsSleepMode(false);
      stopRecording();
      setMicrophoneStatus("Idle");
      setDetectedCommands("Stopped listening due to inactivity");
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, stopRecording]);

  // ──────────────────────────────────────────────────────────────
  // Local offline transcription via whisper.cpp in the Main Process.
  // Audio is sent over IPC and processed locally — no server needed.
  // ──────────────────────────────────────────────────────────────
  const { connect, disconnect, sendPCMData, isConnected } = useLocalWhisper({
    onBibleMatch: (data: any) => {
      resetInactivityTimer();
      handleBibleMatch(data);
    },
    onPartialTranscript: (text) => {
      resetInactivityTimer();
      setMicrophoneStatus("Processing");
    },
    onFinalTranscript: (text) => {
      resetInactivityTimer();
      setMicrophoneStatus("Listening");
      if (text.trim()) {
        useHFBStore.getState().addHfbTranscriptLine({
          id: Date.now(),
          text,
          ts: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        });
      }
    },
    onSleepCommand: () => {
      resetInactivityTimer();
      setIsSleepMode(true);
      setMicrophoneStatus("Sleeping");
      setDetectedCommands(`Sleeping... Say "Bible" or "I'm ready" to wake`);
    },
    onWakeCommand: () => {
      resetInactivityTimer();
      setIsSleepMode(false);
      setMicrophoneStatus("Listening");
      setDetectedCommands("Awake! Listening for commands...");
    },
    onVersionChange: (version) => {
      resetInactivityTimer();
      const normalized = version.toUpperCase();
      setSelectedBibleVersion(normalized);
      setZustandBibleVersion(normalized);
      useHFBStore.getState().setHfbVersion(normalized);
      setDetectedCommands(`Switched to ${normalized}`);
    },
    onNavigation: (commandType, direction, targetVerse, offset) => {
      resetInactivityTimer();
      executeNavigation(commandType, direction, targetVerse, offset);
    },
  });

  // Position recalculation on resize (only if not dragged)
  useEffect(() => {
    const handleResize = () => {
      if (isHandsfreeBibleOpen && !hasBeenDragged) {
        setWidgetPosition(calculateInitialPosition());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isHandsfreeBibleOpen, hasBeenDragged]);

  // Handle socket connection lifecycle
  useEffect(() => {
    if (isHandsfreeBibleOpen && !isConnected) {
      connect();
    }
  }, [isHandsfreeBibleOpen, connect, isConnected]);

  // Clean up socket on unmount ONLY
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Sync state to local storage and live window
  useEffect(() => {
    const widgetState = {
      isOpen: isHandsfreeBibleOpen,
      isListeningMode,
      selectedBibleVersion,
      detectedCommands,
    };
    localStorage.setItem("handsfreeBibleState", JSON.stringify(widgetState));

    if (isWindowOpen(liveWindow)) {
      liveWindow!.postMessage(
        {
          type: "BIBLE_WIDGET_SYNC",
          data: widgetState,
        },
        "*",
      );
    }
  }, [
    isHandsfreeBibleOpen,
    isListeningMode,
    selectedBibleVersion,
    detectedCommands,
    liveWindow,
  ]);

  // Sync dragging coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setWidgetPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasBeenDragged(true);
    setDragOffset({
      x: e.clientX - widgetPosition.x,
      y: e.clientY - widgetPosition.y,
    });
  };

  const calculateInitialPosition = () => {
    if (handsfreeBibleButtonRef.current) {
      const rect = handsfreeBibleButtonRef.current.getBoundingClientRect();
      const WIDGET_WIDTH = 400;
      let leftPosition = rect.left + rect.width / 2 - WIDGET_WIDTH / 2;
      if (leftPosition < 20) leftPosition = 20;
      if (leftPosition + WIDGET_WIDTH > window.innerWidth - 20) {
        leftPosition = window.innerWidth - WIDGET_WIDTH - 20;
      }
      return {
        x: leftPosition,
        y: rect.bottom + 15,
      };
    }
    return { x: window.innerWidth / 2 - 200, y: 100 };
  };

  const toggleHandsfreeBible = () => {
    const newState = !isHandsfreeBibleOpen;

    if (newState) {
      const initialPosition = calculateInitialPosition();
      setWidgetPosition(initialPosition);
      setHasBeenDragged(false);
      setIsSleepMode(false);
      setIsHandsfreeBibleOpen(true);
      setIsWidgetVisible(false);

      setTimeout(() => {
        setIsWidgetVisible(true);
      }, 20);
    } else {
      setIsHandsfreeBibleOpen(false);
      setIsWidgetVisible(false);
      setHasBeenDragged(false);

      setDetectedCommands("No commands detected");
      currentVerseContextRef.current = null;
      setWidgetVerseData(null);
      clearZustandProjection();
      useHFBStore.getState().clearAllState();

      // Stop recording and disconnect
      stopRecording();
      clearInactivityTimer();
      disconnect();
      setIsListeningMode(false);
      setIsSleepMode(true);
    }

    if (isWindowOpen(liveWindow)) {
      liveWindow!.postMessage(
        {
          type: "BIBLE_WIDGET_TOGGLE",
          data: { isOpen: newState },
        },
        "*",
      );
    }
  };

  const toggleMicrophone = async () => {
    if (isListeningMode) {
      setIsListeningMode(false);
      setIsSleepMode(false);
      stopRecording();
      clearInactivityTimer();
      setMicrophoneStatus("Idle");
      setDetectedCommands("Stopped listening");
    } else {
      setIsListeningMode(true);
      setIsSleepMode(false);

      if (!isConnected) connect();

      try {
        await startRecording((pcmBuffer) => {
          sendPCMData(pcmBuffer);
        });
        setMicrophoneStatus("Listening");
        setDetectedCommands("Listening...");
        resetInactivityTimer();
      } catch (err: any) {
        console.error("[HandsfreeBible] Microphone access failed:", err);
        setIsListeningMode(false);
        setMicrophoneStatus("Error");
        setDetectedCommands("Failed to access microphone");
        toast({
          title: "Microphone Error",
          description: err?.message || "Please allow microphone access to use voice commands.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetBibleVersion = (version: string) => {
    const normalized = version.toUpperCase();
    setSelectedBibleVersion(normalized);
    setZustandBibleVersion(normalized);
    useHFBStore.getState().setHfbVersion(normalized);
  };

  return {
    isHandsfreeBibleOpen,
    isWidgetVisible,
    widgetPosition,
    isDragging,
    isListeningMode,
    isSleepMode,
    microphoneStatus,
    detectedCommands,
    selectedBibleVersion,
    widgetVerseData,
    widgetFormattedReference,
    toggleHandsfreeBible,
    toggleMicrophone,
    setSelectedBibleVersion: handleSetBibleVersion,
    handleDragStart,
    setIsListeningMode,
    setDetectedCommands,
    executeNavigation,
  };
};
