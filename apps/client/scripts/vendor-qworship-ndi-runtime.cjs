const fs = require('node:fs');
const path = require('node:path');

const clientRoot = path.resolve(__dirname, '..');
const nativeRoot = path.join(clientRoot, 'native', 'qworship-ndi');
const nodeModulesRoot = path.join(clientRoot, 'node_modules', 'qworship-ndi');
const buildRelativePath = path.join('build', 'Release');

const candidateSourceDirs = [
  path.join(nativeRoot, buildRelativePath),
  path.join(nodeModulesRoot, buildRelativePath),
  path.join(clientRoot, 'release', 'win-unpacked', 'resources', 'app.asar.unpacked', 'node_modules', 'qworship-ndi', buildRelativePath),
  path.join(clientRoot, 'release-hfb-mode-fix', 'win-unpacked', 'resources', 'app.asar.unpacked', 'node_modules', 'qworship-ndi', buildRelativePath),
];

function hasRuntimeFiles(dirPath) {
  return fs.existsSync(path.join(dirPath, 'qworship_ndi.node')) && fs.existsSync(path.join(dirPath, 'Processing.NDI.Lib.x64.dll'));
}

function copyDirectory(sourceDir, destinationDir) {
  fs.mkdirSync(path.dirname(destinationDir), { recursive: true });
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, destinationDir, { recursive: true, dereference: true });
  console.log(`[vendor-qworship-ndi-runtime] Staged ${sourceDir} -> ${destinationDir}`);
}

function main() {
  if (process.platform !== 'win32') {
    console.log('[vendor-qworship-ndi-runtime] Skipping because platform is not Windows.');
    return;
  }

  const existingSource = candidateSourceDirs.find(hasRuntimeFiles);
  if (!existingSource) {
    throw new Error(
      `[vendor-qworship-ndi-runtime] Could not find a complete ${buildRelativePath} directory containing qworship_ndi.node and Processing.NDI.Lib.x64.dll. Build qworship-ndi once before packaging.`,
    );
  }

  const destinations = [
    path.join(nativeRoot, buildRelativePath),
    path.join(nodeModulesRoot, buildRelativePath),
  ];

  for (const destination of destinations) {
    if (path.resolve(destination) === path.resolve(existingSource)) {
      console.log(`[vendor-qworship-ndi-runtime] Keeping existing runtime at ${destination}`);
      continue;
    }

    copyDirectory(existingSource, destination);
  }
}

main();
