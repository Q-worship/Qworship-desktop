# Local-First Bible Architecture Plan (Electron Roadmap)

## Objective
To enable 100% offline functionality and zero-latency database querying for the `Qworship-v2` Electron desktop application, the legacy Backend Bible Service parsing engine will be fully migrated to the React Client.

## Motivation
Currently, when a user speaks "John 3:16", the raw audio is piped to the server, which proxies it to OpenAI, retrieves the text transcript, runs a heavy multi-step regex + fuzzy matching algorithm on the server CPU, queries the database on the server, and emits a websocket event back to the client.

For an offline-first Electron application:
1. The **Database** will live on the client (via `IndexedDB` with `Dexie.js` or an embedded `SQLite` database).
2. The **Parser** (regex rules, `words-to-numbers`, and `fuse.js`-based fuzzy matching) must live on the client to interpret the text locally without requiring a Node server.
3. The **Speech Engine** can eventually be switched from the cloud-dependent OpenAI Realtime API to the native browser `Web Speech API` (or a local Whisper model).

## Migration Strategy

### Phase 1: Moving the Logic
The existing `apps/server/src/modules/bible/handsfreeBible` directory contains 100% pure TypeScript logic with no server-specific database bindings. 
1. Copy the entire `handsfreeBible` parsing directory into `apps/client/src/features/bible/parser`.
2. Install `fuse.js` and `words-to-numbers` directly into the `apps/client` `package.json`.

### Phase 2: Refactoring the Data Fetch
1. Set up a Dexie.js database (`localDb.ts`) on the frontend to store the 120,000 JSON verses.
2. Inside `HandfreeBibleWidget.tsx`, as soon as the transcribed text is received, pass it into `parseVoiceCommandOptimized(text)`.
3. Take the resulting structured `{ book, chapter, verseStart }` output and immediately query `localDb.verses.where(...)`.

### Phase 3: Offline Speech Recognition
Replace `useRealtimeSocket.ts` (which hits OpenAI) with a simple React hook that utilizes `window.SpeechRecognition` or `window.webkitSpeechRecognition`. This will allow the entire Hands Free Bible to function completely disconnected from the internet.
