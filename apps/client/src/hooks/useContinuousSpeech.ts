import { useState, useEffect, useCallback, useRef } from "react";
import { parseVoiceCommand, lookupOffline, type BibleVersion } from "@/lib/offlineBibleEngine";

// For TypeScript generic window access
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ContinuousSpeechProps {
  onBibleMatch: (result: any) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSleepCommand?: () => void;
  onWakeCommand?: () => void;
  onVersionChange?: (version: string) => void;
  onNavigation?: (commandType: string, direction: "next" | "previous") => void;
  onError?: (error: string) => void;
}

export const useContinuousSpeech = ({
  onBibleMatch,
  onPartialTranscript,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
  onError,
}: ContinuousSpeechProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const contextRef = useRef<{
    currentBook?: string;
    currentChapter?: number;
    currentVerse?: number;
    currentVersion?: BibleVersion;
  }>({});

  const processCommand = async (text: string) => {
    try {
      const version = contextRef.current.currentVersion || 'kjv';
      const command = parseVoiceCommand(text, version);

      switch (command.commandType) {
        case 'lookup': {
          if (!command.parsedReference) {
            console.warn('[HFB Offline] Could not parse reference:', text);
            return;
          }
          const result = await lookupOffline(command.parsedReference);
          if (result && result.verses.length > 0) {
            contextRef.current = {
              currentBook: result.book,
              currentChapter: result.chapter,
              currentVerse: result.verses[0].number,
              currentVersion: version,
            };
            onBibleMatch({
              commandType: 'lookup',
              parsedReference: command.parsedReference,
              data: {
                book: result.book,
                chapter: result.chapter,
                verses: result.verses,
                version: result.version,
                formattedReference: result.formattedReference,
              },
            });
          } else {
            console.warn('[HFB Offline] Verse not found in IndexedDB for:', command.parsedReference);
          }
          break;
        }
        case 'version_change':
          if (command.requestedVersion) {
            contextRef.current.currentVersion = command.requestedVersion;
            onVersionChange?.(command.requestedVersion);
          }
          break;
        case 'verse_change':
          if (command.navigationDirection) {
            onNavigation?.('verse_change', command.navigationDirection);
          }
          break;
        case 'chapter_change':
          if (command.navigationDirection) {
            onNavigation?.('chapter_change', command.navigationDirection);
          }
          break;
        case 'jump_to_verse':
          onNavigation?.('jump_to_verse', 'next');
          break;
        case 'sleep':
          onSleepCommand?.();
          break;
        case 'wake':
          onWakeCommand?.();
          break;
        default:
          break;
      }
    } catch (e: any) {
      console.error('[HFB Offline] processCommand error:', e);
      onError?.(e.message || 'Failed to process voice command');
    }
  };




  const startListening = useCallback(
    (context?: any) => {
      if (context) {
        contextRef.current = context;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        onError?.(
          "Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.",
        );
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            onPartialTranscript?.(interimTranscript);
          }

          if (finalTranscript) {
            const trimmed = finalTranscript.trim();
            if (trimmed) {
              onFinalTranscript?.(trimmed);
              processCommand(trimmed);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === "not-allowed") {
            onError?.("Microphone access was denied.");
            setIsListening(false);
            recognitionRef.current = null;
          }
        };

        recognition.onend = () => {
          // Automatically restart if it wasn't intentionally stopped
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Error handling if already started
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Recognition already started", e);
      }
    },
    [
      onPartialTranscript,
      onFinalTranscript,
      onBibleMatch,
      onSleepCommand,
      onWakeCommand,
      onVersionChange,
      onNavigation,
      onError,
    ],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null; // Prevent auto-restart
      rec.stop();
    }
    setIsListening(false);
  }, []);

  const updateContext = useCallback((context: any) => {
    contextRef.current = { ...contextRef.current, ...context };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    updateContext,
  };
};
