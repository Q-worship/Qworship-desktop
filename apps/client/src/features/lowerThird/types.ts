export type TemplateCategory =
  | "professional"
  | "contemporary"
  | "elegant"
  | "branded"
  | "lyrics"
  | "announcement"
  | "custom";

export type AnimationType =
  | "fadeIn"
  | "slideIn"
  | "scaleIn"
  | "rotateIn"
  | "none";
export type AnimationEasing = "ease-in" | "ease-out" | "ease-in-out" | "linear";
export type TextOverflow = "truncate" | "wrap" | "scale";
export type TextAlign = "left" | "center" | "right";
export type FontStyle = "normal" | "italic";
export type ObjectFit = "cover" | "contain" | "fill";
export type ElementType = "text" | "shape" | "image" | "icon" | "group";
export type BindingField =
  | "verse"
  | "reference"
  | "version"
  | "churchName"
  | "songTitle"
  | "custom";

export interface ElementAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  animateFontSize?: boolean;
}

export interface ElementBinding {
  field: BindingField;
  placeholder?: string;
}

/** A single part in a composite (merged) binding.
 *  The resolved text for the element is: parts.map(p => p.prefix + data[p.field] + p.suffix).join("") */
export interface CompositeBindingPart {
  field: BindingField;
  prefix?: string;  // e.g. "" or " · "
  suffix?: string;  // e.g. "" or ")"
}

export interface LowerThirdElement {
  id: string;
  type: ElementType;
  name: string;

  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  boxShadow?: string;
  clipPath?: string;
  gradient?: string;
  transform?: string;
  backdropFilter?: string;

  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontSizeMin?: number;
  fontSizeMax?: number;
  fontSizeDynamic?: boolean;
  fontSizeAnimated?: boolean;
  fontWeight?: number;
  fontStyle?: FontStyle;
  textColor?: string;
  textAlign?: TextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  lineClamp?: number;
  textOverflow?: TextOverflow;

  src?: string;
  objectFit?: ObjectFit;

  zIndex: number;
  locked: boolean;
  visible: boolean;

  animation?: ElementAnimation;
  /** Single-field binding — superseded by compositeBinding when present */
  binding?: ElementBinding;
  /** Merged multi-field binding (e.g. reference + " · " + version) */
  compositeBinding?: CompositeBindingPart[];
}

export interface LowerThirdTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isDefault: boolean;
  isCustom: boolean;

  width: number;
  height: number;
  backgroundColor: string;

  containerMinHeight: number;
  containerMaxHeight: number;
  containerRecommendedHeight: number;

  elements: LowerThirdElement[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  thumbnail: string;
}

export interface FontSizePreset {
  min: number;
  max: number;
  label: string;
}

export const FONT_SIZE_PRESETS: Record<string, FontSizePreset> = {
  verseText: { min: 16, max: 200, label: "Verse Text (Primary)" },
  referenceText: { min: 16, max: 48, label: "Reference (Secondary)" },
  churchName: { min: 16, max: 36, label: "Church Name" },
  metadata: { min: 16, max: 28, label: "Metadata/Version" },
};

export const CONTAINER_CONSTRAINTS = {
  minHeightPercent: 18,
  maxHeightPercent: 30,
  recommendedHeightPercent: 25,
  minHeightPx: 194,
  maxHeightPx: 324,
  recommendedHeightPx: 270,
  baseResolution: { width: 1920, height: 1080 },
};

export interface LowerThirdBindingData {
  verse: string;
  reference: string;
  version: string;
  churchName?: string;
  type?: "scripture" | "lyrics" | "announcement";
}
