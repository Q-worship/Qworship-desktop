/**
 * NdiManager — TypeScript port of the qworship-ndi-bridge NdiManager.
 *
 * Wraps the `@stagetimerio/grandiose` NDI sender native module.
 * The NDI Runtime DLL must be present either:
 *   - In the same directory as the .exe (packaged builds via extraFiles)
 *   - Or on the system PATH (dev: install NDI Tools from ndi.video)
 */


// eslint-disable-next-line @typescript-eslint/no-explicit-any
let grandiose: any = null;
let grandioseError: { message: string; details: string; solution: string } | null = null;

try {
  // grandiose is a CJS native addon — require() is intentional here
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  grandiose = require('@stagetimerio/grandiose');
  console.log('[NdiManager] grandiose module loaded successfully');
} catch (e: unknown) {
  const err = e as Error;
  console.error(
    '[NdiManager] CRITICAL: grandiose native module could not be loaded.\n' +
    'Make sure the NDI Runtime is installed.\n' +
    'Download from: https://www.ndi.tv/tools/\n' +
    'Error:', err.message,
  );
  grandioseError = {
    message: 'NDI Runtime not found',
    details: err.message,
    solution: 'Download and install NDI Tools from https://www.ndi.tv/tools/',
  };
}

// ─── NdiSender ────────────────────────────────────────────────────────────────

class NdiSender {
  private readonly _index: number;
  private readonly _name: string;
  private readonly _width: number;
  private readonly _height: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _sender: any = null;
  private _frameCount = 0;
  private _lastFpsCheck = Date.now();
  private _fps = 0;
  private _bytesSent = 0;
  private _lastBitCheck = Date.now();
  private _bitrateMbps = 0;

  constructor(index: number, name: string, width: number, height: number) {
    this._index = index;
    this._name = name;
    this._width = width;
    this._height = height;
    this._init();
  }

  private async _init() {
    if (!grandiose) return;
    try {
      const senderObj = await grandiose.send({
        name: this._name,
        clockVideo: true,
        clockAudio: false,
      });
      this._sender = senderObj;
      console.log(`[NdiSender ${this._index}] NDI sender "${this._name}" initialised`);
    } catch (e: unknown) {
      console.error(`[NdiSender ${this._index}] Failed to create NDI sender:`, (e as Error).message);
    }
  }

  sendFrame(bgraBuffer: Buffer, width: number, height: number) {
    if (!this._sender) return;

    this._frameCount++;
    this._bytesSent += bgraBuffer.byteLength;
    const now = Date.now();

    if (now - this._lastFpsCheck >= 1000) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastFpsCheck = now;
    }
    if (now - this._lastBitCheck >= 1000) {
      this._bitrateMbps = parseFloat(((this._bytesSent * 8) / 1_000_000).toFixed(1));
      this._bytesSent = 0;
      this._lastBitCheck = now;
    }

    try {
      this._sender.video({
        xres: width,
        yres: height,
        frameRateN: 60000,
        frameRateD: 1001,
        pictureAspectRatio: width / height,
        frameFormatType: grandiose.FORMAT_TYPE_PROGRESSIVE,
        fourCC: 1095911234, // BGRA
        lineStrideBytes: width * 4,
        data: bgraBuffer,
      }).catch(() => {
        // Suppress per-frame drop errors to prevent console spam
      });
    } catch (e: unknown) {
      console.error(`[NdiSender ${this._index}] sendFrame sync error:`, (e as Error).message);
    }
  }

  get fps() { return this._fps; }
  get bitrateMbps() { return this._bitrateMbps; }

  destroy() {
    if (this._sender) {
      try { this._sender.destroy(); } catch (_) {}
      this._sender = null;
    }
  }
}

// ─── NdiManager ───────────────────────────────────────────────────────────────

export class NdiManager {
  private _senders: (NdiSender | null)[] = [null, null];

  static getGrandioseError() {
    return grandioseError;
  }

  createSender(index: number, name: string, width: number, height: number): NdiSender {
    if (this._senders[index]) this._senders[index]!.destroy();
    const s = new NdiSender(index, name, width, height);
    this._senders[index] = s;
    return s;
  }

  getFpsStats(): number[] {
    return this._senders.map((s) => (s ? s.fps : 0));
  }

  getBitrateStats(): number[] {
    return this._senders.map((s) => (s ? s.bitrateMbps : 0));
  }

  destroy() {
    this._senders.forEach((s) => s && s.destroy());
    this._senders = [null, null];
  }
}
