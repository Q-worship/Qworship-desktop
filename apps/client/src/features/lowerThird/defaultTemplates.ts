import type { LowerThirdTemplate, TemplateCategory } from "./types";

const now = new Date().toISOString();

function createTextElement(
  id: string,
  name: string,
  opts: {
    x: number; y: number; width: number; height: number;
    text?: string; fontFamily?: string; fontSize?: number;
    fontSizeMin?: number; fontSizeMax?: number; fontSizeDynamic?: boolean;
    fontSizeAnimated?: boolean; fontWeight?: number; textColor?: string;
    textAlign?: "left" | "center" | "right"; lineHeight?: number;
    lineClamp?: number; textOverflow?: "truncate" | "wrap" | "scale";
    zIndex?: number; binding?: { field: "verse" | "reference" | "version" | "churchName" | "custom"; placeholder?: string };
    animation?: { type: "fadeIn" | "slideIn" | "scaleIn" | "rotateIn" | "none"; duration: number; delay: number; easing: "ease-in" | "ease-out" | "ease-in-out" | "linear"; animateFontSize?: boolean };
    opacity?: number; letterSpacing?: number;
  }
) {
  return {
    id,
    type: "text" as const,
    name,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    rotation: 0,
    text: opts.text || "",
    fontFamily: opts.fontFamily || "Inter",
    fontSize: opts.fontSize || 48,
    fontSizeMin: opts.fontSizeMin ?? 16,
    fontSizeMax: opts.fontSizeMax ?? 200,
    fontSizeDynamic: opts.fontSizeDynamic !== false,
    fontSizeAnimated: opts.fontSizeAnimated !== false,
    fontWeight: opts.fontWeight || 700,
    fontStyle: "normal" as const,
    textColor: opts.textColor || "#ffffff",
    textAlign: opts.textAlign || "left",
    lineHeight: opts.lineHeight || 1.3,
    letterSpacing: opts.letterSpacing || 0,
    lineClamp: opts.lineClamp || 5,
    textOverflow: opts.textOverflow || "scale",
    opacity: opts.opacity ?? 1,
    zIndex: opts.zIndex || 2,
    locked: false,
    visible: true,
    animation: opts.animation || { type: "fadeIn", duration: 400, delay: 0, easing: "ease-out", animateFontSize: true },
    binding: opts.binding,
  };
}

function createShapeElement(
  id: string,
  name: string,
  opts: {
    x: number; y: number; width: number; height: number;
    backgroundColor?: string; borderColor?: string; borderWidth?: number;
    borderRadius?: number; opacity?: number; clipPath?: string;
    gradient?: string; transform?: string; zIndex?: number; boxShadow?: string;
    backdropFilter?: string;
    animation?: { type: "fadeIn" | "slideIn" | "scaleIn" | "rotateIn" | "none"; duration: number; delay: number; easing: "ease-in" | "ease-out" | "ease-in-out" | "linear" };
  }
) {
  return {
    id,
    type: "shape" as const,
    name,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    rotation: 0,
    backgroundColor: opts.backgroundColor || "#1a1a1a",
    borderColor: opts.borderColor,
    borderWidth: opts.borderWidth || 0,
    borderRadius: opts.borderRadius || 0,
    opacity: opts.opacity ?? 1,
    clipPath: opts.clipPath,
    gradient: opts.gradient,
    transform: opts.transform,
    boxShadow: opts.boxShadow,
    backdropFilter: opts.backdropFilter,
    zIndex: opts.zIndex || 1,
    locked: false,
    visible: true,
    animation: opts.animation || { type: "slideIn", duration: 500, delay: 0, easing: "ease-out" },
  };
}

export const DEFAULT_TEMPLATES: LowerThirdTemplate[] = [
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 0. GLASS SCRIPTURE
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "glass-scripture",
    name: "Glass Scripture",
    description: "Premium glassmorphism overlay with logo area, reference badge, translation label, and bold verse text.",
    category: "branded",
    isDefault: true,
    isCustom: false,
    width: 1920,
    height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 20,
    containerMaxHeight: 36,
    containerRecommendedHeight: 32,
    elements: [
      createShapeElement("gs-glass", "Glass Panel", {
        x: 2, y: 65, width: 96, height: 32,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        borderRadius: 32,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        zIndex: 1,
        animation: { type: "slideIn", duration: 800, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("gs-logo", "Church Logo Area", {
        x: 3.6, y: 70, width: 5.5, height: 10,
        gradient: "linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(109, 40, 217, 0.85) 100%)",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        borderRadius: 16,
        zIndex: 2,
        animation: { type: "scaleIn", duration: 600, delay: 150, easing: "ease-out" },
      }),
      createShapeElement("gs-divider", "Vertical Divider", {
        x: 10.2, y: 67, width: 0.12, height: 28,
        backgroundColor: "rgba(255,255,255,0.2)",
        zIndex: 2,
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out" },
      }),
      createShapeElement("gs-ref-bg", "Reference Badge", {
        x: 11, y: 67, width: 14, height: 6,
        backgroundColor: "rgba(37, 99, 235, 0.88)",
        borderRadius: 8,
        zIndex: 3,
        animation: { type: "fadeIn", duration: 400, delay: 250, easing: "ease-out" },
      }),
      createTextElement("gs-ref", "Reference Text", {
        x: 11, y: 67, width: 14, height: 6,
        fontSizeMin: 14, fontSizeMax: 32, fontWeight: 800, textColor: "#ffffff",
        textAlign: "center", lineClamp: 1, letterSpacing: 1,
        zIndex: 4,
        binding: { field: "reference", placeholder: "John 3:16" },
        animation: { type: "fadeIn", duration: 300, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("gs-version", "Version Label", {
        x: 26, y: 67, width: 6, height: 6,
        fontSizeMin: 14, fontSizeMax: 24, fontWeight: 600, textColor: "rgba(255,255,255,0.6)",
        lineClamp: 1, letterSpacing: 2,
        zIndex: 4,
        binding: { field: "version", placeholder: "KJV" },
        animation: { type: "fadeIn", duration: 300, delay: 350, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("gs-verse", "Verse Text", {
        x: 11, y: 74, width: 84, height: 19,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 600, textColor: "#ffffff",
        lineHeight: 1.35,
        zIndex: 4,
        binding: { field: "verse", placeholder: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
        animation: { type: "fadeIn", duration: 600, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["glass", "glassmorphism", "scripture", "premium", "branded"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 1. CLASSIC SOLID
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "classic-solid",
    name: "Classic Solid",
    description: "Timeless solid-bar design with verse text, scripture reference, and translation label.",
    category: "professional",
    isDefault: true,
    isCustom: false,
    width: 1920,
    height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18,
    containerMaxHeight: 32,
    containerRecommendedHeight: 30,
    elements: [
      createShapeElement("cs-bg", "Background Bar", {
        x: 0, y: 68, width: 100, height: 30,
        backgroundColor: "#1a1a1a", opacity: 0.92,
        animation: { type: "slideIn", duration: 500, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("cs-line", "Decorative Line", {
        x: 0, y: 68, width: 100, height: 0.2,
        backgroundColor: "#fbd618",
        animation: { type: "fadeIn", duration: 300, delay: 200, easing: "ease-out" },
      }),
      createTextElement("cs-verse", "Verse Text", {
        x: 4, y: 70, width: 90, height: 18,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        binding: { field: "verse", placeholder: "For God so loved the world..." },
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("cs-ref", "Reference", {
        x: 4, y: 90, width: 38, height: 7,
        fontSizeMin: 16, fontSizeMax: 48, fontWeight: 700, textColor: "#fbd618",
        lineClamp: 1,
        binding: { field: "reference", placeholder: "John 3:16" },
        animation: { type: "fadeIn", duration: 300, delay: 400, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("cs-version", "Translation", {
        x: 43, y: 90, width: 12, height: 7,
        fontSizeMin: 14, fontSizeMax: 28, fontWeight: 400, textColor: "rgba(255,255,255,0.55)",
        lineClamp: 1,
        binding: { field: "version", placeholder: "NIV" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["traditional", "professional", "solid"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 2. CLEAN GRADIENT
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "clean-gradient",
    name: "Clean Gradient",
    description: "Sophisticated gradient background with verse, reference, and translation label.",
    category: "professional",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 32, containerRecommendedHeight: 30,
    elements: [
      createShapeElement("cg-gradient", "Gradient Background", {
        x: 0, y: 68, width: 100, height: 30,
        gradient: "linear-gradient(to right, #1a1a2e, transparent)",
        opacity: 0.95,
        animation: { type: "slideIn", duration: 700, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("cg-accent", "Left Accent Bar", {
        x: 0, y: 68, width: 4, height: 30,
        backgroundColor: "#3b82f6",
        animation: { type: "slideIn", duration: 400, delay: 200, easing: "ease-out" },
      }),
      createTextElement("cg-verse", "Verse Text", {
        x: 6, y: 70, width: 86, height: 18,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        binding: { field: "verse", placeholder: "For God so loved the world..." },
        animation: { type: "fadeIn", duration: 500, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("cg-ref", "Reference", {
        x: 6, y: 90, width: 32, height: 6,
        fontSizeMin: 16, fontSizeMax: 36, fontWeight: 400, textColor: "#e0e0e0",
        lineClamp: 1,
        binding: { field: "reference", placeholder: "John 3:16" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("cg-version", "Translation", {
        x: 40, y: 90, width: 10, height: 6,
        fontSizeMin: 14, fontSizeMax: 28, fontWeight: 400, textColor: "rgba(255,255,255,0.5)",
        lineClamp: 1,
        binding: { field: "version", placeholder: "NIV" },
        animation: { type: "fadeIn", duration: 300, delay: 600, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["gradient", "sophisticated", "broadcast"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 3. COSMIC FIRE  (matches screenshot 1 â€” space image background)
  // Full-canvas image bg Â· dark overlay Â· maroon reference bar Â· dark verse strip
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "cosmic-fire",
    name: "Cosmic Fire",
    description: "Cinematic space nebula background with a bold maroon reference banner and dark verse strip. Upload your own space image in the editor.",
    category: "contemporary",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "#0c060d",
    containerMinHeight: 22, containerMaxHeight: 40, containerRecommendedHeight: 32,
    elements: [
      // Full-canvas background image (user replaces src via editor)
      {
        id: "cf-bg-img", type: "image" as const, name: "Space Background",
        x: 0, y: 0, width: 100, height: 100,
        src: "", objectFit: "cover" as const, opacity: 1, zIndex: 0,
        rotation: 0, locked: false, visible: true,
        animation: { type: "none", duration: 0, delay: 0, easing: "ease-out" as const },
      },
      // Dark gradient overlay â€” emphasises bottom half
      createShapeElement("cf-overlay", "Dark Vignette Overlay", {
        x: 0, y: 0, width: 100, height: 100,
        gradient: "linear-gradient(to bottom, transparent 30%, rgba(5,2,8,0.70) 65%, rgba(5,2,8,0.88) 100%)",
        zIndex: 1,
        animation: { type: "none", duration: 0, delay: 0, easing: "ease-out" },
      }),
      // Narrow maroon reference tab (centered, sits above verse strip)
      createShapeElement("cf-ref-bar", "Reference Bar", {
        x: 30, y: 70, width: 40, height: 5.5,
        backgroundColor: "#5c1a1a",
        borderColor: "rgba(255,255,255,0.10)", borderWidth: 1,
        borderRadius: 0,
        zIndex: 3,
        animation: { type: "fadeIn", duration: 500, delay: 0, easing: "ease-out" },
      }),
      createTextElement("cf-ref", "Scripture Reference", {
        x: 30, y: 70, width: 40, height: 5.5,
        fontSizeMin: 12, fontSizeMax: 28, fontWeight: 700, textColor: "#f5e6d0",
        textAlign: "center", lineClamp: 1, letterSpacing: 2,
        zIndex: 4,
        binding: { field: "reference", placeholder: "SCRIPTURE REFERENCE" },
        animation: { type: "fadeIn", duration: 400, delay: 100, easing: "ease-out", animateFontSize: false },
      }),
      // Full-width dark strip for verse text
      createShapeElement("cf-verse-bg", "Verse Strip", {
        x: 0, y: 75.5, width: 100, height: 24.5,
        backgroundColor: "rgba(5, 2, 8, 0.82)",
        zIndex: 3,
        animation: { type: "slideIn", duration: 600, delay: 100, easing: "ease-out" },
      }),
      createTextElement("cf-verse", "Verse Text", {
        x: 4, y: 77, width: 92, height: 19,
        fontSizeMin: 18, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        textAlign: "center", lineHeight: 1.4,
        zIndex: 5,
        binding: { field: "verse", placeholder: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nInteger a elit quam. Sed nec turpis justo." },
        animation: { type: "fadeIn", duration: 600, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("cf-version", "Translation", {
        x: 82, y: 96.5, width: 16, height: 3,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "rgba(245,230,208,0.55)",
        textAlign: "right", lineClamp: 1, letterSpacing: 1,
        zIndex: 5,
        binding: { field: "version", placeholder: "NIV" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["cinematic", "space", "image", "dramatic", "contemporary"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 4. CRYSTAL DARK  (matches screenshot 2 â€” dark violet gradient)
  // Dark navyâ†’purple gradient Â· centered reference label Â· large verse text
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "crystal-dark",
    name: "Crystal Dark",
    description: "Dark violet-navy gradient overlay with a centered reference caption and large, left-aligned verse text.",
    category: "elegant",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 20, containerMaxHeight: 38, containerRecommendedHeight: 33,
    elements: [
      createShapeElement("cd-gradient", "Gradient Background", {
        x: 0, y: 65, width: 100, height: 35,
        gradient: "linear-gradient(135deg, rgba(15,10,40,0.92) 0%, rgba(50,20,80,0.88) 50%, rgba(30,10,60,0.80) 100%)",
        zIndex: 1,
        animation: { type: "fadeIn", duration: 900, delay: 0, easing: "ease-out" },
      }),
      // Subtle top border glow
      createShapeElement("cd-top-glow", "Top Glow Line", {
        x: 0, y: 65, width: 100, height: 0.25,
        backgroundColor: "rgba(140,80,220,0.6)",
        zIndex: 2,
        animation: { type: "fadeIn", duration: 600, delay: 200, easing: "ease-out" },
      }),
      // Reference centered label
      createTextElement("cd-ref", "Scripture Reference", {
        x: 10, y: 66.5, width: 80, height: 5.5,
        fontSizeMin: 12, fontSizeMax: 24, fontWeight: 700, textColor: "#c89ef4",
        textAlign: "center", lineClamp: 1, letterSpacing: 4,
        zIndex: 3,
        binding: { field: "reference", placeholder: "SCRIPTURE REFERENCE" },
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out", animateFontSize: false },
      }),
      // Verse text â€” large, left-aligned
      createTextElement("cd-verse", "Verse Text", {
        x: 3, y: 73, width: 94, height: 22,
        fontSizeMin: 18, fontSizeMax: 200, fontWeight: 400, textColor: "#ffffff",
        textAlign: "left", lineHeight: 1.5,
        zIndex: 3,
        binding: { field: "verse", placeholder: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eleifend in augue a laoreet.\nQuisque porttitor accumsan tellus, vitae interdum metus sodales feugiat." },
        animation: { type: "fadeIn", duration: 700, delay: 350, easing: "ease-out", animateFontSize: true },
      }),
      // Translation â€” bottom left, small
      createTextElement("cd-version", "Translation", {
        x: 3, y: 96, width: 20, height: 3.5,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "rgba(200,158,244,0.60)",
        lineClamp: 1, letterSpacing: 1,
        zIndex: 3,
        binding: { field: "version", placeholder: "ESV" },
        animation: { type: "fadeIn", duration: 300, delay: 600, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["cinematic", "violet", "gradient", "elegant", "dark"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 5. EMBER GLOW  (warm amber/crimson gradient)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "ember-glow",
    name: "Ember Glow",
    description: "Warm crimson-to-amber gradient with a pill reference badge and bold verse text.",
    category: "contemporary",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 36, containerRecommendedHeight: 30,
    elements: [
      createShapeElement("eg-gradient", "Ember Gradient Bg", {
        x: 0, y: 68, width: 100, height: 32,
        gradient: "linear-gradient(to right, #7f1d1d, #b45309, rgba(30,8,8,0.0))",
        opacity: 0.95,
        zIndex: 1,
        animation: { type: "slideIn", duration: 700, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("eg-ref-pill", "Reference Pill", {
        x: 4, y: 69.5, width: 18, height: 5.5,
        backgroundColor: "rgba(0,0,0,0.55)",
        borderColor: "rgba(251,191,36,0.55)", borderWidth: 1,
        borderRadius: 50,
        zIndex: 3,
        animation: { type: "fadeIn", duration: 400, delay: 150, easing: "ease-out" },
      }),
      createTextElement("eg-ref", "Reference", {
        x: 4, y: 69.5, width: 18, height: 5.5,
        fontSizeMin: 12, fontSizeMax: 26, fontWeight: 700, textColor: "#fbbf24",
        textAlign: "center", lineClamp: 1, letterSpacing: 1,
        zIndex: 4,
        binding: { field: "reference", placeholder: "John 3:16" },
        animation: { type: "fadeIn", duration: 300, delay: 250, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("eg-verse", "Verse Text", {
        x: 4, y: 76, width: 90, height: 19,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        lineHeight: 1.35,
        zIndex: 4,
        binding: { field: "verse", placeholder: "For God so loved the world that he gave his one and only Son..." },
        animation: { type: "fadeIn", duration: 600, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("eg-version", "Translation", {
        x: 80, y: 96.5, width: 16, height: 3.5,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "rgba(251,191,36,0.65)",
        textAlign: "right", lineClamp: 1, letterSpacing: 1,
        zIndex: 4,
        binding: { field: "version", placeholder: "NIV" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["warm", "amber", "crimson", "contemporary", "gradient"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 6. IVORY CLEAN  (high-contrast minimalist)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: "ivory-clean",
    name: "Ivory Clean",
    description: "Minimalist high-contrast design with a white left accent, clean reference label, and bold verse text.",
    category: "professional",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 34, containerRecommendedHeight: 28,
    elements: [
      createShapeElement("ic-bg", "Dark Strip", {
        x: 0, y: 68, width: 100, height: 30,
        backgroundColor: "rgba(10,10,12,0.90)",
        zIndex: 1,
        animation: { type: "slideIn", duration: 600, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("ic-accent", "White Left Bar", {
        x: 0, y: 68, width: 0.5, height: 30,
        backgroundColor: "#f5f5f0",
        zIndex: 2,
        animation: { type: "fadeIn", duration: 300, delay: 200, easing: "ease-out" },
      }),
      createTextElement("ic-ref-label", "Reference", {
        x: 2.5, y: 69.5, width: 50, height: 5,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "rgba(245,245,240,0.50)",
        lineClamp: 1, letterSpacing: 3,
        zIndex: 3,
        binding: { field: "reference", placeholder: "JOHN 3:16" },
        animation: { type: "fadeIn", duration: 400, delay: 250, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("ic-verse", "Verse Text", {
        x: 2.5, y: 75, width: 88, height: 18,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#f5f5f0",
        lineHeight: 1.35,
        zIndex: 3,
        binding: { field: "verse", placeholder: "For God so loved the world that he gave his one and only Son..." },
        animation: { type: "fadeIn", duration: 600, delay: 350, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("ic-version", "Translation", {
        x: 2.5, y: 93.5, width: 14, height: 4,
        fontSizeMin: 10, fontSizeMax: 20, fontWeight: 400, textColor: "rgba(245,245,240,0.40)",
        lineClamp: 1, letterSpacing: 2,
        zIndex: 3,
        binding: { field: "version", placeholder: "NIV" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["minimalist", "clean", "professional", "high-contrast"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // LYRICS TEMPLATES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // 7. BOLD ACCENT â€“ LYRICS
  {
    id: "bold-accent-lyrics",
    name: "Bold Accent Bar",
    description: "A striking design with a bold accent bar for high-energy worship lyrics display.",
    category: "lyrics",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 36, containerRecommendedHeight: 30,
    elements: [
      createShapeElement("bal-bg", "Background Bar", {
        x: 0, y: 65, width: 100, height: 33,
        backgroundColor: "rgba(0,0,0,0.75)",
        borderColor: "rgba(236,72,153,0.6)", borderWidth: 0,
        animation: { type: "slideIn", duration: 600, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("bal-accent", "Left Accent", {
        x: 0, y: 65, width: 0.5, height: 33,
        backgroundColor: "#EC4899",
        animation: { type: "slideIn", duration: 400, delay: 100, easing: "ease-out" },
      }),
      createShapeElement("bal-badge-bg", "Section Badge", {
        x: 2, y: 66.5, width: 11, height: 5,
        backgroundColor: "#EC4899", borderRadius: 6,
        animation: { type: "fadeIn", duration: 300, delay: 200, easing: "ease-out" },
      }),
      createTextElement("bal-section", "Section Label", {
        x: 2, y: 66.5, width: 11, height: 5,
        fontSizeMin: 10, fontSizeMax: 20, fontWeight: 800, textColor: "#ffffff",
        textAlign: "center", lineClamp: 1, letterSpacing: 1,
        zIndex: 4,
        binding: { field: "reference", placeholder: "Verse 1" },
        animation: { type: "fadeIn", duration: 300, delay: 250, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("bal-lyrics", "Lyrics Text", {
        x: 2, y: 73, width: 95, height: 22,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        lineHeight: 1.4,
        zIndex: 3,
        binding: { field: "verse", placeholder: "Amazing grace, how sweet the sound\nThat saved a wretch like me" },
        animation: { type: "fadeIn", duration: 500, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("bal-song", "Song Title", {
        x: 2, y: 96, width: 50, height: 4,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "#EC4899",
        lineClamp: 1,
        zIndex: 3,
        binding: { field: "version", placeholder: "Amazing Grace" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["lyrics", "bold", "accent", "worship"],
    thumbnail: "",
  },

  // 8. GLASS LYRICS
  {
    id: "glass-lyrics",
    name: "Glass Lyrics",
    description: "Premium glassmorphism overlay for worship lyrics with a clean, modern aesthetic.",
    category: "lyrics",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 36, containerRecommendedHeight: 32,
    elements: [
      createShapeElement("gl-glass", "Glass Panel", {
        x: 2, y: 65, width: 96, height: 33,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255,255,255,0.12)", borderWidth: 1,
        borderRadius: 24,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        zIndex: 1,
        animation: { type: "slideIn", duration: 800, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("gl-section-bg", "Section Badge Bg", {
        x: 4.5, y: 67, width: 10, height: 5,
        backgroundColor: "rgba(139,92,246,0.8)", borderRadius: 8,
        zIndex: 2,
        animation: { type: "fadeIn", duration: 400, delay: 150, easing: "ease-out" },
      }),
      createTextElement("gl-section", "Section Label", {
        x: 4.5, y: 67, width: 10, height: 5,
        fontSizeMin: 10, fontSizeMax: 20, fontWeight: 700, textColor: "#ffffff",
        textAlign: "center", lineClamp: 1,
        zIndex: 4,
        binding: { field: "reference", placeholder: "Chorus" },
        animation: { type: "fadeIn", duration: 300, delay: 250, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("gl-lyrics", "Lyrics Text", {
        x: 4, y: 74, width: 91, height: 20,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 600, textColor: "#ffffff",
        lineHeight: 1.45,
        zIndex: 3,
        binding: { field: "verse", placeholder: "Amazing grace, how sweet the sound\nThat saved a wretch like me" },
        animation: { type: "fadeIn", duration: 600, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("gl-song", "Song Title", {
        x: 4, y: 95, width: 50, height: 4,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 400, textColor: "rgba(255,255,255,0.5)",
        lineClamp: 1,
        zIndex: 3,
        binding: { field: "version", placeholder: "Amazing Grace â€” Hymn" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["lyrics", "glass", "glassmorphism", "premium"],
    thumbnail: "",
  },

  // 9. MINIMAL LYRICS
  {
    id: "minimal-lyrics",
    name: "Minimal Lyrics",
    description: "A clean, distraction-free lower third for worship lyrics with a thin accent line.",
    category: "lyrics",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 32, containerRecommendedHeight: 28,
    elements: [
      createShapeElement("mly-fade", "Gradient Fade", {
        x: 0, y: 62, width: 100, height: 38,
        gradient: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))",
        zIndex: 0,
        animation: { type: "fadeIn", duration: 600, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("mly-line", "Accent Line", {
        x: 0, y: 88, width: 100, height: 0.25,
        backgroundColor: "#EC4899",
        animation: { type: "slideIn", duration: 600, delay: 0, easing: "ease-out" },
      }),
      createTextElement("mly-lyrics", "Lyrics Text", {
        x: 4, y: 65, width: 90, height: 22,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        lineHeight: 1.35,
        binding: { field: "verse", placeholder: "Amazing grace, how sweet the sound\nThat saved a wretch like me" },
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("mly-section", "Section Label", {
        x: 4, y: 89, width: 30, height: 5,
        fontSizeMin: 10, fontSizeMax: 24, fontWeight: 400, textColor: "#EC4899",
        lineClamp: 1,
        binding: { field: "reference", placeholder: "Verse 1" },
        animation: { type: "fadeIn", duration: 300, delay: 400, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("mly-song", "Song Title", {
        x: 70, y: 90, width: 26, height: 4,
        fontSizeMin: 10, fontSizeMax: 20, fontWeight: 400, textColor: "rgba(255,255,255,0.5)",
        textAlign: "right", lineClamp: 1,
        binding: { field: "version", placeholder: "Amazing Grace" },
        animation: { type: "fadeIn", duration: 300, delay: 500, easing: "ease-out", animateFontSize: false },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["lyrics", "minimal", "clean"],
    thumbnail: "",
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ANNOUNCEMENT TEMPLATES
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // 10. ANNOUNCEMENT SOLID
  {
    id: "announcement-solid",
    name: "Announcement Banner",
    description: "A clean, bold announcement lower third with category badge and prominent title.",
    category: "announcement",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 32, containerRecommendedHeight: 28,
    elements: [
      createShapeElement("ann-bg", "Background Bar", {
        x: 0, y: 70, width: 100, height: 28,
        backgroundColor: "#1e1b4b",
        animation: { type: "slideIn", duration: 600, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("ann-top-line", "Top Accent Line", {
        x: 0, y: 70, width: 100, height: 0.35,
        backgroundColor: "#6366f1",
        animation: { type: "slideIn", duration: 500, delay: 100, easing: "ease-out" },
      }),
      createShapeElement("ann-badge-bg", "Category Badge", {
        x: 4, y: 71.5, width: 12, height: 5,
        backgroundColor: "#6366f1", borderRadius: 6,
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out" },
      }),
      createTextElement("ann-badge", "Category Label", {
        x: 4, y: 71.5, width: 12, height: 5,
        fontSizeMin: 10, fontSizeMax: 20, fontWeight: 800, textColor: "#ffffff",
        textAlign: "center", lineClamp: 1, letterSpacing: 1,
        zIndex: 4,
        binding: { field: "reference", placeholder: "Upcoming Event" },
        animation: { type: "fadeIn", duration: 300, delay: 250, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("ann-text", "Announcement Text", {
        x: 4, y: 78, width: 72, height: 16,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 700, textColor: "#ffffff",
        lineHeight: 1.3,
        zIndex: 3,
        binding: { field: "verse", placeholder: "Sunday Morning Worship Service â€” All are welcome!" },
        animation: { type: "fadeIn", duration: 500, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("ann-time", "Date / Time", {
        x: 78, y: 80, width: 18, height: 12,
        fontSizeMin: 12, fontSizeMax: 48, fontWeight: 600, textColor: "#a5b4fc",
        textAlign: "right", lineClamp: 2,
        zIndex: 3,
        binding: { field: "version", placeholder: "Sunday 9:00 AM" },
        animation: { type: "fadeIn", duration: 300, delay: 450, easing: "ease-out", animateFontSize: true },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["announcement", "event", "solid", "banner"],
    thumbnail: "",
  },

  // 11. ANNOUNCEMENT GRADIENT
  {
    id: "announcement-gradient",
    name: "Announcement Gradient",
    description: "An elegant gradient design for service announcements and upcoming events.",
    category: "announcement",
    isDefault: true,
    isCustom: false,
    width: 1920, height: 1080,
    backgroundColor: "transparent",
    containerMinHeight: 18, containerMaxHeight: 32, containerRecommendedHeight: 28,
    elements: [
      createShapeElement("ang-bg", "Gradient Background", {
        x: 0, y: 70, width: 100, height: 28,
        gradient: "linear-gradient(to right, #312e81, rgba(99,102,241,0.15))",
        animation: { type: "slideIn", duration: 700, delay: 0, easing: "ease-out" },
      }),
      createShapeElement("ang-left-bar", "Left Accent", {
        x: 0, y: 70, width: 0.5, height: 28,
        backgroundColor: "#818cf8",
        animation: { type: "slideIn", duration: 400, delay: 100, easing: "ease-out" },
      }),
      createTextElement("ang-label", "Category", {
        x: 3, y: 71.5, width: 25, height: 5,
        fontSizeMin: 10, fontSizeMax: 22, fontWeight: 700, textColor: "#818cf8",
        lineClamp: 1, letterSpacing: 2,
        zIndex: 3,
        binding: { field: "reference", placeholder: "ANNOUNCEMENT" },
        animation: { type: "fadeIn", duration: 400, delay: 200, easing: "ease-out", animateFontSize: false },
      }),
      createTextElement("ang-text", "Announcement Text", {
        x: 3, y: 78, width: 74, height: 16,
        fontSizeMin: 16, fontSizeMax: 200, fontWeight: 600, textColor: "#ffffff",
        lineHeight: 1.3,
        zIndex: 3,
        binding: { field: "verse", placeholder: "Join us for our evening prayer service." },
        animation: { type: "fadeIn", duration: 500, delay: 300, easing: "ease-out", animateFontSize: true },
      }),
      createTextElement("ang-time", "Subtitle / Time", {
        x: 78, y: 80, width: 18, height: 12,
        fontSizeMin: 12, fontSizeMax: 40, fontWeight: 500, textColor: "#c7d2fe",
        textAlign: "right", lineClamp: 2,
        zIndex: 3,
        binding: { field: "version", placeholder: "6:00 PM" },
        animation: { type: "fadeIn", duration: 300, delay: 450, easing: "ease-out", animateFontSize: true },
      }),
    ],
    createdAt: now, updatedAt: now, createdBy: "system",
    tags: ["announcement", "gradient", "elegant", "event"],
    thumbnail: "",
  },
];

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; templates: string[] }[] = [
  { id: "professional", label: "Professional", templates: ["classic-solid", "clean-gradient", "ivory-clean"] },
  { id: "contemporary", label: "Contemporary", templates: ["cosmic-fire", "ember-glow"] },
  { id: "elegant", label: "Elegant", templates: ["crystal-dark"] },
  { id: "branded", label: "Branded", templates: ["glass-scripture"] },
  { id: "lyrics", label: "Lyrics", templates: ["bold-accent-lyrics", "glass-lyrics", "minimal-lyrics"] },
  { id: "announcement", label: "Announcement", templates: ["announcement-solid", "announcement-gradient"] },
];


