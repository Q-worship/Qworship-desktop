const { manager } = require('smart-whisper');
async function run() {
  console.log("Downloading base.en...");
  const model = await manager.download('base.en');
  console.log("Downloaded:", model);
}
run().catch(console.error);
