import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { app } from 'electron';
import { createRequire } from 'module';

const _require = typeof require !== 'undefined' ? require : createRequire(import.meta.url);

function getPackagedModulePackageJsonCandidates(moduleName: string) {
    if (!process.resourcesPath) {
        return [];
    }

    return [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', moduleName, 'package.json'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'apps', 'client', 'node_modules', moduleName, 'package.json'),
        path.join(process.resourcesPath, 'node_modules', moduleName, 'package.json'),
        path.join(process.resourcesPath, 'apps', 'client', 'node_modules', moduleName, 'package.json')
    ];
}

function resolveModulePackageDir(moduleName: string) {
    try {
        return path.dirname(_require.resolve(`${moduleName}/package.json`));
    } catch (error) {
        if (!app.isPackaged) {
            throw error;
        }

        const packagedPackageJson = getPackagedModulePackageJsonCandidates(moduleName).find(candidate => fs.existsSync(candidate));
        if (!packagedPackageJson) {
            throw error;
        }

        return path.dirname(packagedPackageJson);
    }
}

function loadPackagedAwareModule<T = any>(moduleName: string): T {
    try {
        return _require(moduleName);
    } catch (error) {
        if (!app.isPackaged) {
            throw error;
        }

        const packagedPackageJson = getPackagedModulePackageJsonCandidates(moduleName).find(candidate => fs.existsSync(candidate));
        if (!packagedPackageJson) {
            throw error;
        }

        return createRequire(packagedPackageJson)(moduleName) as T;
    }
}

const koffi = loadPackagedAwareModule('koffi');
const voskDir = resolveModulePackageDir('vosk');

let soname;
if (os.platform() === 'win32') {
    const dllDirectory = path.resolve(path.join(voskDir, 'lib', 'win-x86_64'));
    if (process.env.Path) {
        process.env.Path = process.env.Path + path.delimiter + dllDirectory;
    } else {
        process.env.Path = dllDirectory;
    }
    soname = path.join(dllDirectory, 'libvosk.dll');
} else if (os.platform() === 'darwin') {
    soname = path.join(voskDir, 'lib', 'osx-universal', 'libvosk.dylib');
} else {
    soname = path.join(voskDir, 'lib', 'linux-x86_64', 'libvosk.so');
}

const libvosk = koffi.load(soname);

const vosk_model_ptr = koffi.pointer('vosk_model', koffi.opaque());
const vosk_spk_model_ptr = koffi.pointer('vosk_spk_model', koffi.opaque());
const vosk_recognizer_ptr = koffi.pointer('vosk_recognizer', koffi.opaque());

const vosk_set_log_level = libvosk.func('vosk_set_log_level', 'void', ['int']);
const vosk_model_new = libvosk.func('vosk_model_new', vosk_model_ptr, ['str']);
const vosk_model_free = libvosk.func('vosk_model_free', 'void', [vosk_model_ptr]);
const vosk_recognizer_new = libvosk.func('vosk_recognizer_new', vosk_recognizer_ptr, [vosk_model_ptr, 'float']);
const vosk_recognizer_new_grm = libvosk.func('vosk_recognizer_new_grm', vosk_recognizer_ptr, [vosk_model_ptr, 'float', 'str']);
const vosk_recognizer_free = libvosk.func('vosk_recognizer_free', 'void', [vosk_recognizer_ptr]);
const vosk_recognizer_accept_waveform = libvosk.func('vosk_recognizer_accept_waveform', 'bool', [vosk_recognizer_ptr, 'uint8_t*', 'int']);
const vosk_recognizer_result = libvosk.func('vosk_recognizer_result', 'str', [vosk_recognizer_ptr]);
const vosk_recognizer_final_result = libvosk.func('vosk_recognizer_final_result', 'str', [vosk_recognizer_ptr]);
const vosk_recognizer_partial_result = libvosk.func('vosk_recognizer_partial_result', 'str', [vosk_recognizer_ptr]);

export function setLogLevel(level: number) {
    vosk_set_log_level(level);
}

export class Model {
    handle: any;
    constructor(modelPath: string) {
        this.handle = vosk_model_new(modelPath);
    }
    free() {
        if (this.handle) {
            vosk_model_free(this.handle);
            this.handle = null;
        }
    }
}

export class Recognizer {
    handle: any;
    constructor(param: { model: Model, sampleRate: number, grammar?: string[] }) {
        if (param.grammar) {
            this.handle = vosk_recognizer_new_grm(param.model.handle, param.sampleRate, JSON.stringify(param.grammar));
        } else {
            this.handle = vosk_recognizer_new(param.model.handle, param.sampleRate);
        }
    }
    free() {
        if (this.handle) {
            vosk_recognizer_free(this.handle);
            this.handle = null;
        }
    }
    acceptWaveform(buffer: Buffer) {
        return vosk_recognizer_accept_waveform(this.handle, buffer, buffer.length);
    }
    result() {
        return JSON.parse(vosk_recognizer_result(this.handle));
    }
    partialResult() {
        return JSON.parse(vosk_recognizer_partial_result(this.handle));
    }
    finalResult() {
        return JSON.parse(vosk_recognizer_final_result(this.handle));
    }
}
