import { useState, useEffect, useCallback, useRef } from "react";

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
    currentVersion?: string;
  }>({});

  const processCommand = async (text: string) => {
    try {
      const commandRes = await fetch("/api/bible/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          ...contextRef.current,
        }),
      });

      const commandData = await commandRes.json();

      if (!commandData.success) {
        console.warn("Command failed or not recognized:", commandData.error);
        return;
      }

      switch (commandData.commandType) {
        case "lookup":
          if (commandData.result) {
            onBibleMatch({ result: commandData.result, commandType: "lookup" });
          }
          break;
        case "sleep":
          onSleepCommand?.();
          break;
        case "wake":
          onWakeCommand?.();
          break;
        case "version_change":
          if (commandData.requestedVersion) {
            onVersionChange?.(commandData.requestedVersion);
          }
          break;
        case "verse_change":
        case "chapter_change":
          if (commandData.result) {
            onBibleMatch({
              result: commandData.result,
              commandType: commandData.commandType,
            });
          } else {
            onNavigation?.(
              commandData.commandType,
              commandData.navigationDirection,
            );
          }
          break;
      }
    } catch (err) {
      console.error("[ContinuousSpeech] Failed to process command", err);
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
