import { useState, useCallback } from "react";

interface ScriptureCommandProps {
  onBibleMatch: (result: any) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSleepCommand?: () => void;
  onWakeCommand?: () => void;
  onVersionChange?: (version: string) => void;
  onNavigation?: (commandType: string, direction: "next" | "previous") => void;
}

export const useScriptureCommand = ({
  onBibleMatch,
  onFinalTranscript,
  onSleepCommand,
  onWakeCommand,
  onVersionChange,
  onNavigation,
}: ScriptureCommandProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudio = useCallback(
    async (
      blob: Blob,
      context?: {
        currentBook?: string;
        currentChapter?: number;
        currentVerse?: number;
        currentVersion?: string;
      },
    ) => {
      try {
        setIsProcessing(true);

        // 1. Convert WebM blob to base64
        const reader = new FileReader();
        const base64Audio = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve(base64String.split(",")[1]); // remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // 2. Transcribe using Whisper
        const transcribeRes = await fetch("/api/whisper/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Audio, format: "webm" }),
        });

        const transcribeData = await transcribeRes.json();
        if (!transcribeData.success || !transcribeData.transcript) {
          throw new Error("Failed to transcribe audio");
        }

        const text = transcribeData.transcript;
        onFinalTranscript?.(text);

        // 3. Process Command
        const commandRes = await fetch("/api/bible/voice-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            ...context,
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
              onBibleMatch({
                result: commandData.result,
                commandType: "lookup",
              });
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
        console.error("[ScriptureCommand] Failed to process audio", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [
      onBibleMatch,
      onFinalTranscript,
      onSleepCommand,
      onWakeCommand,
      onVersionChange,
      onNavigation,
    ],
  );

  return {
    isProcessing,
    processAudio,
  };
};
