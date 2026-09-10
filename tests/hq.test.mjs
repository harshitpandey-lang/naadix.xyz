import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const hq = resolve("site/hq");
const routes = ["hq/index.html", "hq/dashboard/index.html", "hq/projects/index.html", "hq/calendar/index.html", "hq/goals/index.html"];

test("static Founder HQ routes and client assets exist", async () => {
  for (const route of routes) assert.ok((await stat(resolve("dist", route))).isFile(), route);
  for (const file of ["config.js", "supabase.js", "auth.js", "app.js", "hq.css"]) assert.ok((await stat(resolve(hq, file))).isFile(), file);
});

test("HQ uses browser Supabase auth and no privileged browser secret", async () => {
  const source = (await Promise.all(["config.js", "supabase.js", "auth.js", "app.js"].map((file) => readFile(resolve(hq, file), "utf8")))).join("\n");
  assert.match(source, /signInWithPassword/);
  assert.match(source, /founder/);
  assert.match(source, /getSession/);
    assert.match(source, /onAuthStateChange/);
  assert.doesNotMatch(source, /service[_-]?role|sb_secret_|SUPABASE_SECRET|DATABASE_URL/i);
});

test("generated HQ contains protected redirects and no Vercel dependency", async () => {
  const source = await Promise.all(routes.map((route) => readFile(resolve("dist", route), "utf8"))).then((files) => files.join("\n"));
  assert.match(source, /data-hq-page/);
  assert.match(await readFile(resolve(hq, "auth.js"), "utf8"), /location\.replace\(`\/hq/);
  assert.doesNotMatch(source, /vercel\.app|service_role|sb_secret_/i);
});
