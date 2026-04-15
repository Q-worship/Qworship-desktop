const { Whisper } = require('smart-whisper');
const path = require('path');

async function test() {
  const modelPath = path.join(__dirname, 'models', 'ggml-tiny.en.bin');
  const whisper = new Whisper(modelPath, { gpu: false });
  await whisper.load();
  
  // Random noise instead of silence
  const fakeAudio = new Float32Array(16000 * 5); 
  for(let i = 0; i < fakeAudio.length; i++) {
    fakeAudio[i] = (Math.random() - 0.5) * 0.1;
  }
  
  const startTime = Date.now();
  console.log("Starting transcribe...");
  const task = await whisper.transcribe(fakeAudio, {
    language: 'en',
    n_threads: 4,
  });   // Removed single_segment!
  
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Finished in", Date.now() - startTime, "ms", result);
  process.exit(0);
}
test().catch(console.error);
