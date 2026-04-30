const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const clientRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repoRoot, 'node_modules', '.pnpm');
const targetRoot = path.join(clientRoot, 'node_modules', '@tigerconnect');

const packages = [
  {
    source: path.join(sourceRoot, '@tigerconnect+ffi-napi@4.0.3-tc3', 'node_modules', '@tigerconnect', 'ffi-napi'),
    target: path.join(targetRoot, 'ffi-napi'),
  },
  {
    source: path.join(sourceRoot, '@tigerconnect+ref-napi@4.0.0-tc8', 'node_modules', '@tigerconnect', 'ref-napi'),
    target: path.join(targetRoot, 'ref-napi'),
  },
];

fs.mkdirSync(targetRoot, { recursive: true });

for (const entry of packages) {
  if (!fs.existsSync(entry.source)) {
    console.error(`[stage-tigerconnect-runtime] Missing source package: ${entry.source}`);
    process.exit(1);
  }

  fs.rmSync(entry.target, { recursive: true, force: true });
  fs.cpSync(entry.source, entry.target, { recursive: true });
  console.log(`[stage-tigerconnect-runtime] Copied ${entry.source} -> ${entry.target}`);
}
