const fs = require('node:fs');
const path = require('node:path');

const clientRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(clientRoot, 'node_modules');
const targetRoot = path.join(clientRoot, 'release', 'win-unpacked', 'resources', 'app.asar.unpacked', 'node_modules');

const packages = [
  '@tigerconnect/ffi-napi',
  '@tigerconnect/ref-napi',
  'debug',
  'ms',
  'node-addon-api',
  'node-gyp-build',
  'get-uv-event-loop-napi-h',
  'get-symbol-from-current-process-h',
  'ref-struct-di',
];

for (const pkg of packages) {
  const source = path.join(sourceRoot, ...pkg.split('/'));
  const target = path.join(targetRoot, ...pkg.split('/'));

  if (!fs.existsSync(source)) {
    console.error(`[stage-tigerconnect-into-win-unpacked] Missing source package: ${source}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
  console.log(`[stage-tigerconnect-into-win-unpacked] Copied ${source} -> ${target}`);
}
