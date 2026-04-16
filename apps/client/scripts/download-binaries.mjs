/**
 * Download script to fetch pre-compiled whisper.cpp binaries for both macOS
 * (via Homebrew Bottles) and Windows (via GitHub Releases) to achieve the
 * Subprocess Binary Architecture for offline STT.
 */
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import os from 'node:os';

const TARGET_DIR = path.join(process.cwd(), 'bin');
const BREW_API_URL = 'https://formulae.brew.sh/api/formula/whisper-cpp.json';

// Windows: Official release zip
const WINDOWS_ZIP_URL = 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.5.4/whisper-bin-x64.zip';

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function downloadFile(url, destPath, token = null) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const options = {};
    if (token) options.headers = { Authorization: `Bearer ${token}` };
    
    https.get(url, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
         return resolve(downloadFile(res.headers.location, destPath, token));
      }
      
      // Handle GHCR Auth
      if (res.statusCode === 401 && res.headers['www-authenticate']) {
         // Example: Bearer realm="https://ghcr.io/token",service="ghcr.io",scope="repository:homebrew/core/whisper-cpp:pull"
         const authHeader = res.headers['www-authenticate'];
         const realmMatch = authHeader.match(/realm="([^"]+)"/);
         const scopeMatch = authHeader.match(/scope="([^"]+)"/);
         if (realmMatch && scopeMatch) {
             const tokenUrl = `${realmMatch[1]}?service=ghcr.io&scope=${scopeMatch[1]}`;
             console.log(`Fetching anonymous token from: ${tokenUrl}`);
             return https.get(tokenUrl, (tokenRes) => {
                 let tokenData = '';
                 tokenRes.on('data', c => tokenData += c);
                 tokenRes.on('end', () => {
                     const tokenJson = JSON.parse(tokenData);
                     resolve(downloadFile(url, destPath, tokenJson.token));
                 });
             });
         }
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${res.statusCode}`));
      }
      
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
    }).on('error', reject);
  });
}

async function extractMacBottle(bottleUrl) {
  console.log('Extracting macOS binary from Homebrew bottle...');
  const tarPath = path.join(TARGET_DIR, 'mac-bottle.tar.gz');
  await downloadFile(bottleUrl, tarPath);
  
  const macDir = path.join(TARGET_DIR, 'mac');
  ensureDirectoryExists(macDir);
  
  // Extract whisper-cpp binary
  // The path inside the bottle is usually whisper-cpp/XXX/bin/whisper-cli
  // We can just use tar --strip-components or find it
  try {
    execSync(`tar -xzf "${tarPath}" -C "${macDir}"`);
    const findOutput = execSync(`find "${macDir}" -name "whisper-cli"`).toString().trim();
    if (findOutput) {
       fs.renameSync(findOutput, path.join(macDir, 'whisper-cli'));
       console.log('✅ macOS binary extracted to bin/mac/whisper-cli');
    }
    // Cleanup extraction artifacts
    fs.unlinkSync(tarPath);
    execSync(`find "${macDir}" -mindepth 1 -maxdepth 1 ! -name "whisper-cli" -exec rm -rf {} +`);
  } catch (e) {
    console.error('Failed to extract macOS binary:', e);
  }
}

async function extractWindowsZip() {
  console.log('Extracting Windows binary from GitHub zip...');
  const zipPath = path.join(TARGET_DIR, 'win-binaries.zip');
  await downloadFile(WINDOWS_ZIP_URL, zipPath);
  
  const winDir = path.join(TARGET_DIR, 'win');
  ensureDirectoryExists(winDir);

  try {
    // Unzip utility
    execSync(`unzip -p "${zipPath}" main.exe > "${path.join(winDir, 'whisper-cli.exe')}"`);
    console.log('✅ Windows binary extracted to bin/win/whisper-cli.exe');
    fs.unlinkSync(zipPath);
  } catch (e) {
    console.error('Failed to extract Windows binary:', e);
  }
}

async function getMacBottleUrl() {
  return new Promise((resolve, reject) => {
    let data = '';
    https.get(BREW_API_URL, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let targetBottle = null;
          if (os.arch() === 'arm64') {
             targetBottle = json.bottle.stable.files.arm64_sonoma || json.bottle.stable.files.arm64_ventura;
          } else {
             targetBottle = json.bottle.stable.files.sonoma || json.bottle.stable.files.ventura;
          }
          resolve(targetBottle.url);
        } catch (e) {
          reject('Failed to parse brew api json');
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  ensureDirectoryExists(TARGET_DIR);
  
  try {
    const macUrl = await getMacBottleUrl();
    await extractMacBottle(macUrl);
    await extractWindowsZip();
    console.log('🎉 All binaries successfully acquired!');
  } catch (e) {
    console.error('Extraction script failed:', e);
  }
}

main();
