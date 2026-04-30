const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const voskEntry = path.join(repoRoot, 'node_modules', '.pnpm', 'vosk@0.3.39', 'node_modules', 'vosk', 'index.js');

if (!fs.existsSync(voskEntry)) {
  console.error(`[patch-vosk-electron-runtime] Vosk entry not found: ${voskEntry}`);
  process.exit(1);
}

const hasDesiredPatch = source =>
  source.includes("const ffi = require(resolveTigerConnectModule('ffi-napi'));") &&
  source.includes("const ref = require(resolveTigerConnectModule('ref-napi'));") &&
  source.includes("const kernel32 = os.platform() === 'win32'") &&
  source.includes("const resolveWin32VoskDllDirectory = () => {") &&
  source.includes("kernel32.SetDllDirectoryA(dllDirectory);") &&
  source.includes("soname = path.join(dllDirectory, 'libvosk.dll')");

const replacementBlock = `const resolveTigerConnectModule = (packageName) => {
    const fs = require('fs');
    const regularPath = packageName;
    const devPath = path.resolve(__dirname, '..', '..', '..', '..', '..', 'apps', 'client', 'node_modules', '@tigerconnect', packageName);
    if (fs.existsSync(devPath)) {
        return devPath;
    }
    if (process.resourcesPath) {
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@tigerconnect', packageName);
        if (fs.existsSync(unpackedPath)) {
            return unpackedPath;
        }
    }
    return regularPath;
};
const resolveWin32VoskDllDirectory = () => {
    const defaultDirectory = path.resolve(path.join(__dirname, "lib", "win-x86_64"));
    if (process.resourcesPath) {
        const unpackedDirectory = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'vosk', 'lib', 'win-x86_64');
        if (require('fs').existsSync(unpackedDirectory)) {
            return unpackedDirectory;
        }
    }
    return defaultDirectory;
};
/** @type {import('ffi-napi')} */
const ffi = require(resolveTigerConnectModule('ffi-napi'));
/** @type {import('ref-napi')} */
const ref = require(resolveTigerConnectModule('ref-napi'));
const kernel32 = os.platform() === 'win32'
    ? ffi.Library('kernel32', {
        SetDllDirectoryA: ['bool', ['string']],
    })
    : null;`;

const win32BlockRegex = /if \(os\.platform\(\) == 'win32'\) \{[\s\S]*?soname = path\.join\(__dirname, "lib", "win-x86_64", "libvosk\.dll"\)\n\} else if \(os\.platform\(\) == 'darwin'\) \{/;
const win32BlockReplacement = `if (os.platform() == 'win32') {
    // Update path to load dependent dlls
    let currentPath = process.env.Path;
    let dllDirectory = resolveWin32VoskDllDirectory();
    process.env.Path = dllDirectory + path.delimiter + currentPath;
    if (kernel32) {
        kernel32.SetDllDirectoryA(dllDirectory);
    }

    soname = path.join(dllDirectory, 'libvosk.dll')
} else if (os.platform() == 'darwin') {`;

let source = fs.readFileSync(voskEntry, 'utf8');

if (hasDesiredPatch(source)) {
  console.log(`[patch-vosk-electron-runtime] Desired runtime patch already present in ${voskEntry}`);
  process.exit(0);
}

const hasTigerConnectBlock =
  source.includes("const ffi = require(resolveTigerConnectModule('ffi-napi'));") &&
  source.includes("const ref = require(resolveTigerConnectModule('ref-napi'));") &&
  source.includes("const kernel32 = os.platform() === 'win32'");

if (hasTigerConnectBlock) {
  source = source.replace(/const resolveWin32VoskDllDirectory = \(\) => \{[\s\S]*?\};\n?/g, '');
  source = source.replace(/const resolveTigerConnectModule = \(packageName\) => \{[\s\S]*?return regularPath;\n\};/, `const resolveTigerConnectModule = (packageName) => {\n    const fs = require('fs');\n    const regularPath = packageName;\n    const devPath = path.resolve(__dirname, '..', '..', '..', '..', '..', 'apps', 'client', 'node_modules', '@tigerconnect', packageName);\n    if (fs.existsSync(devPath)) {\n        return devPath;\n    }\n    if (process.resourcesPath) {\n        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@tigerconnect', packageName);\n        if (fs.existsSync(unpackedPath)) {\n            return unpackedPath;\n        }\n    }\n    return regularPath;\n};\nconst resolveWin32VoskDllDirectory = () => {\n    const defaultDirectory = path.resolve(path.join(__dirname, \"lib\", \"win-x86_64\"));\n    if (process.resourcesPath) {\n        const unpackedDirectory = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'vosk', 'lib', 'win-x86_64');\n        if (require('fs').existsSync(unpackedDirectory)) {\n            return unpackedDirectory;\n        }\n    }\n    return defaultDirectory;\n};`);
  source = source.replace("let dllDirectory = path.resolve(path.join(__dirname, \"lib\", \"win-x86_64\"));", "let dllDirectory = resolveWin32VoskDllDirectory();");
  source = source.replace("soname = path.join(__dirname, \"lib\", \"win-x86_64\", \"libvosk.dll\")", "soname = path.join(dllDirectory, 'libvosk.dll')");
} else {
  source = source.replace(/const resolveTigerConnectModule = \(packageName\) => \{[\s\S]*?const kernel32 = os\.platform\(\) === 'win32'[\s\S]*?: null;\n?/g, '');
  source = source.replace(/\/\*\* @type \{import\('ffi-napi'\)\} \*\/\s*const ffi = require\([^\n]+\);\s*\/\*\* @type \{import\('ref-napi'\)\} \*\/\s*const ref = require\([^\n]+\);/, replacementBlock);
  source = source.replace(win32BlockRegex, win32BlockReplacement);
  source = source.replace("soname = path.join(__dirname, \"lib\", \"win-x86_64\", \"libvosk.dll\")", "soname = path.join(dllDirectory, 'libvosk.dll')");
}

if (!hasDesiredPatch(source)) {
  console.error('[patch-vosk-electron-runtime] Failed to apply TigerConnect runtime patch cleanly.');
  process.exit(1);
}

fs.writeFileSync(voskEntry, source, 'utf8');
console.log(`[patch-vosk-electron-runtime] Ensured TigerConnect runtime patch in ${voskEntry}`);
