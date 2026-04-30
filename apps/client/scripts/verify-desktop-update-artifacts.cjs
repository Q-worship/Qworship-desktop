const fs = require('node:fs');
const path = require('node:path');

const releaseDirName = process.env.QWORSHIP_UPDATE_RELEASE_DIR || 'release-hfb-mode-fix-v2';
const releaseDir = path.resolve(__dirname, '..', releaseDirName);

const requiredFiles = ['latest.yml'];

function fail(message) {
  console.error(`[verify-desktop-update-artifacts] ${message}`);
  process.exit(1);
}

function findInstallerArtifacts() {
  const files = fs.readdirSync(releaseDir);
  const installer = files.find((file) => /^Qworship Live Console Setup .+\.exe$/i.test(file));
  const blockmap = installer ? `${installer}.blockmap` : null;
  return { installer, blockmap };
}

if (!fs.existsSync(releaseDir)) {
  fail(`Release directory not found: ${releaseDir}`);
}

for (const file of requiredFiles) {
  const absolutePath = path.join(releaseDir, file);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required update metadata file: ${absolutePath}`);
  }
}

const latestYmlPath = path.join(releaseDir, 'latest.yml');
const latestYml = fs.readFileSync(latestYmlPath, 'utf8');

if (!/version:\s*['"]?.+['"]?/i.test(latestYml)) {
  fail('latest.yml is missing a version field.');
}

if (!/path:\s*['"]?.+\.exe['"]?/i.test(latestYml)) {
  fail('latest.yml is missing the installer path field.');
}

const { installer, blockmap } = findInstallerArtifacts();

if (!installer) {
  fail(`No Windows installer was found in ${releaseDir}`);
}

if (!blockmap || !fs.existsSync(path.join(releaseDir, blockmap))) {
  fail(`Missing blockmap for installer ${installer}`);
}

console.log('[verify-desktop-update-artifacts] Release artifacts verified successfully.');
console.log(`[verify-desktop-update-artifacts] Release directory: ${releaseDir}`);
console.log(`[verify-desktop-update-artifacts] Installer: ${installer}`);
console.log(`[verify-desktop-update-artifacts] Blockmap: ${blockmap}`);
console.log(`[verify-desktop-update-artifacts] Metadata: latest.yml`);
