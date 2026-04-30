try {
  const mod = require('vosk');
  console.log('VOSK_OK', Object.keys(mod));
} catch (error) {
  console.error('VOSK_LOAD_ERROR');
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
}
