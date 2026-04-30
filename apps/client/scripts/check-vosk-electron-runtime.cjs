const path = require('node:path');

console.log('DIAG_START');
console.log('process.versions', JSON.stringify(process.versions, null, 2));
console.log('cwd', process.cwd());
console.log('__dirname', __dirname);

function tryResolve(label, specifier) {
  try {
    const resolved = require.resolve(specifier);
    console.log(`${label}_RESOLVE_OK`, resolved);
    return resolved;
  } catch (error) {
    console.log(`${label}_RESOLVE_ERR`, error && error.message ? error.message : String(error));
    return null;
  }
}

function tryRequire(label, specifier) {
  try {
    const value = require(specifier);
    const keys = value && typeof value === 'object' ? Object.keys(value).slice(0, 12) : [];
    console.log(`${label}_REQUIRE_OK`, JSON.stringify(keys));
    return value;
  } catch (error) {
    console.log(`${label}_REQUIRE_ERR`, error && error.stack ? error.stack : String(error));
    return null;
  }
}

tryResolve('REF', 'ref-napi');
tryResolve('FFI', 'ffi-napi');
tryResolve('VOSK', 'vosk');

tryRequire('REF', 'ref-napi');
tryRequire('FFI', 'ffi-napi');
tryRequire('VOSK', 'vosk');

console.log('DIAG_END');
