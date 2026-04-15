const { manager, Whisper } = require('smart-whisper');
async function run() {
  console.log("Downloading tiny...");
  await manager.download('tiny');
  const path = require('path');
  const whisper = new Whisper(path.join(__dirname, 'node_modules/smart-whisper/models/ggml-tiny.bin'), { gpu: false });
  await whisper.load();
  const fakeAudio = new Float32Array(16000 * 2); 
  const task = await whisper.transcribe(fakeAudio, { language: 'en' });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Done");
}
run().catch(console.error);
