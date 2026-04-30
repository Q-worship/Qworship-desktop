const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const { execFileSync } = require('node:child_process');

const clientRoot = path.resolve(__dirname, '..');
const targetRoot = path.join(clientRoot, 'node_modules');
const cacheRoot = path.join(clientRoot, '.runtime-cache', 'tigerconnect');

const packages = [
  {
    name: '@tigerconnect/ffi-napi',
    version: '4.0.3-tc3',
    tarball: 'https://registry.npmjs.org/@tigerconnect/ffi-napi/-/ffi-napi-4.0.3-tc3.tgz',
  },
  {
    name: '@tigerconnect/ref-napi',
    version: '4.0.0-tc8',
    tarball: 'https://registry.npmjs.org/@tigerconnect/ref-napi/-/ref-napi-4.0.0-tc8.tgz',
  },
  {
    name: 'debug',
    version: '4.3.1',
    tarball: 'https://registry.npmjs.org/debug/-/debug-4.3.1.tgz',
  },
  {
    name: 'ms',
    version: '2.1.2',
    tarball: 'https://registry.npmjs.org/ms/-/ms-2.1.2.tgz',
  },
  {
    name: 'node-addon-api',
    version: '4.2.0',
    tarball: 'https://registry.npmjs.org/node-addon-api/-/node-addon-api-4.2.0.tgz',
  },
  {
    name: 'node-gyp-build',
    version: '4.3.0',
    tarball: 'https://registry.npmjs.org/node-gyp-build/-/node-gyp-build-4.3.0.tgz',
  },
  {
    name: 'get-uv-event-loop-napi-h',
    version: '1.0.6',
    tarball: 'https://registry.npmjs.org/get-uv-event-loop-napi-h/-/get-uv-event-loop-napi-h-1.0.6.tgz',
  },
  {
    name: 'get-symbol-from-current-process-h',
    version: '1.0.2',
    tarball: 'https://registry.npmjs.org/get-symbol-from-current-process-h/-/get-symbol-from-current-process-h-1.0.2.tgz',
  },
  {
    name: 'ref-struct-di',
    version: '1.1.1',
    tarball: 'https://registry.npmjs.org/ref-struct-di/-/ref-struct-di-1.1.1.tgz',
  },
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

function targetPathFor(pkgName) {
  const parts = pkgName.split('/');
  return path.join(targetRoot, ...parts);
}

async function main() {
  fs.mkdirSync(cacheRoot, { recursive: true });

  for (const pkg of packages) {
    const safeName = pkg.name.replace(/[\/@]/g, '_');
    const archivePath = path.join(cacheRoot, `${safeName}-${pkg.version}.tgz`);
    const extractRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${safeName}-`));
    const destination = targetPathFor(pkg.name);

    if (!fs.existsSync(archivePath)) {
      console.log(`[vendor-tigerconnect-runtime] Downloading ${pkg.name}@${pkg.version}`);
      await download(pkg.tarball, archivePath);
    }

    execFileSync('tar', ['-xzf', archivePath, '-C', extractRoot], { stdio: 'inherit' });

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.rmSync(destination, { recursive: true, force: true });
    fs.cpSync(path.join(extractRoot, 'package'), destination, { recursive: true });
    fs.rmSync(extractRoot, { recursive: true, force: true });
    console.log(`[vendor-tigerconnect-runtime] Staged ${pkg.name}@${pkg.version} -> ${destination}`);
  }
}

main().catch(error => {
  console.error('[vendor-tigerconnect-runtime] Failed:', error);
  process.exit(1);
});
