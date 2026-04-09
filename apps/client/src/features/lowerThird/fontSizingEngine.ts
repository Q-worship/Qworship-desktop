/**
 * Font Sizing Engine — powered by canvas-txt
 *
 * Uses canvas-txt's `splitText` (accurate CSS-based word-wrap on canvas) and
 * `getTextHeight` (single-line em-box height) as measurement primitives,
 * replacing the previous manual word-wrap loop.
 */

import { splitText, getTextHeight } from "canvas-txt";

let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D | null {
  if (_ctx) return _ctx;
  if (typeof document === "undefined") return null;
  _canvas = document.createElement("canvas");
  _ctx = _canvas.getContext("2d");
  return _ctx;
}

// ─── cache ────────────────────────────────────────────────────────────────────

const metricsCache = new Map<string, { lines: number; height: number }>();
const MAX_CACHE_SIZE = 300;

function cacheKey(
  text: string,
  fontSize: number,
  availableWidth: number,
  fontFamily: string,
  fontWeight: number,
  lineHeight: number,
): string {
  return `${text.substring(0, 60)}|${fontSize}|${availableWidth}|${fontFamily}|${fontWeight}|${lineHeight}`;
}

// ─── core measurement ─────────────────────────────────────────────────────────

/**
 * Measure how many lines `text` occupies at `fontSize` inside `availableWidth`,
 * and return the total block height using `canvas-txt` primitives.
 */
export function measureTextDimensions(
  text: string,
  fontSize: number,
  availableWidth: number,
  fontFamily: string,
  fontWeight: number,
  lineHeight: number = 1.3,
): { width: number; height: number; lines: number } {
  const ctx = getCtx();
  if (!ctx || !text || availableWidth <= 0 || fontSize <= 0) {
    return { width: 0, height: 0, lines: 0 };
  }

  const key = cacheKey(text, fontSize, availableWidth, fontFamily, fontWeight, lineHeight);
  const cached = metricsCache.get(key);
  if (cached) return { width: availableWidth, ...cached };

  // Set font exactly as canvas-txt expects (it reads ctx.font internally)
  const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.font = fontStr;

  // canvas-txt splitText wraps text the same way the library renders it
  const wrappedLines = splitText({ ctx, text, justify: false, width: availableWidth });

  // getTextHeight returns the rendered em-box height for one line at this style
  const singleLineH = getTextHeight({ ctx, text: "Mg", style: fontStr });
  const totalHeight = wrappedLines.length * singleLineH * lineHeight;

  const result = { lines: wrappedLines.length, height: totalHeight };

  if (metricsCache.size >= MAX_CACHE_SIZE) {
    const first = metricsCache.keys().next().value;
    if (first) metricsCache.delete(first);
  }
  metricsCache.set(key, result);

  return { width: availableWidth, ...result };
}

// ─── binary-search optimal size ───────────────────────────────────────────────

/**
 * Find the largest font size (in `[minFontSize, maxFontSize]`) where `text`
 * wraps to fit within `availableWidth × availableHeight` using canvas-txt
 * measurement.
 */
export function calculateOptimalFontSize(
  text: string,
  availableWidth: number,
  availableHeight: number,
  minFontSize: number,
  maxFontSize: number,
  fontFamily: string = "Inter",
  fontWeight: number = 700,
  lineHeight: number = 1.3,
): number {
  if (!text || availableWidth <= 0 || availableHeight <= 0) {
    return minFontSize;
  }

  let low = minFontSize;
  let high = maxFontSize;
  let optimal = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const { height } = measureTextDimensions(
      text, mid, availableWidth, fontFamily, fontWeight, lineHeight,
    );

    if (height <= availableHeight) {
      optimal = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return optimal;
}

// ─── responsive scaling ───────────────────────────────────────────────────────

/**
 * Scale a base font size from 1080p to any target resolution height.
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  baseResolutionHeight: number = 1080,
  targetResolutionHeight: number,
): number {
  const scale = targetResolutionHeight / baseResolutionHeight;
  return Math.round(baseFontSize * scale);
}

// ─── cache management ─────────────────────────────────────────────────────────

export function clearFontMetricsCache(): void {
  metricsCache.clear();
}
