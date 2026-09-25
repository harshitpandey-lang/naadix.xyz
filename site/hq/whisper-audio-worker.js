const TARGET_RATE = 16000;
const WINDOW_SAMPLES = TARGET_RATE * 5;
const OVERLAP_SAMPLES = TARGET_RATE;
const MIN_FINAL_SAMPLES = TARGET_RATE / 2;
let inputRate = 48000;
let carry = new Float32Array(0);
let position = 0;
let samples = [];
let active = true;
let windowHasSpeech = false;
let activitySamples = 0;
let activityEnergy = 0;

function resample(input) {
  const data = new Float32Array(carry.length + input.length);
  data.set(carry);
  data.set(input, carry.length);
  const step = inputRate / TARGET_RATE;
  const output = [];
  while (position + 1 < data.length) {
    const left = Math.floor(position);
    const mix = position - left;
    output.push(data[left] + (data[left + 1] - data[left]) * mix);
    position += step;
  }
  const keepFrom = Math.max(0, Math.floor(position));
  carry = data.slice(keepFrom);
  position -= keepFrom;
  return output;
}

function emitWindow(final = false) {
  if (samples.length < (final ? MIN_FINAL_SAMPLES : WINDOW_SAMPLES)) return false;
  const length = Math.min(samples.length, WINDOW_SAMPLES);
  const audio = Float32Array.from(samples.slice(0, length));
  if (windowHasSpeech) self.postMessage({ type: "window", audio, final }, [audio.buffer]);
  const consume = final ? samples.length : Math.max(1, length - OVERLAP_SAMPLES);
  samples = samples.slice(consume);
  windowHasSpeech = false;
  return true;
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "init") {
    inputRate = Number(message.inputRate) || 48000;
    active = true;
    return;
  }
  if (message.type === "pause") {
    active = false;
    emitWindow(true);
    self.postMessage({ type: "paused" });
    return;
  }
  if (message.type === "resume") {
    active = true;
    return;
  }
  if (message.type === "flush") {
    emitWindow(true);
    self.postMessage({ type: "flushed" });
    return;
  }
  if (message.type !== "audio" || !active) return;
  const output = resample(message.audio);
  for (const value of output) {
    samples.push(value);
    activityEnergy += value * value;
    activitySamples += 1;
  }
  if (activitySamples >= TARGET_RATE / 2) {
    const rms = Math.sqrt(activityEnergy / activitySamples);
    if (rms > 0.004) windowHasSpeech = true;
    self.postMessage({ type: "activity", speaking: rms > 0.004 });
    activitySamples = 0;
    activityEnergy = 0;
  }
  while (samples.length >= WINDOW_SAMPLES) emitWindow(false);
};

