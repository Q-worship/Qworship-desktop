const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const resourcesPath = path.resolve(__dirname, '../dist/win-unpacked/resources');

function getPackagedModulePackageJsonCandidates(moduleName) {
  return [
    path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', moduleName, 'package.json'),
    path.join(resourcesPath, 'app.asar.unpacked', 'apps', 'client', 'node_modules', moduleName, 'package.json'),
    path.join(resourcesPath, 'node_modules', moduleName, 'package.json'),
    path.join(resourcesPath, 'apps', 'client', 'node_modules', moduleName, 'package.json'),
  ];
}

function resolveModulePackageDir(moduleName) {
  const packagedPackageJson = getPackagedModulePackageJsonCandidates(moduleName).find(candidate => fs.existsSync(candidate));
  if (!packagedPackageJson) {
    throw new Error(`Could not find packaged package.json for ${moduleName}`);
  }
  return path.dirname(packagedPackageJson);
}

function loadPackagedAwareModule(moduleName) {
  const packagedPackageJson = getPackagedModulePackageJsonCandidates(moduleName).find(candidate => fs.existsSync(candidate));
  if (!packagedPackageJson) {
    throw new Error(`Could not find packaged package.json for ${moduleName}`);
  }
  return createRequire(packagedPackageJson)(moduleName);
}

const koffi = loadPackagedAwareModule('koffi');
const voskDir = resolveModulePackageDir('vosk');
const koffiBinary = path.join(resolveModulePackageDir('koffi'), 'build', 'koffi', 'win32_x64', 'koffi.node');
const voskDll = path.join(voskDir, 'lib', 'win-x86_64', 'libvosk.dll');

console.log(JSON.stringify({
  resourcesPath,
  koffiLoaded: Boolean(koffi),
  koffiDir: resolveModulePackageDir('koffi'),
  koffiBinaryExists: fs.existsSync(koffiBinary),
  voskDir,
  voskDllExists: fs.existsSync(voskDll)
}, null, 2));
