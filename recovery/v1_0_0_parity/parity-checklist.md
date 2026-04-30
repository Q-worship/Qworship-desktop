# Version 1.0.0 Parity Validation Checklist

This checklist defines the minimum behaviors that must be validated before the reconstruction branch can be treated as a preserved version 1.0.0-equivalent baseline.

## Core parity targets

| Area | Required parity behavior | Validation status |
|---|---|---|
| Hands-Free Bible command resolution | Voice command resolves in sub-second fashion without the recent 2–3 second delay. | Pending |
| HFB panel synchronization | Live Transcript, Detected Verses, chapter panel, Preview/Live, and Recent Detections update together. | Pending |
| Translation switching | KJV, NKJV, NIV, ESV, AMP, and MSG switch immediately without blank states. | Pending |
| Startup readiness message | Shows `Offline Data Ready` readiness state with the zero-latency offline readiness text. | Pending |
| Startup loading behavior | Must be validated against the packaged 1.0.0 baseline rather than assumed from the current 1.0.1 source. | Pending |
| On-screen Bible behavior | Chapter and verse projection must remain fast and aligned with Live Console preview/output updates. | Pending |
| NDI baseline | Existing native load and smoke-test behavior must still hold after parity restoration. | Pending |

## Known parity-risk files

| File | Reason it is parity-sensitive |
|---|---|
| `apps/client/src/hooks/useLocalWhisper.ts` | Recent HFB pipeline regression area. |
| `apps/client/src/app/LiveConsoleDesktopFrame.tsx` | Recent preview/live sync and chapter projection regression area. |
| `apps/client/src/features/dashboard/hooks/useBibleRAMCache.ts` | Recently rewritten preload behavior. |
| `apps/client/src/lib/sharedBibleEngine.ts` | Recently patched for RAM-first lookup behavior. |
| `apps/client/src/lib/offlineBibleEngine.ts` | Recently patched parser and Bible lookup behavior. |
| `apps/client/src/components/DesktopStartupLoader.tsx` | Recently scaled and copy-adjusted loader UI. |
| `apps/client/src/lib/startupLoaderState.ts` | Recently changed loader stage copy. |
| `apps/client/src/app/App.tsx` | Recently changed startup gating and readiness behavior. |
| `apps/client/src/features/dashboard/components/OnScreenBibleEditor.tsx` | Recently patched version-switching behavior. |
| `apps/client/electron/services/voskSpeechProvider.ts` | Recent live-audio threshold changes to fix listening state. |

## Working discipline

No HFB accuracy improvement is allowed into this branch until the items above are validated as parity-safe or the remaining gaps are explicitly documented.
