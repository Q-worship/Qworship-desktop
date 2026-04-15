const { manager, Whisper } = require('smart-whisper');
async function run() {
  await manager.download('tiny');
  const whisper = new Whisper(manager.resolve('tiny'), { gpu: false });
  await whisper.load();
  const fakeAudio = new Float32Array(16000 * 2); 
  const task = await whisper.transcribe(fakeAudio, { language: 'en' });
  task.on('transcribed', console.log);
  const result = await task.result;
  console.log("Done");
}
run().catch(console.error);
