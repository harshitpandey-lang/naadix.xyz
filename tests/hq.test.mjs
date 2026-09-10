import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  calendarDays,
  completionPayload,
  dateKey,
  formatDate,
  goalMatches,
  projectMatches,
  validateEvent,
  validateGoal,
  validateProject,
} from "../site/hq/core.js";

const hq = resolve("site/hq");
const routes = ["hq/index.html", "hq/dashboard/index.html", "hq/projects/index.html", "hq/calendar/index.html", "hq/goals/index.html"];
const modules = ["config.js", "supabase.js", "auth.js", "core.js", "ui.js", "app.js", "dashboard.js", "projects.js", "calendar.js", "goals.js", "hq.css"];

test("static Founder HQ routes and page-specific modules exist", async () => {
  for (const route of routes) assert.ok((await stat(resolve("dist", route))).isFile(), route);
  for (const file of modules) assert.ok((await stat(resolve(hq, file))).isFile(), file);
});

test("private pages redirect through the shared authentication guard", async () => {
  const auth = await readFile(resolve(hq, "auth.js"), "utf8");
  const app = await readFile(resolve(hq, "app.js"), "utf8");
  assert.match(auth, /getSession/);
  assert.match(auth, /location\.replace/);
  assert.match(auth, /\/hq\/\?next=/);
  assert.match(app, /import\("\.\/projects\.js"\)/);
  assert.match(app, /import\("\.\/calendar\.js"\)/);
  assert.match(app, /import\("\.\/goals\.js"\)/);
});

test("HQ uses browser Supabase auth without a privileged browser secret", async () => {
  const source = (await Promise.all(modules.filter((file) => file.endsWith(".js")).map((file) => readFile(resolve(hq, file), "utf8")))).join("\n");
  assert.match(source, /signInWithPassword/);
  assert.match(source, /getSession/);
  assert.doesNotMatch(source, /service[_-]?role|sb_secret_|SUPABASE_SECRET|DATABASE_URL/i);
});

test("shared shell includes navigation, mobile controls, and quick actions", async () => {
  const source = await readFile(resolve(hq, "ui.js"), "utf8");
  for (const route of ["/hq/dashboard/", "/hq/projects/", "/hq/calendar/", "/hq/goals/"]) assert.ok(source.includes(route), route);
  assert.match(source, /data-open-menu/);
  assert.match(source, /data-open-command/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(source, /data-action="logout"/);
});

test("project workspace supports empty state, validated creation, search, and status filters", async () => {
  const source = await readFile(resolve(hq, "projects.js"), "utf8");
  assert.match(source, /No projects yet/);
  assert.match(source, /data-project-form/);
  assert.match(source, /data-project-search/);
  assert.match(source, /data-status-filter/);
  assert.match(source, /project_items/);
  assert.match(source, /project_actions/);
  const invalid = validateProject({ name: " ", category: "", status: "UNKNOWN", priority: 9, progress: 140 });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 4);
  const valid = validateProject({ name: "Product system", category: "Company", status: "ACTIVE", priority: "2", progress: "35" });
  assert.equal(valid.valid, true);
  assert.equal(valid.values.name, "Product system");
  assert.equal(projectMatches({ name: "Product system", status: "ACTIVE", category: "Company" }, { query: "product", status: "ACTIVE" }), true);
  assert.equal(projectMatches({ name: "Product system", status: "PAUSED" }, { status: "ACTIVE" }), false);
});

test("calendar generates a Monday-first month with a correct today marker", () => {
  const today = new Date(2026, 8, 10, 12);
  const days = calendarDays(today, "month", today);
  assert.equal(days.length, 42);
  assert.equal(days[0].date.getDay(), 1);
  assert.equal(days.filter((day) => day.isToday).length, 1);
  assert.equal(days.find((day) => day.isToday).key, "2026-09-10");
});

test("calendar validates events and renders events with scheduled goals", async () => {
  const source = await readFile(resolve(hq, "calendar.js"), "utf8");
  assert.match(source, /calendar_events/);
  assert.match(source, /scheduled_start/);
  assert.match(source, /goal-item/);
  assert.match(source, /data-calendar-view="month"/);
  assert.match(source, /data-calendar-view="week"/);
  const invalid = validateEvent({ title: "", start_at: "2026-09-10T11:00", end_at: "2026-09-10T10:00", category: "Project" });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(" "), /title is required/i);
  assert.match(invalid.errors.join(" "), /end must be after/i);
  const valid = validateEvent({ title: "Founder review", start_at: "2026-09-10T10:00", end_at: "2026-09-10T11:00", category: "Project" });
  assert.equal(valid.valid, true);
});

test("goal strategy filters, validation, completion, and dates are deterministic", async () => {
  const source = await readFile(resolve(hq, "goals.js"), "utf8");
  assert.match(source, /Overall completion/);
  assert.match(source, /data-goal-filter/);
  assert.match(source, /View in calendar/);
  const today = new Date(2026, 8, 10);
  const dueSoon = { title: "Ship HQ", goal_type: "task", due_date: "2026-09-14", completed: false };
  assert.equal(goalMatches(dueSoon, { state: "DUE_SOON", type: "task" }, today), true);
  assert.equal(goalMatches({ ...dueSoon, completed: true }, { state: "ACTIVE" }, today), false);
  assert.equal(validateGoal({ title: " ", goal_type: "duration", target_value: "", unit: "", due_date: "" }).valid, false);
  assert.equal(validateGoal({ title: "Deep work", goal_type: "duration", target_value: "10", unit: "hours", due_date: "2026-09-30" }).valid, true);
  const completedAt = new Date("2026-09-10T12:00:00.000Z");
  assert.deepEqual(completionPayload(true, completedAt), { completed: true, completed_at: completedAt.toISOString() });
  assert.equal(completionPayload(false, completedAt).completed_at, null);
  assert.equal(dateKey(new Date(2026, 8, 10)), "2026-09-10");
  assert.notEqual(formatDate("2026-09-10"), "—");
});

test("Supabase list queries support bounded repeated filters", async () => {
  const source = await readFile(resolve(hq, "supabase.js"), "utf8");
  assert.match(source, /Array\.isArray\(value\)/);
  assert.match(source, /params\.append/);
  const pageSource = (await Promise.all(["dashboard.js", "projects.js", "calendar.js", "goals.js"].map((file) => readFile(resolve(hq, file), "utf8")))).join("\n");
  assert.doesNotMatch(pageSource, /limit:\s*(?:[5-9]\d{3}|\d{5,})/);
});

test("generated HQ contains protected pages and no Vercel dependency", async () => {
  const source = await Promise.all(routes.map((route) => readFile(resolve("dist", route), "utf8"))).then((files) => files.join("\n"));
  assert.match(source, /data-hq-page/);
  assert.doesNotMatch(source, /vercel\.app|service_role|sb_secret_/i);
});
