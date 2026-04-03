# Lower Third Default Designs - Comprehensive Prompt

## Overview

This document provides detailed specifications for 12 pre-built Lower Third templates that ship with Qworship. Each template is designed to work seamlessly with church presentations, live streaming, and broadcast environments. Templates are optimized for 1920×1080 resolution and include customizable elements (colors, fonts, logos, text).

---

## Design System Principles

### **Canvas & Resolution**

- **Base Resolution:** 1920×1080 (16:9 aspect ratio)
- **Safe Area:** Bottom 25% of screen (Y: 70% to 100%)
- **Positioning System:** Percentage-based (X%, Y%) for responsive scaling
- **Z-index Layering:** Manages element stacking (background, mid, foreground)

### **Container Height Constraints**

The lower third main content section has defined min/max height limits to prevent filling the entire 1080p screen:

- **Minimum Height:** 18% of screen (194px at 1080p)
- **Maximum Height:** 30% of screen (324px at 1080p)
- **Recommended Height:** 25% of screen (270px at 1080p)
- **Safe Content Area:** Y: 70% to 95% (leaves 5% margin at bottom)

These constraints ensure:

- Lower thirds don't dominate the screen
- Sufficient space for video/presentation content above
- Professional, balanced appearance
- Consistent sizing across different templates

### **Dynamic Font Sizing**

Text elements support dynamic font sizing to fill available space based on area rather than strict character length lengths:

- **Minimum Font Size:** Set per text element (typically 24px - 32px)
- **Maximum Font Size:** Set per text element (typically 56px - 72px)
- **Scaling Logic:** Font size dynamically calculates to fill the maximum available container area (width × height).
- **Line Wrapping:** Text wraps naturally to maximize bounding box filling.
- **Overflow Handling:** Scales down to the minimum bound until height is no longer exceeded, truncating only if absolutely necessary at the minimum size.

Area-Based Example:

- Rather than counting lines, the text engine checks the full container dimensions.
- A short verse expands to use larger fonts and line heights to comfortably anchor the space constraint.
- A long verse shrinks precisely enough to sit within the container bounds without breaking min-height/max-height rules.

### **Element Categories**

1. **Background Elements** - Static shapes, gradients, bars (Z-index: 1)
   - Constrained within container height limits (min 18%, max 30%)
2. **Primary Content** - Verse text, main message (Z-index: 2)
   - Font size: Min 28px, Max 56px (dynamic scaling)
3. **Secondary Content** - Reference, version, metadata (Z-index: 2)
   - Font size: Min 20px, Max 32px (dynamic scaling)
4. **Branding Elements** - Logos, social icons, church name (Z-index: 3-4)
   - Fixed or proportional sizing within container
5. **Decorative Elements** - Dividers, accent lines, shapes (Z-index: 1-2)
   - Scale proportionally with container height

### **Typography Standards**

- **Display Font:** Bold, high-contrast (for verse text)
- **Body Font:** Clean, readable (for reference/metadata)
- **Verse Font Size Min:** 24px - 32px (guided by container area)
- **Verse Font Size Max:** 56px - 72px (guided by container area)
- Reference Font Weight
- **Dynamic Scaling:** Font sizes scale organically based on the intersection of content density and allowable maximum dimensions.

### **Color Palette Guidance**

- **Primary Colors:** Brand colors (church colors, purple, blue, etc.)
- **Secondary Colors:** Complementary accent colors
- **Text Colors:** High contrast (white on dark, dark on light)
- **Neutral Colors:** Grays for metadata, subtle backgrounds

---

## Template 1: Classic Solid

### **Design Description**

A timeless, professional lower third with a solid color bar and clean typography. Perfect for traditional church broadcasts and formal presentations.

### **Visual Composition**

- **Background:** Solid color bar spanning full width (Y: 70%, Height: 25%, constrained to 18%-30%)
- **Layout:** Single-column, left-aligned text
- **Accent:** Thin decorative line above bar (optional)
- **Branding:** Church logo in bottom-right corner
- **Container Height:** 270px (25% of 1080p), Min: 194px, Max: 324px

### **Element Specifications**

| Element         | X(%) | Y(%) | Width | Height | Z-index | Details                                                          |
| --------------- | ---- | ---- | ----- | ------ | ------- | ---------------------------------------------------------------- |
| Background Bar  | 0    | 70   | 100%  | 25%    | 1       | Solid color, default: #1a1a1a, constrained height                |
| Verse Text      | 5    | 76   | 90%   | Auto   | 2       | Font: Inter Bold, Min: 28px, Max: 56px (dynamic), Color: #ffffff |
| Reference       | 5    | 88   | 30%   | Auto   | 2       | Font: Inter Bold, Min: 20px, Max: 32px (dynamic), Color: #fbd618 |
| Logo            | 92   | 72   | 6%    | Auto   | 3       | Maintain aspect ratio, max width 120px                           |
| Decorative Line | 0    | 70   | 100%  | 2px    | 2       | Color: #fbd618, optional                                         |

### **Customization Options**

- **Background Color:** Any solid color (recommended: dark colors for contrast)
- **Text Color:** White, light gray, or custom
- **Accent Color:** Yellow, gold, or brand color
- **Logo Placement:** Bottom-right (default) or bottom-left
- **Font Family:** Inter, Roboto, or custom sans-serif
- **Verse Font Size:** Min 28px - 40px, Max 48px - 56px (user-configurable)
- **Reference Font Size:** Min 18px - 24px, Max 28px - 32px (user-configurable)
- **Container Height:** 18% - 30% of screen (locked, prevents full-screen fill)
- **Dynamic Scaling:** Enable/disable automatic font sizing based on content

### **Use Cases**

- Traditional church services
- Formal broadcasts
- Professional presentations
- Scripture reading sessions

### **Animation Suggestions**

- Container slides in from bottom (0.5s ease-out)
- Verse text fades in with font size animation (0.4s ease-out)
- Reference text fades in with font size animation (0.3s ease-out)
- Logo appears with subtle scale (0.3s ease-out)
- All animations synchronized for smooth, professional appearance

---

## Template 2: Minimal Line

### **Design Description**

A modern, minimalist design with a thin accent line and floating text. Emphasizes content over decoration, perfect for contemporary churches.

### **Visual Composition**

- **Background:** Transparent or subtle gradient
- **Accent Line:** Thin horizontal line (2-3px) in brand color
- **Layout:** Text floats above line with breathing room
- **Branding:** Church name or logo integrated into line

### **Element Specifications**

| Element         | X(%) | Y(%) | Width | Height | Z-index | Details                                         |
| --------------- | ---- | ---- | ----- | ------ | ------- | ----------------------------------------------- |
| Accent Line     | 0    | 75   | 100%  | 3px    | 1       | Color: #8b5cf6, spans full width                |
| Verse Text      | 5    | 68   | 85%   | Auto   | 2       | Font: Inter Bold, 52px, Color: #ffffff          |
| Reference       | 5    | 82   | 25%   | Auto   | 2       | Font: Inter, 24px, Color: #8b5cf6               |
| Church Name     | 88   | 75   | 10%   | Auto   | 2       | Font: Inter Bold, 18px, Color: #8b5cf6          |
| Background Fade | 0    | 65   | 100%  | 35%    | 0       | Subtle gradient: transparent to rgba(0,0,0,0.2) |

### **Customization Options**

- **Line Color:** Brand color (default: purple)
- **Line Thickness:** 2px, 3px, or 4px
- **Text Alignment:** Left, center, or right
- **Background:** Transparent, gradient, or semi-transparent dark
- **Font Weight:** Regular or Bold

### **Use Cases**

- Contemporary worship services
- Modern church branding
- Minimalist presentations
- Social media clips

### **Animation Suggestions**

- Line draws from left to right (0.6s)
- Text fades in after line completes (0.3s)
- Staggered entry: line → verse → reference

---

## Template 3: Clean Gradient

### **Design Description**

A sophisticated design with a gradient background that transitions from dark to transparent. Creates depth and visual interest while maintaining readability.

### **Visual Composition**

- **Background:** Gradient bar (dark color to transparent)
- **Layout:** Text positioned over gradient with optimal contrast
- **Accent:** Vertical accent bar on left side
- **Branding:** Logo integrated into gradient area

### **Element Specifications**

| Element             | X(%) | Y(%) | Width | Height | Z-index | Details                                          |
| ------------------- | ---- | ---- | ----- | ------ | ------- | ------------------------------------------------ |
| Gradient Background | 0    | 70   | 100%  | 30%    | 1       | Gradient: #1a1a2e to transparent (left to right) |
| Left Accent Bar     | 0    | 70   | 4%    | 30%    | 2       | Color: #3b82f6, solid                            |
| Verse Text          | 8    | 78   | 75%   | Auto   | 2       | Font: Inter Bold, 48px, Color: #ffffff           |
| Reference           | 8    | 90   | 25%   | Auto   | 2       | Font: Inter, 26px, Color: #e0e0e0                |
| Logo                | 85   | 72   | 12%   | Auto   | 3       | Right-aligned, maintain aspect ratio             |

### **Customization Options**

- **Gradient Colors:** Primary and secondary brand colors
- **Gradient Direction:** Left-to-right, top-to-bottom, or diagonal
- **Accent Bar Color:** Complementary color
- **Text Color:** White or light color
- **Opacity:** Adjust gradient transparency

### **Use Cases**

- Modern church services
- Broadcast-quality presentations
- Professional streaming
- Multi-camera productions

### **Animation Suggestions**

- Gradient slides in from bottom (0.7s ease-out)
- Text fades in with slight upward movement (0.5s)
- Accent bar draws from top to bottom (0.4s)

---

## Template 4: Centered Verse

### **Design Description**

A centered, elegant design that emphasizes the verse text. Perfect for scripture-focused presentations and meditation sessions.

### **Visual Composition**

- **Background:** Subtle background with centered focus
- **Layout:** Centered text with balanced spacing
- **Accent:** Decorative elements above and below text
- **Branding:** Minimal, integrated into design

### **Element Specifications**

| Element                | X(%) | Y(%) | Width | Height | Z-index | Details                                                |
| ---------------------- | ---- | ---- | ----- | ------ | ------- | ------------------------------------------------------ |
| Background Container   | 10   | 68   | 80%   | 28%    | 1       | Subtle border: 2px solid #8b5cf6, border-radius: 8px   |
| Top Decorative Line    | 20   | 70   | 60%   | 2px    | 2       | Color: #8b5cf6                                         |
| Verse Text             | 15   | 75   | 70%   | Auto   | 2       | Font: Georgia or Serif, 44px, centered, Color: #ffffff |
| Reference              | 20   | 88   | 60%   | Auto   | 2       | Font: Inter, 24px, centered, Color: #b0b0b0            |
| Bottom Decorative Line | 20   | 93   | 60%   | 2px    | 2       | Color: #8b5cf6                                         |

### **Customization Options**

- **Container Border:** Color, thickness, style
- **Border Radius:** Sharp, rounded, or fully rounded
- **Text Font:** Serif (elegant) or Sans-serif (modern)
- **Decorative Elements:** Lines, dots, or ornamental shapes
- **Background:** Solid, gradient, or transparent

### **Use Cases**

- Scripture readings
- Meditation and prayer sessions
- Formal ceremonies
- Contemplative services

### **Animation Suggestions**

- Container fades and scales in (0.6s ease-out)
- Top line draws inward from edges (0.4s)
- Verse text fades in (0.5s)
- Bottom line draws inward (0.4s)

---

## Template 5: Bold Accent Bar

### **Design Description**

A striking design with a bold colored bar and high-contrast text. Designed to grab attention and work well in high-energy worship environments.

### **Visual Composition**

- **Background:** Bold solid color bar
- **Layout:** Text positioned for maximum impact
- **Accent:** Large, prominent bar color
- **Branding:** Logo prominently displayed

### **Element Specifications**

| Element             | X(%) | Y(%) | Width | Height | Z-index | Details                                              |
| ------------------- | ---- | ---- | ----- | ------ | ------- | ---------------------------------------------------- |
| Bold Background Bar | 2    | 70   | 96%   | 25%    | 1       | Color: #ef4444 (or brand color), border-radius: 12px |
| Verse Text          | 7    | 73   | 85%   | Auto   | 2       | Font: Inter Black, 56px, Color: #ffffff              |
| Reference           | 12   | 88   | 75%   | Auto   | 2       | Font: Inter Bold, 28px, Color: #ffffff               |
| Logo                | 88   | 72   | 10%   | Auto   | 3       | Right-aligned, white background circle               |

### **Customization Options**

- **Bar Color:** Bold primary color (red, orange, blue, etc.)
- **Text Color:** White or contrasting color
- **Border Radius:** Sharp, rounded, or fully rounded
- **Logo Background:** Circle, square, or none
- **Shadow Effect:** Optional drop shadow for depth

### **Use Cases**

- High-energy worship services
- Contemporary church settings
- Announcement presentations
- Attention-grabbing content

### **Animation Suggestions**

- Bar slides in from left (0.6s ease-out)
- Text fades in with scale effect (0.5s)
- Logo appears with bounce effect (0.4s)

---

## Template 6: Dual Tone Split

### **Design Description**

A sophisticated design with two contrasting color zones. Creates visual interest and allows for multiple content areas.

### **Visual Composition**

- **Background:** Two-color split (vertical or diagonal)
- **Layout:** Text positioned across color zones
- **Accent:** Dividing line between colors
- **Branding:** Logo positioned at intersection

### **Element Specifications**

| Element          | X(%) | Y(%) | Width | Height | Z-index | Details                                |
| ---------------- | ---- | ---- | ----- | ------ | ------- | -------------------------------------- |
| Left Background  | 0    | 70   | 50%   | 30%    | 1       | Color: #1a1a2e                         |
| Right Background | 50   | 70   | 50%   | 30%    | 1       | Color: #8b5cf6                         |
| Dividing Line    | 50   | 70   | 2px   | 30%    | 2       | Color: #ffffff                         |
| Verse Text       | 5    | 78   | 90%   | Auto   | 2       | Font: Inter Bold, 48px, Color: #ffffff |
| Reference        | 5    | 90   | 40%   | Auto   | 2       | Font: Inter, 24px, Color: #fbd618      |
| Logo             | 48   | 72   | 4%    | Auto   | 3       | Centered on dividing line              |

### **Customization Options**

- **Color 1 & 2:** Any contrasting colors
- **Split Direction:** Vertical, horizontal, or diagonal
- **Dividing Line:** Thin, thick, or decorative
- **Text Positioning:** Left, center, or right
- **Logo Style:** Circular, square, or custom shape

### **Use Cases**

- Dual-message presentations
- Before/after comparisons
- Testimonies and stories
- Creative worship services

### **Animation Suggestions**

- Left color slides in from left (0.5s)
- Right color slides in from right (0.5s)
- Dividing line appears (0.3s)
- Text fades in (0.4s)

---

## Template 7: Modern Geometric

### **Design Description**

A contemporary design with geometric shapes and modern aesthetics. Perfect for tech-forward churches and modern presentations.

### **Visual Composition**

- **Background:** Geometric shapes (triangles, rectangles, circles)
- **Layout:** Text integrated with geometric elements
- **Accent:** Angular lines and shapes
- **Branding:** Logo integrated into geometric design

### **Element Specifications**

| Element             | X(%) | Y(%) | Width | Height | Z-index | Details                                           |
| ------------------- | ---- | ---- | ----- | ------ | ------- | ------------------------------------------------- |
| Triangle Background | 0    | 70   | 100%  | 30%    | 1       | Polygon shape, Color: #1a1a2e, clip-path: polygon |
| Accent Rectangle    | 0    | 70   | 8%    | 30%    | 2       | Color: #8b5cf6                                    |
| Verse Text          | 12   | 77   | 75%   | Auto   | 2       | Font: Inter Bold, 50px, Color: #ffffff            |
| Reference           | 12   | 90   | 30%   | Auto   | 2       | Font: Inter, 26px, Color: #8b5cf6                 |
| Geometric Circle    | 88   | 75   | 8%    | 8%     | 3       | Color: #3b82f6, contains logo or icon             |

### **Customization Options**

- **Shape Type:** Triangles, rectangles, circles, or custom polygons
- **Shape Colors:** Primary and secondary brand colors
- **Clip-path:** Adjust angles and proportions
- **Text Alignment:** Left, center, or right
- **Geometric Complexity:** Simple (1-2 shapes) or complex (multiple shapes)

### **Use Cases**

- Modern church branding
- Tech-focused presentations
- Youth ministry events
- Contemporary worship services

### **Animation Suggestions**

- Shapes draw/animate in sequence (0.6s total)
- Text fades in with slight rotation (0.4s)
- Circle appears with scale effect (0.3s)

---

## Template 8: Purple Gradient Accent

### **Design Description**

A premium design featuring a purple-to-blue gradient with accent elements. Designed specifically for Qworship's brand identity.

### **Visual Composition**

- **Background:** Purple-to-blue gradient bar
- **Layout:** Text positioned for optimal readability
- **Accent:** Gradient overlay with transparency
- **Branding:** Full branding integration (logo, social icons)

### **Element Specifications**

| Element             | X(%) | Y(%) | Width | Height | Z-index | Details                                            |
| ------------------- | ---- | ---- | ----- | ------ | ------- | -------------------------------------------------- |
| Gradient Background | 0    | 65   | 100%  | 35%    | 1       | Gradient: #8b5cf6 to #3b82f6 (left to right)       |
| Reference           | 6    | 65   | 40%   | Auto   | 1       | Font: Inter Bold, 32px, Color: #ffffff             |
| Verse Text          | 6    | 73   | 85%   | Auto   | 1       | Font: Inter Bold, 48px, Color: #ffffff             |
| Version             | 6    | 82   | 10%   | Auto   | 1       | Font: Inter, 20px, Color: #e0e0e0                  |
| Social Icons        | 6    | 89   | 25%   | Auto   | 1       | Facebook, Twitter, Instagram icons, Color: #ffffff |

### **Customization Options**

- **Gradient Colors:** Purple, blue, or custom brand colors
- **Gradient Direction:** Left-to-right, top-to-bottom, or diagonal
- **Text Colors:** White, light gray, or custom
- **Social Icons:** Show/hide, customize colors
- **Logo Placement:** Bottom-right or integrated into gradient

### **Use Cases**

- Qworship branded presentations
- Church services using Qworship
- Professional broadcasts
- Consistent branding across services

### **Animation Suggestions**

- Gradient slides in from bottom (0.6s ease-out)
- Reference text fades in (0.3s)
- Verse text fades in with slight delay (0.4s)
- Social icons appear in sequence (0.5s total)

---

## Template 9: Rounded Pill

### **Design Description**

A friendly, approachable design with rounded corners and pill-shaped containers. Perfect for welcoming, community-focused churches.

### **Visual Composition**

- **Background:** Rounded pill-shaped container
- **Layout:** Text inside rounded container
- **Accent:** Soft shadows and rounded elements
- **Branding:** Logo integrated into pill design

### **Element Specifications**

| Element        | X(%) | Y(%) | Width | Height | Z-index | Details                                                                          |
| -------------- | ---- | ---- | ----- | ------ | ------- | -------------------------------------------------------------------------------- |
| Header Tab     | 12   | 60   | 30%   | 8%     | 2       | Background: #8b5cf6, border-radius: 50px, Font: Inter Bold, 20px                 |
| Main Container | 2    | 68   | 96%   | 25%    | 1       | Background: #1a1a2e, border-radius: 24px, box-shadow: 0 8px 32px rgba(0,0,0,0.3) |
| Verse Text     | 10   | 72   | 70%   | Auto   | 2       | Font: Inter Bold, 44px, Color: #ffffff                                           |
| Translation    | 10   | 84   | 20%   | Auto   | 2       | Font: Inter, 22px, Color: #b0b0b0                                                |
| Social Footer  | 12   | 90   | 75%   | 6%     | 1       | Horizontal icon row, Color: #ffffff                                              |

### **Customization Options**

- **Container Color:** Dark, light, or gradient
- **Border Radius:** Adjust roundness (12px to 50px)
- **Header Tab Color:** Brand color
- **Shadow:** Adjust depth and blur
- **Text Alignment:** Left or center

### **Use Cases**

- Community-focused churches
- Welcoming, friendly presentations
- Youth ministry events
- Family-oriented services

### **Animation Suggestions**

- Header tab slides in from top (0.4s)
- Main container fades and scales in (0.5s)
- Text fades in (0.4s)
- Social icons appear in sequence (0.5s)

---

## Template 10: Rounded Organic

### **Design Description**

A natural, flowing design with organic shapes and curved elements. Creates a warm, welcoming atmosphere.

### **Visual Composition**

- **Background:** Organic curved shapes
- **Layout:** Text flowing with organic elements
- **Accent:** Curved dividers and flowing lines
- **Branding:** Logo integrated into organic design

### **Element Specifications**

| Element                 | X(%) | Y(%) | Width | Height | Z-index | Details                                                                          |
| ----------------------- | ---- | ---- | ----- | ------ | ------- | -------------------------------------------------------------------------------- |
| Organic Wave Background | 0    | 65   | 100%  | 35%    | 1       | SVG wave shape, Color: #1a1a2e, clip-path: polygon with curves                   |
| Orange Header           | 8    | 68   | 25%   | 8%     | 2       | Background: #f97316, border-radius: 50px, Font: Inter Bold, 24px, Color: #ffffff |
| Main Navy Container     | 2    | 64   | 96%   | 28%    | 1       | Background: #0f172a, border-radius: 32px                                         |
| Verse Text              | 9    | 70   | 85%   | Auto   | 4       | Font: Inter Bold, 48px, Color: #ffffff                                           |
| Version                 | 9    | 81   | 15%   | Auto   | 2       | Font: Inter, 24px, Color: #f97316                                                |
| Logo Placeholder        | 60   | 58   | 150px | 150px  | 4       | Circular, background: #f97316, opacity: 0.2                                      |

### **Customization Options**

- **Wave Shape:** Adjust curve depth and direction
- **Primary Color:** Navy, dark blue, or custom
- **Accent Color:** Orange, coral, or custom
- **Text Colors:** White, light gray, or custom
- **Logo Size:** Adjust from 100px to 200px

### **Use Cases**

- Organic, natural church branding
- Meditation and prayer services
- Nature-focused presentations
- Welcoming, warm atmospheres

### **Animation Suggestions**

- Wave draws from bottom (0.8s ease-out)
- Orange header slides in from left (0.5s)
- Verse text fades in (0.4s)
- Logo appears with fade effect (0.3s)

---

## Template 11: Angled Header

### **Design Description**

A dynamic design with angled/skewed elements that create movement and energy. Perfect for contemporary worship and announcements.

### **Visual Composition**

- **Background:** Angled bar with skew effect
- **Layout:** Text positioned alongside angled elements
- **Accent:** Angular lines and sharp edges
- **Branding:** Logo positioned at angle intersection

### **Element Specifications**

| Element           | X(%) | Y(%) | Width | Height | Z-index | Details                                                        |
| ----------------- | ---- | ---- | ----- | ------ | ------- | -------------------------------------------------------------- |
| Angled Background | 0    | 70   | 100%  | 30%    | 1       | Background: #8b5cf6, transform: skewY(-2deg)                   |
| Verse Text        | 5    | 75   | 85%   | Auto   | 2       | Font: Inter Bold, 50px, Color: #ffffff, transform: skewY(2deg) |
| Reference         | 5    | 88   | 30%   | Auto   | 2       | Font: Inter, 26px, Color: #fbd618, transform: skewY(2deg)      |
| Accent Line       | 0    | 70   | 4%    | 30%    | 2       | Background: #fbd618, transform: skewY(-2deg)                   |
| Logo              | 92   | 72   | 6%    | Auto   | 3       | Right-aligned, white background                                |

### **Customization Options**

- **Skew Angle:** Adjust from -5deg to 5deg
- **Background Color:** Brand color
- **Accent Line:** Color and width
- **Text Skew:** Match or offset background skew
- **Logo Placement:** Right, left, or center

### **Use Cases**

- Contemporary worship services
- Dynamic announcements
- High-energy presentations
- Modern church branding

### **Animation Suggestions**

- Background skews in from bottom (0.6s ease-out)
- Text fades in with slight rotation (0.5s)
- Accent line draws from top (0.4s)
- Logo appears with scale effect (0.3s)

---

## Template 12: Bold Impact

### **Design Description**

A powerful, attention-grabbing design with maximum contrast and bold typography. Designed for announcements and important messages.

### **Visual Composition**

- **Background:** Solid black bar for maximum contrast
- **Layout:** Large, bold text
- **Accent:** Minimal, focused design
- **Branding:** Logo for brand recognition

### **Element Specifications**

| Element          | X(%) | Y(%) | Width | Height | Z-index | Details                                 |
| ---------------- | ---- | ---- | ----- | ------ | ------- | --------------------------------------- |
| Black Background | 2    | 70   | 96%   | 25%    | 1       | Background: #000000, border-radius: 8px |
| Verse Text       | 7    | 73   | 85%   | Auto   | 2       | Font: Inter Black, 56px, Color: #ffffff |
| Reference        | 12   | 88   | 75%   | Auto   | 2       | Font: Inter Bold, 28px, Color: #fbd618  |
| Accent Underline | 7    | 86   | 40%   | 3px    | 2       | Background: #fbd618                     |
| Logo             | 88   | 72   | 10%   | Auto   | 3       | Right-aligned, white circle background  |

### **Customization Options**

- **Background Color:** Black, dark navy, or dark brand color
- **Text Color:** White or light color
- **Accent Color:** Yellow, gold, or brand color
- **Underline:** Show/hide, adjust width
- **Logo Background:** Circle, square, or none

### **Use Cases**

- Important announcements
- Breaking news or urgent messages
- High-impact presentations
- Attention-grabbing content

### **Animation Suggestions**

- Background slides in from bottom (0.5s ease-out)
- Text fades in with scale effect (0.4s)
- Underline draws from left (0.3s)
- Logo appears with bounce (0.3s)

---

## Template Customization Framework

### **Editable Properties (for all templates)**

Each template supports the following customization options:

#### **Colors**

- Primary Background Color
- Secondary Background Color
- Text Color (Verse)
- Text Color (Reference/Metadata)
- Accent Color
- Logo Background Color

#### **Typography**

- Verse Font Family (sans-serif, serif, or custom)
- **Verse Font Size Min:** 28px - 40px (user-configurable)
- **Verse Font Size Max:** 48px - 64px (user-configurable)
- Verse Font Weight (400, 600, 700, 900)
- Reference Font Family
- **Reference Font Size Min:** 18px - 24px (user-configurable)
- **Reference Font Size Max:** 28px - 36px (user-configurable)
- Reference Font Weight
- **Dynamic Scaling:** Enabled/Disabled toggle

#### **Layout**

- Element Positioning (X%, Y%)
- Element Width/Height
- **Container Height:** Min 18%, Max 30% (system-enforced)
- **Container Min Height:** 194px at 1080p (adjusts proportionally)
- **Container Max Height:** 324px at 1080p (adjusts proportionally)
- Padding and Margins
- Text Alignment (left, center, right)
- Rotation and Skew (for applicable templates)
- **Line Clamp:** Max number of lines before truncation (2-5 lines)

#### **Branding**

- Logo Image Upload
- Logo Size and Position
- Church Name/Text
- Social Media Icons (show/hide)
- Custom Watermark

#### **Effects**

- Background Opacity
- Shadow Effects (blur, offset, color)
- Border Radius
- Border Style and Color
- Gradient Direction and Colors
- **Text Overflow:** Truncate, wrap, or scale down
- **Vertical Alignment:** Top, middle, bottom within container

---

## Default Template Assignments

### **Recommended Default Selection**

When a user first opens Qworship, the system should:

1. **Load "Purple Gradient Accent"** as the default template (matches Qworship branding)
2. **Display all 12 templates** in the template selector for easy browsing
3. **Allow one-click switching** between templates
4. **Preserve customizations** when switching templates (if applicable)
5. **Save user's last-used template** for next session

### **Template Organization**

**By Category:**

- **Professional:** Classic Solid, Minimal Line, Clean Gradient
- **Contemporary:** Bold Accent Bar, Modern Geometric, Angled Header
- **Elegant:** Centered Verse, Dual Tone Split, Rounded Organic
- **Branded:** Purple Gradient Accent, Rounded Pill, Bold Impact

**By Use Case:**

- **Scripture Focus:** Centered Verse, Minimal Line, Clean Gradient
- **Announcements:** Bold Impact, Bold Accent Bar, Angled Header
- **Branding:** Purple Gradient Accent, Rounded Pill, Organic Wave
- **Versatile:** Classic Solid, Dual Tone Split, Modern Geometric

---

## Animation & Transition Standards

### **Entry Animations (0.3s - 0.8s)**

All templates support these entry animations:

1. **Fade In** - Simple opacity transition (0.3s - 0.5s)
2. **Slide In** - Directional slide (0.5s - 0.7s)
3. **Scale In** - Grow from center (0.4s - 0.6s)
4. **Rotate In** - Spin into place (0.4s - 0.6s)
5. **Combined** - Multiple effects (0.6s - 0.8s)

### **Exit Animations (0.2s - 0.5s)**

1. **Fade Out** - Simple opacity transition (0.2s - 0.3s)
2. **Slide Out** - Directional slide (0.3s - 0.5s)
3. **Scale Out** - Shrink to center (0.3s - 0.4s)

### **Default Animation Sequence**

For each template:

1. Background element enters first (0.5s - 0.7s)
   - Container animates to max height (if animated)
2. Primary content (verse) fades in (0.4s - 0.5s)
   - Font size animates to target size (if dynamic scaling enabled)
3. Secondary content (reference) fades in (0.3s - 0.4s)
   - Font size animates to target size (if dynamic scaling enabled)
4. Branding elements appear last (0.3s - 0.4s)

### **Font Size Animation**

When dynamic font sizing is enabled:

- Font size animates smoothly from 0 to target size during entry
- Animation duration: 0.4s - 0.6s (synchronized with text fade-in)
- Easing: ease-out for natural feel
- Text reflows smoothly as font size changes

---

## Responsive Behavior

### **Scaling for Different Resolutions**

All templates use percentage-based positioning to scale responsively:

- **1920×1080** - 100% scale (default)
  - Min container height: 194px (18%)
  - Max container height: 324px (30%)
- **1280×720** - Automatic scaling (66.7%)
  - Min container height: 129px (18%)
  - Max container height: 216px (30%)
- **3840×2160** - Automatic scaling (200%)
  - Min container height: 388px (18%)
  - Max container height: 648px (30%)
- **Custom Resolutions** - Proportional scaling
  - Container height = resolution_height × (18% to 30%)

### **Text Overflow Handling**

Dynamic font sizing ensures text fills available space by calculating the container's allowable bounding box area:

- **Area Maximization:** Text size is dictated by the available container width and height dimension checks, completely replacing the need for arbitrary content length bounds constraints.
- **Dynamic Fitting:** The font size is chosen dynamically, picking the exact mathematically-largest scale that perfectly situates the content inside the defined container logic.
- **Constraint Bounds:** If the maximum height is reached, the solver shrinks the layout naturally till it successfully clears the rules or reaches the lowest bound limitation constraint.
- **Truncation Fallback:** Ellipsis or forced truncation is strictly the final fallback once maximum width, max height, and minimum text constraints are all exceeded together.
- **Minimum guarantee:** Text never goes below the explicitly configured minimum font size constraint parameter.

Area-Based Example:

- Area dimensions accurately drive scaling, rather than rigid estimations like lines.
- As the container width adjustments occur, or more content is pumped in, the text solver iterates and automatically repaints safely without leaking pixels outside the visual hierarchy bounds.

---

## Export & Sharing

### **Template Export Options**

Each template can be exported as:

1. **JSON Configuration** - For backup and sharing
2. **PNG Snapshot** - For preview and documentation
3. **SVG Assets** - For editing in design tools
4. **Custom Theme** - For distribution to other users

### **Template Sharing**

Users can:

1. **Share templates** with other church members
2. **Download community templates** from Qworship library
3. **Import custom templates** from JSON files
4. **Duplicate templates** to create variations

---

## Implementation Notes

### **Technical Requirements**

- All templates must render at 1920×1080 (16:9)
- Support for custom fonts (Google Fonts, uploaded fonts)
- Real-time preview as user customizes
- Undo/Redo functionality for all changes
- Auto-save customizations

### **Performance Considerations**

- Templates should render in < 100ms
- Animations should run at 60fps
- Support for GPU acceleration
- Optimize for low-end hardware

### **Accessibility**

- All text must have sufficient contrast (WCAG AA minimum)
- Support for screen readers
- Keyboard navigation for all controls
- High contrast mode support

---

## Summary

This comprehensive design system provides 12 professionally-designed, customizable lower third templates that cover a wide range of church presentation styles. Each template is optimized for broadcast quality, includes detailed specifications, and supports extensive customization while maintaining visual coherence and professional appearance.

Key improvements in this version:

✅ **Container Height Constraints** - Lower thirds stay within 18%-30% of screen (194px-324px at 1080p)  
✅ **Dynamic Area-Based Font Sizing** - Text scaling uses physical container area (width × height) logic over unpredictable string length rules  
✅ **Responsive Scaling** - Container and font sizes scale proportionally across different resolutions  
✅ **Professional Typography** - Ensures text always fills available space without overflow or undersizing  
✅ **Smooth Animations** - Font sizes animate during entry for polished appearance

Templates can be mixed and matched, customized extensively, and combined with the Lower Third Builder tool to create unlimited variations while maintaining brand consistency, professional quality, and proper text sizing.
