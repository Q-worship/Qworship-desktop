/**
 * Lower Third System - Utility Functions
 * Font sizing calculations, validation, responsive scaling, and helpers
 */

import {
  LowerThirdElement,
  LowerThirdTemplate,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FontMetrics,
  ResolutionConfig,
  CONTAINER_HEIGHT_CONSTRAINTS,
  BASE_RESOLUTION,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  RESOLUTION_CONFIGS
} from './lower-third-types';

// ============================================================================
// FONT SIZE CALCULATIONS
// ============================================================================

/**
 * Calculate optimal font size based on text length and constraints
 */
export function calculateOptimalFontSize(
  text: string,
  availableWidth: number,
  minFontSize: number,
  maxFontSize: number,
  fontFamily: string = 'Inter',
  fontWeight: number = 400
): number {
  if (!text || text.length === 0) {
    return maxFontSize;
  }

  // Estimate character width at max font size
  const charWidthRatio = 0.5; // Approximate ratio for most fonts
  const estimatedWidth = text.length * (maxFontSize * charWidthRatio);

  // If text fits at max size, use it
  if (estimatedWidth <= availableWidth) {
    return maxFontSize;
  }

  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  let optimalSize = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const estimatedMidWidth = text.length * (mid * charWidthRatio);

    if (estimatedMidWidth <= availableWidth) {
      optimalSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(minFontSize, Math.min(optimalSize, maxFontSize));
}

/**
 * Calculate font size based on text line count
 */
export function calculateFontSizeByLineCount(
  lineCount: number,
  minFontSize: number,
  maxFontSize: number,
  maxLines: number = 5
): number {
  if (lineCount <= 2) {
    return maxFontSize;
  }

  if (lineCount <= 4) {
    return Math.floor((minFontSize + maxFontSize) / 2);
  }

  return minFontSize;
}

/**
 * Get responsive font size for different resolutions
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  targetResolution: ResolutionConfig
): number {
  const scaleFactor = targetResolution.scaleFactor;
  return Math.round(baseFontSize * scaleFactor);
}

/**
 * Calculate font size animation keyframes
 */
export function generateFontSizeAnimationKeyframes(
  startSize: number,
  endSize: number,
  duration: number,
  steps: number = 5
): Array<{ time: number; fontSize: number }> {
  const keyframes = [];
  const interval = duration / steps;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const easeOutProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const fontSize = startSize + (endSize - startSize) * easeOutProgress;

    keyframes.push({
      time: i * interval,
      fontSize: Math.round(fontSize)
    });
  }

  return keyframes;
}

// ============================================================================
// CONTAINER HEIGHT CALCULATIONS
// ============================================================================

/**
 * Get container height in pixels for given resolution
 */
export function getContainerHeightPixels(
  heightPercentage: number,
  resolution: ResolutionConfig = RESOLUTION_CONFIGS[0]
): number {
  return Math.round((heightPercentage / 100) * resolution.height);
}

/**
 * Get container height constraints for resolution
 */
export function getContainerHeightConstraints(
  resolution: ResolutionConfig = RESOLUTION_CONFIGS[0]
): {
  minPixels: number;
  maxPixels: number;
  recommendedPixels: number;
} {
  return {
    minPixels: getContainerHeightPixels(CONTAINER_HEIGHT_CONSTRAINTS.minPercentage, resolution),
    maxPixels: getContainerHeightPixels(CONTAINER_HEIGHT_CONSTRAINTS.maxPercentage, resolution),
    recommendedPixels: getContainerHeightPixels(CONTAINER_HEIGHT_CONSTRAINTS.recommendedPercentage, resolution)
  };
}

/**
 * Clamp container height to valid range
 */
export function clampContainerHeight(
  heightPercentage: number,
  resolution: ResolutionConfig = RESOLUTION_CONFIGS[0]
): number {
  const min = CONTAINER_HEIGHT_CONSTRAINTS.minPercentage;
  const max = CONTAINER_HEIGHT_CONSTRAINTS.maxPercentage;
  return Math.max(min, Math.min(heightPercentage, max));
}

// ============================================================================
// RESPONSIVE SCALING
// ============================================================================

/**
 * Scale element position for different resolution
 */
export function scaleElementPosition(
  element: LowerThirdElement,
  fromResolution: ResolutionConfig,
  toResolution: ResolutionConfig
): { x: number; y: number } {
  const scaleFactor = toResolution.scaleFactor / fromResolution.scaleFactor;

  return {
    x: element.x * scaleFactor,
    y: element.y * scaleFactor
  };
}

/**
 * Scale element size for different resolution
 */
export function scaleElementSize(
  element: LowerThirdElement,
  fromResolution: ResolutionConfig,
  toResolution: ResolutionConfig
): { width: number; height: number } {
  const scaleFactor = toResolution.scaleFactor / fromResolution.scaleFactor;

  const width = typeof element.width === 'number' ? element.width * scaleFactor : element.width;
  const height = typeof element.height === 'number' ? element.height * scaleFactor : element.height;

  return { width, height };
}

/**
 * Get all resolution configs
 */
export function getAllResolutionConfigs(): ResolutionConfig[] {
  return RESOLUTION_CONFIGS;
}

/**
 * Find resolution config by name
 */
export function findResolutionByName(name: string): ResolutionConfig | undefined {
  return RESOLUTION_CONFIGS.find(r => r.name === name);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate template structure
 */
export function validateTemplate(template: LowerThirdTemplate): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate template properties
  if (!template.id || template.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Template ID is required',
      severity: 'error'
    });
  }

  if (!template.name || template.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      severity: 'error'
    });
  }

  // Validate container height constraints
  if (template.containerMinHeight < 10 || template.containerMinHeight > 50) {
    errors.push({
      field: 'containerMinHeight',
      message: 'Container min height must be between 10% and 50%',
      severity: 'error'
    });
  }

  if (template.containerMaxHeight < 10 || template.containerMaxHeight > 50) {
    errors.push({
      field: 'containerMaxHeight',
      message: 'Container max height must be between 10% and 50%',
      severity: 'error'
    });
  }

  if (template.containerMinHeight >= template.containerMaxHeight) {
    errors.push({
      field: 'containerHeight',
      message: 'Container min height must be less than max height',
      severity: 'error'
    });
  }

  // Validate elements
  if (!template.elements || template.elements.length === 0) {
    warnings.push({
      field: 'elements',
      message: 'Template has no elements',
      suggestion: 'Add at least one element to the template'
    });
  }

  template.elements?.forEach((element, index) => {
    const elementErrors = validateElement(element, template);
    errors.push(...elementErrors.errors);
    warnings.push(...elementErrors.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate individual element
 */
export function validateElement(
  element: LowerThirdElement,
  template?: LowerThirdTemplate
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate element properties
  if (!element.id || element.id.trim() === '') {
    errors.push({
      elementId: element.id,
      field: 'id',
      message: 'Element ID is required',
      severity: 'error'
    });
  }

  if (!element.name || element.name.trim() === '') {
    errors.push({
      elementId: element.id,
      field: 'name',
      message: 'Element name is required',
      severity: 'error'
    });
  }

  // Validate position
  if (element.x < 0 || element.x > 100) {
    errors.push({
      elementId: element.id,
      field: 'x',
      message: 'X position must be between 0 and 100%',
      severity: 'error'
    });
  }

  if (element.y < 0 || element.y > 100) {
    errors.push({
      elementId: element.id,
      field: 'y',
      message: 'Y position must be between 0 and 100%',
      severity: 'error'
    });
  }

  // Validate text element
  if (element.type === 'text') {
    if (element.fontSizeMin && element.fontSizeMax) {
      if (element.fontSizeMin >= element.fontSizeMax) {
        errors.push({
          elementId: element.id,
          field: 'fontSize',
          message: 'Min font size must be less than max font size',
          severity: 'error'
        });
      }

      if (element.fontSizeMin < MIN_FONT_SIZE || element.fontSizeMin > MAX_FONT_SIZE) {
        errors.push({
          elementId: element.id,
          field: 'fontSizeMin',
          message: `Min font size must be between ${MIN_FONT_SIZE}px and ${MAX_FONT_SIZE}px`,
          severity: 'error'
        });
      }

      if (element.fontSizeMax < MIN_FONT_SIZE || element.fontSizeMax > MAX_FONT_SIZE) {
        errors.push({
          elementId: element.id,
          field: 'fontSizeMax',
          message: `Max font size must be between ${MIN_FONT_SIZE}px and ${MAX_FONT_SIZE}px`,
          severity: 'error'
        });
      }
    }

    // Check contrast
    if (element.textColor && template?.backgroundColor) {
      const contrast = calculateColorContrast(element.textColor, template.backgroundColor);
      if (contrast < 4.5) {
        warnings.push({
          elementId: element.id,
          field: 'textColor',
          message: 'Text color may have insufficient contrast with background',
          suggestion: 'Use a darker or lighter text color for better readability'
        });
      }
    }
  }

  // Validate z-index
  if (element.zIndex < 0 || element.zIndex > 1000) {
    warnings.push({
      elementId: element.id,
      field: 'zIndex',
      message: 'Z-index is outside typical range (0-1000)',
      suggestion: 'Consider using values between 0 and 1000'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate color contrast ratio (WCAG)
 */
export function calculateColorContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = calculateLuminance(rgb1);
  const lum2 = calculateLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

/**
 * Calculate relative luminance
 */
export function calculateLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ============================================================================
// TEXT MEASUREMENT & LAYOUT
// ============================================================================

/**
 * Estimate text width (approximate)
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string = 'Inter',
  fontWeight: number = 400
): number {
  // Rough estimation based on font metrics
  const charWidthRatio = fontWeight >= 700 ? 0.55 : 0.5;
  return text.length * (fontSize * charWidthRatio);
}

/**
 * Estimate line count for text
 */
export function estimateLineCount(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string = 'Inter',
  fontWeight: number = 400
): number {
  const charWidth = estimateTextWidth('W', fontSize, fontFamily, fontWeight);
  const charsPerLine = Math.floor(maxWidth / charWidth);
  return Math.ceil(text.length / charsPerLine);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

// ============================================================================
// ELEMENT UTILITIES
// ============================================================================

/**
 * Generate unique element ID
 */
export function generateElementId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${type}-${timestamp}-${random}`;
}

/**
 * Generate unique template ID
 */
export function generateTemplateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `template-${timestamp}-${random}`;
}

/**
 * Clone element
 */
export function cloneElement(element: LowerThirdElement): LowerThirdElement {
  return {
    ...element,
    id: generateElementId(element.type),
    name: `${element.name} (Copy)`
  };
}

/**
 * Clone template
 */
export function cloneTemplate(template: LowerThirdTemplate): LowerThirdTemplate {
  return {
    ...template,
    id: generateTemplateId(),
    name: `${template.name} (Copy)`,
    isCustom: true,
    elements: template.elements.map(el => ({ ...el })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================

/**
 * Get animation duration in milliseconds
 */
export function getAnimationDuration(type: string): number {
  const durations: Record<string, number> = {
    fadeIn: 400,
    slideIn: 500,
    scaleIn: 400,
    rotateIn: 600,
    none: 0
  };
  return durations[type] || 400;
}

/**
 * Get easing function
 */
export function getEasingFunction(easing: string): (t: number) => number {
  const easings: Record<string, (t: number) => number> = {
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    linear: (t: number) => t
  };
  return easings[easing] || easings.linear;
}

// ============================================================================
// EXPORT/IMPORT UTILITIES
// ============================================================================

/**
 * Export template as JSON
 */
export function exportTemplateAsJson(template: LowerThirdTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Import template from JSON
 */
export function importTemplateFromJson(json: string): LowerThirdTemplate | null {
  try {
    const template = JSON.parse(json);
    const validation = validateTemplate(template);
    return validation.isValid ? template : null;
  } catch (error) {
    console.error('Failed to import template:', error);
    return null;
  }
}

/**
 * Export template as file
 */
export function downloadTemplateFile(template: LowerThirdTemplate, filename?: string): void {
  const json = exportTemplateAsJson(template);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${template.name.replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
