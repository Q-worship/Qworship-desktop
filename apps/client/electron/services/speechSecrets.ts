import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export interface SpeechSecrets {
  openaiApiKey?: string;
}

const CANDIDATE_ENV_KEYS = [
  "QWORSHIP_OPENAI_API_KEY",
  "OPENAI_API_KEY",
] as const;

function getSecretsFilePath() {
  return path.join(app.getPath("userData"), "speech-secrets.json");
}

export function loadSpeechSecrets(): SpeechSecrets {
  for (const envKey of CANDIDATE_ENV_KEYS) {
    const value = process.env[envKey];
    if (value && value.trim()) {
      return { openaiApiKey: value.trim() };
    }
  }

  try {
    const filePath = getSecretsFilePath();
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").trim();
    const parsed = JSON.parse(raw) as SpeechSecrets;
    if (parsed.openaiApiKey?.trim()) {
      return { openaiApiKey: parsed.openaiApiKey.trim() };
    }
  } catch (error) {
    console.warn("[SpeechSecrets] Failed to load speech secrets", error);
  }

  return {};
}

export function saveSpeechSecrets(nextSecrets: SpeechSecrets) {
  const filePath = getSecretsFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(nextSecrets, null, 2), "utf8");
}
