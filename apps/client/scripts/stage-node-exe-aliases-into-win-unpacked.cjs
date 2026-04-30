const fs = require('node:fs');
const path = require('node:path');

const clientRoot = path.resolve(__dirname, '..');
const winUnpackedRoot = path.join(clientRoot, 'release', 'win-unpacked');
const sourceExe = path.join(winUnpackedRoot, 'Qworship Live Console.exe');
const targets = [
  path.join(winUnpackedRoot, 'resources', 'app.asar.unpacked', 'node_modules', '@tigerconnect', 'ffi-napi', 'prebuilds', 'win32-x64', 'node.exe'),
  path.join(winUnpackedRoot, 'resources', 'app.asar.unpacked', 'node_modules', '@tigerconnect', 'ref-napi', 'prebuilds', 'win32-x64', 'node.exe'),
];

if (!fs.existsSync(sourceExe)) {
  console.error(`[stage-node-exe-aliases-into-win-unpacked] Source executable not found: ${sourceExe}`);
  process.exit(1);
}

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(sourceExe, target);
  console.log(`[stage-node-exe-aliases-into-win-unpacked] Copied ${sourceExe} -> ${target}`);
}
