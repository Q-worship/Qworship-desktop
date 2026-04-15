const { Whisper } = require('smart-whisper');
const path = require('path');
const fs = require('fs');

async function test() {
  const modelPath = path.join(__dirname, 'models', 'ggml-tiny.en.bin');
  const whisper = new Whisper(modelPath, { gpu: false });
  console.log("Loading model...");
  await whisper.load();
  console.log("Model loaded. Transcribing fake audio...");
  const fakeAudio = new Float32Array(16000 * 5); // 5 seconds of silence
  
  const startTime = Date.now();
  const task = await whisper.transcribe(fakeAudio, {
    language: 'en',
    n_threads: 4,
    single_segment: true,
  });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Finished in", Date.now() - startTime, "ms", result);
}
test().catch(console.error);
