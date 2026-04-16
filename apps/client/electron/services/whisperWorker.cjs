/**
 * Whisper Worker (Isolated Thread Pattern)
 * 
 * Safely runs the 'smart-whisper' native addon in a dedicated Node process
 * to prevent Metal/Graph deallocation memory faults from crashing the Electron main loop.
 */
const { Whisper } = require('smart-whisper');

let instance = null;
const BIBLE_INITIAL_PROMPT = 'Genesis, Exodus, Luke, Psalms, Matthew, John, Revelation, chapter, verse.';

process.on('message', async (msg) => {
  try {
    if (msg.type === 'init') {
      console.log('[WhisperWorker] Initializing smart-whisper with model:', msg.modelPath);
      instance = new Whisper(msg.modelPath, { gpu: false }); // CPU fallback or safely isolated GPU
      process.send({ type: 'ready' });
    }
    
    if (msg.type === 'transcribe' && instance) {
      console.log('[WhisperWorker] Received transcribe IPC payload. Buffer size bytes:', msg.buffer.data ? msg.buffer.data.length : msg.buffer.length);
      
      const nodeBuf = Buffer.isBuffer(msg.buffer) ? msg.buffer : Buffer.from(msg.buffer.data || msg.buffer);
      const float32 = new Float32Array(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.length / 4);

      let maxAmp = 0;
      for (let i = 0; i < float32.length; i++) {
         const abs = Math.abs(float32[i]);
         if (abs > maxAmp) maxAmp = abs;
      }
      
      if (maxAmp < 0.005) { // Peak amplitude < 164/32768 (standard room noise floor)
          console.log(`[WhisperWorker] Dropping chunk: Audio is pure silence (Peak: ${maxAmp.toFixed(5)})`);
          process.send({ type: 'transcript-partial', text: '' });
          process.send({ type: 'transcript-final', text: '' });
          return;
      }
      
      console.log('[WhisperWorker] Starting instance.transcribe...');
      const task = await instance.transcribe(float32, {
        language: 'en',
        n_threads: 4,
        initial_prompt: BIBLE_INITIAL_PROMPT,
      });

      task.on('transcribed', (segment) => {
        if (segment.text) {
           process.send({ type: 'transcript-partial', text: segment.text.trim() });
        }
      });

      console.log('[WhisperWorker] Task scheduled, awaiting result...');
      const result = await Promise.race([
        task.result,
        new Promise((_, reject) => setTimeout(() => reject(new Error('INFERENCE_TIMEOUT: C++ engine hung')), 15000))
      ]);
      console.log('[WhisperWorker] Task resolved!');
      try {
        console.log('[WhisperWorker] Raw result payload:', JSON.stringify(result)?.substring(0, 500));
      } catch(e) {}
      
      let transcript = '';
      if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
          transcript = '';
      } else if (typeof result === 'string') {
          transcript = result;
      } else if (Array.isArray(result)) {
          transcript = result.map(s => s.text || '').join(' ');
      } else if (result && typeof result === 'object') {
          transcript = result.text || (result.segments ? result.segments.map(s => s.text).join(' ') : '');
      }
                         
      let safeTranscript = transcript || '';
      
      // Filter out Whisper hallucination tags
      safeTranscript = safeTranscript.replace(/\[BLANK_AUDIO\]/g, '');
      safeTranscript = safeTranscript.replace(/\(BLANK_AUDIO\)/g, '');
      
      console.log(`[WhisperWorker] Final transcript string: "${safeTranscript.trim()}"`);
      
      // ALWAYS send a message back to release the lock in WhisperService
      process.send({ type: 'transcript-final', text: safeTranscript.trim() });
    }
    
    if (msg.type === 'shutdown' && instance) {
      await instance.free();
      instance = null;
      process.exit(0);
    }
  } catch (err) {
    console.error('[WhisperWorker] Unhandled specific error:', err);
    process.send({ type: 'error', message: err.message || err.toString() });
    
    // FATAL: If the C++ engine has timed out or hung, we MUST forcefully kill the V8 process.
    // If we return to the event loop, the unresolvable N-API background thread will permanently 
    // leak CPU and deadlock future queries. Process exit guarantees a clean reboot by WhisperService.
    if (err.message && err.message.includes('INFERENCE_TIMEOUT')) {
      console.error('[WhisperWorker] FATAL: Killing worker process to wipe leaked C++ thread...');
      process.exit(1);
    }
  }
});
