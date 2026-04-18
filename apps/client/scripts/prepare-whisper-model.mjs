import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manager } from 'smart-whisper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');
const modelsDir = path.join(clientRoot, 'models');
const modelAlias = 'small.en';
const targetFileName = 'ggml-small.en.bin';
const targetPath = path.join(modelsDir, targetFileName);

async function ensureModel() {
  fs.mkdirSync(modelsDir, { recursive: true });

  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    console.log(`[prepare-whisper-model] Model already staged at ${targetPath} (${stats.size} bytes)`);
    return;
  }

  let sourcePath = '';

  try {
    sourcePath = manager.resolve(modelAlias);
  } catch {
    sourcePath = '';
  }

  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.log(`[prepare-whisper-model] Local ${modelAlias} model not found. Downloading...`);
    await manager.download(modelAlias);
    sourcePath = manager.resolve(modelAlias);
  }

  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error(`Unable to resolve downloaded model for ${modelAlias}`);
  }

  fs.copyFileSync(sourcePath, targetPath);
  const stats = fs.statSync(targetPath);
  console.log(`[prepare-whisper-model] Staged ${modelAlias} to ${targetPath} (${stats.size} bytes)`);
}

ensureModel().catch((error) => {
  console.error('[prepare-whisper-model] Failed to stage Whisper model:', error);
  process.exit(1);
});
