/**
 * Default Lower Third Templates
 * 12 pre-built professional templates with font sizing and container height constraints
 */

import { LowerThirdTemplate } from './lower-third-types';

/**
 * Create a default template with standard settings
 */
const createTemplate = (
  id: string,
  name: string,
  description: string,
  category: 'professional' | 'contemporary' | 'elegant' | 'branded',
  backgroundColor: string,
  elements: any[]
): LowerThirdTemplate => ({
  id,
  name,
  description,
  category,
  isDefault: true,
  isCustom: false,
  width: 1920,
  height: 1080,
  backgroundColor,
  containerMinHeight: 18,
  containerMaxHeight: 30,
  containerRecommendedHeight: 25,
  elements,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'Qworship',
  tags: [category, 'default'],
  thumbnail: '',
  version: 1
});

// ============================================================================
// TEMPLATE 1: CLASSIC SOLID
// ============================================================================

export const CLASSIC_SOLID: LowerThirdTemplate = createTemplate(
  'template-classic-solid',
  'Classic Solid',
  'Timeless professional design with solid color bar and clean typography',
  'professional',
  '#0a0520',
  [
    {
      id: 'bg-bar',
      type: 'shape',
      name: 'Background Bar',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 5,
      y: 76,
      width: 90,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 5,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 28,
      fontSizeMin: 20,
      fontSizeMax: 32,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#fbd618',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 200,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE 2: MINIMAL LINE
// ============================================================================

export const MINIMAL_LINE: LowerThirdTemplate = createTemplate(
  'template-minimal-line',
  'Minimal Line',
  'Modern minimalist design with thin accent line',
  'contemporary',
  '#0a0520',
  [
    {
      id: 'accent-line',
      type: 'shape',
      name: 'Accent Line',
      x: 0,
      y: 70,
      width: 100,
      height: 0.5,
      rotation: 0,
      backgroundColor: '#8b5cf6',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 5,
      y: 73,
      width: 90,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'slideIn',
        duration: 500,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 5,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 500,
      textColor: '#8b5cf6',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE 3: CLEAN GRADIENT
// ============================================================================

export const CLEAN_GRADIENT: LowerThirdTemplate = createTemplate(
  'template-clean-gradient',
  'Clean Gradient',
  'Sophisticated gradient background with modern typography',
  'elegant',
  '#0a0520',
  [
    {
      id: 'gradient-bg',
      type: 'shape',
      name: 'Gradient Background',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      rotation: 0,
      backgroundColor: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 8,
      y: 76,
      width: 84,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 8,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 600,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 200,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE 4: BOLD ACCENT BAR
// ============================================================================

export const BOLD_ACCENT_BAR: LowerThirdTemplate = createTemplate(
  'template-bold-accent',
  'Bold Accent Bar',
  'High-energy attention-grabbing design with colored accent bar',
  'professional',
  '#0a0520',
  [
    {
      id: 'accent-bar',
      type: 'shape',
      name: 'Accent Bar',
      x: 0,
      y: 70,
      width: 8,
      height: 30,
      rotation: 0,
      backgroundColor: '#ef4444',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'bg-bar',
      type: 'shape',
      name: 'Background Bar',
      x: 8,
      y: 70,
      width: 92,
      height: 30,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 12,
      y: 76,
      width: 84,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'slideIn',
        duration: 500,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 12,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ef4444',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE 5: PURPLE GRADIENT ACCENT (Qworship Branded)
// ============================================================================

export const PURPLE_GRADIENT_ACCENT: LowerThirdTemplate = createTemplate(
  'template-purple-gradient',
  'Purple Gradient Accent',
  'Qworship branded design with purple gradient and modern typography',
  'branded',
  '#0a0520',
  [
    {
      id: 'gradient-bg',
      type: 'shape',
      name: 'Gradient Background',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      rotation: 0,
      backgroundColor: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 6,
      y: 73,
      width: 85,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 6,
      y: 82,
      width: 40,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 600,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 200,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE 6: ROUNDED PILL
// ============================================================================

export const ROUNDED_PILL: LowerThirdTemplate = createTemplate(
  'template-rounded-pill',
  'Rounded Pill',
  'Friendly community-focused design with rounded corners',
  'contemporary',
  '#0a0520',
  [
    {
      id: 'pill-bg',
      type: 'shape',
      name: 'Pill Background',
      x: 2,
      y: 68,
      width: 96,
      height: 28,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      borderRadius: 20,
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 10,
      y: 72,
      width: 80,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 44,
      fontSizeMin: 26,
      fontSizeMax: 52,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'scaleIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 10,
      y: 84,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 20,
      fontSizeMin: 16,
      fontSizeMax: 24,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 600,
      textColor: '#8b5cf6',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// ADDITIONAL TEMPLATES (7-12)
// ============================================================================

// Template 7: Dual Tone Split
export const DUAL_TONE_SPLIT: LowerThirdTemplate = createTemplate(
  'template-dual-tone',
  'Dual Tone Split',
  'Two-color sophisticated design with split layout',
  'elegant',
  '#0a0520',
  [
    {
      id: 'left-bg',
      type: 'shape',
      name: 'Left Background',
      x: 0,
      y: 70,
      width: 50,
      height: 30,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'right-bg',
      type: 'shape',
      name: 'Right Background',
      x: 50,
      y: 70,
      width: 50,
      height: 30,
      rotation: 0,
      backgroundColor: '#8b5cf6',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 5,
      y: 76,
      width: 40,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved',
      fontFamily: 'Inter',
      fontSize: 44,
      fontSizeMin: 26,
      fontSizeMax: 52,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 4,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'slideIn',
        duration: 500,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 55,
      y: 76,
      width: 40,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 32,
      fontSizeMin: 20,
      fontSizeMax: 40,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// Template 8: Modern Geometric
export const MODERN_GEOMETRIC: LowerThirdTemplate = createTemplate(
  'template-geometric',
  'Modern Geometric',
  'Contemporary geometric shapes with dynamic layout',
  'contemporary',
  '#0a0520',
  [
    {
      id: 'accent-shape',
      type: 'shape',
      name: 'Accent Shape',
      x: 0,
      y: 70,
      width: 6,
      height: 30,
      rotation: 0,
      backgroundColor: '#3b82f6',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'bg-bar',
      type: 'shape',
      name: 'Background Bar',
      x: 6,
      y: 70,
      width: 94,
      height: 30,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 12,
      y: 74,
      width: 80,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 12,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 600,
      textColor: '#3b82f6',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 200,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// Template 9: Centered Verse
export const CENTERED_VERSE: LowerThirdTemplate = createTemplate(
  'template-centered',
  'Centered Verse',
  'Elegant centered text design for focused scripture display',
  'elegant',
  '#0a0520',
  [
    {
      id: 'semi-transparent-bg',
      type: 'shape',
      name: 'Background',
      x: 10,
      y: 68,
      width: 80,
      height: 28,
      rotation: 0,
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      borderRadius: 8,
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 15,
      y: 72,
      width: 70,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'scaleIn',
        duration: 400,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 35,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 20,
      fontSizeMin: 16,
      fontSizeMax: 24,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 600,
      textColor: '#8b5cf6',
      textAlign: 'center',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// Template 10: Angled Header
export const ANGLED_HEADER: LowerThirdTemplate = createTemplate(
  'template-angled',
  'Angled Header',
  'Dynamic angled/skewed elements design',
  'contemporary',
  '#0a0520',
  [
    {
      id: 'angled-bg',
      type: 'shape',
      name: 'Angled Background',
      x: 0,
      y: 70,
      width: 100,
      height: 30,
      rotation: 0,
      backgroundColor: '#1a1a1a',
      clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 8,
      y: 76,
      width: 84,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 48,
      fontSizeMin: 28,
      fontSizeMax: 56,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'slideIn',
        duration: 500,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 8,
      y: 88,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#8b5cf6',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// Template 11: Bold Impact
export const BOLD_IMPACT: LowerThirdTemplate = createTemplate(
  'template-bold-impact',
  'Bold Impact',
  'Powerful maximum contrast design',
  'professional',
  '#0a0520',
  [
    {
      id: 'black-bg',
      type: 'shape',
      name: 'Black Background',
      x: 2,
      y: 70,
      width: 96,
      height: 30,
      rotation: 0,
      backgroundColor: '#000000',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 7,
      y: 73,
      width: 86,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 52,
      fontSizeMin: 32,
      fontSizeMax: 60,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 900,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.3,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'rotateIn',
        duration: 600,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 12,
      y: 88,
      width: 75,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 28,
      fontSizeMin: 20,
      fontSizeMax: 36,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffd700',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 300,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// Template 12: Gradient Sunset
export const GRADIENT_SUNSET: LowerThirdTemplate = createTemplate(
  'template-sunset',
  'Gradient Sunset',
  'Warm gradient design inspired by sunset colors',
  'elegant',
  '#0a0520',
  [
    {
      id: 'sunset-gradient',
      type: 'shape',
      name: 'Sunset Gradient',
      x: 2,
      y: 72,
      width: 96,
      height: 25,
      rotation: 0,
      backgroundColor: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 50%, #fdb833 100%)',
      zIndex: 1,
      locked: false,
      visible: true
    },
    {
      id: 'verse-text',
      type: 'text',
      name: 'Verse Text',
      x: 8,
      y: 75,
      width: 84,
      height: 'auto',
      rotation: 0,
      text: 'For God so loved the world',
      fontFamily: 'Inter',
      fontSize: 44,
      fontSizeMin: 26,
      fontSizeMax: 52,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      lineClamp: 5,
      textOverflow: 'wrap',
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'slideIn',
        duration: 500,
        delay: 100,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'verse',
        placeholder: 'Enter verse text'
      }
    },
    {
      id: 'reference',
      type: 'text',
      name: 'Reference',
      x: 8,
      y: 89,
      width: 30,
      height: 'auto',
      rotation: 0,
      text: 'John 3:16',
      fontFamily: 'Inter',
      fontSize: 24,
      fontSizeMin: 18,
      fontSizeMax: 28,
      fontSizeDynamic: true,
      fontSizeAnimated: true,
      fontWeight: 700,
      textColor: '#180101',
      textAlign: 'left',
      lineHeight: 1.2,
      zIndex: 2,
      locked: false,
      visible: true,
      animation: {
        type: 'fadeIn',
        duration: 300,
        delay: 250,
        easing: 'ease-out',
        animateFontSize: true
      },
      binding: {
        field: 'reference',
        placeholder: 'John 3:16'
      }
    }
  ]
);

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

export const DEFAULT_TEMPLATES: LowerThirdTemplate[] = [
  CLASSIC_SOLID,
  MINIMAL_LINE,
  CLEAN_GRADIENT,
  BOLD_ACCENT_BAR,
  PURPLE_GRADIENT_ACCENT,
  ROUNDED_PILL,
  DUAL_TONE_SPLIT,
  MODERN_GEOMETRIC,
  CENTERED_VERSE,
  ANGLED_HEADER,
  BOLD_IMPACT,
  GRADIENT_SUNSET
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): LowerThirdTemplate | undefined {
  return DEFAULT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: 'professional' | 'contemporary' | 'elegant' | 'branded'
): LowerThirdTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all template categories
 */
export function getAllCategories(): Array<'professional' | 'contemporary' | 'elegant' | 'branded'> {
  return ['professional', 'contemporary', 'elegant', 'branded'];
}
