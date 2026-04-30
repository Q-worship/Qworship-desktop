const { app } = require('electron');

app.whenReady().then(() => {
  const checks = [
    ['ref-napi', () => require('ref-napi')],
    ['ffi-napi', () => require('ffi-napi')],
    ['vosk', () => require('vosk')],
  ];

  for (const [name, load] of checks) {
    try {
      const mod = load();
      console.log('LOAD_OK', name, Object.keys(mod || {}));
    } catch (error) {
      console.error('LOAD_FAIL', name);
      console.error(error && error.stack ? error.stack : String(error));
      app.exit(1);
      return;
    }
  }

  app.exit(0);
});
