// AudioWorklet processor — runs in a dedicated audio thread (NOT the main thread).
// This replaces the deprecated ScriptProcessorNode which caused native ACCESS_VIOLATION
// crashes (0xC0000005) in Electron's Chromium renderer process on Windows.
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const inputData = input[0]; // Float32Array (-1.0 to 1.0)

    // Downsample to 16kHz and convert Float32 → PCM16
    // whisper.cpp requires 16kHz mono audio for inference
    const ratio = Math.max(1, Math.floor(sampleRate / 16000));
    const outputLength = Math.floor(inputData.length / ratio);
    const pcm16 = new Int16Array(outputLength);

    let outIndex = 0;
    let maxFloat = 0;
    for (
      let i = 0;
      i < inputData.length && outIndex < outputLength;
      i += ratio
    ) {
      if (Math.abs(inputData[i]) > maxFloat) maxFloat = Math.abs(inputData[i]);
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcm16[outIndex++] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Transfer the raw ArrayBuffer and diagnostic volume
    this.port.postMessage(
      {
        buffer: pcm16.buffer,
        maxFloat: maxFloat,
      },
      [pcm16.buffer],
    );
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
