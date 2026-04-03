# QWorship-v2 Expanded Folder Structure Guide

To ensure clean isolation between different product domains (Public Marketing Web vs. Authenticated Dashboard vs. Legal Documentation), the `apps/client/src/pages/` directory is partitioned into specific routing segments.

## 1. Top-Level Page Segments

### `pages/web/`
Contains all **Unauthenticated Public Marketing** pages.
- `Home.tsx` (The landing page)
- `About.tsx`
- `Pricing.tsx`

### `pages/dashboard/`
Contains all **Authenticated Workspace** wrappers and root layouts.
- `Dashboard.tsx` (Main workspace entry point)
- Layout containers that mount the Sidebar and Topbar.

### `pages/docs/`
Contains all **Legal & Support Documentation** pages.
- `DocsPage.tsx`
- `PrivacyPolicy.tsx`
- `EndUserLicense.tsx`
- `RefundPolicy.tsx`

### `pages/auth/`
Contains all entry **Authentication Routes**.
*(Note: Active business logic and tiny form components for these pages live inside `features/auth/`.)*

---

## 2. Feature-Sliced Design (FSD) Deep Dive

Features are highly cohesive, business-logic-heavy modules that are **injected** into the Pages listed above. 

### `features/{feature-name}/`
- **`components/`**: Tiny, highly isolated chunks of UI (e.g., `<SignInForm />`, `<DuplicateEmailModal />`). These components NO LONGER span 800+ lines.
- **`pages/`**: The composed feature page that combines the micro-components and exports them back to the root `App.tsx` router.
- **`store.ts`**: (Optional) The Zustand state manager.

## 3. Strict Decoupling Rules
1. A component in `pages/web/` **MAY NOT** import a component from `pages/dashboard/`.
2. A component in `features/bible-reader/` **MAY NOT** directly import components from `features/song-manager/` (use shared modules or global stores if necessary).
3. If an 800-line monolithic file is migrated from the legacy repository, it MUST immediately be broken down into `<MicroComponents />` within the `features/*/components/` folder before being wired to the router.
