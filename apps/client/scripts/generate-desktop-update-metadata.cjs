const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const releaseDirName = process.env.QWORSHIP_UPDATE_RELEASE_DIR || 'release-hfb-mode-fix-v2';
const channel = process.env.QWORSHIP_UPDATE_CHANNEL || 'stable';
const releaseDir = path.resolve(__dirname, '..', releaseDirName);
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const latestYmlPath = path.join(releaseDir, 'latest.yml');

function fail(message) {
  console.error(`[generate-desktop-update-metadata] ${message}`);
  process.exit(1);
}

function base64Sha512(filePath) {
  const hash = crypto.createHash('sha512');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('base64');
}

function isoDateForFile(filePath) {
  return new Date(fs.statSync(filePath).mtimeMs).toISOString();
}

function yamlEscape(value) {
  return String(value).replace(/'/g, "''");
}

if (!fs.existsSync(releaseDir)) {
  fail(`Release directory not found: ${releaseDir}`);
}

if (!fs.existsSync(packageJsonPath)) {
  fail(`package.json not found: ${packageJsonPath}`);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!version) {
  fail('Package version is missing in package.json');
}

const releaseFiles = fs.readdirSync(releaseDir);
const installers = releaseFiles
  .filter((file) => /^Qworship Live Console Setup .+\.exe$/i.test(file))
  .map((file) => {
    const absolutePath = path.join(releaseDir, file);
    return {
      file,
      absolutePath,
      mtimeMs: fs.statSync(absolutePath).mtimeMs,
    };
  })
  .sort((a, b) => b.mtimeMs - a.mtimeMs);

if (!installers.length) {
  fail(`No Windows installer found in ${releaseDir}`);
}

const installer = installers[0];
const blockmapPath = `${installer.absolutePath}.blockmap`;

if (!fs.existsSync(blockmapPath)) {
  fail(`Missing blockmap for installer: ${installer.file}`);
}

const sha512 = base64Sha512(installer.absolutePath);
const size = fs.statSync(installer.absolutePath).size;
const releaseDate = isoDateForFile(installer.absolutePath);

const latestYml = [
  `version: '${yamlEscape(version)}'`,
  `channel: '${yamlEscape(channel)}'`,
  'files:',
  `  - url: '${yamlEscape(installer.file)}'`,
  `    sha512: '${yamlEscape(sha512)}'`,
  `    size: ${size}`,
  `path: '${yamlEscape(installer.file)}'`,
  `sha512: '${yamlEscape(sha512)}'`,
  `releaseDate: '${yamlEscape(releaseDate)}'`,
].join('\n') + '\n';

fs.writeFileSync(latestYmlPath, latestYml, 'utf8');

console.log(`[generate-desktop-update-metadata] Wrote ${latestYmlPath}`);
console.log(`[generate-desktop-update-metadata] Installer: ${installer.file}`);
console.log(`[generate-desktop-update-metadata] Channel: ${channel}`);
