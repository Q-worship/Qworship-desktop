# Lower Third Builder/Editor Tool - Updated Prompt

## With Font Size Constraints & Container Height Limits

---

## Key Updates

### **1. Container Height Constraints**

The lower third main content section is now constrained to prevent filling the entire screen:

- **Minimum Height:** 18% of screen (194px at 1920×1080)
- **Maximum Height:** 30% of screen (324px at 1920×1080)
- **Recommended Height:** 25% of screen (270px at 1920×1080)
- **System-Enforced:** Users cannot set container height outside these limits

This ensures:

- Lower thirds don't dominate the broadcast
- Sufficient space for video/presentation content
- Professional, balanced appearance
- Consistent across all templates and resolutions

### **2. Dynamic Font Sizing**

All text elements now support min/max font size constraints, and scale dynamically by filling available space:

**Verse Text (Primary Content):**

- Minimum Font Size: 24px - 32px (configurable, based on container constraints)
- Maximum Font Size: 56px - 72px (configurable, based on container constraints)
- Dynamic Scaling: Enabled by default
- Scaling Logic: Font size is determined by maximizing the entire available container area (width × height) rather than strictly estimating text length or lines.

**Reference/Metadata (Secondary Content):**

- Minimum Font Size: 18px - 24px (configurable)
- Maximum Font Size: 28px - 36px (configurable)
- Dynamic Scaling: Enabled by default

**Church Name/Version (Tertiary Content):**

- Minimum Font Size: 14px - 20px (configurable)
- Maximum Font Size: 24px - 32px (configurable)

**How It Works (Area-Based Scaling):**

- The system checks the total available pixel area (width × height) inside the container.
- Text expands to fill this area as perfectly as possible, utilizing the maximum font bounds and line-height.
- Small content: Employs maximum font size to occupy the space aesthetically.
- Voluminous content: The engine measures the text and steps down the font size until all text fits within the physical bounding box.
- Exceeds min bounds: Only truncates with an ellipsis if the text cannot fit the physical container parameters even at the minimum font size constraint.

---

## Updated Data Models

### **LowerThirdTemplate Interface**

```typescript
interface LowerThirdTemplate {
  id: string;
  name: string;
  description: string;
  category: "professional" | "contemporary" | "elegant" | "branded" | "custom";
  isDefault: boolean;
  isCustom: boolean;

  // Canvas settings
  width: number; // 1920
  height: number; // 1080
  backgroundColor: string;

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
  thumbnail: string;
}
```

### **LowerThirdElement Interface**

```typescript
interface LowerThirdElement {
  id: string;
  type: "text" | "shape" | "image" | "icon" | "group";
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

  // Font size constraints (NEW)
  fontSize?: number; // current/default font size
  fontSizeMin?: number; // minimum font size (px)
  fontSizeMax?: number; // maximum font size (px)
  fontSizeDynamic?: boolean; // enable dynamic scaling
  fontSizeAnimated?: boolean; // animate font size changes

  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  lineClamp?: number; // max number of lines (2-5)
  textOverflow?: "truncate" | "wrap" | "scale"; // how to handle overflow

  // Image-specific
  src?: string;
  objectFit?: "cover" | "contain" | "fill";

  // Layering
  zIndex: number;
  locked: boolean;
  visible: boolean;

  // Animation
  animation?: {
    type: "fadeIn" | "slideIn" | "scaleIn" | "rotateIn" | "none";
    duration: number;
    delay: number;
    easing: "ease-in" | "ease-out" | "ease-in-out" | "linear";
    animateFontSize?: boolean; // animate font size during entry
  };

  // Binding
  binding?: {
    field: "verse" | "reference" | "version" | "churchName" | "custom";
    placeholder?: string;
  };
}
```

---

## Updated Properties Panel

### **Font Size Section** (NEW)

When a text element is selected, the Properties Panel now includes a dedicated "Font Size" section:

```
┌──────────────────────────────────────┐
│ FONT SIZE CONSTRAINTS                │
├──────────────────────────────────────┤
│ Current Size: Auto-calculated        │
│                                      │
│ Minimum Size:                        │
│ [24px ▼] (Range: 20px - 32px)       │
│                                      │
│ Maximum Size:                        │
│ [64px ▼] (Range: 56px - 72px)       │
│                                      │
│ [✓] Enable Area-Based Scaling        │
│ [✓] Animate Font Size on Entry       │
│                                      │
│ Max Height limit: [System]           │
│ Overflow Handling: [Scale to view ▼] │
│                                      │
│ Preview with Area Fill:              │
│ ┌──────────────────────────────────┐ │
│ │ Fits best: Text calculates       │ │
│ │ space intersection (56px)        │ │
│ │                                  │ │
│ │ Scales down: Font size drops     │ │
│ │ precisely to honor bounding box  │ │
│ │ height restrictions (32px)       │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### **Container Height Section** (NEW)

A new section displays container height constraints:

```
┌──────────────────────────────────────┐
│ CONTAINER HEIGHT                     │
├──────────────────────────────────────┤
│ Current Height: 270px (25%)          │
│ (System-enforced constraints)        │
│                                      │
│ Minimum: 194px (18%)                 │
│ Maximum: 324px (30%)                 │
│ Recommended: 270px (25%)             │
│                                      │
│ ⓘ Container height is locked to     │
│   prevent lower thirds from filling  │
│   the entire screen. Adjust element  │
│   positioning within this space.     │
└──────────────────────────────────────┘
```

---

## Updated Canvas Editor

### **Container Height Visualization**

The canvas now displays visual guides for container height constraints:

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│              Video/Presentation Area                │
│                                                       │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ▲ Min Height (18%) - 194px                      │ │
│  │                                                  │ │
│  │ ┌───────────────────────────────────────────┐   │ │
│  │ │ Lower Third Content Area                  │   │ │
│  │ │ (Current: 270px / 25%)                    │   │ │
│  │ │                                            │   │ │
│  │ │ [Verse Text - Dynamic Font Sizing]        │   │ │
│  │ │ [Reference - Dynamic Font Sizing]         │   │ │
│  │ │                                            │   │ │
│  │ └───────────────────────────────────────────┘   │ │
│  │                                                  │ │
│  │ ▼ Max Height (30%) - 324px                      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Bottom Margin (5%)                                  │
└─────────────────────────────────────────────────────┘
```

**Visual Indicators:**

- Gray shaded area shows container height constraints
- Blue border indicates current container bounds
- Green guides show min/max height limits
- Red warning if user tries to exceed limits

### **Font Size Preview**

When editing text elements, show real-time preview of font size scaling:

```
Preview: "For God so loved the world" dynamically fitting container

Optimizing Area (Large Container):
For God so loved the world
(Perfect fit at 64px)

Optimizing Area (Mid Container):
For God so loved the
world
(Perfect fit at 48px)

Optimizing Area (Small Container/Longer Text):
For God so loved
the world that he
gave his one and
only Son
(Perfect fit at 32px)
```

---

## Updated Workflows

### **Creating a New Template with Font Sizing**

**Step 1-4:** Same as before (template details, background, text elements)

**Step 5: Configure Font Size Constraints** (NEW)

After adding text elements:

1. Select verse text element
2. In Properties Panel, go to "Font Size Constraints"
3. Set Minimum Font Size (e.g., 28px)
4. Set Maximum Font Size (e.g., 56px)
5. Enable "Dynamic Scaling" toggle
6. Enable "Animate Font Size on Entry" toggle
7. Set Line Clamp (e.g., 5 lines max)
8. Set Overflow Handling (Wrap, Truncate, or Scale)
9. Preview shows how text will scale at different lengths
10. Repeat for reference text and other text elements

**Step 6: Test Font Sizing**

1. Click "Preview" button
2. Enter test verses of different lengths or adjust container dimensions:
   - Notice how text expands to comfortably use available width and height limit.
   - Long passages stringently respect the exact physical boundary limit rather than counting arbitrary line counts.
3. Verify font sizes scale appropriately to fill the area efficiently.
4. Verify text fits neatly within container height constraint.
5. Return to editor to adjust if needed

**Step 7: Save Template**

Template now includes font size constraints for all text elements.

### **Customizing Existing Template with Font Sizing**

1. Open template from library
2. Select text element to customize
3. Adjust font size constraints in Properties Panel
4. Preview changes with sample text
5. Save as new template or update existing

---

## Advanced Font Sizing Features

### **1. Font Size Presets**

Pre-defined font size ranges for common element types:

```typescript
const fontSizePresets = {
  verseText: {
    min: 28,
    max: 56,
    label: "Verse Text (Primary)",
  },
  referenceText: {
    min: 20,
    max: 32,
    label: "Reference (Secondary)",
  },
  churchName: {
    min: 16,
    max: 28,
    label: "Church Name",
  },
  metadata: {
    min: 14,
    max: 24,
    label: "Metadata/Version",
  },
};
```

Users can:

- Click preset to apply default ranges
- Customize ranges after applying preset
- Save custom ranges as new preset

### **2. Font Size Scaling Algorithm**

System calculates optimal font size based on:

```typescript
function calculateFontSize(
  text: string,
  availableWidth: number,
  availableHeight: number,
  minFontSize: number,
  maxFontSize: number,
  fontFamily: string,
  fontWeight: number,
): number {
  // 1. Binary search for optimal font size that maximizes available area
  let low = minFontSize;
  let high = maxFontSize;
  let optimalSize = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    // Measure text dimensions (width and height) at current font size with wrapping
    const { width, height } = measureTextDimensions(
      text,
      mid,
      availableWidth,
      fontFamily,
      fontWeight,
    );

    // 2. If text fits both width and height constraints, try a larger size
    if (width <= availableWidth && height <= availableHeight) {
      optimalSize = mid;
      low = mid + 1;
    } else {
      // 3. If it overflows the area, try a smaller size
      high = mid - 1;
    }
  }

  // 4. Return the maximum size that fits within the available area boundaries
  return optimalSize;
}
```

### **3. Line Wrapping & Truncation**

Control how text behaves when it exceeds available space:

```typescript
enum TextOverflowBehavior {
  WRAP = "wrap", // Wrap to multiple lines
  TRUNCATE = "truncate", // Truncate with ellipsis
  SCALE = "scale", // Scale down font size
}
```

Users can configure per element:

- **Wrap:** Text wraps to multiple lines (respects line clamp)
- **Truncate:** Text truncates with "..." if exceeds line clamp
- **Scale:** Font size scales down to fit (respects min font size)

### **4. Responsive Font Sizing**

Font sizes scale proportionally across different resolutions:

```typescript
function getResponsiveFontSize(
  baseFontSize: number,
  baseResolution: { width: 1920; height: 1080 },
  targetResolution: { width: number; height: number },
): number {
  const scaleFactor = targetResolution.height / baseResolution.height;
  return Math.round(baseFontSize * scaleFactor);
}
```

Example:

- 1920×1080: Verse text 56px
- 1280×720: Verse text 37px (56 × 0.67)
- 3840×2160: Verse text 112px (56 × 2.0)

---

## Validation & Constraints

### **Font Size Validation**

System validates font size constraints:

1. **Minimum < Maximum:** Min font size must be less than max
2. **Reasonable Range:** Min 14px, Max 120px
3. **Consistency:** Similar elements have similar ranges
4. **Contrast:** Text color has sufficient contrast with background at min font size

### **Container Height Validation**

System enforces container height constraints:

1. **Min/Max Locked:** Users cannot change these values
2. **Visual Warning:** Red border if content exceeds max height
3. **Auto-Adjustment:** If content too tall, system suggests:
   - Reduce font size max
   - Increase line clamp
   - Change overflow handling to "scale"

---

## Animation with Font Sizing

### **Font Size Animation During Entry**

When "Animate Font Size on Entry" is enabled:

```typescript
animation: {
  type: 'fadeIn',
  duration: 400, // ms
  delay: 0,
  easing: 'ease-out',
  animateFontSize: true // NEW
}
```

Animation sequence:

1. Text element fades in (opacity 0 → 1)
2. Font size animates from 0 to target size
3. Text reflows smoothly as font size changes
4. All animations synchronized for polished appearance

Example timeline:

```
0ms:    Opacity 0%, Font Size 0px
100ms:  Opacity 25%, Font Size 14px
200ms:  Opacity 50%, Font Size 28px
300ms:  Opacity 75%, Font Size 42px
400ms:  Opacity 100%, Font Size 56px (complete)
```

---

## Real-Time Preview

### **Font Sizing Preview Panel**

New panel shows how text will render at different content lengths:

```
┌────────────────────────────────────────┐
│ AREA-BASED FONT PREVIEW                │
├────────────────────────────────────────┤
│ Test intersection bounding box limits  │
│                                        │
│ Maximizing Area Fill:                  │
│ ┌────────────────────────────────────┐ │
│ │ John 3:16                          │ │
│ │ (Dynamically calculated based on   │ │
│ │ container max-width: 72px)         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Scaling Output Interactively:          │
│ ┌────────────────────────────────────┐ │
│ │ For God so loved the world that    │ │
│ │ he gave his one and only Son       │ │
│ │ (Precise bound scale fit: 48px)    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Respecting Height Contraints:          │
│ ┌────────────────────────────────────┐ │
│ │ For God so loved the world that    │ │
│ │ he gave his one and only Son, so   │ │
│ │ that everyone who believes in him  │ │
│ │ shall not perish but have eternal  │ │
│ │ life. (Max area fitting: 28px)     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ [Enter custom text/resize canvas...]   │
│ ┌────────────────────────────────────┐ │
│ │ [Live preview updates as area      │ │
│ │ intersects boundary contraints]    │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Export & Configuration

### **Template Configuration Export**

When exporting template, includes font size constraints:

```json
{
  "id": "template-001",
  "name": "Classic Solid",
  "containerMinHeight": 18,
  "containerMaxHeight": 30,
  "elements": [
    {
      "id": "verse-text",
      "type": "text",
      "name": "Verse Text",
      "fontSize": 48,
      "fontSizeMin": 28,
      "fontSizeMax": 56,
      "fontSizeDynamic": true,
      "fontSizeAnimated": true,
      "lineClamp": 5,
      "textOverflow": "wrap"
    },
    {
      "id": "reference",
      "type": "text",
      "name": "Reference",
      "fontSize": 28,
      "fontSizeMin": 20,
      "fontSizeMax": 32,
      "fontSizeDynamic": true,
      "fontSizeAnimated": true,
      "lineClamp": 2,
      "textOverflow": "truncate"
    }
  ]
}
```

---

## Performance Considerations

### **Font Size Calculation**

- Calculate optimal font size on content change (debounced 100ms)
- Cache font measurements for common sizes
- Use requestAnimationFrame for smooth animations
- Lazy-load font size preview only when needed

### **Memory Usage**

- Store font metrics cache (max 100 entries)
- Clear cache when fonts change
- Limit animation frame rate to 60fps

---

## Accessibility

### **Font Size Accessibility**

- Minimum font size respects accessibility guidelines (14px minimum)
- Sufficient contrast maintained at minimum font size
- Line height automatically adjusted for readability
- Screen reader announces font size changes

### **Container Height Accessibility**

- Container height clearly labeled and explained
- Visual indicators for min/max constraints
- Keyboard navigation for all controls
- Focus indicators visible

---

## Summary

The updated Lower Third Builder now includes:

✅ **Container Height Constraints** - Locked to 18%-30% to prevent full-screen fill  
✅ **Dynamic Font Sizing** - Text automatically scales between min/max based on content  
✅ **Font Size Presets** - Quick-apply ranges for common element types  
✅ **Real-Time Preview** - See how text scales at different lengths  
✅ **Responsive Scaling** - Font sizes scale across different resolutions  
✅ **Animation Support** - Font sizes animate smoothly during entry  
✅ **Validation** - System enforces constraints and validates configurations  
✅ **Accessibility** - Full keyboard navigation and screen reader support

These improvements ensure professional typography while maintaining flexibility and ease of use.
