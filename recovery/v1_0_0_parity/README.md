# Version 1.0.0 Parity Reconstruction Notes

This directory was created on the `reconstruction/v1.0.0-parity` branch to hold the controlled recovery work for restoring Qworship Live Console to version 1.0.0 parity before any future HFB optimization work.

## Confirmed authoritative baseline evidence

| Evidence | Status | Notes |
|---|---|---|
| Windows installer `apps/client/release/Qworship Live Console Setup 1.0.0.exe` | Confirmed | Installer metadata reports ProductVersion 1.0.0. |
| Packaged Windows app bundle `apps/client/release/win-unpacked/resources/app.asar` | Confirmed | Contains packaged application code and assets for the shipped 1.0.0 build. |
| Packaged Windows unpacked runtime `apps/client/release/win-unpacked/resources/app.asar.unpacked` | Confirmed | Contains unpacked runtime dependencies and bundled Bible assets referenced by the app bundle. |
| Packaged macOS 1.0.0 artifacts in Downloads | Confirmed | Additional packaged evidence exists, but not a standalone source workspace. |
| Clean standalone 1.0.0 source repository / tag / branch | Not confirmed | No preserved local 1.0.0 source snapshot has been found so far. |

## Extracted packaged baseline findings

A local extraction of key files from the packaged 1.0.0 `app.asar` confirmed the following:

| Packaged file | Finding |
|---|---|
| `package.json` | Packaged client version is `1.0.0`. |
| `dist-electron/main.js` | Contains offline Vosk speech status strings such as `Listening with offline Vosk.`, `Resolving offline Bible command...`, and `Streaming offline transcript...`. |
| `dist/assets/index-*.js` | Contains UI strings including `Offline Data Ready`, `All resources are now available for zero-latency offline use.`, `Detected Verses`, and `Recent Detections`. |

## Current source drift already confirmed

| Area | Current source state | Packaged 1.0.0 state | Reconstruction implication |
|---|---|---|---|
| Client package version | `1.0.1` | `1.0.0` | Version metadata must not be treated as parity-safe. |
| Startup loader detail copy | `Loading your Bible data` exists in source | Packaged 1.0.0 frontend bundle does not currently show that exact string | Loader copy appears to have drifted after 1.0.0 and must be validated carefully. |
| Offline-ready readiness text | Present in current source as `Offline Data Ready. All resources are now available for zero-latency offline use.` | Present in packaged 1.0.0 frontend bundle | This is a parity anchor and should be preserved. |
| Offline Vosk status strings | Present in current source | Present in packaged 1.0.0 main-process bundle | Speech-status behavior appears at least partially aligned. |

## Working rule for this branch

The goal of this branch is not to continue 1.0.1 patching. The goal is to restore and validate version 1.0.0 parity first. Any future HFB changes must be considered only after this branch has a preserved parity baseline and a documented validation pass.
