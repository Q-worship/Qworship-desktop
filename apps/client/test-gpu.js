const { Whisper } = require('smart-whisper');
const path = require('path');
async function run() {
  const whisper = new Whisper(path.join(__dirname, 'models/ggml-tiny.en.bin'), { gpu: true });
  await whisper.load();
  const fakeAudio = new Float32Array(16000 * 2); 
  const task = await whisper.transcribe(fakeAudio, { language: 'en' });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Done");
}
run().catch(console.error);
