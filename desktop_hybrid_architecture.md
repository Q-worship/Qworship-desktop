# Q-worship Hybrid Local-First Architecture

## Overview
Q-worship is transitioning from a traditional cloud-dependent web application into a high-performance Offline-First Desktop Application (via Electron/Tauri). 

To ensure our signature features—like the **Hands-Free Bible**—achieve **0ms latency** and work seamlessly with the least possible network dependency, we are adopting a **Hybrid Local-First Data Architecture**. This document serves as the permanent reference guide for mapping this offline-first strategy.

## 1. The Architectural Data Split
System data is strictly segregated into two layers based on latency constraints and mutability.

### A. The Cloud Data Layer (MongoDB Atlas)
The centralized MongoDB server is reserved *only* for data that inherently requires network synchronization.
- **Authentication & Licensing:** Login credentials, JWT generation, and billing checks.
- **Dynamic Content Sync:** Background synchronization of user-generated content (e.g., custom lyrics, new song imports, saved media playlists).
- **Telemetry:** Error logs and cross-device usage stats.

### B. The Local Data Layer (IndexedDB / Dexie.js)
This is an ultra-fast, offline database running locally inside the user's browser (or Desktop wrapper). The React frontend queries this layer immediately, bypassing the MongoDB network requests to achieve 0ms search latency. Since IndexedDB mirrors MongoDB's NoSQL JSON document structure, the data mapping is a 1:1 match.
- **Heavy Static Data:** The complete text of all supported Bible translations (approx. 4-5MB per version). Since the Bible is static, it never needs to be repeatedly fetched from the cloud.
- **Local State & Caching:** Fast layout preferences and immediate media caching rules.

## 2. Technical Stack & Data Flow Workflow

To maintain a pure FSD (Feature-Sliced Design) architecture, we will execute the Local-First approach universally for both Web and Desktop platforms using **IndexedDB (via Dexie.js)**. 

### Phase 1: Hydration (Initial App Launch)
1. **Initial Boot Check:** On login, the app checks IndexedDB using Dexie.js to see if core assets (e.g., `{ version: "kjv" }`) exist.
2. **Bulk Download:** If missing, a single request is made to the MongoDB Cloud API. The web app downloads the full JSON translation chunk (~4MB) and writes it persistently into the local IndexedDB.

### Phase 2: Zero-Latency Operation (The Engine)
1. **The User Speaks:** The pastor says, *"Turn to John 3:16."*
2. **Intent Chunking:** Using OpenAI's Voice Activity Detection (VAD), the audio is buffered until a natural human pause is detected, forming a clean sentence chunk.
3. **Regex Extraction:** Our blazing-fast local Regex/Fuzzy parser (`fuzzyBibleMatcher`) scans the sentence chunk and deterministically extracts the reference `"John 3:16"` in `<2 milliseconds`. *(ChatGPT is only invoked as an emergency fallback if deterministic parsing absolutely fails).*
4. **Local Retrieval:** The Frontend intercepts the `John 3:16` request and executes a Dexie.js query against the **local IndexedDB** instead of MongoDB.
5. **Instant Projection:** The verse is retrieved from the local SSD and projected to the congregation in **<1ms**.

### Phase 3: The Native Desktop Target
Because frameworks like Electron and Tauri inherently bundle a Chromium/Webkit engine, **IndexedDB works natively out of the box**. 
If we implement the IndexedDB synchronization logic for the Web platform today, the exact same React FSD code will compile into our native desktop wrapper and instantly provide offline projection support without needing to rewrite backend database drivers (like SQLite).

## 3. The OpenAI Speech-to-Text Limitation
While the Local Data layer and Regex Intent Extraction will work entirely offline with sub-millisecond speeds, the **Voice Capture** component still heavily relies on the internet.
- **Current Model:** We utilize the `gpt-4o-realtime-preview` model via WebSocket to transcribe and correct audio into perfect text. This *mandates* a stable internet connection.
- **Future Offline Desktop Consideration:** To achieve 100% true offline operability (e.g., if Sunday Wi-Fi drops completely), the desktop wrapper will eventually need to embed a local STT engine binary (such as `Whisper.cpp` or `Vosk`). This local binary would replace the OpenAI WebSocket connection, passing offline transcriptions straight to the Local Regex + IndexedDB logic.
