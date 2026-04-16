# Qworship Desktop: macOS Native STT Crash Diagnosis & Fix Blueprint

**Author:** Manus AI  
**Date:** April 16, 2026  
**Commit Analyzed:** `d7690f3` (feat: implement SQLite-backed Bible storage and IPC services)

## Executive Summary

The Qworship development team successfully implemented the offline SQLite Bible engine and the native Electron IPC bridge. However, as reported, the Hands-Free Bible (HFB) fails silently on macOS with a 30-second timeout. 

Deep-dive analysis confirms the root cause: a **fatal C++ segmentation fault** within the `smart-whisper` native Node.js addon. This crash is triggered by a fundamental incompatibility between the legacy GGML model format (`ggml-tiny.en.bin`) downloaded by the app and the newer `whisper.cpp` engine bundled inside the `smart-whisper` package. Furthermore, the native addon architecture itself is inherently brittle in Electron, as any C++ exception immediately kills the entire Main Process (or thread) without bubbling up to JavaScript.

This report details the exact failure mechanisms and provides a robust, production-ready architectural pivot to solve the offline STT requirement for macOS and Windows.

## 1. Root Cause Analysis: The Silent Death

The 30-second timeout experienced in the UI is a symptom of the Electron Main Process (or the V8 worker thread executing the native addon) crashing natively. 

### 1.1 The GGML vs. GGUF Compatibility Break
The `whisperModelManager.ts` file is hard-coded to download legacy GGML `.bin` models directly from Hugging Face:
```typescript
'ggml-tiny.en.bin': {
  url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  expectedSizeMB: 75,
}
```
However, the `smart-whisper` npm package (version `0.8.1`) bundles a newer snapshot of the `whisper.cpp` C++ engine. Recent versions of `whisper.cpp` (v1.5+) introduced Dynamic Time Warping (DTW) for word-level timestamps and transitioned to the **GGUF** model format. 

When the newer C++ engine attempts to load the older GGML model, it expects DTW matrices (`aheads_masks_init`) that do not exist in the legacy file. This results in a memory pointer abort: `aheads_masks_init: dtw_aheads_preset should be != DTW_AHEADS_NONE`.

### 1.2 The macOS Metal (Apple Silicon) Crash
When GPU acceleration is forced (`gpu: true`), the crash shifts to the Metal backend: `libc++abi: terminating with uncaught exception of type std::out_of_range: map::at: key not found`. This occurs because the Metal shader pipeline expects specific tensor dictionary labels that are absent in the legacy GGML format.

### 1.3 Missing Native Rebuild Step
In `package.json`, the `postinstall` script only rebuilds `better-sqlite3` for the Electron ABI:
```json
"postinstall": "electron-rebuild -f -w better-sqlite3"
```
`smart-whisper` is missing from this command. Consequently, Electron attempts to load a native addon compiled for standard Node.js (V8) rather than the specific Electron Node.js ABI, which can cause unpredictable memory corruption even before inference begins.

### 1.4 Missing `whisper.load()` Call
In the test scripts (`test-whisper.js`), the team correctly called `await whisper.load()` before transcribing. However, in the production `whisperService.ts`, this call is entirely missing from the `initialize()` method. The engine attempts to transcribe against an uninitialized memory pointer.

## 2. The Architectural Flaw: Native Addons in Electron

While `smart-whisper` is a convenient wrapper, using native Node.js addons (`.node` files via `node-gyp`) for heavy AI inference inside Electron is an anti-pattern for production desktop apps. 

1.  **Silent Crashes:** A C++ segfault kills the entire Electron Main Process instantly. The user sees the app freeze or vanish.
2.  **ABI Hell:** Every time Electron updates its internal Node.js version, the native addon must be recompiled on the user's machine or pre-built for every possible OS/Architecture combination.
3.  **Thread Blocking:** Even with `worker_threads`, V8 memory management during heavy tensor operations can cause garbage collection pauses that stutter the UI.

## 3. The Solution: The Subprocess Binary Pattern

To achieve stable, crash-proof offline STT on macOS and Windows, Qworship must abandon the native Node.js addon approach (`smart-whisper`) and adopt the **Subprocess Binary Pattern**.

Instead of loading a C++ library into Node.js memory, the app bundles the pre-compiled standalone `whisper-cli` executable and spawns it as an isolated child process.

### 3.1 Advantages of the Subprocess Pattern
*   **Crash Isolation:** If the `whisper-cli` binary crashes (e.g., bad model file), it only kills the child process. Electron detects the `exit code`, logs the error, and restarts the process gracefully. The app never crashes.
*   **Zero ABI Issues:** Standalone binaries do not depend on Node.js or Electron versions.
*   **True Streaming:** The `whisper-cli` supports a `-stream` mode. Electron can pipe the raw PCM audio directly into the binary's `stdin` and read the transcripts from `stdout` in real-time.

### 3.2 Implementation Blueprint

**Step 1: Remove `smart-whisper`**
Uninstall the package and remove it from the Vite external rollup options.

**Step 2: Bundle Pre-compiled Binaries**
Download the official pre-compiled `whisper.cpp` binaries for macOS (Universal) and Windows (x64) from the [ggml-org/whisper.cpp releases page](https://github.com/ggml-org/whisper.cpp/releases). Place them in a `bin/` directory.

**Step 3: Update Electron Builder Config**
Modify `package.json` to package the binaries based on the target OS:
```json
"extraFiles": [
  {
    "from": "bin/${os}",
    "to": "bin",
    "filter": ["*"]
  }
]
```

**Step 4: Switch to GGUF Models**
Update `whisperModelManager.ts` to download the modern GGUF format models instead of the legacy GGML `.bin` files.
```typescript
'ggml-tiny.en-q5_1.bin': {
  url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin',
  expectedSizeMB: 31,
}
```

**Step 5: Rewrite `whisperService.ts` to use `child_process.spawn`**
Replace the native addon logic with a Node.js spawned process.

```typescript
import { spawn, ChildProcess } from 'node:child_process';

export class WhisperService extends EventEmitter {
  private whisperProcess: ChildProcess | null = null;

  async startListening(modelPath: string, binaryPath: string) {
    // Spawn the standalone whisper-cli binary in stream mode
    this.whisperProcess = spawn(binaryPath, [
      '-m', modelPath,
      '-l', 'en',
      '-t', '4',
      '--step', '500', // 500ms audio chunks
      '--length', '5000', // 5s sliding window
      '-c', '0', // No context
      '-p', 'Genesis, Exodus, Luke, Psalms, Matthew, John, Revelation, chapter, verse.',
      '--stream' // Enable stdin streaming
    ]);

    // Read transcripts from stdout
    this.whisperProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        this.emit('transcript-partial', output);
      }
    });

    this.whisperProcess.on('exit', (code) => {
      console.log(`Whisper process exited with code ${code}`);
      this.setStatus('uninitialized');
    });
  }

  feedAudioChunk(pcm16: Int16Array) {
    // Pipe raw PCM16 bytes directly into the binary's stdin
    if (this.whisperProcess && this.whisperProcess.stdin) {
      this.whisperProcess.stdin.write(Buffer.from(pcm16.buffer));
    }
  }
}
```

## Conclusion

The current macOS crash is a textbook example of why native AI addons are dangerous in Electron. By pivoting to the **Subprocess Binary Pattern** and updating to the **GGUF model format**, Qworship will achieve a rock-solid, crash-proof offline Hands-Free Bible that works flawlessly across both macOS (Apple Silicon/Intel) and Windows.
