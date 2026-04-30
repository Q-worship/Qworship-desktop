# Version 1.0.0 Packaged Baseline vs Current Source Comparison

## Summary

The current repository is not a preserved version 1.0.0 source tree. However, the packaged 1.0.0 Windows release provides authoritative baseline evidence that can be used to drive a controlled parity reconstruction.

## Packaged baseline evidence extracted so far

| Source | Finding |
|---|---|
| Packaged `package.json` extracted from `app.asar` | Client version is `1.0.0`. |
| Packaged `dist-electron/main.js` | Includes offline-Vosk speech pipeline status strings: `Listening with offline Vosk.`, `Resolving offline Bible command...`, and `Streaming offline transcript...`. |
| Packaged frontend bundle `dist/assets/index-*.js` | Includes `Offline Data Ready`, `All resources are now available for zero-latency offline use.`, `Detected Verses`, and `Recent Detections`. |
| Packaged frontend bundle `dist/assets/index-*.js` | Does **not** currently show the exact string `Loading your Bible data`; instead it still uses an older library-sync loading copy. |

## Current source comparison findings

| Area | Current source finding | Reconstruction meaning |
|---|---|---|
| `apps/client/package.json` | Current source version is `1.0.1`. | Current metadata must not be treated as parity-safe. |
| `apps/client/electron/services/voskSpeechProvider.ts` | Contains the same offline-Vosk status strings seen in the packaged 1.0.0 main bundle. | At least part of the speech-status layer remains aligned with the packaged baseline. |
| `apps/client/src/app/App.tsx` | Contains `Offline Data Ready. All resources are now available for zero-latency offline use.` | The offline-ready readiness text remains aligned with packaged 1.0.0. |
| `apps/client/src/lib/startupLoaderState.ts` | Contains `Loading your Bible data`. | This appears to be newer than the packaged 1.0.0 frontend bundle and should not be assumed to be parity-safe. |
| `apps/client/src/app/LiveConsoleDesktopFrame.tsx` and several other patched UI files | Were part of the recent regression cycle described in task history. | These are prime candidates for parity restoration or revert review rather than incremental patching. |

## Key file history signals

| File | Relevant history observed |
|---|---|
| `apps/client/src/hooks/useLocalWhisper.ts` | History points to `3c88c4b feat(hfb): replace cloud STT with local whisper.cpp for offline hands-free bible`. |
| `apps/client/src/lib/offlineBibleEngine.ts` | Recent history includes `e156430` plus earlier parser-related commits `65c70ae` and `c3f902f`. |
| `apps/client/src/features/dashboard/hooks/useBibleRAMCache.ts` | History includes `d7690f3`, `3172e60`, `05c47c3`, and `f999d4b`, indicating repeated Bible-data-path evolution. |
| `apps/client/src/app/App.tsx` | History reaches back through `d40c7eb`, `05c47c3`, and earlier sync-related commits, making it a likely parity-sensitive file. |
| `apps/client/src/features/dashboard/components/OnScreenBibleEditor.tsx` | History includes `d7690f3`, `3172e60`, and `05c47c3`, which suggests offline Bible path changes likely affected it. |

## Reconstruction interpretation

The safest initial reconstruction path is:

1. Use the packaged 1.0.0 bundle as the authority for shipped behavior.
2. Treat recently patched HFB, startup-loader, translation, and preview-sync files as parity-risk areas.
3. Restore parity before making any accuracy improvements.
4. Preserve all recovery notes and branch work under `reconstruction/v1.0.0-parity`.

## Working-tree condition on reconstruction start

The reconstruction branch was created from a repository state that is **heavily dirty**, with a large number of untracked scripts, runtime artifacts, screenshots, logs, and multiple parity-sensitive application files appearing outside a clean committed baseline. This means the reconstruction process must treat the current workspace as an unstable development state rather than a trustworthy baseline.

| Implication | Meaning |
|---|---|
| Current working tree is not clean | Blindly optimizing the present files would risk carrying regressions forward. |
| Recovery notes and branch isolation are necessary | Parity restoration must proceed deliberately and be documented at each step. |
| Packaged 1.0.0 artifacts remain the strongest authority | The shipped bundle is more trustworthy than the present working tree for parity decisions. |

## Corrected packaged baseline source candidate

A stronger packaged **version 1.0.0** artifact source has now been confirmed at `apps/client/release-hfb-mode-fix-v2`.

| Candidate path | Key finding |
|---|---|
| `apps/client/release` | Contains an earlier 1.0.0 installer dated **25/04/2026 10:49:24** with many runtime-capture logs around iterative fixes. |
| `apps/client/release-hfb-mode-fix-v2` | Contains a later installer named **`Qworship Live Console Setup 1.0.0.exe`** dated **28/04/2026 20:49:13**, with version metadata **1.0.0 / 1.0.0**, a packaged `win-unpacked/resources/app.asar` dated **28/04/2026 21:31:11**, and a cleaner artifact set consistent with a deliberate restoration package. |

## Interim interpretation

Until contradicted by deeper bundle comparison, `release-hfb-mode-fix-v2` should be treated as the **leading packaged 1.0.0 reconstruction authority**. The earlier `release` folder remains useful as supporting evidence, but not necessarily as the best baseline source for continued parity work.
