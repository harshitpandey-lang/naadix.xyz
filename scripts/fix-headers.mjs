import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve("dist/_headers");
const source = await readFile(target, "utf8");
const next = source.replace("microphone=()", "microphone=(self)");
if (next === source) throw new Error("Expected microphone Permissions-Policy entry was not found in dist/_headers");
await writeFile(target, next);
console.log("Enabled same-origin microphone access for Founder HQ voice transcription.");
