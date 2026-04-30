// AudioWorklet processor — runs in a dedicated audio thread (NOT the main thread).
// This replaces the deprecated ScriptProcessorNode which caused native ACCESS_VIOLATION
// crashes (0xC0000005) in Electron's Chromium renderer process on Windows.
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0] || input[0].length === 0) return true;

    const channelCount = input.length;
    const frameLength = input[0].length;
    const mixBuffer = new Float32Array(frameLength);

    for (let channel = 0; channel < channelCount; channel += 1) {
      const channelData = input[channel];
      if (!channelData) continue;
      for (let i = 0; i < frameLength; i += 1) {
        mixBuffer[i] += channelData[i] / channelCount;
      }
    }

    // Downsample to 16kHz and convert Float32 → PCM16
    // whisper.cpp requires 16kHz mono audio for inference
    const ratio = Math.max(1, Math.floor(sampleRate / 16000));
    const outputLength = Math.floor(mixBuffer.length / ratio);
    const pcm16 = new Int16Array(outputLength);

    let outIndex = 0;
    let maxFloat = 0;
    const softwareGain = 8;
    for (
      let i = 0;
      i < mixBuffer.length && outIndex < outputLength;
      i += ratio
    ) {
      const amplified = mixBuffer[i] * softwareGain;
      if (Math.abs(amplified) > maxFloat) maxFloat = Math.abs(amplified);
      const s = Math.max(-1, Math.min(1, amplified));
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
