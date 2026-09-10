import { addDays, dateKey, esc, formatDate, formatDateTime, startOfDay } from "./core.js";
import { errorState, icon, mountShell, skeleton } from "./ui.js";
import { supabase } from "./supabase.js";

export async function mount() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const shell = await mountShell({ active: "dashboard", title: `${greeting}, Founder.`, description: "A concise operating view of what needs attention now." });
  if (!shell) return;
  shell.actions.innerHTML = `<a class="hq-action" href="/hq/projects/">Open projects${icon("chevron")}</a>`;
  await load(shell);
}

async function load(shell) {
  shell.content.innerHTML = skeleton(6);
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  try {
    const [projects, goals, events, actions] = await Promise.all([
      supabase.query("projects", { select: "id,name,status,priority,progress,deadline,updated_at", order: "updated_at.desc", limit: 40 }),
      supabase.query("goals", { select: "id,title,due_date,scheduled_start,completed", order: "due_date.asc", limit: 40 }),
      supabase.query("calendar_events", { select: "id,title,start_at,end_at,all_day,category", filters: { start_at: [`gte.${today.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "start_at.asc", limit: 20 }),
      supabase.query("project_actions", { select: "id,project_id,task,due_date,status,position", filters: { status: "neq.DONE" }, order: "due_date.asc", limit: 20 }),
    ]);
    render(shell, { projects, goals, events, actions });
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", () => load(shell));
  }
}

function render(shell, { projects, goals, events, actions }) {
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const openGoals = goals.filter((goal) => !goal.completed);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  shell.content.innerHTML = `<section class="summary-grid dashboard-summary" aria-label="Workspace summary"><a href="/hq/projects/"><span>Active projects</span><strong>${activeProjects.length}</strong><small>${projects.length} total</small></a><a href="/hq/goals/"><span>Open goals</span><strong>${openGoals.length}</strong><small>${openGoals[0]?.due_date ? `Next due ${formatDate(openGoals[0].due_date)}` : "No upcoming due date"}</small></a><a href="/hq/calendar/"><span>Today's schedule</span><strong>${events.length}</strong><small>${events[0] ? `Next ${formatDateTime(events[0].start_at)}` : "Calendar is clear"}</small></a></section>
    <div class="dashboard-grid"><section class="dashboard-panel span-2"><header><div><p class="eyebrow">In motion</p><h2>Active projects</h2></div><a href="/hq/projects/">View all</a></header>${activeProjects.length ? `<div class="dashboard-list">${activeProjects.slice(0, 5).map((project) => `<a href="/hq/projects/?project=${project.id}"><span><strong>${esc(project.name)}</strong><small>${project.deadline ? `Due ${formatDate(project.deadline)}` : "No deadline"}</small></span><span class="progress-compact"><i><b style="width:${project.progress ?? 0}%"></b></i>${project.progress ?? 0}%</span></a>`).join("")}</div>` : '<p class="subtle panel-empty">No active projects.</p>'}</section>
      <section class="dashboard-panel"><header><div><p class="eyebrow">Today</p><h2>Schedule</h2></div><a href="/hq/calendar/">Calendar</a></header>${events.length ? `<div class="dashboard-list">${events.slice(0, 5).map((event) => `<a href="/hq/calendar/?date=${dateKey(new Date(event.start_at))}"><span><strong>${esc(event.title)}</strong><small>${event.all_day ? "All day" : formatDateTime(event.start_at)}</small></span></a>`).join("")}</div>` : '<p class="subtle panel-empty">No events today.</p>'}</section>
      <section class="dashboard-panel"><header><div><p class="eyebrow">Outcomes</p><h2>Upcoming goals</h2></div><a href="/hq/goals/">Goals</a></header>${openGoals.length ? `<div class="dashboard-list">${openGoals.slice(0, 5).map((goal) => `<a href="/hq/goals/?goal=${goal.id}"><span><strong>${esc(goal.title)}</strong><small>Due ${formatDate(goal.due_date)}</small></span></a>`).join("")}</div>` : '<p class="subtle panel-empty">No active goals.</p>'}</section>
      <section class="dashboard-panel span-2"><header><div><p class="eyebrow">Next moves</p><h2>Project actions</h2></div><a href="/hq/projects/">Projects</a></header>${actions.length ? `<div class="dashboard-list action-list">${actions.slice(0, 6).map((action) => `<a href="/hq/projects/?project=${action.project_id}"><span><strong>${esc(action.task)}</strong><small>${esc(projectNames.get(action.project_id) || "Project")}${action.due_date ? ` · ${formatDate(action.due_date)}` : ""}</small></span><span class="status-pill" data-status="${action.status}">${action.status.replaceAll("_", " ")}</span></a>`).join("")}</div>` : '<p class="subtle panel-empty">No open project actions.</p>'}</section></div>`;
}
