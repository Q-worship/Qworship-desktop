const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const VERSION = '2.6.0';
const CACHE_ROOT = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign');
const TARGET_DIR = path.join(CACHE_ROOT, `winCodeSign-${VERSION}`);

function findLatestArchive() {
  if (!fs.existsSync(CACHE_ROOT)) return null;

  const archives = fs
    .readdirSync(CACHE_ROOT)
    .filter(name => name.endsWith('.7z'))
    .map(name => {
      const fullPath = path.join(CACHE_ROOT, name);
      const stat = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return archives[0]?.fullPath ?? null;
}

function ensureTargetDir() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function hasWindowsTools() {
  return fs.existsSync(path.join(TARGET_DIR, 'rcedit-x64.exe'));
}

function extractArchive(archivePath) {
  execFileSync('tar', ['-xf', archivePath, '-C', TARGET_DIR], {
    stdio: 'pipe',
    shell: false,
  });
}

function main() {
  if (process.platform !== 'win32') {
    console.log('[prepare-wincodesign-cache] Skipping because platform is not Windows.');
    return;
  }

  ensureTargetDir();

  if (hasWindowsTools()) {
    console.log(`[prepare-wincodesign-cache] Cache already ready at ${TARGET_DIR}`);
    return;
  }

  const archivePath = findLatestArchive();
  if (!archivePath) {
    throw new Error(
      '[prepare-wincodesign-cache] No cached winCodeSign archive was found. Run electron-builder once or place a winCodeSign-2.6.0 archive in the cache root first.',
    );
  }

  console.log(`[prepare-wincodesign-cache] Seeding cache from ${archivePath}`);

  try {
    extractArchive(archivePath);
  } catch (error) {
    // Windows tar still reports errors for the macOS dylib symlinks, but it extracts the
    // Windows tooling we need. We only fail if the required Windows executable is still missing.
    console.warn('[prepare-wincodesign-cache] tar reported extraction warnings; validating Windows payload.');
  }

  if (!hasWindowsTools()) {
    throw new Error(
      `[prepare-wincodesign-cache] Cache seeding failed. Expected ${path.join(TARGET_DIR, 'rcedit-x64.exe')} to exist.`,
    );
  }

  console.log(`[prepare-wincodesign-cache] Cache prepared successfully at ${TARGET_DIR}`);
}

main();
