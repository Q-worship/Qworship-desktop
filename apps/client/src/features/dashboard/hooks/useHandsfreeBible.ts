import React, {
  useState,
  useEffect,
  useRef,
  MutableRefObject,
  useCallback,
} from "react";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useRealtimeSocket } from "@/hooks/useRealtimeSocket";
import { useRawAudioStream } from "@/hooks/useRawAudioStream";
import { useToast } from "@/hooks/use-toast";
import { useHFBStore } from "./useHFBStore";

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
      chapter
    });
    
    // Set all other detected verses to inactive
    useHFBStore.getState().setHfbDetectedVerses(prev => 
      prev.map(d => ({ ...d, isActive: d.id === Date.now() })) // This handles new addition logic
    );
    useHFBStore.getState().setHfbCurrentProjected({ reference: `${book} ${chapter}:${verseNum}`, text, version: effectiveVersion });
    
    // Asynchronously fetch and display the whole chapter in Center Stage
    useHFBStore.getState().fetchHFBChapter(book, chapter, effectiveVersion, verseNum);

    if (isHandsfreeBibleOpen) {
      setDisplayMode("hfb-bible");
    }

    const currentLiveWindow = liveWindowRef.current;
    if (currentLiveWindow && !currentLiveWindow.closed) {
      currentLiveWindow.postMessage(
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
        window.location.origin,
      );
    }
  };

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

    // We need to fetch the next/previous verse using the current context
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

    console.log(
      "[HandsfreeBible] Fetching from API with context:",
      currentContext,
    );
    try {
      const response = await fetch("/api/bible/voice-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: commandText,
          currentBook: currentContext.book,
          currentChapter: currentContext.chapter,
          currentVerse: currentContext.verse,
          currentVersion:
            (currentContext as any).version ||
            selectedBibleVersion.toLowerCase(),
          commandType,
          direction,
          targetVerse,
          offset,
        }),
      });

      console.log("[HandsfreeBible] Fetch status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("[HandsfreeBible] Navigation API response:", data);
        if (data.success && data.result) {
          handleBibleMatch({
            result: data.result,
            commandType: data.commandType,
          });
        } else {
          console.warn("[HandsfreeBible] Navigation failed:", data.error);
        }
      } else {
        console.error(
          "[HandsfreeBible] Navigation fetch failed. Status:",
          response.status,
        );
        const errorText = await response.text();
        console.error("[HandsfreeBible] Error body:", errorText);
      }
    } catch (error) {
      console.error(
        "[HandsfreeBible] Error executing navigation command:",
        error,
      );
    }
  };

  const { isRecording, volume, startRecording, stopRecording } =
    useRawAudioStream();

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

  const { connect, disconnect, sendPCMData, isConnected } = useRealtimeSocket({
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
          ts: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

    if (liveWindow && !liveWindow.closed) {
      liveWindow.postMessage(
        {
          type: "BIBLE_WIDGET_SYNC",
          data: widgetState,
        },
        window.location.origin,
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

    if (liveWindow && !liveWindow.closed) {
      liveWindow.postMessage(
        {
          type: "BIBLE_WIDGET_TOGGLE",
          data: { isOpen: newState },
        },
        window.location.origin,
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
      } catch (err) {
        setIsListeningMode(false);
        setMicrophoneStatus("Error");
        setDetectedCommands("Failed to access microphone");
        toast({
          title: "Microphone Error",
          description: "Please allow microphone access to use voice commands.",
          variant: "destructive",
        });
      }
    }
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
    volume,
    toggleHandsfreeBible,
    toggleMicrophone,
    setSelectedBibleVersion,
    handleDragStart,
    setIsListeningMode,
    setDetectedCommands,
    executeNavigation,
  };
};
