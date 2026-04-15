process.env.UV_THREADPOOL_SIZE = "64";
const { app } = require('electron');
const { Whisper } = require('smart-whisper');
const path = require('path');

app.whenReady().then(async () => {
  const modelPath = path.join(__dirname, 'models', 'ggml-tiny.en.bin');
  const whisper = new Whisper(modelPath, { gpu: false });
  await whisper.load();
  
  const fakeAudio = new Float32Array(16000 * 2); 
  console.log("Transcribing with 64 libuv threads...");
  const task = await whisper.transcribe(fakeAudio, { language: 'en' });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Result:", result);
  process.exit(0);
}).catch(console.error);
