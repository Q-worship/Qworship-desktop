const { createRequire } = require('node:module');

console.log('PLAIN_NODE_DIAG_START');
console.log('process.versions', JSON.stringify(process.versions, null, 2));

const voskEntry = require.resolve('vosk');
console.log('VOSK_ENTRY', voskEntry);
const voskRequire = createRequire(voskEntry);

for (const specifier of ['ref-napi', 'ffi-napi', 'vosk']) {
  try {
    const resolved = voskRequire.resolve(specifier);
    console.log(specifier.toUpperCase() + '_RESOLVE_OK', resolved);
  } catch (error) {
    console.log(specifier.toUpperCase() + '_RESOLVE_ERR', error && error.message ? error.message : String(error));
  }
}

for (const specifier of ['ref-napi', 'ffi-napi', 'vosk']) {
  try {
    const value = voskRequire(specifier);
    const keys = value && typeof value === 'object' ? Object.keys(value).slice(0, 12) : [];
    console.log(specifier.toUpperCase() + '_REQUIRE_OK', JSON.stringify(keys));
  } catch (error) {
    console.log(specifier.toUpperCase() + '_REQUIRE_ERR', error && error.stack ? error.stack : String(error));
  }
}

console.log('PLAIN_NODE_DIAG_END');
