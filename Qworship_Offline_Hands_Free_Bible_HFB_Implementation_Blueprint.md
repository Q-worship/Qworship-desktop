# Qworship Offline Hands-Free Bible (HFB) Implementation Blueprint

**Author:** Manus AI  
**Date:** April 14, 2026  

## Executive Summary

The Hands-Free Bible (HFB) feature is the core differentiator of the Qworship platform. Currently, the desktop application relies on a cloud-dependent architecture: audio is captured in the browser, sent over a WebSocket to a Node.js server, and processed by the OpenAI Realtime API (Whisper + GPT-4o) before results are returned to the client. This approach introduces network latency, incurs API costs, and completely fails in offline environments.

To achieve the goal of a 100% offline, near-zero latency HFB experience within the Electron desktop application, the architecture must be fundamentally redesigned. This blueprint outlines a comprehensive strategy to embed a native speech-to-text (STT) engine directly into the Electron Main Process, leverage the existing client-side parsing logic, and utilize a local SQLite database for verse retrieval. By adopting `whisper.cpp` via a native Node.js addon, Qworship can achieve high accuracy for complex biblical terminology while maintaining the low latency required for live presentation environments.

## Current Architecture Analysis

The existing HFB implementation in the Qworship codebase is highly dependent on cloud infrastructure. The audio capture pipeline begins in the React client, where an `AudioWorklet` (`pcm-processor.js`) captures microphone input, downsamples it to 24kHz, and converts it to PCM16 format. This raw audio data is then streamed over a WebSocket connection (`useRealtimeSocket.ts`) to the backend server.

On the server side (`audio.socket.ts`), the incoming audio is forwarded to the `TranscriptionService`, which acts as a bridge to the OpenAI Realtime API. The OpenAI service utilizes the Whisper model to generate partial transcripts and GPT-4o to produce final, corrected transcripts. The server then processes these transcripts using `BibleService.parseVoiceCommandOptimized()`, queries a MongoDB database for the corresponding verses, and sends the results back to the client via the WebSocket. Furthermore, if the deterministic parser fails, the server employs a GPT-4o-mini fallback to extract the Bible reference from the transcript.

This architecture presents several critical limitations for an offline desktop application. First, it requires a continuous, stable internet connection, which is often unavailable in many church environments. Second, the round-trip network latency between the client, server, and OpenAI API introduces noticeable delays in verse projection. Finally, the reliance on OpenAI APIs incurs ongoing operational costs that scale with usage. The `LOCAL_FIRST_BIBLE_ARCHITECTURE.md` document in the repository acknowledges these issues and proposes moving the parser and database to the client, but it leaves the offline speech recognition component unresolved, suggesting the use of the `Web Speech API`. However, the `Web Speech API` is not a viable solution for Electron, as Chromium strips out the necessary Google cloud service integrations, rendering it non-functional in offline desktop environments.

## Offline Speech-to-Text Engine Selection

Selecting the appropriate offline STT engine is the most critical decision for the offline HFB implementation. The engine must balance accuracy, latency, model size, and compatibility with the Electron framework. Three primary candidates were evaluated: Vosk, sherpa-onnx, and whisper.cpp.

Vosk is a lightweight, CPU-only engine that offers true streaming recognition and minimal resource overhead [1]. While its small model size (~40MB) makes it attractive for low-end hardware, its accuracy for complex proper nouns and rare words—such as biblical book names—is significantly lower than Whisper-based models [2]. Additionally, integrating Vosk into an Electron application on Windows often requires complex native compilation steps involving Visual Studio Build Tools, which can complicate the deployment process [3].

Sherpa-onnx is another strong contender, offering both streaming and non-streaming recognition using Next-gen Kaldi models [4]. It supports advanced architectures like Zipformer and Paraformer, with streaming English models as small as 20MB [5]. However, the Node.js addon for sherpa-onnx (`sherpa-onnx-node`) has documented integration issues within Electron, particularly concerning ABI mismatches on macOS and DLL loading conflicts on Windows [6] [7]. These integration challenges make it a riskier choice for a production-ready desktop application.

Whisper.cpp emerges as the optimal solution for Qworship. It is a highly optimized, C++ implementation of OpenAI's Whisper model that supports hardware acceleration across various platforms (e.g., Vulkan on Windows, Metal on macOS) [8]. Through native Node.js addons like `smart-whisper`, whisper.cpp can be seamlessly integrated into the Electron Main Process [9]. While Whisper is traditionally a non-streaming model, whisper.cpp implements a sliding window approach with Voice Activity Detection (VAD) to achieve near real-time transcription with low latency [10]. The `small.en` model (466MB) provides an excellent balance of speed and accuracy, particularly for English-language biblical terminology [11].

## Implementation Strategy

The transition to an offline HFB architecture involves three primary components: the audio pipeline, the STT engine integration, and the local parsing and database layer.

### 1. Audio Pipeline Redirection

The existing `AudioWorklet` (`pcm-processor.js`) is well-designed and should be retained. It efficiently captures and downsamples audio off the main thread, preventing UI blocking. However, instead of sending the PCM16 data over a WebSocket to a remote server, the client must route this data to the Electron Main Process via Inter-Process Communication (IPC).

The `useRawAudioStream.ts` hook should be updated to emit IPC messages containing the audio buffers. In the Main Process, an IPC listener will receive these buffers and feed them into the native STT engine. This approach eliminates network latency and keeps the audio processing entirely local.

### 2. Whisper.cpp Integration in Electron

To integrate whisper.cpp, the application should utilize a native Node.js addon, such as `smart-whisper`, within the Electron Main Process. The STT engine should be instantiated during application startup, loading the `small.en` model into memory.

To achieve near-zero latency, the implementation must utilize whisper.cpp's sliding window streaming mode. This involves buffering the incoming audio chunks and running inference at regular intervals (e.g., every 500ms) [10]. To optimize performance and prevent unnecessary CPU usage, a Voice Activity Detection (VAD) gate should be implemented. The engine will only process the audio buffer when speech is detected, and it will finalize the transcription block when silence is detected.

A critical challenge with Whisper models is their tendency to misspell rare proper nouns, which is problematic for biblical book names (e.g., "Habakkuk", "Zephaniah"). To mitigate this, the implementation must leverage Whisper's `initial_prompt` parameter [12]. By providing a prompt containing a comma-separated list of all 66 Bible book names, the model's recognition is biased toward this specific vocabulary, significantly improving accuracy for biblical references [13].

### 3. Local Parsing and Database Lookup

Once the Main Process generates a transcript, it must be parsed to extract the Bible reference. The Qworship codebase already contains a robust client-side parser in `offlineBibleEngine.ts`. This parser utilizes regex patterns and fuzzy matching (`fuse.js`) to interpret voice commands and correct minor phonetic errors.

The Main Process should pass the transcript to this parsing logic. If a valid reference is extracted, the system must query the local database. As identified in previous performance analyses, loading the entire Bible into RAM causes significant memory pressure and startup delays. Therefore, the application must bundle a pre-packaged SQLite database containing the Bible verses. The Main Process will execute the SQLite query to retrieve the requested verses and then send the final result back to the React renderer via IPC for projection.

## Conclusion

By migrating the Hands-Free Bible feature to a fully offline architecture using whisper.cpp, Qworship can eliminate its reliance on internet connectivity and cloud APIs. This blueprint provides a clear path to achieving near-zero latency and high accuracy by embedding the STT engine in the Electron Main Process, utilizing the `initial_prompt` feature for vocabulary biasing, and leveraging a local SQLite database for verse retrieval. This approach not only fulfills the core objective of the desktop application but also significantly enhances the reliability and performance of the platform in live presentation environments.

## References

[1] VOSK Offline Speech Recognition API. Alpha Cephei. https://alphacephei.com/vosk/
[2] Whisper.cpp vs Whisper vs VOSK for Linux Voice Dictation. Vocalinux. https://vocalinux.com/compare/
[3] Need free offline speech-to-text for Electron app on Windows. Reddit. https://www.reddit.com/r/javascript/comments/1r36r7j/askjs_need_free_offline_speechtotext_for_electron/
[4] sherpa-onnx — sherpa 1.3 documentation. https://k2-fsa.github.io/sherpa/onnx/index.html
[5] Zipformer & Transducer Models. React Native Sherpa-ONNX. https://www.mintlify.com/XDcobra/react-native-sherpa-onnx/models/stt/transducer
[6] Failed to load sherpa-onnx-node in Electron on macOS. GitHub. https://github.com/k2-fsa/sherpa-onnx/issues/2622
[7] Windows DLL search order causes sherpa-onnx to load stale DLLs. GitHub. https://github.com/k2-fsa/sherpa-onnx/issues/3059
[8] Whisper.cpp Node.js Addon with Vulkan Support. Reddit. https://www.reddit.com/r/LocalLLaMA/comments/1m0eq11/whispercpp_nodejs_addon_with_vulkan_support/
[9] Smart Whisper. GitHub. https://github.com/JacobLinCool/smart-whisper
[10] whisper.cpp/examples/stream/README.md. GitHub. https://github.com/ggerganov/whisper.cpp/blob/master/examples/stream/README.md
[11] Whisper Large vs Medium vs Small: Which Model Size Should You Use? Sotto Blog. https://sotto.to/blog/whisper-model-sizes-compared
[12] Whisper prompting guide. OpenAI Cookbook. https://developers.openai.com/cookbook/examples/whisper_prompting_guide
[13] Adding custom vocabularies on Whisper. Hugging Face Forums. https://discuss.huggingface.co/t/adding-custom-vocabularies-on-whisper/29311
