const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const { execFileSync } = require('node:child_process');

const clientRoot = path.resolve(__dirname, '..');
const winUnpackedRoot = path.join(clientRoot, 'release', 'win-unpacked');
const voskDllRoot = path.join(winUnpackedRoot, 'resources', 'app.asar.unpacked', 'node_modules', 'vosk', 'lib', 'win-x86_64');
const cacheRoot = path.join(clientRoot, '.runtime-cache', 'vosk-runtime');
const releaseArchiveUrl = 'https://github.com/alphacep/vosk-api/releases/download/v0.3.45/vosk-win64-0.3.45.zip';
const releaseArchivePath = path.join(cacheRoot, 'vosk-win64-0.3.45.zip');
const targets = [
  winUnpackedRoot,
  path.join(winUnpackedRoot, 'resources'),
  voskDllRoot,
];
const dlls = [
  'libgcc_s_seh-1.dll',
  'libstdc++-6.dll',
  'libwinpthread-1.dll',
];

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.rmSync(destination, { force: true });
        download(response.headers.location, destination).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed for ${url} with status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', error => {
      file.close();
      fs.rmSync(destination, { force: true });
      reject(error);
    });
  });
}

function ensureArchiveExtracted() {
  fs.mkdirSync(cacheRoot, { recursive: true });
  if (!fs.existsSync(releaseArchivePath)) {
    return download(releaseArchiveUrl, releaseArchivePath).then(() => extractArchive());
  }
  return extractArchive();
}

function extractArchive() {
  const extractRoot = path.join(cacheRoot, 'vosk-win64-0.3.45');
  if (fs.existsSync(path.join(extractRoot, 'libstdc++-6.dll'))) {
    return Promise.resolve(extractRoot);
  }

  fs.rmSync(extractRoot, { recursive: true, force: true });
  fs.mkdirSync(extractRoot, { recursive: true });
  execFileSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Expand-Archive -LiteralPath '${releaseArchivePath.replace(/'/g, "''")}' -DestinationPath '${extractRoot.replace(/'/g, "''")}' -Force`,
  ], { stdio: 'inherit' });

  return Promise.resolve(extractRoot);
}

function findSource(root, dll) {
  const direct = path.join(voskDllRoot, dll);
  if (fs.existsSync(direct)) {
    return direct;
  }

  const extracted = path.join(root, dll);
  if (fs.existsSync(extracted)) {
    return extracted;
  }

  return null;
}

async function main() {
  const extractedRoot = await ensureArchiveExtracted();

  for (const dll of dlls) {
    const source = findSource(extractedRoot, dll);
    if (!source) {
      console.error(`[stage-vosk-runtime-dlls-into-win-unpacked] Missing source DLL even after release extraction: ${dll}`);
      process.exit(1);
    }

    for (const targetDir of targets) {
      fs.mkdirSync(targetDir, { recursive: true });
      const target = path.join(targetDir, dll);
      fs.copyFileSync(source, target);
      console.log(`[stage-vosk-runtime-dlls-into-win-unpacked] Copied ${source} -> ${target}`);
    }
  }
}

main().catch(error => {
  console.error('[stage-vosk-runtime-dlls-into-win-unpacked] Failed:', error);
  process.exit(1);
});
