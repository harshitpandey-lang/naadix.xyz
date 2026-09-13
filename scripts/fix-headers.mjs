import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const out = resolve("dist");
const headersPath = resolve(out, "_headers");
const source = await readFile(headersPath, "utf8");
const next = source.replace("microphone=()", "microphone=(self)");
if (next === source) throw new Error("Expected microphone Permissions-Policy entry was not found in dist/_headers");
await writeFile(headersPath, next);

const files = await readdir(out, { recursive: true });
let hqGateCount = 0;
for (const relative of files) {
  if (!relative.endsWith("index.html") || relative.startsWith("hq/") || relative.startsWith("hq\\")) continue;
  const path = join(out, relative);
  const html = await readFile(path, "utf8");
  if (html.includes("data-hq-gate")) continue;
  const marker = '<button class="command-trigger" aria-label="Open command menu" title="Ctrl or Command K">⌘ K</button>';
  if (!html.includes(marker)) continue;
  const gate = '<a class="command-trigger hq-gate" data-hq-gate href="/hq/" aria-label="Open Founder HQ" title="Founder HQ">HQ</a>';
  await writeFile(path, html.replace(marker, `${marker}${gate}`));
  hqGateCount += 1;
}

console.log(`Enabled same-origin microphone access and added Founder HQ gate to ${hqGateCount} public pages.`);
