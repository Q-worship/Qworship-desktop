declare global {
  interface Window {
    api?: {
      onDeepLinkPayload?: (callback: (url: string) => void) => () => void;
      requestInitialDeepLink?: () => void;
      openWebAuth?: (url: string) => void;
      updates?: {
        getState?: () => Promise<{
          status: string;
          message?: string;
          version?: string;
          releaseDate?: string;
          downloadedBytes?: number;
          totalBytes?: number;
          percent?: number;
          feedUrl?: string;
        }>;
        checkForUpdates?: (manual?: boolean) => Promise<unknown>;
        quitAndInstall?: () => Promise<{ success: boolean; message?: string }>;
        onStateChange?: (callback: (payload: unknown) => void) => () => void;
      };
      live?: {
        sendSync?: (payload: unknown) => void;
        onMessage?: (callback: (payload: unknown) => void) => () => void;
        onWindowClosed?: (callback: () => void) => () => void;
        openOutput?: (options: {
          route: string;
          targetDisplayId: string | null;
          connectionMethod: ConnectionMethod;
          fullscreen: boolean;
          ndiSettings?: {
            resolution: "1920x1080" | "1280x720" | "3840x2160";
            frameRate: "24" | "30" | "60";
            bandwidth: "highest" | "balanced" | "lowest";
            colorFormat: "uyvy422" | "rgba" | "bgra";
            audioEnabled: boolean;
            alphaEnabled: boolean;
            audienceEnabled: boolean;
            lowerThirdEnabled: boolean;
            audienceStreamName: string;
            lowerThirdStreamName: string;
          };
          lowerThirdRenderUrl?: string | null;
        }) => Promise<{ success: boolean }>;
        closeOutput?: () => Promise<{ success: boolean }>;
      };
      display?: {
        getOutputs?: () => Promise<OutputDisplayInfo[]>;
      };
      speech?: {
        sendAudioChunk?: (pcm16Buffer: ArrayBuffer) => void;
        startListening?: () => void;
        stopListening?: () => void;
        getStatus?: () => Promise<unknown>;
        setAuthToken?: (token: string | null) => Promise<{ success: boolean }>;
        setProvider?: (providerId: string) => Promise<unknown>;
        getProviders?: () => Promise<unknown>;
        onTranscriptPartial?: (callback: (payload: unknown) => void) => () => void;
        onTranscriptFinal?: (callback: (payload: unknown) => void) => () => void;
        onStatusChange?: (callback: (payload: unknown) => void) => () => void;
        onModelDownloadProgress?: (callback: (payload: unknown) => void) => () => void;
      };
      whisper?: {
        sendAudioChunk?: (pcm16Buffer: ArrayBuffer) => void;
        startListening?: () => void;
        stopListening?: () => void;
        getStatus?: () => Promise<unknown>;
        onTranscriptPartial?: (callback: (text: string) => void) => () => void;
        onTranscriptFinal?: (callback: (text: string) => void) => () => void;
        onStatusChange?: (callback: (status: string, message?: string) => void) => () => void;
        onModelDownloadProgress?: (
          callback: (percent: number, downloadedMB: number, totalMB: number) => void,
        ) => () => void;
      };
      bible?: {
        getChapter?: (version: string, book: string, chapter: number) => Promise<unknown>;
      };
    };
  }
}

export {};
