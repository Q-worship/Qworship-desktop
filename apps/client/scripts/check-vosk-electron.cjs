try {
  const { app } = require('electron');
  app.whenReady().then(() => {
    try {
      const mod = require('vosk');
      console.log('ELECTRON_VOSK_OK', Object.keys(mod));
      app.exit(0);
    } catch (error) {
      console.error('ELECTRON_VOSK_LOAD_ERROR');
      console.error(error && error.stack ? error.stack : String(error));
      app.exit(1);
    }
  });
} catch (error) {
  console.error('ELECTRON_BOOT_ERROR');
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
