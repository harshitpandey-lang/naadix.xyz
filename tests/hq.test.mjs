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
  inboxConversionPayload,
  projectMatches,
  suggestNextAction,
  validateEvent,
  validateGoal,
  validateProject,
  waitingIsOverdue,
  weeklyReviewSummary,
} from "../site/hq/core.js";
import { applyRecognitionResults, dedupeWhisperSegment } from "../site/hq/meetings.js";

const hq = resolve("site/hq");
const routes = ["hq/index.html", "hq/login/index.html", "hq/dashboard/index.html", "hq/inbox/index.html", "hq/projects/index.html", "hq/calendar/index.html", "hq/goals/index.html", "hq/meetings/index.html", "hq/finances/index.html", "hq/decisions/index.html", "hq/development/index.html", "hq/learning/index.html", "hq/notes/index.html", "hq/review/index.html"];
const modules = ["config.js", "supabase.js", "auth.js", "core.js", "ui.js", "app.js", "dashboard.js", "inbox.js", "projects.js", "calendar.js", "goals.js", "meetings.js", "whisper-local.js", "whisper-audio-worker.js", "whisper-audio-worklet.js", "finances.js", "decisions.js", "development.js", "learning.js", "notes.js", "review.js", "hq.css"];

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
  assert.match(app, /import\("\.\/meetings\.js"\)/);
  assert.match(app, /import\("\.\/finances\.js"\)/);
  assert.match(app, /import\("\.\/inbox\.js"\)/);
  assert.match(app, /import\("\.\/decisions\.js"\)/);
  assert.match(app, /import\("\.\/development\.js"\)/);
  assert.match(app, /import\("\.\/learning\.js"\)/);
  assert.match(app, /import\("\.\/notes\.js"\)/);
  assert.match(app, /import\("\.\/review\.js"\)/);
});

test("HQ uses browser Supabase auth without a privileged browser secret", async () => {
  const source = (await Promise.all(modules.filter((file) => file.endsWith(".js")).map((file) => readFile(resolve(hq, file), "utf8")))).join("\n");
  assert.match(source, /signInWithPassword/);
  assert.match(source, /getSession/);
  assert.doesNotMatch(source, /service[_-]?role|sb_secret_|SUPABASE_SECRET|DATABASE_URL/i);
});

test("shared shell includes navigation, mobile controls, and quick actions", async () => {
  const source = await readFile(resolve(hq, "ui.js"), "utf8");
  for (const route of ["/hq/dashboard/", "/hq/inbox/", "/hq/projects/", "/hq/calendar/", "/hq/goals/", "/hq/meetings/", "/hq/finances/", "/hq/decisions/", "/hq/development/", "/hq/learning/", "/hq/notes/", "/hq/review/"]) assert.ok(source.includes(route), route);
  assert.match(source, /data-open-menu/);
  assert.match(source, /data-open-command/);
  assert.match(source, /aria-label="Quick actions"/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "k"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /data-action="logout"/);
});

test("Founder momentum uses bounded operational records without a chart dependency", async () => {
  const source = await readFile(resolve(hq, "dashboard.js"), "utf8");
  assert.match(source, /Founder momentum/i);
  assert.match(source, /Array\.from\(\{ length: 30 \}/);
  assert.match(source, /completed_at: \[`gte\./);
  assert.match(source, /<svg class="momentum-chart"/);
  assert.doesNotMatch(source, /Chart\.js|d3|ApexCharts|ECharts/i);
});

test("Meetings and finances are private owner-scoped workspaces", async () => {
  const meetings = await readFile(resolve(hq, "meetings.js"), "utf8");
  const finances = await readFile(resolve(hq, "finances.js"), "utf8");
  const migration = await readFile(resolve("supabase/migrations/20260911053622_founder_hq_meetings_finances.sql"), "utf8");
  assert.match(meetings, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(meetings, /transcript/);
  assert.match(meetings, /starts_at: timestamp/);
  assert.match(meetings, /scheduled_at: timestamp/);
  assert.match(meetings, /Choose a valid meeting date and time/);
  assert.match(finances, /finance_transactions/);
  assert.match(finances, /Net cash flow/);
  assert.match(migration, /alter table public\.meetings enable row level security/);
  assert.match(migration, /alter table public\.finance_transactions enable row level security/);
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
  assert.match(migration, /grant select, insert, update, delete on table public\.meetings, public\.finance_transactions to authenticated/);
});

test("live meeting transcription uses local Whisper while retaining optional browser recognition", async () => {
  const source = await readFile(resolve(hq, "meetings.js"), "utf8");
  const local = await readFile(resolve(hq, "whisper-local.js"), "utf8");
  const audioWorker = await readFile(resolve(hq, "whisper-audio-worker.js"), "utf8");
  const start = source.indexOf("const startRecording = async");
  const request = source.indexOf("navigator.mediaDevices.getUserMedia");
  assert.ok(start > 0 && request > start, "microphone permission is requested only inside startRecording");
  assert.match(source, /window\.MediaRecorder/);
  assert.match(source, /new MediaRecorder\(stream\)/);
  assert.match(source, /data-start-recording>Start recording/);
  assert.match(source, /data-pause-recording[\s\S]*>Pause/);
  assert.match(source, /data-resume-recording[\s\S]*>Resume/);
  assert.match(source, /data-stop-recording[\s\S]*>Stop recording/);
  assert.match(source, /echoCancellation:\s*true, noiseSuppression:\s*true, autoGainControl:\s*true/);
  assert.match(source, /\.lang="en-IN"/);
  assert.match(source, /\.maxAlternatives=1/);
  assert.match(source, /if \(result\.isFinal\)[\s\S]*transcript\.dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\)/);
  assert.match(source, /interim\.textContent = interimChunk/);
  assert.match(source, /r\.onend=\(\)=>\{[\s\S]*scheduleRestart\(\)/);
  assert.match(source, /if\(!wantsRecognition \|\| disposed \|\| recordingState!=="recording"\) return/);
  assert.match(source, /stopButton\.addEventListener\("click",stopRecording\)/);
  assert.match(source, /data-complete-meeting[\s\S]*await stopRecording\(\)/);
  assert.match(source, /recorder\.onstart=\(\)=>\{ setUi\("recording"\)/);
  assert.match(source, /import\("\.\/whisper-local\.js"\)/);
  assert.match(source, /Transcription runs locally on this device/);
  assert.match(source, /Preparing transcriptionâ€¦/);
  assert.match(source, /Downloading local speech modelâ€¦/);
  assert.match(source, /data-retry-transcription/);
  assert.match(source, /\["Me", "Client", "Other"\]/);
  assert.match(local, /ggml-tiny\.en-q5_1\.bin/);
  assert.match(local, /32166155/);
  assert.match(local, /RUNTIME_INIT_TIMEOUT_MS = 180000/);
  assert.doesNotMatch(local, /took too long to initialize/);
  assert.match(local, /indexedDB\.open/);
  assert.match(local, /new Worker/);
  assert.match(local, /module\.set_audio/);
  assert.match(audioWorker, /TARGET_RATE = 16000/);
  assert.match(audioWorker, /OVERLAP_SAMPLES/);
  const build = await readFile(resolve("dist/_headers"), "utf8");
  assert.match(build, /Permissions-Policy: camera=\(\), microphone=\(self\), geolocation=\(\)/);
  assert.match(build, /Cross-Origin-Embedder-Policy: require-corp/);
  assert.match(build, /\/hq\/meetings\/\*[\s\S]*script-src 'self' 'unsafe-eval'/);
  assert.ok((await stat(resolve("dist/assets/hq/whisper/libstream.js"))).size > 1_000_000);
  const homepage = await readFile(resolve("dist/index.html"), "utf8");
  assert.doesNotMatch(homepage, /whisper|ggml-tiny/i);
});

test("final recognition text appends once while interim text stays transient", () => {
  const dispatched = [];
  const transcript = { value: "Existing sentence.", dispatchEvent: (event) => dispatched.push(event) };
  const interim = { textContent: "" };
  const processed = new Set();
  const finalResult = Object.assign([{ transcript: "Final phrase" }], { isFinal: true });
  const interimResult = Object.assign([{ transcript: "still speaking" }], { isFinal: false });
  const event = { resultIndex: 0, results: [finalResult, interimResult] };
  applyRecognitionResults(event, transcript, interim, processed);
  assert.equal(transcript.value, "Existing sentence.\nFinal phrase");
  assert.equal(interim.textContent, "still speaking");
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].type, "input");
  assert.equal(dispatched[0].bubbles, true);
  applyRecognitionResults(event, transcript, interim, processed);
  assert.equal(transcript.value, "Existing sentence.\nFinal phrase");
  assert.equal(dispatched.length, 1);
});

test("overlapping local Whisper windows append only new finalized words", () => {
  const first = "What your country can do for you, ask what you can do.";
  assert.equal(dedupeWhisperSegment("Existing text.", first, []), first);
  assert.equal(dedupeWhisperSegment(first, "ask what you can do for your country.", [first]), "for your country.");
  assert.equal(dedupeWhisperSegment(first, first, [first]), "");
  assert.equal(dedupeWhisperSegment(`${first}\nfor your country.`, "can do for your country.", [first, "for your country."]), "");
  assert.equal(dedupeWhisperSegment(first, "Like your country can do for you.", [first]), "");
  assert.equal(dedupeWhisperSegment("Existing text must remain.", "A new finalized segment.", []), "A new finalized segment.");
});

test("Inbox conversion creates the destination payload and preserves the source", async () => {
  const item = { id: "inbox-1", content: "Ship founder workflow", notes: "Captured in a meeting" };
  const project = inboxConversionPayload("PROJECT", item, { title: "Founder workflow", category: "Company" });
  assert.equal(project.table, "projects");
  assert.equal(project.values.name, "Founder workflow");
  assert.match(project.values.notes, /Captured in a meeting/);
  const waiting = inboxConversionPayload("WAITING", item, { waiting_for: "Client", related_project_id: "project-1" });
  assert.equal(waiting.table, "waiting_items");
  assert.equal(waiting.values.related_project_id, "project-1");
  const source = await readFile(resolve(hq, "inbox.js"), "utf8");
  assert.match(source, /status:\s*"PROCESSED"/);
  assert.match(source, /processed_at/);
  assert.doesNotMatch(source, /remove\("inbox_items"/);
});

test("Focus suggestion prioritizes critical work and stores one daily selection", async () => {
  const today = new Date(2026, 8, 11);
  const result = suggestNextAction({
    projects: [{ id: "p1", name: "High", status: "ACTIVE", priority: 3, next_action: "Do high", updated_at: today }, { id: "p2", name: "Critical", status: "ACTIVE", priority: 4, next_action: "Do critical", updated_at: today }],
    goals: [{ id: "g1", title: "Later goal", priority: 2, due_date: "2026-09-12", completed: false }],
    actions: [],
  }, today);
  assert.equal(result.label, "Do critical");
  const dashboard = await readFile(resolve(hq, "dashboard.js"), "utf8");
  assert.match(dashboard, /daily_focus/);
  assert.match(dashboard, /Focus on this/);
  assert.match(dashboard, /Mark focus complete/);
});

test("Waiting overdue derivation is status and date sensitive", () => {
  const today = new Date(2026, 8, 11, 12);
  assert.equal(waitingIsOverdue({ status: "WAITING", follow_up_at: "2026-09-10T12:00:00Z" }, today), true);
  assert.equal(waitingIsOverdue({ status: "RESOLVED", follow_up_at: "2026-09-10T12:00:00Z" }, today), false);
  assert.equal(waitingIsOverdue({ status: "WAITING", follow_up_at: "2026-09-12T12:00:00Z" }, today), false);
});

test("Decision relationships and new Phase 3 tables are owner secured", async () => {
  const migration = await readFile(resolve("supabase/migrations/20260911010000_founder_hq_phase3.sql"), "utf8");
  for (const table of ["inbox_items", "daily_focus", "waiting_items", "decisions"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.match(migration, new RegExp(`${table}[\\s\\S]+auth\\.uid\\(\\)`, "i"));
  }
  assert.match(migration, /project_id uuid references public\.projects\(id\) on delete set null/);
  assert.match(migration, /related_project_id is null or exists/);
  assert.match(migration, /project_id is null or exists/);
  const project = await readFile(resolve(hq, "projects.js"), "utf8");
  assert.match(project, /Record decision/);
  assert.match(project, /decisions\/\?new=1&project=/);
});

test("Weekly Review summary derives real operational counts", () => {
  const now = new Date(2026, 8, 11, 12);
  const summary = weeklyReviewSummary({
    projects: [{ status: "ACTIVE", health: "BLOCKED", updated_at: "2026-09-10T10:00:00Z" }],
    goals: [{ completed: true, completed_at: "2026-09-09T10:00:00Z" }, { completed: false, due_date: "2026-09-01", target_value: 10, current_value: 0 }],
    events: [{ start_at: "2026-09-10T10:00:00Z", end_at: "2026-09-10T11:00:00Z" }, { start_at: "2026-09-12T10:00:00Z", end_at: "2026-09-12T11:00:00Z" }],
    waiting: [{ status: "WAITING" }], inbox: [{ status: "INBOX" }], decisions: [{ decided_at: "2026-09-11T09:00:00Z" }],
  }, now);
  assert.equal(summary.projectsAdvanced, 1);
  assert.equal(summary.projectsBlocked, 1);
  assert.equal(summary.goalsCompleted, 1);
  assert.equal(summary.goalsOverdue, 1);
  assert.equal(summary.eventsPast, 1);
  assert.equal(summary.upcomingEvents, 1);
  assert.equal(summary.waitingUnresolved, 1);
  assert.equal(summary.inboxUnprocessed, 1);
  assert.equal(summary.decisionsMade, 1);
});

test("Command palette exposes Phase 3 capture and operating routes safely", async () => {
  const source = await readFile(resolve(hq, "ui.js"), "utf8");
  for (const label of ["Quick capture", "Focus Mode", "New Waiting Item", "Record Decision", "Development", "New Learning Item", "New Note", "Weekly Review", "Unprocessed inbox"]) assert.ok(source.includes(label), label);
  assert.match(source, /isFormField\(event\.target\)/);
  assert.match(source, /event\.key\.toLowerCase\(\) === "c"/);
});

test("development, learning, and notes modules persist owner-scoped records", async () => {
  const development = await readFile(resolve(hq, "development.js"), "utf8");
  const learning = await readFile(resolve(hq, "learning.js"), "utf8");
  const notes = await readFile(resolve(hq, "notes.js"), "utf8");
  assert.match(development, /development_areas/);
  assert.match(development, /skills/);
  assert.match(development, /development_milestones/);
  assert.match(development, /development_reflections/);
  assert.match(development, /user_id: shell\.session\.user\.id/);
  assert.match(learning, /learning_items/);
  assert.match(learning, /skill_id/);
  assert.match(learning, /project_id/);
  assert.match(learning, /data-learning-search/);
  assert.match(notes, /notes/);
  assert.match(notes, /data-notes-search/);
  assert.match(notes, /pinned/);
  assert.match(notes, /tags/);
  const migration = await readFile(resolve("supabase/migrations/20260910012141_founder_system_completion.sql"), "utf8");
  for (const table of ["development_milestones", "development_reflections", "company_items"]) assert.match(migration, new RegExp(`${table}[\\s\\S]+auth\\.uid\\(\\)`, "i"));
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
  assert.match(source, /At risk/);
  assert.match(source, /goalProgress/);
  assert.match(source, /current_value/);
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
  assert.notEqual(formatDate("2026-09-10"), "â€”");
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

