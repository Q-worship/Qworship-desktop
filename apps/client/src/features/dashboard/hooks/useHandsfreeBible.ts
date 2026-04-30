import {
  useState,
  useEffect,
  useRef,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  useCallback,
} from "react";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useLocalWhisper } from "@/hooks/useLocalWhisper";
import { useRawAudioStream } from "@/hooks/useRawAudioStream";
import { useToast } from "@/hooks/use-toast";
import { useHFBStore } from "./useHFBStore";
import { ALL_BIBLE_VERSION_KEYS_LCC } from "../data/bibleBooks";
import { fetchMultiVersionVerseRange } from "@/lib/sharedBibleEngine";

export type HFBSpeechMode = "online" | "offline";

const HFB_SPEECH_MODE_STORAGE_KEY = "qworship-hfb-speech-mode";
const HFB_PROVIDER_ID_BY_MODE: Record<HFBSpeechMode, string> = {
  online: "online-whisper",
  // Switched from offline-vosk to offline-whisper (tiny.en q5_1 + Silero VAD)
  // for improved Bible book accuracy while maintaining sub-1s latency.
  offline: "offline-whisper",
};

const isWindowOpen = (win: Window | null) => {
  if (!win) return false;
  try {
    return !win.closed;
  } catch {
    return true;
  }
};

const getInitialSpeechMode = (): HFBSpeechMode => {
  try {
    const stored = localStorage.getItem(HFB_SPEECH_MODE_STORAGE_KEY);
    if (stored === "online" || stored === "offline") {
      return stored;
    }
  } catch (error) {
    console.warn("[HandsfreeBible] Failed to read stored speech mode", error);
  }

  return "offline";
};

type WidgetVerseDataEntry = {
  verse: number;
  kjv?: string;
  nkjv?: string;
  amp?: string;
  msg?: string;
  esv?: string;
  niv?: string;
  gn?: string;
};

async function fetchVerseRangeForVersions(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | undefined,
  versions: string[],
) {
  return fetchMultiVersionVerseRange({
    book,
    chapter,
    verseStart,
    verseEnd,
    versions,
  });
}

async function fetchSelectedVersionVerses(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | undefined,
  selectedVersion: string,
) {
  return fetchVerseRangeForVersions(book, chapter, verseStart, verseEnd, [selectedVersion.toLowerCase()]);
}

async function fetchRemainingVersionVerses(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd: number | undefined,
  selectedVersion: string,
) {
  const selectedVersionKey = selectedVersion.toLowerCase();
  const remainingVersions = ALL_BIBLE_VERSION_KEYS_LCC.filter(
    (version) => version !== selectedVersionKey,
  );

  if (remainingVersions.length === 0) {
    return [];
  }

  return fetchVerseRangeForVersions(book, chapter, verseStart, verseEnd, remainingVersions);
}

function mergeWidgetVerseData(
  baseVerses: WidgetVerseDataEntry[] | null | undefined,
  incomingVerses: WidgetVerseDataEntry[] | null | undefined,
): WidgetVerseDataEntry[] | null {
  if (!baseVerses?.length && !incomingVerses?.length) {
    return null;
  }

  const merged = new Map<number, WidgetVerseDataEntry>();

  for (const verse of baseVerses ?? []) {
    merged.set(verse.verse, { ...verse });
  }

  for (const verse of incomingVerses ?? []) {
    const existing = merged.get(verse.verse) ?? { verse: verse.verse };
    merged.set(verse.verse, { ...existing, ...verse });
  }

  return Array.from(merged.values()).sort((a, b) => a.verse - b.verse);
}

function buildVerseForStore(
  book: string,
  chapter: number,
  verseData: WidgetVerseDataEntry | null | undefined,
) {
  if (!verseData) {
    return null;
  }

  return {
    book,
    chapter,
    verse: verseData.verse,
    kjv: verseData.kjv,
    nkjv: verseData.nkjv,
    niv: verseData.niv,
    amp: verseData.amp,
    gn: verseData.gn,
    msg: verseData.msg,
    esv: verseData.esv,
  };
}

function getVerseTextForVersion(
  verseData: WidgetVerseDataEntry | null | undefined,
  version: string,
) {
  if (!verseData) {
    return '';
  }

  const versionKey = version.toLowerCase() as keyof WidgetVerseDataEntry;
  const versionText = verseData[versionKey];
  return typeof versionText === 'string' ? versionText : verseData.kjv || '';
}

function buildReferenceLabel(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
) {
  return verseEnd && verseEnd > verseStart
    ? `${book} ${chapter}:${verseStart}-${verseEnd}`
    : `${book} ${chapter}:${verseStart}`;
}

function getVerseRangeBounds(verses: WidgetVerseDataEntry[] | null | undefined) {
  if (!verses?.length) {
    return null;
  }

  const verseNumbers = verses.map((verse) => verse.verse).filter(Number.isFinite);
  if (!verseNumbers.length) {
    return null;
  }

  return {
    verseStart: Math.min(...verseNumbers),
    verseEnd: Math.max(...verseNumbers),
  };
}

function normalizeWidgetVerses(verses: any[] | null | undefined): WidgetVerseDataEntry[] {
  return (verses ?? []).map((verse) => ({ ...verse, verse: Number(verse?.verse ?? 0) }))
    .filter((verse) => Number.isFinite(verse.verse) && verse.verse > 0)
    .sort((a, b) => a.verse - b.verse);
}

function getPrimaryVerse(verses: WidgetVerseDataEntry[] | null | undefined) {
  return verses?.[0] ?? null;
}

function matchesCurrentReference(
  currentContext: { book: string; chapter: number; verse: number } | null,
  book: string,
  chapter: number,
  verse: number,
) {
  return (
    currentContext?.book === book &&
    currentContext?.chapter === chapter &&
    currentContext?.verse === verse
  );
}

function resolveEffectiveVersion(
  commandType: string,
  requestedVersion: string | undefined,
  selectedBibleVersion: string,
) {
  return commandType === 'version_change' && requestedVersion
    ? requestedVersion.toUpperCase()
    : selectedBibleVersion;
}

function shouldHydrateAdditionalVersions(verses: WidgetVerseDataEntry[] | null | undefined) {
  const firstVerse = getPrimaryVerse(verses);
  if (!firstVerse) {
    return false;
  }

  return ALL_BIBLE_VERSION_KEYS_LCC.some((versionKey) => {
    const value = firstVerse[versionKey as keyof WidgetVerseDataEntry];
    return typeof value !== 'string' || !value.trim();
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
  const { setMode: setDisplayMode } = useDisplayModeStore();
  const {
    setVerse: setZustandVerse,
    setBibleVersion: setZustandBibleVersion,
    clearProjection: clearZustandProjection,
  } = useBibleProjectionStore();

  const [isHandsfreeBibleOpen, setIsHandsfreeBibleOpen] = useState(false);
  const [selectedBibleVersion, setSelectedBibleVersion] = useState("KJV");
  const [detectedCommands, setDetectedCommands] = useState(
    "No commands detected",
  );
  const [widgetPosition, setWidgetPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [microphoneStatus, setMicrophoneStatus] = useState("Idle");
  const [speechMode, setSpeechMode] = useState<HFBSpeechMode>(
    getInitialSpeechMode(),
  );
  const [availableSpeechProviders, setAvailableSpeechProviders] = useState<any[]>(
    [],
  );
  const [activeSpeechProviderId, setActiveSpeechProviderId] = useState<string | null>(
    null,
  );

  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false);
  const [isSleepMode, setIsSleepMode] = useState(false);

  const [widgetVerseData, setWidgetVerseData] = useState<WidgetVerseDataEntry[] | null>(null);
  const [widgetFormattedReference, setWidgetFormattedReference] = useState<
    string | null
  >(null);

  const currentVerseContextRef = useRef<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);
  const liveWindowRef = useRef<Window | null>(null);
  const verseHydrationRequestRef = useRef(0);

  useEffect(() => {
    liveWindowRef.current = liveWindow;
  }, [liveWindow]);

  const syncProjectedVerseVersion = useCallback((nextVersion: string) => {
    setZustandBibleVersion(nextVersion);

    const currentContext = currentVerseContextRef.current;
    const primaryVerse = getPrimaryVerse(widgetVerseData);
    if (!currentContext || !primaryVerse) {
      return;
    }

    const rangeBounds = getVerseRangeBounds(widgetVerseData) ?? {
      verseStart: primaryVerse.verse,
      verseEnd: primaryVerse.verse,
    };
    const referenceLabel =
      widgetFormattedReference ??
      buildReferenceLabel(
        currentContext.book,
        currentContext.chapter,
        rangeBounds.verseStart,
        rangeBounds.verseEnd,
      );
    const text = getVerseTextForVersion(primaryVerse, nextVersion);

    setZustandVerse(
      buildVerseForStore(currentContext.book, currentContext.chapter, primaryVerse),
      referenceLabel,
    );
    useHFBStore.getState().setHfbCurrentProjected({
      reference: referenceLabel,
      text,
      version: nextVersion,
    });

    const currentLiveWindow = liveWindowRef.current;
    if (isWindowOpen(currentLiveWindow)) {
      currentLiveWindow!.postMessage(
        {
          type: "PROJECT_BIBLE_VERSE",
          data: {
            book: currentContext.book,
            chapter: currentContext.chapter,
            verse: primaryVerse.verse,
            text,
            version: nextVersion,
            reference: referenceLabel,
          },
        },
        "*",
      );
    }
  }, [setZustandBibleVersion, setZustandVerse, widgetFormattedReference, widgetVerseData]);

  const {
    connect,
    disconnect,
    sendPCMData,
    isConnected,
    setSpeechProvider,
    getSpeechProviders,
  } = useLocalWhisper({
    onBibleMatch: (data: any) => {
      resetInactivityTimer();
      handleBibleMatch(data);
    },
    onPartialTranscript: () => {
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
      useHFBStore.getState().setHfbVersion(normalized);
      syncProjectedVerseVersion(normalized);
      setDetectedCommands(`Switched to ${normalized}`);
    },
    onNavigation: (commandType, direction, targetVerse, offset) => {
      resetInactivityTimer();
      executeNavigation(commandType, direction, targetVerse, offset);
    },
  });

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      setIsListeningMode(false);
      setIsSleepMode(false);
      stopRecording();
      setMicrophoneStatus("Idle");
      setDetectedCommands("Stopped listening due to inactivity");
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer]);

  const { startRecording, stopRecording } = useRawAudioStream();

  const applySpeechMode = useCallback(
    async (requestedMode: HFBSpeechMode) => {
      const providerId = HFB_PROVIDER_ID_BY_MODE[requestedMode];
      const result = await setSpeechProvider(providerId);

      if (result?.success) {
        setActiveSpeechProviderId(result.activeProviderId ?? providerId);
        return result;
      }

      setActiveSpeechProviderId(result?.activeProviderId ?? null);

      if (requestedMode === "online") {
        console.warn(
          "[HandsfreeBible] Online speech provider is not yet available; retaining current provider.",
          result,
        );
      }

      return result;
    },
    [setSpeechProvider],
  );

  useEffect(() => {
    try {
      localStorage.setItem(HFB_SPEECH_MODE_STORAGE_KEY, speechMode);
    } catch (error) {
      console.warn("[HandsfreeBible] Failed to persist speech mode", error);
    }
  }, [speechMode]);

  useEffect(() => {
    getSpeechProviders()
      .then((providers) => {
        setAvailableSpeechProviders(Array.isArray(providers) ? providers : []);
      })
      .catch((error) => {
        console.warn("[HandsfreeBible] Failed to load speech providers", error);
      });
  }, [getSpeechProviders]);

  useEffect(() => {
    if (!isHandsfreeBibleOpen) return;

    applySpeechMode(speechMode).then((result) => {
      if (!result?.success && speechMode === "online") {
        setDetectedCommands(
          "Online mode selected, but the Online speech provider failed to activate. The previous provider remains active.",
        );
      }
    });
  }, [applySpeechMode, isHandsfreeBibleOpen, speechMode]);

  const hydrateAdditionalVerseVersions = useCallback(
    async ({
      book,
      chapter,
      verses,
      effectiveVersion,
      requestId,
    }: {
      book: string;
      chapter: number;
      verses: WidgetVerseDataEntry[];
      effectiveVersion: string;
      requestId: number;
    }) => {
      if (!shouldHydrateAdditionalVersions(verses)) {
        return;
      }

      const rangeBounds = getVerseRangeBounds(verses);
      if (!rangeBounds) {
        return;
      }

      try {
        const additionalVerses = await fetchRemainingVersionVerses(
          book,
          chapter,
          rangeBounds.verseStart,
          rangeBounds.verseEnd,
          effectiveVersion,
        );

        if (!additionalVerses.length || verseHydrationRequestRef.current !== requestId) {
          return;
        }

        const mergedVerses = mergeWidgetVerseData(verses, additionalVerses);
        const primaryVerse = getPrimaryVerse(mergedVerses);

        if (!primaryVerse || !matchesCurrentReference(currentVerseContextRef.current, book, chapter, primaryVerse.verse)) {
          return;
        }

        setWidgetVerseData(mergedVerses);
        setZustandVerse(
          buildVerseForStore(book, chapter, primaryVerse),
          buildReferenceLabel(book, chapter, rangeBounds.verseStart, rangeBounds.verseEnd),
        );
      } catch (error) {
        console.warn('[HandsfreeBible] Deferred translation hydration failed', {
          book,
          chapter,
          effectiveVersion,
          error,
        });
      }
    },
    [setZustandVerse],
  );

  const handleBibleMatch = useCallback((data: any) => {
    if (data.success === false) {
      setDetectedCommands(data.error || "Command not recognized");
      return;
    }

    const { book, chapter, verses } = data.result;
    const normalizedVerses = normalizeWidgetVerses(verses);
    const verseData = getPrimaryVerse(normalizedVerses);
    const verseNum = verseData?.verse;

    if (!verseData || !verseNum) {
      setDetectedCommands("Command recognized, but no verse data was returned");
      return;
    }

    if (data.commandType === "version_change" && data.requestedVersion) {
      const newVersion = data.requestedVersion.toUpperCase();
      setSelectedBibleVersion(newVersion);
      useHFBStore.getState().setHfbVersion(newVersion);
    }

    const effectiveVersion = resolveEffectiveVersion(
      data.commandType,
      data.requestedVersion,
      selectedBibleVersion,
    );
    const text = getVerseTextForVersion(verseData, effectiveVersion);
    const rangeBounds = getVerseRangeBounds(normalizedVerses) ?? {
      verseStart: verseNum,
      verseEnd: verseNum,
    };
    const referenceLabel = buildReferenceLabel(
      book,
      chapter,
      rangeBounds.verseStart,
      rangeBounds.verseEnd,
    );

    const currentVerseContext = { book, chapter, verse: verseNum };
    currentVerseContextRef.current = currentVerseContext;
    const requestId = Date.now();
    verseHydrationRequestRef.current = requestId;
    setWidgetVerseData(normalizedVerses);
    setWidgetFormattedReference(referenceLabel);
    setDetectedCommands(referenceLabel);

    setZustandVerse(buildVerseForStore(book, chapter, verseData), referenceLabel);
    setZustandBibleVersion(effectiveVersion);

    const detectionId = Date.now();
    useHFBStore.getState().addHfbDetectedVerse({
      id: detectionId,
      reference: referenceLabel,
      verseText: text,
      version: effectiveVersion,
      isActive: true,
      verseNum,
      book,
      chapter,
    });

    useHFBStore
      .getState()
      .setHfbDetectedVerses((prev) =>
        prev.map((detectedVerse) => ({
          ...detectedVerse,
          isActive: detectedVerse.id === detectionId,
        })),
      );

    useHFBStore.getState().setHfbCurrentProjected({
      reference: referenceLabel,
      text,
      version: effectiveVersion,
    });

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
          type: "PROJECT_BIBLE_VERSE",
          data: {
            book,
            chapter,
            verse: verseNum,
            text,
            version: effectiveVersion,
            reference: referenceLabel,
          },
        },
        "*",
      );
    }

    void hydrateAdditionalVerseVersions({
      book,
      chapter,
      verses: normalizedVerses,
      effectiveVersion,
      requestId,
    });
  }, [
    hydrateAdditionalVerseVersions,
    isHandsfreeBibleOpen,
    selectedBibleVersion,
    setDisplayMode,
    setZustandBibleVersion,
    setZustandVerse,
  ]);

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
      commandText = "Last verse";
    } else if (commandType === "jump_relative") {
      commandText = `Jump ${offset! > 0 ? `forward ${offset}` : `back ${-offset!}`} verses`;
    }

    setDetectedCommands(commandText);

    const currentContext = currentVerseContextRef.current;
    if (!currentContext?.book || !currentContext.chapter || !currentContext.verse) {
      console.warn("[HandsfreeBible] No current verse context for navigation");
      return;
    }

    const newBook = currentContext.book;
    let newChapter = currentContext.chapter;
    let newVerse = currentContext.verse;

    if (commandType === "verse_change") {
      newVerse =
        direction === "next" ? newVerse + 1 : Math.max(1, newVerse - 1);
    } else if (commandType === "chapter_change") {
      newChapter =
        direction === "next" ? newChapter + 1 : Math.max(1, newChapter - 1);
    } else if (commandType === "jump_to_verse" && targetVerse) {
      newVerse = targetVerse;
    } else if (commandType === "jump_relative" && offset) {
      newVerse = Math.max(1, newVerse + offset);
    } else if (commandType === "last_verse") {
      const chapterPassage = await fetchMultiVersionVerseRange({
        book: newBook,
        chapter: newChapter,
        verseStart: 1,
        verseEnd: 500,
        versions: [selectedBibleVersion.toLowerCase()],
      });
      if (chapterPassage.length > 0) {
        newVerse = chapterPassage[chapterPassage.length - 1].verse as number;
      }
    }

    try {
      const selectedVersionVerses = await fetchSelectedVersionVerses(
        newBook,
        newChapter,
        newVerse,
        undefined,
        selectedBibleVersion,
      );
      if (selectedVersionVerses.length > 0) {
        handleBibleMatch({
          success: true,
          result: {
            book: newBook,
            chapter: newChapter,
            verses: selectedVersionVerses,
          },
          commandType: "lookup",
        });
      } else {
        console.warn(
          "[HandsfreeBible] No verses found for navigation target:",
          { newBook, newChapter, newVerse, selectedBibleVersion },
        );
      }
    } catch (error) {
      console.error("[HandsfreeBible] Error executing offline navigation:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (isHandsfreeBibleOpen && !hasBeenDragged) {
        setWidgetPosition(calculateInitialPosition());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasBeenDragged, isHandsfreeBibleOpen]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    const widgetState = {
      isOpen: isHandsfreeBibleOpen,
      isListeningMode,
      selectedBibleVersion,
      detectedCommands,
      speechMode,
      activeSpeechProviderId,
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
    activeSpeechProviderId,
    detectedCommands,
    isHandsfreeBibleOpen,
    isListeningMode,
    liveWindow,
    selectedBibleVersion,
    speechMode,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        setWidgetPosition({
          x: event.clientX - dragOffset.x,
          y: event.clientY - dragOffset.y,
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
  }, [dragOffset, isDragging]);

  const handleDragStart = (event: ReactMouseEvent) => {
    setIsDragging(true);
    setHasBeenDragged(true);
    setDragOffset({
      x: event.clientX - widgetPosition.x,
      y: event.clientY - widgetPosition.y,
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
      stopRecording();
      clearInactivityTimer();
      disconnect();
      setIsListeningMode(false);
      setIsSleepMode(true);
      setActiveSpeechProviderId(null);
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
      return;
    }

    setIsListeningMode(true);
    setIsSleepMode(false);

    const providerResult = await applySpeechMode(speechMode);
    if (!providerResult?.success && speechMode === "online") {
      const providerError =
        providerResult?.error ||
        "Online Whisper mode could not be activated. The previous speech provider remains active.";
      setDetectedCommands(providerError);
      toast({
        title: "Online speech mode unavailable",
        description: providerError,
        variant: "destructive",
      });
    }

    try {
      disconnect();
      await connect();

      await startRecording((pcmBuffer) => {
        sendPCMData(pcmBuffer);
      });
      setMicrophoneStatus(
        speechMode === "online" ? "Listening (Online Mode)" : "Listening (Offline Mode)",
      );
      setDetectedCommands(
        speechMode === "online"
          ? "Listening in Online Mode..."
          : "Listening in Offline Mode...",
      );
      resetInactivityTimer();
    } catch (error) {
      console.error("[HandsfreeBible] Microphone access failed:", error);
      setIsListeningMode(false);
      setMicrophoneStatus("Error");
      setDetectedCommands("Failed to access microphone");
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetBibleVersion = (version: string) => {
    const normalized = version.toUpperCase();
    setSelectedBibleVersion(normalized);
    useHFBStore.getState().setHfbVersion(normalized);
    syncProjectedVerseVersion(normalized);
  };

  const handleSetSpeechMode = async (mode: HFBSpeechMode) => {
    setSpeechMode(mode);
    const result = await applySpeechMode(mode);
    if (!result?.success && mode === "online") {
      setDetectedCommands(
        result?.error ||
          "Online mode selected, but the Online provider failed to activate. The previous provider remains active.",
      );
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
    speechMode,
    availableSpeechProviders,
    activeSpeechProviderId,
    toggleHandsfreeBible,
    toggleMicrophone,
    setSelectedBibleVersion: handleSetBibleVersion,
    setSpeechMode: handleSetSpeechMode,
    handleDragStart,
    setIsListeningMode,
    setDetectedCommands,
    executeNavigation,
  };
};
