import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const DEFAULT_VOSK_MODEL_DIR = "vosk-model-small-en-us-0.15";
const MODEL_DOWNLOAD_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip";

export class VoskModelManager {
  constructor(private readonly modelDirName = DEFAULT_VOSK_MODEL_DIR) {}

  getModelPath() {
    return app.isPackaged
      ? path.join(process.resourcesPath, "models", this.modelDirName)
      : path.join(app.getAppPath(), "models", this.modelDirName);
  }

  ensureModelExists() {
    const modelPath = this.getModelPath();
    const confPath = path.join(modelPath, "conf", "model.conf");

    if (!fs.existsSync(confPath)) {
      throw new Error(
        `Vosk offline model is missing at ${modelPath}. Download ${MODEL_DOWNLOAD_URL} and extract it to the desktop client models directory as ${this.modelDirName}.`,
      );
    }

    return modelPath;
  }
}
