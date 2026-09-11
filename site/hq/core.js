export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];
export const PROJECT_CATEGORIES = ["Company", "Client", "Internal tools", "Research", "AI & Automation"];
export const GOAL_TYPES = ["task", "duration", "quantity"];
export const EVENT_CATEGORIES = ["College", "Study", "Project", "Personal", "Other"];
export const PROJECT_HEALTH = ["ON_TRACK", "AT_RISK", "BLOCKED"];
export const PROJECT_PRIORITIES = [1, 2, 3, 4];
export const GOAL_PRIORITIES = [1, 2, 3, 4];

export const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
})[character]);

export const normalize = (value) => String(value ?? "").trim().toLowerCase();

export function slugify(value) {
  const base = normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export function projectMatches(project, { query = "", status = "ALL" } = {}) {
  const statusMatch = status === "ALL" || (status === "BLOCKED" ? project.health === "BLOCKED" : project.status === status);
  const haystack = normalize([project.name, project.short_description, project.category, project.notes].join(" "));
  return statusMatch && (!normalize(query) || haystack.includes(normalize(query)));
}

export function goalMatches(goal, { query = "", state = "ACTIVE", type = "ALL" } = {}, today = new Date()) {
  const textMatch = !normalize(query) || normalize([goal.title, goal.description, goal.unit].join(" ")).includes(normalize(query));
  const typeMatch = type === "ALL" || goal.goal_type === type;
  const due = goal.due_date ? parseDateKey(goal.due_date) : null;
  const soon = due && !goal.completed && due >= startOfDay(today) && due <= addDays(startOfDay(today), 7);
  const stateMatch = state === "ALL" || (state === "COMPLETED" ? goal.completed : state === "DUE_SOON" ? soon : !goal.completed);
  return textMatch && typeMatch && stateMatch;
}

export function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, amount) {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function parseDateKey(key) {
  const [year, month, day] = String(key).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function startOfWeek(value) {
  const date = startOfDay(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  return addDays(date, -mondayOffset);
}

export function calendarDays(anchor, mode = "month", today = new Date()) {
  const focus = new Date(anchor);
  const first = mode === "week" ? startOfWeek(focus) : startOfWeek(new Date(focus.getFullYear(), focus.getMonth(), 1));
  const count = mode === "week" ? 7 : 42;
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(first, index);
    return {
      date,
      key: dateKey(date),
      day: date.getDate(),
      isToday: dateKey(date) === dateKey(today),
      isCurrentMonth: date.getMonth() === focus.getMonth(),
    };
  });
}

export function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? parseDateKey(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatDateTime(value) {
  return formatDate(value, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function localInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function itemOccursOn(item, key, field) {
  return dateKey(item[field]) === key;
}

export function projectProgress(project, items = []) {
  const related = items.filter((item) => item.project_id === project.id);
  if (!related.length) return Number(project.progress ?? 0);
  return Math.round((related.filter((item) => item.status === "DONE" || item.section === "completed_work").length / related.length) * 100);
}

export function isStaleProject(project, today = new Date()) {
  if (project.status !== "ACTIVE") return false;
  const updated = new Date(project.updated_at || project.created_at);
  return !Number.isNaN(updated.getTime()) && updated < addDays(startOfDay(today), -7);
}

export function goalProgress(goal, milestones = []) {
  if (Number.isFinite(Number(goal.target_value)) && Number(goal.target_value) > 0 && goal.current_value != null) return Math.max(0, Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100)));
  const related = milestones.filter((milestone) => milestone.goal_id === goal.id);
  return related.length ? Math.round((related.filter((milestone) => milestone.completed).length / related.length) * 100) : 0;
}

export function isGoalAtRisk(goal, progress = 0, today = new Date()) {
  if (goal.completed || !goal.due_date) return false;
  const due = parseDateKey(goal.due_date);
  return due < addDays(startOfDay(today), 7) && progress < 50;
}

const text = (values, name) => String(values[name] ?? "").trim();
const numberOrNull = (value) => value === "" || value == null ? null : Number(value);

export function validateProject(values) {
  const cleaned = {
    name: text(values, "name"),
    short_description: text(values, "short_description") || null,
    category: text(values, "category"),
    status: text(values, "status") || "PLANNED",
    priority: numberOrNull(values.priority) ?? 3,
    progress: numberOrNull(values.progress) ?? 0,
    deadline: text(values, "deadline") || null,
    github_url: text(values, "github_url") || null,
    notes: text(values, "notes") || null,
    overview: text(values, "overview") || null,
    health: text(values, "health") || "ON_TRACK",
    next_action: text(values, "next_action") || null,
    blocker: text(values, "blocker") || null,
  };
  const errors = [];
  if (!cleaned.name) errors.push("Project name is required.");
  if (!cleaned.category) errors.push("Choose a project category.");
  if (!PROJECT_STATUSES.includes(cleaned.status)) errors.push("Choose a supported project status.");
  if (!Number.isInteger(cleaned.priority) || cleaned.priority < 1 || cleaned.priority > 5) errors.push("Priority must be from 1 to 5.");
  if (!PROJECT_HEALTH.includes(cleaned.health)) errors.push("Choose a supported project health.");
  if (!Number.isFinite(cleaned.progress) || cleaned.progress < 0 || cleaned.progress > 100) errors.push("Progress must be from 0 to 100.");
  if (cleaned.github_url) {
    try { new URL(cleaned.github_url); } catch { errors.push("Primary link must be a valid URL."); }
  }
  return { valid: errors.length === 0, errors, values: cleaned };
}

export function validateGoal(values) {
  const type = text(values, "goal_type") || "task";
  const target = numberOrNull(values.target_value);
  const cleaned = {
    title: text(values, "title"),
    description: text(values, "description") || null,
    goal_type: type,
    target_value: type === "task" ? null : target,
    unit: type === "task" ? null : text(values, "unit") || null,
    due_date: text(values, "due_date"),
    scheduled_start: text(values, "scheduled_start") || null,
    scheduled_end: text(values, "scheduled_end") || null,
    priority: numberOrNull(values.priority) ?? 3,
    current_value: numberOrNull(values.current_value),
    next_step: text(values, "next_step") || null,
    project_id: text(values, "project_id") || null,
  };
  const errors = [];
  if (!cleaned.title) errors.push("Goal title is required.");
  if (!GOAL_TYPES.includes(type)) errors.push("Choose a supported goal type.");
  if (!cleaned.due_date || Number.isNaN(parseDateKey(cleaned.due_date).getTime())) errors.push("A valid due date is required.");
  if (type !== "task" && (!Number.isFinite(target) || target <= 0)) errors.push("A positive target is required for measurable goals.");
  if (type !== "task" && !cleaned.unit) errors.push("Add a unit for the target.");
  if (!Number.isInteger(cleaned.priority) || cleaned.priority < 1 || cleaned.priority > 4) errors.push("Priority must be from 1 to 4.");
  if (cleaned.scheduled_start && Number.isNaN(new Date(cleaned.scheduled_start).getTime())) errors.push("Scheduled start is invalid.");
  if (cleaned.scheduled_end && Number.isNaN(new Date(cleaned.scheduled_end).getTime())) errors.push("Scheduled end is invalid.");
  if (cleaned.scheduled_start && cleaned.scheduled_end && new Date(cleaned.scheduled_end) <= new Date(cleaned.scheduled_start)) errors.push("Scheduled end must be after the start.");
  if (!cleaned.scheduled_start && cleaned.scheduled_end) errors.push("Add a scheduled start before the end.");
  if (cleaned.scheduled_start) cleaned.scheduled_start = new Date(cleaned.scheduled_start).toISOString();
  if (cleaned.scheduled_end) cleaned.scheduled_end = new Date(cleaned.scheduled_end).toISOString();
  return { valid: errors.length === 0, errors, values: cleaned };
}

export function validateEvent(values) {
  const cleaned = {
    title: text(values, "title"),
    description: text(values, "description") || null,
    start_at: text(values, "start_at"),
    end_at: text(values, "end_at"),
    all_day: values.all_day === true || values.all_day === "on",
    location: text(values, "location") || null,
    category: text(values, "category") || null,
  };
  const errors = [];
  const start = new Date(cleaned.start_at);
  const end = new Date(cleaned.end_at);
  if (!cleaned.title) errors.push("Event title is required.");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) errors.push("Valid start and end times are required.");
  else if (!cleaned.all_day && end <= start) errors.push("Event end must be after the start.");
  if (cleaned.category && !EVENT_CATEGORIES.includes(cleaned.category)) errors.push("Choose a supported event category.");
  if (!errors.some((error) => error.includes("start and end"))) {
    cleaned.start_at = start.toISOString();
    cleaned.end_at = end.toISOString();
  }
  return { valid: errors.length === 0, errors, values: cleaned };
}

export function completionPayload(completed, now = new Date()) {
  return { completed: Boolean(completed), completed_at: completed ? now.toISOString() : null };
}

export function isFormField(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
}

export function waitingIsOverdue(item, today = new Date()) {
  return item.status === "WAITING" && Boolean(item.follow_up_at) && new Date(item.follow_up_at) < startOfDay(today);
}

export function inboxConversionPayload(type, item, values = {}, now = new Date()) {
  const content = String(values.title || item.content || "").trim();
  const notes = [item.notes, values.notes].filter(Boolean).join("\n\n") || null;
  if (type === "PROJECT") return { table: "projects", values: { name: content, short_description: item.content, category: values.category || "Company", status: "PLANNED", priority: 3, progress: 0, health: "ON_TRACK", notes } };
  if (type === "GOAL") return { table: "goals", values: { title: content, description: [item.content, notes].filter(Boolean).join("\n\n"), goal_type: "task", due_date: values.due_date, priority: 3 } };
  if (type === "EVENT") return { table: "calendar_events", values: { title: content, description: item.content, start_at: new Date(values.start_at).toISOString(), end_at: new Date(values.end_at).toISOString(), all_day: false, category: values.category || "Other" } };
  if (type === "WAITING") return { table: "waiting_items", values: { title: content, waiting_for: String(values.waiting_for || "").trim(), related_project_id: values.related_project_id || null, follow_up_at: values.follow_up_at ? new Date(values.follow_up_at).toISOString() : null, status: "WAITING", notes } };
  throw new Error("Unsupported inbox conversion.");
}

export function suggestNextAction({ projects = [], goals = [], actions = [] }, today = new Date()) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const candidates = [];
  for (const action of actions.filter((item) => item.status !== "DONE")) {
    const project = projectById.get(action.project_id);
    candidates.push({ entity_type: "PROJECT_ACTION", entity_id: action.id, label: action.task, priority: Number(project?.priority || 0), deadline: action.due_date || project?.deadline || null, stale: project ? isStaleProject(project, today) : false, href: project ? `/hq/projects/?project=${project.id}` : "/hq/projects/" });
  }
  for (const project of projects.filter((item) => item.status === "ACTIVE" && item.next_action)) candidates.push({ entity_type: "PROJECT", entity_id: project.id, label: project.next_action, priority: Number(project.priority || 0), deadline: project.deadline, stale: isStaleProject(project, today), href: `/hq/projects/?project=${project.id}` });
  for (const goal of goals.filter((item) => !item.completed)) candidates.push({ entity_type: "GOAL", entity_id: goal.id, label: goal.next_step || goal.title, priority: Number(goal.priority || 0), deadline: goal.due_date, stale: false, href: `/hq/goals/?goal=${goal.id}` });
  const deadlineValue = (value) => value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  return candidates.sort((a, b) => (b.priority - a.priority) || (deadlineValue(a.deadline) - deadlineValue(b.deadline)) || (Number(b.stale) - Number(a.stale)) || a.label.localeCompare(b.label))[0] || null;
}

export function weeklyReviewSummary({ projects = [], goals = [], events = [], waiting = [], inbox = [], decisions = [] }, now = new Date()) {
  const weekStart = startOfWeek(now);
  const nextWeek = addDays(weekStart, 7);
  const inWeek = (value) => { const date = new Date(value); return !Number.isNaN(date.getTime()) && date >= weekStart && date < nextWeek; };
  const today = startOfDay(now);
  return {
    projectsAdvanced: projects.filter((item) => inWeek(item.updated_at) && item.status !== "ARCHIVED").length,
    projectsStale: projects.filter((item) => isStaleProject(item, now)).length,
    projectsBlocked: projects.filter((item) => item.status === "ACTIVE" && item.health === "BLOCKED").length,
    goalsCompleted: goals.filter((item) => item.completed && inWeek(item.completed_at)).length,
    goalsAtRisk: goals.filter((item) => isGoalAtRisk(item, goalProgress(item), now)).length,
    goalsOverdue: goals.filter((item) => !item.completed && item.due_date && parseDateKey(item.due_date) < today).length,
    eventsPast: events.filter((item) => inWeek(item.start_at) && new Date(item.end_at || item.start_at) < now).length,
    upcomingEvents: events.filter((item) => new Date(item.start_at) >= now && new Date(item.start_at) < addDays(now, 7)).length,
    waitingUnresolved: waiting.filter((item) => item.status === "WAITING").length,
    inboxUnprocessed: inbox.filter((item) => item.status === "INBOX").length,
    decisionsMade: decisions.filter((item) => inWeek(item.decided_at)).length,
  };
}
