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
      // Decode Float32Array from base64 if sent as buffer, or rebuild from raw array
      const float32 = new Float32Array(msg.buffer);
      
      const task = await instance.transcribe(float32, {
        language: 'en',
        n_threads: 4,
        single_segment: true,
        no_context: true,
        no_timestamps: true,
        initial_prompt: BIBLE_INITIAL_PROMPT,
      });

      task.on('transcribed', (segment) => {
        if (segment.text) {
           process.send({ type: 'transcript-partial', text: segment.text.trim() });
        }
      });

      const result = await task.result;
      const transcript = typeof result === 'string' ? result : 
                         (Array.isArray(result) ? result.map(s => s.text).join(' ') : 
                         (result.segments ? result.segments.map(s => s.text).join(' ') : result.text));
                         
      if (transcript && transcript.trim()) {
        process.send({ type: 'transcript-final', text: transcript.trim() });
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
