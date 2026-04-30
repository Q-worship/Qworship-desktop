# Version 1.0.0 Parity Validation Status

## Current confidence level

**Reconstruction confidence:** Low to moderate.

The work has now established a controlled reconstruction lane and authoritative packaged baseline evidence, but it has **not yet proven full 1.0.0 behavioral parity** inside a rebuilt source state.

## What is already validated

| Validation item | Status | Notes |
|---|---|---|
| Real packaged Windows 1.0.0 release artifact exists | Validated | Installer metadata confirms version 1.0.0. |
| Packaged app bundle contains authoritative shipped code and assets | Validated | `app.asar` and `app.asar.unpacked` are present and inspectable. |
| Packaged 1.0.0 frontend includes `Offline Data Ready` and the zero-latency readiness text | Validated | Extracted frontend bundle confirms the readiness copy. |
| Packaged 1.0.0 main-process bundle includes offline-Vosk runtime status strings | Validated | Extracted main-process bundle confirms speech-pipeline status text. |
| Controlled reconstruction branch exists | Validated | Work is isolated under `reconstruction/v1.0.0-parity`. |

## What is not yet validated

| Validation item | Status | Notes |
|---|---|---|
| Full Hands-Free Bible end-to-end parity in source form | Not yet validated | No rebuilt source baseline has been executed and compared yet. |
| Preview/live synchronization parity | Not yet validated | Recent regression files still require targeted restoration review. |
| Translation-switching parity across all Bible versions | Not yet validated | Requires runtime verification after restoration steps. |
| Startup loading-copy parity | Not yet validated | Current source appears to differ from packaged 1.0.0 loader copy. |
| Zero-regression claim | Not yet validated | Cannot be claimed until runtime parity checks are completed. |

## Interpretation

The reconstruction process has genuinely started, but it is still in the **baseline establishment** stage rather than the **parity proven** stage. The next safe action is to begin targeted restoration of the highest-risk files using the packaged 1.0.0 bundle and commit history as the authority.

## First controlled restoration pass completed

The first restoration pass focused only on **low-risk startup-loader parity drift** rather than runtime logic changes.

| Restored area | Result |
|---|---|
| Loader headline structure | The startup loader can now switch between `Synchronizing Library` and `Offline Data Ready`, which mirrors the packaged 1.0.0 headline pattern more closely. |
| Loader subtitle copy | The active startup subtitle now uses the packaged 1.0.0 phrasing `Downloading datasets for zero-latency performance.` during preload. |
| Ready-state subtitle copy | The completion message now uses the packaged 1.0.0 phrasing `All resources are now available for zero-latency offline use.` without the extra prefixed sentence previously present in source. |
| Bible RAM preload progress copy | The preload callback now emits the packaged generic synchronization wording instead of newer per-dataset phrasing. |

## Updated confidence after first restoration pass

**Reconstruction confidence:** Moderate for loader-copy parity, still low for broader behavioral parity.

This means the branch now aligns more closely with the packaged 1.0.0 startup messaging, but the larger parity targets—especially HFB timing, verse detection flow, preview/live synchronization, and translation behavior—remain unproven and still require targeted restoration and runtime validation.

## Second controlled restoration pass completed

The second restoration pass targeted the **Hands-Free Bible lookup gate** inside `useLocalWhisper.ts`, because the working tree had added stricter offline-provider rejection logic than the simpler committed parse-only guard.

| Restored area | Result |
|---|---|
| Offline-provider pre-filter rejection | Removed the extra `Ignoring under-specified offline transcript` gate so valid spoken references are not rejected before parsing. |
| Confidence-threshold rejection | Removed the added low-confidence threshold branch and restored the simpler `parsedReference` guard used by the earlier source baseline. |
| Parse failure handling | Preserved a clear failure path with `Could not parse reference` and `Command unclear` so invalid phrases still fail cleanly. |

## Interpretation after second pass

This pass moves the HFB intake flow closer to the less restrictive baseline by allowing the parser to attempt more spoken references before rejecting them. It improves parity confidence for **voice-command acceptance**, but it does **not yet prove** end-to-end parity for verse detection, wake/sleep behavior, translation switching, or downstream live presentation synchronization.

## Third controlled restoration pass completed

The third restoration pass targeted **Hands-Free Bible microphone-error behavior**, because the current source had drifted from the packaged version 1.0.0 user-facing failure copy.

| Restored area | Result |
|---|---|
| Microphone error command text | Restored to `Failed to access microphone`, matching the packaged 1.0.0 behavior instead of the newer generalized startup-failure message. |
| Error toast title | Restored to `Microphone Error`, replacing the newer broader `Hands-Free Bible Error` title. |
| Error toast description | Restored to the packaged microphone-permission guidance `Please allow microphone access and try again.` |
| Console error label | Restored to `Microphone access failed` for closer parity with the shipped bundle. |

## Interpretation after third pass

This pass improves parity confidence for the **failure-mode behavior** of Hands-Free Bible startup. The reconstruction branch now aligns more closely with the packaged 1.0.0 experience when microphone initialization fails. Full parity is still not proven for downstream live synchronization, translation switching across projected content, and end-to-end verse navigation behavior.

## Fourth controlled restoration pass completed

The fourth restoration pass targeted **preview/live Bible projection synchronization** in `useBibleProjectionStore.ts`.

| Restored area | Result |
|---|---|
| Sync response handling | Restored to apply the full synchronization payload unconditionally instead of updating only when `payload.currentVerse` was present. |
| Clear-state propagation | A projection clear can now propagate across windows during synchronization, rather than being silently ignored. |
| Version-only propagation | Bible-version and projection-state updates can now synchronize even when no current verse object is present. |
| Validation evidence | Source validation confirmed the `if (payload.currentVerse)` guard is gone and the full state fields are now applied in `SYNC_RESPONSE`. |

## Interpretation after fourth pass

This pass improves confidence that preview and live windows will converge on the same Bible projection state after synchronization requests, especially in clear-state and version-only scenarios. Full runtime parity is still not proven for all cross-window presentation flows, but this removes a concrete synchronization gate that could leave windows out of sync.

## Fifth restoration pass: translation-switching re-sync

The fifth restoration pass targeted **translation-switching parity** in `useHandsfreeBible.ts`.

| Restored area | Result |
|---|---|
| Shared re-sync helper | Added `syncProjectedVerseVersion()` so version changes can reproject the currently active scripture state instead of only changing selector metadata. |
| Voice-triggered version changes | `onVersionChange` now updates the HFB version and re-syncs the currently projected scripture payload. |
| Manual version changes | `handleSetBibleVersion` now re-syncs the currently projected scripture payload instead of changing only the selected version state. |
| Live-window refresh | When a verse is already projected, translation changes now post a refreshed `BIBLE_VERSE_DISPLAY` message to the live window with the updated version and text. |
| Projected-state refresh | The active reference label, projected verse text, and HFB projected state are all refreshed from the current verse context and widget verse data. |

## Interpretation after fifth pass

This pass improves confidence that **translation switching** now affects the projected scripture payload itself, not just the selected version label. Confidence is **moderate** from source validation, but runtime validation is still needed to prove that preview, live, and local projected scripture all refresh exactly like the packaged version 1.0.0 behavior.

## Linux sandbox runtime attempt started

An initial Linux sandbox launch attempt has now begun. The first direct run from the mounted Windows workspace failed before application startup because the existing Windows-generated `vite` shim produced `Permission denied` under Linux. A direct Linux reinstall on the mount also failed with an `EIO` error while recreating `node_modules/.pnpm`, so a fresh Linux-local clone was created at `/home/ubuntu/qworship-runtime-run` for runtime work.

That Linux-local clone successfully completed `pnpm install --force` after the sandbox was provisioned with `build-essential` and `pkg-config`, and the native desktop dependencies rebuilt successfully, including `smart-whisper`. A headless Electron launch using `xvfb-run -a pnpm dev:desktop` now builds `dist-electron/main.js`, `preload.cjs`, and `whisperWorker.cjs`, but the Electron process still exits immediately after startup with DBus-related bus warnings, so a stable interactive Electron session has not yet been achieved in Linux.

A renderer-only fallback validation path was then started using a temporary renderer-only Vite configuration in the Linux-local clone. This exposed that the clean clone did not yet contain all of the current uncommitted working-tree files from the mounted Windows workspace, so the runtime clone is being aligned incrementally from the authoritative mounted source. At the current stopping point, the renderer still does not reach an interactive parity-validation state. The latest unresolved browser-visible blocker is a missing import for `@/features/mainPresentation/MainPresentationRenderer` from `src/app/LiveConsoleDesktopFrame.tsx`.

## Interpretation after runtime-attempt start

The reconstruction branch is now **partially runnable in Linux at the dependency/build level**, but **not yet runnable enough for behavioral parity checks**. The next work item is to finish aligning the Linux-local clone with the mounted reconstruction workspace until the renderer and, if possible, the Electron shell both stay up long enough to execute the actual parity checklist.
