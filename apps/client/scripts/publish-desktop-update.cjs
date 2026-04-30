const fs = require('node:fs');
const path = require('node:path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const releaseDirName = process.env.QWORSHIP_UPDATE_RELEASE_DIR || 'release-hfb-mode-fix-v2';
const channel = (process.env.QWORSHIP_UPDATE_CHANNEL || 'stable').trim();
const keyPrefixBase = (process.env.QWORSHIP_UPDATE_PREFIX || 'live-console-updates/win').replace(/^\/+|\/+$/g, '');
const publicBaseUrl = (process.env.QWORSHIP_UPDATE_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const bucket = process.env.QWORSHIP_UPDATE_BUCKET;
const region = process.env.QWORSHIP_UPDATE_REGION || 'auto';
const endpoint = process.env.QWORSHIP_UPDATE_ENDPOINT || undefined;

const releaseDir = path.resolve(__dirname, '..', releaseDirName);

function fail(message) {
  console.error(`[publish-desktop-update] ${message}`);
  process.exit(1);
}

function requireEnv(value, key) {
  if (!value || !String(value).trim()) {
    fail(`Missing required environment variable: ${key}`);
  }
  return String(value).trim();
}

function getInstallerArtifacts() {
  const files = fs.readdirSync(releaseDir);
  const installer = files.find((file) => /^Qworship Live Console Setup .+\.exe$/i.test(file));
  if (!installer) {
    fail(`Unable to find installer in ${releaseDir}`);
  }
  const blockmap = `${installer}.blockmap`;
  if (!fs.existsSync(path.join(releaseDir, blockmap))) {
    fail(`Missing installer blockmap: ${blockmap}`);
  }
  return { installer, blockmap };
}

function contentTypeFor(fileName) {
  if (fileName.endsWith('.yml')) return 'text/yaml; charset=utf-8';
  if (fileName.endsWith('.blockmap')) return 'application/octet-stream';
  if (fileName.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
  return 'application/octet-stream';
}

async function uploadFile(client, fileName) {
  const filePath = path.join(releaseDir, fileName);
  const body = fs.readFileSync(filePath);
  const key = `${keyPrefixBase}/${channel}/${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: requireEnv(bucket, 'QWORSHIP_UPDATE_BUCKET'),
      Key: key,
      Body: body,
      ContentType: contentTypeFor(fileName),
      CacheControl: fileName === 'latest.yml' ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable',
    }),
  );

  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${channel}/${fileName}` : `(bucket://${bucket}/${key})`;
  console.log(`[publish-desktop-update] Uploaded ${fileName} -> ${publicUrl}`);
}

async function main() {
  requireEnv(bucket, 'QWORSHIP_UPDATE_BUCKET');

  if (!fs.existsSync(releaseDir)) {
    fail(`Release directory not found: ${releaseDir}`);
  }

  const latestYmlPath = path.join(releaseDir, 'latest.yml');
  if (!fs.existsSync(latestYmlPath)) {
    fail(`Missing latest.yml in ${releaseDir}`);
  }

  const { installer, blockmap } = getInstallerArtifacts();

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(process.env.QWORSHIP_UPDATE_FORCE_PATH_STYLE === 'true' || endpoint),
  });

  for (const fileName of ['latest.yml', installer, blockmap]) {
    await uploadFile(client, fileName);
  }

  console.log('[publish-desktop-update] Publish complete.');
}

main().catch((error) => {
  console.error('[publish-desktop-update] Publish failed.', error);
  process.exit(1);
});
