import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

let count = 0;
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await checkDirectory(path);
    else if (/\.(mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ["--check", path], {
        stdio: "inherit",
      });
      if (result.error) throw result.error;
      if (result.status !== 0) process.exit(result.status || 1);
      count++;
    }
  }
}
for (const directory of ["scripts", "site", "tests"])
  await checkDirectory(directory);
console.log(`Syntax checked ${count} source and test modules.`);
