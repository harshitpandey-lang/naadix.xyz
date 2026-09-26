const MODEL = {
  id: "ggml-tiny.en-q5_1-v1",
  name: "tiny.en Q5_1",
  bytes: 32166155,
  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en-q5_1.bin",
};
const ASSET_ROOT = "/assets/hq/whisper/";
const HQ_ASSET_ROOT = "/assets/hq/";
const DB_NAME = "naadix-local-whisper";
const DB_VERSION = 1;
const STORE_NAME = "models";
let runtimePromise = null;
let runtimeModule = null;
let modelPromise = null;
const RUNTIME_INIT_TIMEOUT_MS = 180000;

export const LOCAL_WHISPER_MODEL = Object.freeze({ ...MODEL });

function hasWasmSimd() {
  try {
    return WebAssembly.validate(Uint8Array.from([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
  } catch {
    return false;
  }
}

export function detectLocalWhisperCapability(scope = globalThis) {
  if (!scope.isSecureContext) return { supported: false, reason: "Local transcription requires a secure HTTPS page." };
  if (!scope.WebAssembly || !scope.Worker || !scope.indexedDB) return { supported: false, reason: "This device is missing WebAssembly, Worker, or browser storage support." };
  if (!scope.crossOriginIsolated || typeof scope.SharedArrayBuffer === "undefined") return { supported: false, reason: "Local transcription isolation is unavailable. Reload this Meetings page, then retry." };
  if (!hasWasmSimd()) return { supported: false, reason: "This device does not support the WebAssembly SIMD instructions required by local Whisper." };
  const memory = Number(scope.navigator?.deviceMemory || 4);
  if (memory && memory < 4) return { supported: false, reason: "This device does not have enough memory for the local speech engine (4 GB recommended)." };
  return { supported: true, reason: "" };
}

function openModelDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local model storage."));
  });
}

async function readCachedModel() {
  const db = await openModelDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(MODEL.id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function cacheModel(blob) {
  const db = await openModelDb();
  try {
    await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(blob, MODEL.id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function downloadModel(onState) {
  const response = await fetch(MODEL.url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error(`Local speech model download failed (${response.status}).`);
  const total = Number(response.headers.get("content-length")) || MODEL.bytes;
  if (!response.body) {
    const blob = await response.blob();
    onState?.("downloading", 100);
    return blob;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    onState?.("downloading", Math.min(100, Math.round((received / total) * 100)));
  }
  return new Blob(chunks, { type: "application/octet-stream" });
}

async function loadModel(onState) {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    onState?.("preparing");
    let blob = await readCachedModel().catch(() => null);
    if (!(blob instanceof Blob) || blob.size !== MODEL.bytes) {
      blob = await downloadModel(onState);
      if (blob.size !== MODEL.bytes) throw new Error(`The local speech model is incomplete (${blob.size} of ${MODEL.bytes} bytes).`);
      await cacheModel(blob);
      navigator.storage?.persist?.().catch(() => false);
    }
    onState?.("model-ready");
    return new Uint8Array(await blob.arrayBuffer());
  })().catch((error) => {
    modelPromise = null;
    throw error;
  });
  return modelPromise;
}

function loadRuntime() {
  if (runtimeModule) return Promise.resolve(runtimeModule);
  if (!runtimePromise) runtimePromise = new Promise((resolve, reject) => {
    const previous = globalThis.Module;
    globalThis.Module = {
      locateFile: (path) => `${ASSET_ROOT}${path}`,
      print: () => {},
      printErr: (message) => { if (/error|failed|abort/i.test(String(message))) console.error("Local Whisper:", message); },
      onAbort: (message) => reject(new Error(`Local Whisper could not start: ${message}`)),
      onRuntimeInitialized() {
        runtimeModule = globalThis.Module;
        resolve(runtimeModule);
      },
    };
    const script = document.createElement("script");
    script.src = `${ASSET_ROOT}libstream.js`;
    script.async = true;
    script.onerror = () => {
      globalThis.Module = previous;
      reject(new Error("The local Whisper WebAssembly runtime could not be loaded."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    runtimePromise = null;
    throw error;
  });

  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Local Whisper is still initializing. Keep this tab open, then press Retry.")), RUNTIME_INIT_TIMEOUT_MS);
  });
  return Promise.race([runtimePromise, deadline]).finally(() => clearTimeout(timeout));
}

export class LocalWhisperTranscriber {
  constructor({ onState, onTemporary, onSegment, onError } = {}) {
    this.onState = onState || (() => {});
    this.onTemporary = onTemporary || (() => {});
    this.onSegment = onSegment || (() => {});
    this.onError = onError || (() => {});
    this.module = null;
    this.instance = null;
    this.context = null;
    this.source = null;
    this.capture = null;
    this.sink = null;
    this.audioWorker = null;
    this.pollTimer = null;
    this.audioQueue = [];
    this.pending = false;
    this.pendingSince = 0;
    this.sawRunning = false;
    this.flushed = false;
    this.running = false;
  }

  async prepare() {
    const capability = detectLocalWhisperCapability();
    if (!capability.supported) throw new Error(capability.reason);
    this.onState("preparing");
    const [module, model] = await Promise.all([loadRuntime(), loadModel(this.onState)]);
    this.module = module;
    try { module.FS_unlink("whisper.bin"); } catch {}
    module.FS_createDataFile("/", "whisper.bin", model, true, false);
    if (!this.instance) {
      try { this.instance = module.init("whisper.bin", "en"); }
      catch (error) {
        if (!/expected 1 args/i.test(String(error))) throw error;
        this.instance = module.init("whisper.bin");
      }
    }
    if (!this.instance) throw new Error("The local Whisper model could not be initialized on this device.");
    this.onState("ready");
  }

  async start(stream) {
    if (!this.instance) await this.prepare();
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is unavailable on this device.");
    this.context = new AudioContextClass({ latencyHint: "interactive" });
    await this.context.resume();
    this.source = this.context.createMediaStreamSource(stream);
    let workletReady = false;
    if (this.context.audioWorklet && globalThis.AudioWorkletNode) {
      try {
        await Promise.race([
          this.context.audioWorklet.addModule(`${HQ_ASSET_ROOT}whisper-audio-worklet.js`),
          new Promise((_, reject) => setTimeout(() => reject(new Error("AudioWorklet initialization timed out.")), 3000)),
        ]);
        this.capture = new AudioWorkletNode(this.context, "naadix-whisper-capture", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
        workletReady = true;
      } catch (error) {
        console.warn("Local transcription is using the compatible audio capture fallback:", error.message);
      }
    }
    if (!workletReady) this.capture = this.context.createScriptProcessor(4096, 1, 1);
    this.sink = this.context.createGain();
    this.sink.gain.value = 0;
    this.source.connect(this.capture).connect(this.sink).connect(this.context.destination);
    this.audioWorker = new Worker(`${HQ_ASSET_ROOT}whisper-audio-worker.js`);
    this.audioWorker.onmessage = (event) => this.handleAudioMessage(event.data);
    this.audioWorker.onerror = () => this.fail(new Error("The local audio processing worker stopped unexpectedly."));
    this.audioWorker.postMessage({ type: "init", inputRate: this.context.sampleRate });
    const forwardAudio = (audio) => {
      if (!this.running || !this.audioWorker) return;
      this.audioWorker.postMessage({ type: "audio", audio }, [audio.buffer]);
    };
    if (workletReady) this.capture.port.onmessage = (event) => forwardAudio(event.data);
    else this.capture.onaudioprocess = (event) => forwardAudio(new Float32Array(event.inputBuffer.getChannelData(0)));
    this.module.set_status("");
    this.running = true;
    this.flushed = false;
    this.pollTimer = setInterval(() => this.poll(), 120);
    this.onState("listening");
  }

  handleAudioMessage(message) {
    if (message.type === "activity") {
      this.onTemporary(message.speaking ? "Transcribing current speechâ€¦" : "Listening for speechâ€¦");
    } else if (message.type === "window") {
      this.audioQueue.push(message.audio);
      this.onState("transcribing");
      this.pump();
    } else if (message.type === "flushed" || message.type === "paused") {
      this.flushed = true;
    }
  }

  pump() {
    if (this.pending || !this.audioQueue.length || !this.instance) return;
    const audio = this.audioQueue.shift();
    this.module.set_audio(this.instance, audio);
    this.pending = true;
    this.pendingSince = performance.now();
    this.sawRunning = false;
  }

  poll() {
    if (!this.module) return;
    try {
      const status = String(this.module.get_status?.() || "");
      if (/running whisper/i.test(status)) this.sawRunning = true;
      const text = String(this.module.get_transcribed?.() || "").trim();
      if (text) {
        this.pending = false;
        this.onSegment(text, { speakerId: null, source: "whisper.cpp", finalized: true, endedAt: Date.now() });
      } else if (this.pending && /waiting for audio/i.test(status) && (this.sawRunning || performance.now() - this.pendingSince > 2500)) {
        this.pending = false;
      }
      this.pump();
      if (this.running && !this.pending && !this.audioQueue.length) this.onState("listening");
    } catch (error) {
      this.fail(error);
    }
  }

  async pause() {
    if (!this.audioWorker) return;
    this.running = false;
    this.flushed = false;
    this.audioWorker.postMessage({ type: "pause" });
    this.module?.set_status("paused");
    await this.waitForFlush(3000);
    this.onState("paused");
  }

  async resume() {
    if (!this.audioWorker) return;
    this.flushed = false;
    this.running = true;
    await this.context?.resume();
    this.module?.set_status("");
    this.audioWorker.postMessage({ type: "resume" });
    this.onState("listening");
  }

  async finalize() {
    if (!this.audioWorker) return;
    this.running = false;
    this.flushed = false;
    this.audioWorker.postMessage({ type: "flush" });
    await this.waitForFlush(3000);
    const started = performance.now();
    while ((this.audioQueue.length || this.pending) && performance.now() - started < 30000) {
      this.poll();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    this.poll();
    this.teardownCapture();
    this.onTemporary("");
    this.onState("ready");
  }

  waitForFlush(timeout) {
    const started = performance.now();
    return new Promise((resolve) => {
      const check = () => {
        if (this.flushed || performance.now() - started >= timeout) resolve();
        else setTimeout(check, 40);
      };
      check();
    });
  }

  teardownCapture() {
    clearInterval(this.pollTimer);
    this.pollTimer = null;
    try { this.source?.disconnect(); } catch {}
    try { this.capture?.disconnect(); } catch {}
    try { this.sink?.disconnect(); } catch {}
    this.audioWorker?.terminate();
    if (this.capture && "onaudioprocess" in this.capture) this.capture.onaudioprocess = null;
    this.context?.close().catch(() => {});
    this.audioWorker = null;
    this.context = null;
    this.source = null;
    this.capture = null;
    this.sink = null;
    this.audioQueue = [];
    this.pending = false;
  }

  fail(error) {
    this.running = false;
    this.teardownCapture();
    this.onState("error");
    this.onError(error instanceof Error ? error : new Error(String(error)));
  }

  destroy() {
    this.running = false;
    this.teardownCapture();
  }
}

