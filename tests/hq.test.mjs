import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const hq = resolve("apps/hq");
const modules = ["today", "calendar", "goals", "development", "projects", "learning", "notes", "review", "naadix"];

test("every Founder HQ module has a private route and navigation entry", async () => {
  const sidebar = await readFile(resolve(hq, "src/components/dashboard/dashboard-sidebar.tsx"), "utf8");
  const proxy = await readFile(resolve(hq, "src/lib/supabase/proxy.ts"), "utf8");
  for (const module of modules) {
    assert.ok((await stat(resolve(hq, `src/app/${module}/page.tsx`))).isFile(), module);
    assert.ok(sidebar.includes(`href: "/${module}"`), `${module} navigation`);
    assert.ok(proxy.includes(`"/${module}"`), `${module} route guard`);
  }
});

test("HQ runtime has one Supabase auth model and no privileged browser secret", async () => {
  const files = [
    "src/lib/require-user.ts",
    "src/lib/supabase/client.ts",
    "src/lib/supabase/server.ts",
    "src/lib/supabase/proxy.ts",
    "src/components/auth/login-form.tsx",
  ];
  const source = (await Promise.all(files.map((file) => readFile(resolve(hq, file), "utf8")))).join("\n");
  assert.match(source, /signInWithPassword/);
  assert.match(source, /FOUNDER_ID = "founder"/);
  assert.match(source, /Founder ID or email/);
  assert.match(source, /auth\.getUser\(\)/);
  assert.doesNotMatch(source, /service[_-]?role|SUPABASE_SECRET|CEO_PORTAL/i);
  const env = await readFile(resolve(hq, ".env.example"), "utf8");
  assert.deepEqual(env.trim().split(/\r?\n/).map((line) => line.split("=")[0]), ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);
});

test("Founder system migration is owner-scoped and grants the authenticated Data API", async () => {
  const migration = await readFile(resolve(hq, "supabase/migrations/20260910012141_founder_system_completion.sql"), "utf8");
  for (const table of ["projects", "development_milestones", "development_reflections", "company_items"]) assert.ok(migration.includes(table), table);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /grant select, insert, update, delete/);
  assert.match(migration, /Existing project rows remain unowned/);
  assert.doesNotMatch(migration, /service_role|to anon[^;]*(select|insert|update|delete)/i);
});
