import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "./build.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};
const port = Number(process.env.PORT || 4174);
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = decodeURIComponent(url.pathname);
    let file = resolve(root, "." + path);
    if (
      file !== root &&
      !file.startsWith(root + "/") &&
      !file.startsWith(root + "\\")
    )
      throw Error("Invalid path");
    try {
      if ((await stat(file)).isDirectory()) {
        if (!path.endsWith("/")) {
          res.writeHead(308, { Location: path + "/" + url.search });
          res.end();
          return;
        }
        file = resolve(file, "index.html");
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await readFile(resolve(root, "404.html")));
    }
  } catch {
    res.writeHead(400);
    res.end("Bad request");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `NaadiX preview: http://127.0.0.1:${port}/ (serving public artifact only)`,
  ),
);
