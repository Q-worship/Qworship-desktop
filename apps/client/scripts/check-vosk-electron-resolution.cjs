const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

console.log('RESOLUTION_DIAG_START');
const voskEntry = require.resolve('vosk');
console.log('VOSK_ENTRY', voskEntry);
const voskRequire = createRequire(voskEntry);

function logResolve(label, specifier) {
  try {
    const resolved = voskRequire.resolve(specifier);
    console.log(label, resolved);
    return resolved;
  } catch (error) {
    console.log(label + '_ERR', error && error.message ? error.message : String(error));
    return null;
  }
}

function logRequire(label, specifier) {
  try {
    const value = voskRequire(specifier);
    const keys = value && typeof value === 'object' ? Object.keys(value).slice(0, 12) : [];
    console.log(label + '_OK', JSON.stringify(keys));
    return value;
  } catch (error) {
    console.log(label + '_ERR', error && error.stack ? error.stack : String(error));
    return null;
  }
}

const refPath = logResolve('REF_PATH', 'ref-napi');
const ffiPath = logResolve('FFI_PATH', 'ffi-napi');
logResolve('NODE_GYP_BUILD_PATH', 'node-gyp-build');

if (refPath) {
  const refRoot = path.dirname(path.dirname(refPath));
  const prebuildDir = path.join(refRoot, 'prebuilds', 'win32-x64');
  const electronNode = path.join(prebuildDir, 'electron.napi.node');
  const nodeNode = path.join(prebuildDir, 'node.napi.node');
  const rebuiltNode = path.join(refRoot, 'build', 'Release', 'binding.node');
  console.log('REF_ROOT', refRoot);
  console.log('REF_PREBUILD_DIR_EXISTS', fs.existsSync(prebuildDir));
  console.log('REF_ELECTRON_NODE_EXISTS', fs.existsSync(electronNode), electronNode);
  console.log('REF_NODE_NODE_EXISTS', fs.existsSync(nodeNode), nodeNode);
  console.log('REF_REBUILT_NODE_EXISTS', fs.existsSync(rebuiltNode), rebuiltNode);
  try {
    require(rebuiltNode);
    console.log('DIRECT_REBUILT_NODE_REQUIRE_OK');
  } catch (error) {
    console.log('DIRECT_REBUILT_NODE_REQUIRE_ERR', error && error.stack ? error.stack : String(error));
  }
  try {
    require(electronNode);
    console.log('DIRECT_ELECTRON_NODE_REQUIRE_OK');
  } catch (error) {
    console.log('DIRECT_ELECTRON_NODE_REQUIRE_ERR', error && error.stack ? error.stack : String(error));
  }
  try {
    require(nodeNode);
    console.log('DIRECT_NODE_NODE_REQUIRE_OK');
  } catch (error) {
    console.log('DIRECT_NODE_NODE_REQUIRE_ERR', error && error.stack ? error.stack : String(error));
  }
}

logRequire('REF_REQUIRE', 'ref-napi');
logRequire('FFI_REQUIRE', 'ffi-napi');
logRequire('VOSK_REQUIRE', 'vosk');
console.log('RESOLUTION_DIAG_END');
