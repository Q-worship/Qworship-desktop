/**
 * WhisperModelManager — Manages Whisper model download and path resolution.
 *
 * Handles:
 * - Resolving model path in dev vs. packaged Electron app
 * - Downloading the model from Hugging Face on first launch
 * - Emitting download progress for UI display
 * - Validating model file integrity via size check
 */

import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { app } from 'electron';

/** Known model metadata for validation and download */
const MODEL_REGISTRY: Record<string, { url: string; expectedSizeMB: number }> = {
  'ggml-small.en.bin': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    expectedSizeMB: 466,
  },
  'ggml-base.en.bin': {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    expectedSizeMB: 142,
  },
};

export type ModelDownloadProgress = {
  percent: number;
  downloadedMB: number;
  totalMB: number;
};

export class WhisperModelManager {
  private modelsDir: string;

  constructor() {
    // In development: use the project's models/ directory
    // In production (packaged): use process.resourcesPath/models/
    if (app.isPackaged) {
      this.modelsDir = path.join(process.resourcesPath, 'models');
    } else {
      this.modelsDir = path.join(app.getAppPath(), 'models');
    }

    // Ensure the models directory exists
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /** Get the absolute path to a model file */
  getModelPath(modelName: string): string {
    return path.join(this.modelsDir, modelName);
  }

  /** Check if a model file exists and has a reasonable size */
  isModelDownloaded(modelName: string): boolean {
    const modelPath = this.getModelPath(modelName);
    if (!fs.existsSync(modelPath)) return false;

    const registry = MODEL_REGISTRY[modelName];
    if (!registry) return fs.existsSync(modelPath);

    // Check file size is at least 90% of expected (allow for minor variance)
    const stats = fs.statSync(modelPath);
    const sizeMB = stats.size / (1024 * 1024);
    return sizeMB >= registry.expectedSizeMB * 0.9;
  }

  /**
   * Ensure a model exists locally. If not, download it from Hugging Face.
   * Returns the absolute path to the model file.
   */
  async ensureModelExists(
    modelName: string,
    onProgress?: (progress: ModelDownloadProgress) => void,
  ): Promise<string> {
    const modelPath = this.getModelPath(modelName);

    if (this.isModelDownloaded(modelName)) {
      console.log(`[WhisperModelManager] Model "${modelName}" already exists at ${modelPath}`);
      return modelPath;
    }

    const registry = MODEL_REGISTRY[modelName];
    if (!registry) {
      throw new Error(`[WhisperModelManager] Unknown model: "${modelName}". Available: ${Object.keys(MODEL_REGISTRY).join(', ')}`);
    }

    console.log(`[WhisperModelManager] Downloading "${modelName}" from ${registry.url}...`);
    await this.downloadFile(registry.url, modelPath, onProgress);

    // Validate the downloaded file
    if (!this.isModelDownloaded(modelName)) {
      // Clean up partial download
      if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
      throw new Error(`[WhisperModelManager] Downloaded model "${modelName}" failed integrity check`);
    }

    console.log(`[WhisperModelManager] Model "${modelName}" downloaded successfully`);
    return modelPath;
  }

  /** Download a file with progress reporting, following redirects */
  private downloadFile(
    url: string,
    destPath: string,
    onProgress?: (progress: ModelDownloadProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempPath = `${destPath}.downloading`;

      const makeRequest = (requestUrl: string, redirectCount = 0) => {
        if (redirectCount > 5) {
          reject(new Error('Too many redirects'));
          return;
        }

        const urlObj = new URL(requestUrl);
        const requestModule = urlObj.protocol === 'https:' ? https : require('node:http');

        const req = requestModule.get(requestUrl, (res: any) => {
          // Handle redirects (301, 302, 303, 307, 308)
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, requestUrl).toString();
            console.log(`[WhisperModelManager] Following redirect to ${redirectUrl}`);
            makeRequest(redirectUrl, redirectCount + 1);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Download failed with status ${res.statusCode}`));
            return;
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          const totalMB = totalBytes / (1024 * 1024);
          let downloadedBytes = 0;

          const fileStream = fs.createWriteStream(tempPath);

          res.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length;
            fileStream.write(chunk);

            if (onProgress && totalBytes > 0) {
              onProgress({
                percent: Math.round((downloadedBytes / totalBytes) * 100),
                downloadedMB: Math.round((downloadedBytes / (1024 * 1024)) * 10) / 10,
                totalMB: Math.round(totalMB * 10) / 10,
              });
            }
          });

          res.on('end', () => {
            fileStream.end(() => {
              // Rename temp file to final destination
              fs.renameSync(tempPath, destPath);
              resolve();
            });
          });

          res.on('error', (err: Error) => {
            fileStream.close();
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            reject(err);
          });
        });

        req.on('error', (err: Error) => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          reject(err);
        });
      };

      makeRequest(url);
    });
  }
}
