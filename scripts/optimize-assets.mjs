import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { transform } from "esbuild";

export async function optimizePublicAssets(directory) {
  let originalBytes = 0,
    optimizedBytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(js|css)$/.test(entry.name)) continue;
    const path = join(directory, entry.name);
    const source = await readFile(path, "utf8");
    const { code } = await transform(source, {
      loader: entry.name.endsWith(".css") ? "css" : "js",
      minify: true,
      target: "es2020",
      charset: "utf8",
      legalComments: "inline",
    });
    originalBytes += Buffer.byteLength(source);
    optimizedBytes += Buffer.byteLength(code);
    await writeFile(path, code);
  }
  console.log(`Public JS/CSS: ${originalBytes} -> ${optimizedBytes} bytes.`);
}
