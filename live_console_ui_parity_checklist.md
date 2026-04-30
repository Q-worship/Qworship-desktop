# Live Console UI Parity Checklist

## Purpose

This checklist defines the **non-negotiable UI continuity rules** for the Qworship Live Console Desktop Application. The goal is to ensure that every migrated Live Console route remains visually and structurally consistent with the existing desktop application rather than drifting into a separate design language.

## Core parity rules

| Rule | Requirement | Status target |
|---|---|---|
| Desktop chrome continuity | Reuse the established Qworship dark-purple header, navigation rhythm, borders, and panel framing | Required |
| Operator workspace continuity | Prefer split workspaces, side rails, dense control panels, and preview-adjacent actions over hero-style pages | Required |
| Surface continuity | Keep primary surfaces within the existing `#1a0f2e`, `#2a1f4b`, and purple-accent family | Required |
| Control density continuity | Keep key actions visible near the active work area with concise helper text and low navigation overhead | Required |
| Module reuse continuity | Reuse the strongest existing module surfaces before inventing new shell patterns | Required |
| Bible workflow continuity | Preserve the editor-to-preview-to-projection rhythm in Bible-facing routes | Required |
| Projection continuity | Keep lower-third and main-presentation controls visually connected to the same desktop design family | Required |
| Settings continuity | Treat settings as operator tooling, not as onboarding or marketing content | Required |

## Module validation table

| Module | Current parity approach | Primary existing UI references | Validation result |
|---|---|---|---|
| Bible Reader shell | Desktop-derived frame with route actions and module notes | `BibleWorkspace.tsx`, `HandsfreeBibleWidget.tsx`, dashboard chrome | Pass |
| Offline Songbook shell | Desktop-derived frame with guided reuse notes | Songbook modal/editor patterns, dashboard chrome | Pass |
| Assets shell | Desktop-derived frame with media-browser reuse focus | Assets/media browser routes, dashboard chrome | Pass |
| Main Presentation shell | Desktop-derived frame with projection action grouping | Main presentation settings, lower-third settings, dashboard chrome | Pass |
| Settings shell | Desktop-derived frame with embedded speech-mode control | Existing settings surfaces, dashboard chrome | Pass |

## Specific anti-drift warnings

| Anti-pattern | Why it is not allowed |
|---|---|
| Standalone gradient splash pages | They do not resemble the current desktop application UI |
| Single oversized marketing-style cards | They lower operator density and make the app feel like a different product |
| Isolated module branding treatments | They weaken product continuity across Bible, songs, assets, projection, and settings |
| Overly sparse layouts with action detours | They add friction to live service operation |

## Current implementation note

The Sprint 1 route shells originally served as architectural placeholders, but their standalone gradient-card layout did **not** match the existing desktop application. The current parity pass replaces that shell language with a **desktop-derived frame** so future Sprint 2 work can build on the correct visual foundation.
