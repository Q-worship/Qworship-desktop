const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const runtimePackages = [
  { sourceParts: ['@tigerconnect', 'ffi-napi'], targetParts: ['@tigerconnect', 'ffi-napi'] },
  { sourceParts: ['@tigerconnect', 'ref-napi'], targetParts: ['@tigerconnect', 'ref-napi'] },
  { sourceParts: ['@tigerconnect', 'ffi-napi'], targetParts: ['ffi-napi'] },
  { sourceParts: ['@tigerconnect', 'ref-napi'], targetParts: ['ref-napi'] },
  { sourceParts: ['debug'], targetParts: ['debug'] },
  { sourceParts: ['ms'], targetParts: ['ms'] },
  { sourceParts: ['node-gyp-build'], targetParts: ['node-gyp-build'] },
  { sourceParts: ['node-addon-api'], targetParts: ['node-addon-api'] },
  { sourceParts: ['get-uv-event-loop-napi-h'], targetParts: ['get-uv-event-loop-napi-h'] },
  { sourceParts: ['get-symbol-from-current-process-h'], targetParts: ['get-symbol-from-current-process-h'] },
  { sourceParts: ['qworship-ndi'], targetParts: ['qworship-ndi'] },
];

function packagePath(root, parts) {
  return path.join(root, ...parts);
}

module.exports = async context => {
  const appOutDir = context.appOutDir;
  const sourceNodeModules = path.resolve(__dirname, '..', 'node_modules');
  const targetNodeModules = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules');
  const executablePath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.exe`);

  fs.mkdirSync(targetNodeModules, { recursive: true });

  for (const entry of runtimePackages) {
    const source = packagePath(sourceNodeModules, entry.sourceParts);
    const target = packagePath(targetNodeModules, entry.targetParts);

    if (!fs.existsSync(source)) {
      console.warn(`[after-pack-stage-native-runtime] Skipping missing source ${source}`);
      continue;
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true, dereference: true });
    console.log(`[after-pack-stage-native-runtime] Copied ${source} -> ${target}`);
  }

  if (context.electronPlatformName === 'win32' && fs.existsSync(executablePath)) {
    execFileSync(process.execPath, [path.join(__dirname, 'brand-windows-exe.mjs'), executablePath], {
      stdio: 'inherit',
    });
  }
};
