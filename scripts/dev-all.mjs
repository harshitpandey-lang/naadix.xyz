import { spawn } from "node:child_process";
import { resolve } from "node:path";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(npm, ["run", "dev"], { cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32" }),
  spawn(npm, ["run", "dev"], { cwd: resolve("apps/hq"), stdio: "inherit", shell: process.platform === "win32" }),
];
const stop = () => children.forEach((child) => { if (!child.killed) child.kill(); });
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
const codes = await Promise.all(children.map((child) => new Promise((done) => child.on("exit", (code) => done(code ?? 1)))));
stop();
process.exitCode = codes.some(Boolean) ? 1 : 0;
