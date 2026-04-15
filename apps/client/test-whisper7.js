const { app } = require('electron');
const { Worker, isMainThread, parentPort } = require('worker_threads');
const path = require('path');

if (isMainThread) {
  app.whenReady().then(() => {
    console.log("Starting worker thread...");
    const worker = new Worker(__filename);
    worker.on('message', msg => console.log('Worker says:', msg));
    worker.on('exit', () => process.exit(0));
  });
} else {
  const { Whisper } = require('smart-whisper');
  (async () => {
    try {
      parentPort.postMessage("Loading inside worker...");
      const modelPath = path.join(__dirname, 'models', 'ggml-tiny.en.bin');
      const whisper = new Whisper(modelPath, { gpu: false });
      await whisper.load();
      
      const fakeAudio = new Float32Array(16000 * 2); 
      for(let i=0; i<fakeAudio.length; i++) fakeAudio[i] = (Math.random()-0.5)*0.1;
      
      parentPort.postMessage("Transcribing...");
      const task = await whisper.transcribe(fakeAudio, { language: 'en', n_threads: 4 });
      parentPort.postMessage("Task scheduled...");
      const result = await task.result;
      parentPort.postMessage("Result: " + JSON.stringify(result));
      process.exit(0);
    } catch(err) {
      parentPort.postMessage("Error: " + err.message);
      process.exit(1);
    }
  })();
}
