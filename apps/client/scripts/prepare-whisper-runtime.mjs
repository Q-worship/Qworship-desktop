import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');
const vendorRoot = path.join(clientRoot, 'vendor', 'whispercpp', 'win32-x64');
const archiveDir = path.join(clientRoot, '.cache', 'whispercpp');
const archivePath = path.join(archiveDir, 'whisper-bin-x64.zip');
const downloadUrl = 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.4/whisper-bin-x64.zip';
const extractedRoot = path.join(archiveDir, 'extracted');
const releaseDir = path.join(extractedRoot, 'Release');
const requiredFiles = [
  'whisper-cli.exe',
  'whisper.dll',
  'ggml.dll',
  'ggml-base.dll',
  'ggml-cpu.dll',
];

function ensureFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}`);
  }
}

function hasAllRequiredFiles(dir) {
  return requiredFiles.every((file) => fs.existsSync(path.join(dir, file)));
}

function downloadArchive() {
  fs.mkdirSync(archiveDir, { recursive: true });

  if (!fs.existsSync(archivePath)) {
    console.log(`[prepare-whisper-runtime] Downloading ${downloadUrl}`);
    execFileSync('curl', ['-L', '-o', archivePath, downloadUrl], { stdio: 'inherit' });
  }

  ensureFile(archivePath, 'whisper.cpp Windows archive');
}

function extractArchive() {
  if (hasAllRequiredFiles(releaseDir)) {
    return;
  }

  fs.rmSync(extractedRoot, { recursive: true, force: true });
  fs.mkdirSync(extractedRoot, { recursive: true });
  execFileSync('unzip', ['-oq', archivePath, '-d', extractedRoot], { stdio: 'inherit' });

  if (!hasAllRequiredFiles(releaseDir)) {
    throw new Error('The downloaded whisper.cpp archive did not contain the required Windows runtime files');
  }
}

function stageRuntime() {
  fs.mkdirSync(vendorRoot, { recursive: true });

  for (const file of requiredFiles) {
    const sourcePath = path.join(releaseDir, file);
    const destinationPath = path.join(vendorRoot, file);
    fs.copyFileSync(sourcePath, destinationPath);
    const size = fs.statSync(destinationPath).size;
    console.log(`[prepare-whisper-runtime] Staged ${file} (${size} bytes)`);
  }
}

downloadArchive();
extractArchive();
stageRuntime();
