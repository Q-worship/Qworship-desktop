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
      const result = await task.result;
      console.log('[WhisperWorker] Task resolved! Raw result payload:', JSON.stringify(result).substring(0, 500));
      
      let transcript = '';
      if (typeof result === 'string') {
          transcript = result;
      } else if (Array.isArray(result)) {
          transcript = result.map(s => s.text || '').join(' ');
      } else if (result && typeof result === 'object') {
          transcript = result.text || (result.segments ? result.segments.map(s => s.text).join(' ') : '');
      }
                         
      const safeTranscript = transcript || '';
      console.log(`[WhisperWorker] Final transcript string: "${safeTranscript.trim()}"`);
      
      if (safeTranscript.trim()) {
        process.send({ type: 'transcript-final', text: safeTranscript.trim() });
      }
    }
    
    if (msg.type === 'shutdown' && instance) {
      await instance.free();
      instance = null;
      process.exit(0);
    }
  } catch (err) {
    console.error('[WhisperWorker] Unhandled specific error:', err);
    process.send({ type: 'error', message: err.message });
  }
});
