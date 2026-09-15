import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const out = resolve("dist");
const headersPath = resolve(out, "_headers");
const source = await readFile(headersPath, "utf8");
const next = source.includes("microphone=()") ? source.replace("microphone=()", "microphone=(self)") : source;
if (!next.includes("microphone=(self)")) throw new Error("Expected same-origin microphone Permissions-Policy entry was not found in dist/_headers");
await writeFile(headersPath, next);
console.log("Enabled same-origin microphone access.");
