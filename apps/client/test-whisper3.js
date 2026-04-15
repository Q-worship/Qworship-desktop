const { app } = require('electron');
const { Whisper } = require('smart-whisper');
const path = require('path');

app.whenReady().then(async () => {
  console.log("App ready. Starting whisper test.");
  const modelPath = path.join(__dirname, 'models', 'ggml-tiny.en.bin');
  const whisper = new Whisper(modelPath, { gpu: false });
  await whisper.load();
  
  const fakeAudio = new Float32Array(16000 * 2); 
  for(let i = 0; i < fakeAudio.length; i++) fakeAudio[i] = (Math.random() - 0.5) * 0.1;
  
  const startTime = Date.now();
  console.log("Transcribing...");
  const task = await whisper.transcribe(fakeAudio, { language: 'en', n_threads: 4 });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Finished in", Date.now() - startTime, "ms", result);
  process.exit(0);
}).catch(console.error);
