class NaadixWhisperCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.blocks = [];
    this.length = 0;
  }

  process(inputs) {
    const channels = inputs[0];
    if (!channels?.length) return true;
    const mono = new Float32Array(channels[0].length);
    for (const channel of channels) {
      for (let index = 0; index < mono.length; index += 1) mono[index] += channel[index] / channels.length;
    }
    this.blocks.push(mono);
    this.length += mono.length;
    if (this.length >= 2048) {
      const chunk = new Float32Array(this.length);
      let offset = 0;
      for (const block of this.blocks) {
        chunk.set(block, offset);
        offset += block.length;
      }
      this.blocks = [];
      this.length = 0;
      this.port.postMessage(chunk, [chunk.buffer]);
    }
    return true;
  }
}

registerProcessor("naadix-whisper-capture", NaadixWhisperCaptureProcessor);

