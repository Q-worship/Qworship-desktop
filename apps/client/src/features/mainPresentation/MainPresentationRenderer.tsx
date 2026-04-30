import { useEffect, useState, type CSSProperties } from "react";
import type { LowerThirdBindingData } from "@/features/lowerThird/types";
import type { MainPresentationSettings } from "@/stores/useMainPresentationStore";
import { resolveMediaUrl } from "@/lib/queryClient";
import {
  isLocalBackgroundMediaRef,
  resolveLocalBackgroundMediaObjectUrl,
} from "@/lib/localBackgroundMedia";
;

interface MainPresentationRendererProps {
  settings: MainPresentationSettings;
  activeData: LowerThirdBindingData | null;
  isVisible: boolean;
  isPreview?: boolean;
  className?: string;
  style?: CSSProperties;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBackgroundStyle(settings: MainPresentationSettings): CSSProperties {
  if (settings.backgroundType === "solid") {
    return { background: settings.backgroundValue || "#0f0f0f" };
  }

  if (settings.backgroundType === "gradient") {
    return { background: settings.backgroundValue || "linear-gradient(135deg, #0f0f0f 0%, #222244 100%)" };
  }

  return { background: "#000000" };
}

function getRemoteMediaSource(settings: MainPresentationSettings): string {
  if (settings.backgroundType !== "media" || !settings.backgroundValue) return "";
  if (isLocalBackgroundMediaRef(settings.backgroundValue)) return "";
  return resolveMediaUrl(settings.backgroundValue) || "";
}

function getJustifyItems(textAlign: MainPresentationSettings["textAlign"]): CSSProperties["alignItems"] {
  if (textAlign === "left") return "flex-start";
  if (textAlign === "right") return "flex-end";
  return "center";
}

function renderSongLines(data: LowerThirdBindingData, settings: MainPresentationSettings, isPreview: boolean) {
  const lines = (data.paceLines && data.paceLines.length ? data.paceLines : data.verse.split("\n")).map((line) => line ?? "");
  const activeIndex = typeof data.paceLineIdx === "number" ? data.paceLineIdx : -1;
  const progress = clamp(typeof data.paceLineProgress === "number" ? data.paceLineProgress : 0, 0, 1);
  const baseColor = settings.fontColor;
  const highlightColor = "#fbbf24";

  return (
    <div className={isPreview ? "mt-3 space-y-1" : "mt-8 space-y-3"}>
      {lines.map((line, lineIndex) => {
        const isActive = lineIndex === activeIndex;
        const isPast = activeIndex >= 0 && lineIndex < activeIndex;
        const lineStyle: CSSProperties = {
          minHeight: "1.2em",
          whiteSpace: "pre-wrap",
          color: isPast || isActive ? highlightColor : baseColor,
          transition: "color 0.15s ease",
          position: "relative",
        };

        return (
          <p key={`${lineIndex}-${line}`} style={lineStyle}>
            {isActive ? (
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${progress * 100}%, ${baseColor} ${progress * 100}%, ${baseColor} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                {line || "\u00A0"}
              </span>
            ) : (
              line || "\u00A0"
            )}
          </p>
        );
      })}
    </div>
  );
}

export function MainPresentationRenderer({
  settings,
  activeData,
  isVisible,
  isPreview = false,
  className,
  style,
}: MainPresentationRendererProps) {
  const backgroundStyle = getBackgroundStyle(settings);
  const remoteMediaSrc = getRemoteMediaSource(settings);
  const [localMediaSrc, setLocalMediaSrc] = useState<string>("");
  const showProjection = Boolean(isVisible && activeData);

  useEffect(() => {
    let isActive = true;
    let objectUrlToRevoke: string | null = null;

    if (!isLocalBackgroundMediaRef(settings.backgroundValue)) {
      setLocalMediaSrc("");
      return () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      };
    }

    resolveLocalBackgroundMediaObjectUrl(settings.backgroundValue)
      .then((url) => {
        if (!isActive) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrlToRevoke = url ?? null;
        setLocalMediaSrc(url ?? "");
      })
      .catch(() => {
        if (isActive) setLocalMediaSrc("");
      });

    return () => {
      isActive = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [settings.backgroundValue]);

  const mediaSrc = localMediaSrc || remoteMediaSrc;
  const fontSizeMin = isPreview ? Math.max(10, settings.fontSizeMin * 0.18) : settings.fontSizeMin;
  const fontSizeMax = isPreview ? Math.max(20, settings.fontSizeMax * 0.18) : settings.fontSizeMax;

  const containerStyle: CSSProperties = {
    ...backgroundStyle,
    justifyContent: settings.justifyContent,
    alignItems: getJustifyItems(settings.textAlign),
    padding: isPreview ? "8% 10%" : "7% 8%",
    ...style,
  };

  const textStyle: CSSProperties = {
    color: settings.fontColor,
    fontFamily: settings.fontFamily,
    fontWeight: settings.fontWeight,
    textAlign: settings.textAlign,
    fontSize: `clamp(${fontSizeMin}px, ${isPreview ? "1.1vw" : "4.3vw"}, ${fontSizeMax}px)`,
    lineHeight: isPreview ? "1.4" : "1.35",
    whiteSpace: "pre-wrap",
    width: "100%",
    maxWidth: isPreview ? "100%" : "86vw",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.45)",
  };

  const metaStyle: CSSProperties = {
    opacity: 0.82,
    fontSize: isPreview ? "0.55em" : "0.5em",
    marginTop: "0.65em",
    fontWeight: 500,
    letterSpacing: "0.05em",
  };

  return (
    <div className={className} style={containerStyle}>
      {settings.backgroundType === "media" && mediaSrc
        ? settings.backgroundMediaType === "video"
          ? (
            <video
              key={mediaSrc}
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
          : (
              <img
                src={mediaSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />

          )
        : null}

      {showProjection ? (
        <div className="relative z-10 w-full" style={textStyle}>
          {activeData?.type === "lyrics" ? (
            <>
              {activeData.songTitle ? <p>{activeData.songTitle}</p> : null}
              {activeData.reference ? <div style={metaStyle}>{activeData.reference}</div> : null}
              {renderSongLines(activeData, settings, isPreview)}
            </>
          ) : (
            <>
              {activeData?.reference ? <p>{activeData.reference}</p> : null}
              <div className={isPreview ? "mt-3" : "mt-8"}>{activeData?.verse}</div>
              {activeData?.version ? <div style={metaStyle}>{activeData.version}</div> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
