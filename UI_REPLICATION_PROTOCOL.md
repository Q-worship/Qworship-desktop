# QWorship UI Replication Protocol

## Core Mandate
**DO NOT INVENT NEW UI.** The primary objective of the QWorship-v2 migration is pixel-perfect replication of the legacy `QWorship/client` interface into the new Feature-Sliced Design (FSD) architecture. Modularization must only refactor **React Boundaries** and **State Management**, NEVER the UI markup, CSS, or component structure.

## Rules of Engagement

1. **Exact Tailwind Classes & Styling:** 
   When extracting legacy views (e.g., from `QworshipHome.tsx`), copy the EXACT `className` and `style` attributes. 
   - Retain exact color hexes (e.g., `bg-[#1a0f2e]`, `border-[#8356F3]`, `bg-[#2a1f4b]`).
   - Do not "approximate" sizing. If the original used `w-[320px]`, keep `w-[320px]`.
   - Do not simplify CSS gradients or custom scrollbars.

2. **DOM Hierarchy and Structural Wrappers:**
   When breaking monolithic files into FSD pages (e.g., `features/bible-reader/components/BibleWorkspace.tsx`), you MUST recreate the exact contextual `div` wrappers that originally housed the view.
   - Overlooking parent wrappers (`flex`, `h-full`, `overflow-y-auto`) will break the absolute positioning of child layouts.
   - **Workflow:** 
     1. Search `QWorship/client/src/pages/QworshipHome.tsx` for the desired feature block.
     2. Copy the full parent `div` DOM subtree recursively.
     3. Extract into the new FSD component, preserving the HTML structure layer-by-layer.

3. **State Decoupling vs. Visual Coupling:**
   - **DO:** Move massive `useState` definitions into highly typed isolated Zustand stores (`features/*/store.ts`).
   - **DO NOT:** Rewrite the JSX conditional renders if it visually alters empty states, active tab transitions, or layout loading patterns. The user relies on those specific visual cues from the legacy build.

4. **Absolute/Floating Component Dependencies:**
   - Many widgets (like `HandsfreeBibleWidget`) depend on floating fixed logic (`style={{ left: widgetPosition.x, top: widgetPosition.y }}`) mapped against drag-events on the DOM.
   - When pulling these out, retain the floating wrapper architecture and pass strictly typed position handlers. 

5. **Reusable FSD Structure:**
   - **Layout Wrappers (`shared/ui/layouts`)**: The underlying "App Shell" layout spanning the Dashboard Sidebar -> Main Panel must be 1:1 with the grid established in `QworshipHome`.
   - **Feature Pages (`features/{feature}/pages`)**: These replace the bulky conditional switch-statements in the original app. They must mount the precise flex containers that the original switch cases rendered.
   - **Feature Components (`features/{feature}/components`)**: Extracted tools, heavily localized without global UI pollution.

---
**Agent Directive:** Before scaffolding any new component going forward, always `view_file` on the corresponding section inside the original `QWorship` repository. Copy, paste, and wire dependencies—do not rewrite visual CSS from scratch.
