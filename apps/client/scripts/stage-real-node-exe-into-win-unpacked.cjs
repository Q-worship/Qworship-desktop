const fs = require('node:fs');
const path = require('node:path');

const clientRoot = path.resolve(__dirname, '..');
const winUnpackedRoot = path.join(clientRoot, 'release', 'win-unpacked');
const candidateNodeExes = [
  'C:/Users/viann/AppData/Local/Microsoft/WinGet/Packages/OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe/node-v24.15.0-win-x64/node.exe',
  'C:/Program Files/nodejs/node.exe',
];

const sourceExe = candidateNodeExes.find(candidate => fs.existsSync(candidate));
if (!sourceExe) {
  console.error('[stage-real-node-exe-into-win-unpacked] No usable node.exe installation was found.');
  process.exit(1);
}

const targets = [
  path.join(winUnpackedRoot, 'resources', 'app.asar.unpacked', 'node_modules', '@tigerconnect', 'ffi-napi', 'prebuilds', 'win32-x64', 'node.exe'),
  path.join(winUnpackedRoot, 'resources', 'app.asar.unpacked', 'node_modules', '@tigerconnect', 'ref-napi', 'prebuilds', 'win32-x64', 'node.exe'),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(sourceExe, target);
  console.log(`[stage-real-node-exe-into-win-unpacked] Copied ${sourceExe} -> ${target}`);
}
