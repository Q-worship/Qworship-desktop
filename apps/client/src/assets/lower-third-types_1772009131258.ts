/**
 * Lower Third System - TypeScript Interfaces & Data Models
 * Defines all types for templates, elements, animations, and configurations
 */

// ============================================================================
// CORE TEMPLATE TYPES
// ============================================================================

export type ElementType = 'text' | 'shape' | 'image' | 'icon' | 'group';
export type TemplateCategory = 'professional' | 'contemporary' | 'elegant' | 'branded' | 'custom';
export type AnimationType = 'fadeIn' | 'slideIn' | 'scaleIn' | 'rotateIn' | 'none';
export type EasingType = 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
export type TextOverflowBehavior = 'truncate' | 'wrap' | 'scale';
export type BindingField = 'verse' | 'reference' | 'version' | 'churchName' | 'custom';
export type ObjectFit = 'cover' | 'contain' | 'fill';
export type TextAlign = 'left' | 'center' | 'right';

// ============================================================================
// TEMPLATE INTERFACE
// ============================================================================

export interface LowerThirdTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  isDefault: boolean;
  isCustom: boolean;

  // Canvas settings
  width: number; // 1920
  height: number; // 1080
  backgroundColor: string; // hex or gradient

  // Container constraints (system-enforced)
  containerMinHeight: number; // percentage (18)
  containerMaxHeight: number; // percentage (30)
  containerRecommendedHeight: number; // percentage (25)

  // Elements
  elements: LowerThirdElement[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  thumbnail: string; // base64 or URL
  version: number; // for versioning
}

// ============================================================================
// ELEMENT INTERFACE
// ============================================================================

export interface LowerThirdElement {
  id: string;
  type: ElementType;
  name: string;

  // Position & Size
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage or pixels
  height: number; // percentage or pixels
  rotation: number; // degrees (0-360)

  // Styling
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  boxShadow?: string;
  clipPath?: string;

  // Text-specific
  text?: string;
  fontFamily?: string;
  fontSize?: number; // current/default font size
  fontSizeMin?: number; // minimum font size (px)
  fontSizeMax?: number; // maximum font size (px)
  fontSizeDynamic?: boolean; // enable dynamic scaling
  fontSizeAnimated?: boolean; // animate font size changes
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textColor?: string;
  textAlign?: TextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  lineClamp?: number; // max number of lines (2-5)
  textOverflow?: TextOverflowBehavior;

  // Image-specific
  src?: string;
  objectFit?: ObjectFit;

  // Layering
  zIndex: number;
  locked: boolean;
  visible: boolean;

  // Animation
  animation?: ElementAnimation;

  // Binding (for dynamic content)
  binding?: ElementBinding;
}

// ============================================================================
// ANIMATION INTERFACE
// ============================================================================

export interface ElementAnimation {
  type: AnimationType;
  duration: number; // milliseconds
  delay: number; // milliseconds
  easing: EasingType;
  animateFontSize?: boolean; // animate font size during entry
}

// ============================================================================
// BINDING INTERFACE
// ============================================================================

export interface ElementBinding {
  field: BindingField;
  placeholder?: string;
  format?: string; // for custom formatting
}

// ============================================================================
// FONT SIZE PRESET
// ============================================================================

export interface FontSizePreset {
  name: string;
  label: string;
  min: number;
  max: number;
  description?: string;
}

export const FONT_SIZE_PRESETS: Record<string, FontSizePreset> = {
  verseText: {
    name: 'verseText',
    label: 'Verse Text (Primary)',
    min: 28,
    max: 56,
    description: 'Main scripture text'
  },
  referenceText: {
    name: 'referenceText',
    label: 'Reference (Secondary)',
    min: 20,
    max: 32,
    description: 'Bible reference (e.g., John 3:16)'
  },
  churchName: {
    name: 'churchName',
    label: 'Church Name',
    min: 16,
    max: 28,
    description: 'Church or organization name'
  },
  metadata: {
    name: 'metadata',
    label: 'Metadata/Version',
    min: 14,
    max: 24,
    description: 'Version, translation, or other metadata'
  }
};

// ============================================================================
// CONTAINER HEIGHT CONSTRAINTS
// ============================================================================

export interface ContainerHeightConstraints {
  minPercentage: number; // 18
  maxPercentage: number; // 30
  recommendedPercentage: number; // 25
  minPixels: number; // at 1080p
  maxPixels: number; // at 1080p
}

export const CONTAINER_HEIGHT_CONSTRAINTS: ContainerHeightConstraints = {
  minPercentage: 18,
  maxPercentage: 30,
  recommendedPercentage: 25,
  minPixels: 194, // 18% of 1080
  maxPixels: 324 // 30% of 1080
};

// ============================================================================
// LOWER THIRD DISPLAY DATA
// ============================================================================

export interface LowerThirdDisplayData {
  verse: string;
  reference: string;
  version?: string;
  churchName?: string;
  customFields?: Record<string, string>;
}

// ============================================================================
// EDITOR STATE
// ============================================================================

export interface EditorState {
  template: LowerThirdTemplate;
  selectedElementId: string | null;
  isDirty: boolean;
  zoom: number; // 25-100
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number; // pixels
  history: LowerThirdTemplate[]; // undo/redo history
  historyIndex: number;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  elementId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  elementId?: string;
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// FONT MEASUREMENT
// ============================================================================

export interface FontMetrics {
  width: number;
  height: number;
  lineHeight: number;
  ascent: number;
  descent: number;
}

// ============================================================================
// RESPONSIVE SCALING
// ============================================================================

export interface ResolutionConfig {
  width: number;
  height: number;
  name: string;
  scaleFactor: number; // relative to 1920x1080
}

export const RESOLUTION_CONFIGS: ResolutionConfig[] = [
  { width: 1920, height: 1080, name: '1080p (Full HD)', scaleFactor: 1.0 },
  { width: 1280, height: 720, name: '720p (HD)', scaleFactor: 0.667 },
  { width: 3840, height: 2160, name: '4K (UHD)', scaleFactor: 2.0 },
  { width: 1024, height: 576, name: '576p', scaleFactor: 0.533 }
];

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

export interface TemplateLibrary {
  templates: LowerThirdTemplate[];
  categories: TemplateCategory[];
  tags: string[];
  lastUpdated: Date;
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

export interface TemplateExport {
  version: string; // schema version
  template: LowerThirdTemplate;
  exportedAt: Date;
  exportedBy: string;
}

// ============================================================================
// ANIMATION TIMELINE
// ============================================================================

export interface AnimationKeyframe {
  time: number; // milliseconds
  opacity?: number;
  fontSize?: number;
  transform?: string;
  easing?: EasingType;
}

export interface AnimationTimeline {
  elementId: string;
  keyframes: AnimationKeyframe[];
  totalDuration: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PartialElement = Partial<LowerThirdElement>;
export type PartialTemplate = Partial<LowerThirdTemplate>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 120;
export const DEFAULT_ZOOM = 100;
export const DEFAULT_GRID_SIZE = 10;
export const BASE_RESOLUTION = { width: 1920, height: 1080 };
export const ANIMATION_DURATIONS = {
  short: 300,
  medium: 500,
  long: 800
};
