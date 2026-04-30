/**
 * LowerThirdRenderer
 *
 * Architecture:
 *  • Every text element gets an OUTER fixed-size container div (absolute,
 *    percentage-based dimensions derived from the template canvas).
 *  • fitty is attached to the INNER text div — it reads the outer container's
 *    pixel width and scales font-size to snugly fill that space.
 *  • min/maxSize come from the element's fontSizeMin/fontSizeMax (16–200 range).
 *  • Shape elements are unchanged — plain absolute divs.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import type {
  LowerThirdTemplate,
  LowerThirdElement,
  LowerThirdBindingData,
} from "./types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveText(
  element: LowerThirdElement,
  data: LowerThirdBindingData,
): string {
  // Composite (merged) binding takes priority
  if (element.compositeBinding && element.compositeBinding.length > 0) {
    return element.compositeBinding
      .map((part) => {
        const value = data[part.field as keyof LowerThirdBindingData] as string | undefined;
        if (!value) return "";
        return `${part.prefix ?? ""}${value}${part.suffix ?? ""}`;
      })
      .join("");
  }
  // Single-field binding
  if (element.binding) {
    const value = data[element.binding.field as keyof LowerThirdBindingData];
    return (value as string) || element.binding.placeholder || element.text || "";
  }
  return element.text || "";
}

function renderPaceText(
  element: LowerThirdElement,
  data: LowerThirdBindingData,
): ReactNode {
  const text = resolveText(element, data);
  const bindingField = element.binding?.field;

  if (bindingField !== "verse" || data.type !== "lyrics" || !data.paceLines?.length || typeof data.paceLineIdx !== "number") {
    return text;
  }

  const safeLineProgress = Math.max(0, Math.min(data.paceLineProgress ?? 0, 1));

  return data.paceLines.map((line, lineIndex) => {
    let style: React.CSSProperties | undefined;

    if (lineIndex < data.paceLineIdx!) {
      style = { color: "#f5c542" };
    } else if (lineIndex === data.paceLineIdx) {
      const progressPercent = Math.round(safeLineProgress * 100);
      style = progressPercent >= 100
        ? { color: "#f5c542" }
        : progressPercent <= 0
          ? undefined
          : {
              backgroundImage: `linear-gradient(90deg, #f5c542 ${progressPercent}%, ${element.textColor || "#ffffff"} ${progressPercent}%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            };
    }

    return (
      <span key={`${lineIndex}-${line}`} style={{ display: "block", minHeight: "1.2em", ...style }}>
        {line || "\u00A0"}
      </span>
    );
  });
}

function getAnimationStyle(
  element: LowerThirdElement,
  isVisible: boolean,
  isPreview: boolean,
): React.CSSProperties {
  if (isPreview || !element.animation || element.animation.type === "none") {
    return { opacity: 1, transform: "none" };
  }

  if (!isVisible) {
    return { opacity: 0, transform: "translateY(16px) scale(0.97)" };
  }

  const { type, duration, delay, easing } = element.animation;
  const transition = `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`;

  const visible: React.CSSProperties = {
    opacity: 1,
    transform: "none",
    transition,
  };

  switch (type) {
    case "slideIn":
      return { ...visible, transform: "translateY(0)", transition };
    case "scaleIn":
      return { ...visible, transform: "scale(1)", transition };
    case "rotateIn":
      return { ...visible, transform: "rotate(0) scale(1)", transition };
    default:
      return visible;
  }
}

// ─── SmartTextElement ─────────────────────────────────────────────────────────

interface SmartTextElementProps {
  element: LowerThirdElement;
  text: ReactNode;
  isVisible: boolean;
  isPreview: boolean;
}

function SmartTextElement({
  element,
  text,
  isVisible,
  isPreview,
}: SmartTextElementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const defaultSize = element.fontSizeMax ?? element.fontSize ?? 48;
  const [fontSize, setFontSize] = useState(defaultSize);

  // Intelligent text scaling based on container bounds
  useEffect(() => {
    const container = containerRef.current;
    const textNode = textRef.current;
    if (!container || !textNode) return;

    if (!element.fontSizeDynamic) {
      setFontSize(defaultSize);
      return;
    }

    const minSize = element.fontSizeMin ?? 16;
    const maxSize = defaultSize;

    // Remove clamping temporarily to measure true overflow
    const originalClamp = textNode.style.getPropertyValue("-webkit-line-clamp");
    const originalDisplay = textNode.style.getPropertyValue("display");

    textNode.style.setProperty("-webkit-line-clamp", "unset");
    textNode.style.setProperty("display", "block");

    let min = minSize;
    let max = maxSize;
    let best = minSize;

    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      textNode.style.fontSize = `${mid}px`;

      const isOverflowing =
        textNode.scrollHeight > container.clientHeight ||
        textNode.scrollWidth > container.clientWidth;

      if (isOverflowing) {
        max = mid - 1;
      } else {
        best = mid;
        min = mid + 1;
      }
    }

    // Restore clamp
    if (originalDisplay) {
      textNode.style.setProperty("display", originalDisplay);
    }
    if (originalClamp) {
      textNode.style.setProperty("-webkit-line-clamp", originalClamp);
    }

    setFontSize(best);
  }, [
    text,
    element.fontSizeDynamic,
    element.fontSizeMin,
    defaultSize,
    element.width,
    element.height,
  ]);

  const animStyle = getAnimationStyle(element, isVisible, isPreview);

  // Map alignment perfectly for Flexbox
  const alignItems =
    element.textAlign === "center"
      ? "center"
      : element.textAlign === "right"
        ? "flex-end"
        : "flex-start";

  return (
    /* ── OUTER: fixed-size slot ────────────────────────────────────────────── */
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        overflow: "hidden",
        display: element.visible ? "flex" : "none",
        flexDirection: "column",
        justifyContent: "center", // Vertically center the text block
        alignItems: alignItems,
        zIndex: element.zIndex,
        ...animStyle,
      }}>
      {/* ── INNER: intelligently scaled target ─────────────────────────────── */}
      <div
        ref={textRef}
        style={{
          width: "100%",
          fontFamily: element.fontFamily || "Inter, sans-serif",
          fontWeight: element.fontWeight || 700,
          fontStyle: element.fontStyle || "normal",
          color: element.textColor || "#ffffff",
          textAlign: element.textAlign || "left",
          lineHeight: element.lineHeight || 1.3,
          letterSpacing: element.letterSpacing
            ? `${element.letterSpacing}px`
            : undefined,
          whiteSpace:
            element.textOverflow === "truncate" ? "nowrap" : "pre-wrap",
          wordBreak: "break-word",
          fontSize: `${fontSize}px`,

          // Truncation rules
          display: element.lineClamp ? "-webkit-box" : "block",
          WebkitLineClamp: element.lineClamp,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
        {text}
      </div>
    </div>
  );
}

// ─── ShapeElement ─────────────────────────────────────────────────────────────

function ShapeElement({
  element,
  isVisible,
  isPreview,
}: {
  element: LowerThirdElement;
  isVisible: boolean;
  isPreview: boolean;
}) {
  const animStyle = getAnimationStyle(element, isVisible, isPreview);

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        backgroundColor: element.gradient
          ? undefined
          : element.backgroundColor || "transparent",
        background: element.gradient || undefined,
        borderColor: element.borderColor,
        borderWidth: element.borderWidth
          ? `${element.borderWidth}px`
          : undefined,
        borderStyle: element.borderWidth ? "solid" : undefined,
        borderRadius: element.borderRadius
          ? `${element.borderRadius}px`
          : undefined,
        opacity: element.opacity ?? 1,
        boxShadow: element.boxShadow,
        clipPath: element.clipPath,
        transform: element.transform,
        zIndex: element.zIndex,
        display: element.visible ? "block" : "none",
        ...animStyle,
      }}
    />
  );
}

// ─── ImageElement ─────────────────────────────────────────────────────────────

function ImageElement({
  element,
  isVisible,
  isPreview,
}: {
  element: LowerThirdElement;
  isVisible: boolean;
  isPreview: boolean;
}) {
  const animStyle = getAnimationStyle(element, isVisible, isPreview);

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        overflow: "hidden",
        opacity: element.opacity ?? 1,
        zIndex: element.zIndex,
        display: element.visible ? "block" : "none",
        borderRadius: element.borderRadius
          ? `${element.borderRadius}px`
          : undefined,
        ...animStyle,
      }}>
      {element.src && (
        <img
          src={element.src}
          alt={element.name || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: (element.objectFit as React.CSSProperties["objectFit"]) || "cover",
            display: "block",
          }}
        />
      )}
    </div>
  );
}

// ─── LowerThirdRenderer ───────────────────────────────────────────────────────

interface LowerThirdRendererProps {
  template: LowerThirdTemplate;
  data: LowerThirdBindingData;
  isVisible: boolean;
  containerWidth?: number;
  containerHeight?: number;
  isPreview?: boolean;
}

export function LowerThirdRenderer({
  template,
  data,
  isVisible,
  isPreview = false,
}: LowerThirdRendererProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: isPreview ? "none" : undefined,
      }}>
      {template.elements
        .filter((el) => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => {
          if (element.type === "text") {
            return (
              <SmartTextElement
                key={element.id}
                element={element}
                text={renderPaceText(element, data)}
                isVisible={isVisible}
                isPreview={isPreview}
              />
            );
          }
          if (element.type === "image") {
            return (
              <ImageElement
                key={element.id}
                element={element}
                isVisible={isVisible}
                isPreview={isPreview}
              />
            );
          }
          return (
            <ShapeElement
              key={element.id}
              element={element}
              isVisible={isVisible}
              isPreview={isPreview}
            />
          );
        })}
    </div>
  );
}

// ─── Preview Thumbnail ────────────────────────────────────────────────────────

export function LowerThirdPreviewThumbnail({
  template,
  width = 320,
  height = 180,
}: {
  template: LowerThirdTemplate;
  width?: number;
  height?: number;
}) {
  const sampleData: LowerThirdBindingData = {
    verse: "For God so loved the world that he gave his one and only Son",
    reference: "John 3:16",
    version: "NIV",
    churchName: "My Church",
    songTitle: "",
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
      }}>
      <LowerThirdRenderer
        template={template}
        data={sampleData}
        isVisible={true}
        containerWidth={width}
        containerHeight={height}
        isPreview={true}
      />
    </div>
  );
}
