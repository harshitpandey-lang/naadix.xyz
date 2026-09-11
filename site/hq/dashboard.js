import { addDays, dateKey, esc, formatDate, formatDateTime, goalProgress, isGoalAtRisk, isStaleProject, localInputValue, startOfDay, suggestNextAction, waitingIsOverdue } from "./core.js";
import { errorState, formValues, humanError, icon, mountShell, openDialog, openQuickCapture, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { projects: [], goals: [], events: [], actions: [], waiting: [], inbox: [], focus: null, momentum: { days: [], series: [] }, focusMode: false };

export async function mount() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  state.focusMode = new URLSearchParams(location.search).get("focus") === "1";
  shell = await mountShell({ active: "dashboard", title: state.focusMode ? "Focus" : `${greeting}, Founder.`, description: state.focusMode ? "One commitment. Only what matters today." : "A concise operating view of what needs attention now." });
  if (!shell) return;
  shell.actions.innerHTML = state.focusMode ? `<a class="quiet-button" href="/hq/dashboard/">Exit Focus Mode</a>` : `<button class="quiet-button" type="button" data-quick-capture>${icon("plus")}Quick Capture</button><a class="hq-action" href="/hq/dashboard/?focus=1">Focus${icon("chevron")}</a>`;
  shell.actions.querySelector("[data-quick-capture]")?.addEventListener("click", openQuickCapture);
  await load();
  window.addEventListener("hq:captured", load);
}

async function load() {
  shell.content.innerHTML = skeleton(7);
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const momentumStart = addDays(today, -29);
  try {
    const [projects, goals, events, actions, waiting, inbox, focus, momentumRecords] = await Promise.all([
      supabase.query("projects", { select: "id,name,status,priority,health,deadline,next_action,blocker,progress,updated_at", order: "updated_at.desc", limit: 200 }),
      supabase.query("goals", { select: "id,title,due_date,scheduled_start,scheduled_end,completed,completed_at,target_value,current_value,project_id,priority,next_step", order: "due_date.asc", limit: 200 }),
      supabase.query("calendar_events", { select: "id,title,start_at,end_at,all_day,category", filters: { start_at: [`gte.${today.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "start_at.asc", limit: 100 }),
      supabase.query("project_actions", { select: "id,project_id,task,due_date,status,position", filters: { status: "neq.DONE" }, order: "due_date.asc", limit: 200 }),
      supabase.query("waiting_items", { select: "id,title,waiting_for,related_project_id,follow_up_at,status,notes,created_at,updated_at,resolved_at", filters: { status: "eq.WAITING" }, order: "created_at.asc", limit: 200 }),
      supabase.query("inbox_items", { select: "id,status", filters: { status: "eq.INBOX" }, limit: 1000 }),
      supabase.query("daily_focus", { select: "id,focus_date,entity_type,entity_id,label,completed", filters: { focus_date: `eq.${dateKey(today)}` }, limit: 1 }),
      Promise.allSettled([
        supabase.query("project_actions", { select: "id,completed_at", filters: { status: "eq.DONE", completed_at: [`gte.${momentumStart.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "completed_at.asc", limit: 1000 }),
        supabase.query("project_items", { select: "id,completed_at", filters: { completed_at: [`gte.${momentumStart.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "completed_at.asc", limit: 1000 }),
        supabase.query("goals", { select: "id,completed_at", filters: { completed: "eq.true", completed_at: [`gte.${momentumStart.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "completed_at.asc", limit: 1000 }),
        supabase.query("calendar_events", { select: "id,start_at", filters: { start_at: [`gte.${momentumStart.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "start_at.asc", limit: 1000 }),
        supabase.query("meetings", { select: "id,scheduled_at", filters: { scheduled_at: [`gte.${momentumStart.toISOString()}`, `lt.${tomorrow.toISOString()}`] }, order: "scheduled_at.asc", limit: 1000 }),
      ]),
    ]);
    Object.assign(state, { projects, goals, events, actions, waiting, inbox, focus: focus[0] || null, momentum: buildMomentum(momentumStart, momentumRecords) });
    if (state.focusMode) renderFocus(today); else renderOverview(today);
    handleRequestedWaiting();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function projectName(id) { return state.projects.find((project) => project.id === id)?.name || "Project"; }
function goalsToday(today) { return state.goals.filter((goal) => !goal.completed && goal.scheduled_start && dateKey(goal.scheduled_start) === dateKey(today)); }
function urgentBlockers(today) { return state.projects.filter((project) => project.status === "ACTIVE" && project.health === "BLOCKED" && (Number(project.priority) >= 3 || (project.deadline && project.deadline <= dateKey(today)))); }

function buildMomentum(start, results) {
  const values = results.map((result) => result.status === "fulfilled" ? result.value : []);
  const [actions, items, goals, events, meetings] = values;
  const days = Array.from({ length: 30 }, (_, index) => ({ date: dateKey(addDays(start, index)), projectActivity: 0, goalsCompleted: 0, meetings: 0 }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const item of [...actions, ...items]) { const day = byDate.get(dateKey(item.completed_at)); if (day) day.projectActivity += 1; }
  for (const goal of goals) { const day = byDate.get(dateKey(goal.completed_at)); if (day) day.goalsCompleted += 1; }
  for (const item of [...events, ...meetings]) { const day = byDate.get(dateKey(item.start_at || item.scheduled_at)); if (day) day.meetings += 1; }
  const series = [];
  if (results[0].status === "fulfilled" && results[1].status === "fulfilled") series.push({ key: "projectActivity", label: "Project completions", className: "projects" });
  if (results[2].status === "fulfilled") series.push({ key: "goalsCompleted", label: "Goals completed", className: "goals" });
  if (results[3].status === "fulfilled") series.push({ key: "meetings", label: results[4].status === "fulfilled" ? "Meetings & events" : "Calendar events", className: "meetings" });
  return { days, series };
}

function renderOverview(today) {
  const openGoals = state.goals.filter((goal) => !goal.completed);
  const projectNames = new Map(state.projects.map((project) => [project.id, project.name]));
  const attention = [
    ...openGoals.filter((goal) => (goal.due_date && goal.due_date < dateKey(addDays(today, 1))) || isGoalAtRisk(goal, goalProgress(goal))).map((goal) => ({ key: `goal-${goal.id}`, label: goal.due_date < dateKey(today) ? "Overdue goal" : "Goal at risk", title: goal.title, href: `/hq/goals/?goal=${goal.id}` })),
    ...state.projects.filter((project) => project.status === "ACTIVE" && (project.health === "BLOCKED" || isStaleProject(project) || (project.deadline && project.deadline <= dateKey(addDays(today, 3))))).map((project) => ({ key: `project-${project.id}`, label: project.health === "BLOCKED" ? "Blocked project" : isStaleProject(project) ? "Stale project" : "Project deadline", title: project.name, href: `/hq/projects/?project=${project.id}` })),
    ...state.waiting.filter((item) => waitingIsOverdue(item, today)).map((item) => ({ key: `waiting-${item.id}`, label: "Follow-up overdue", title: item.title, href: "#waiting" })),
  ];
  const attentionKeys = new Set(attention.map((item) => item.key));
  const weekEnd = dateKey(addDays(today, 7));
  const thisWeek = [
    ...openGoals.filter((goal) => goal.due_date && goal.due_date <= weekEnd && !attentionKeys.has(`goal-${goal.id}`)).map((goal) => ({ title: goal.title, meta: `Goal due ${formatDate(goal.due_date)}`, href: `/hq/goals/?goal=${goal.id}` })),
    ...state.projects.filter((project) => project.deadline && project.deadline <= weekEnd && !attentionKeys.has(`project-${project.id}`)).map((project) => ({ title: project.name, meta: `Project due ${formatDate(project.deadline)}`, href: `/hq/projects/?project=${project.id}` })),
  ];
  shell.content.innerHTML = `<section class="summary-grid dashboard-summary" aria-label="Workspace summary"><a href="/hq/inbox/"><span>Inbox</span><strong>${state.inbox.length}</strong><small>${state.inbox.length ? "Ready to clarify" : "Capture is clear"}</small></a><a href="/hq/calendar/"><span>Today's schedule</span><strong>${state.events.length}</strong><small>${state.events[0] ? `Next ${formatDateTime(state.events[0].start_at)}` : "Calendar is clear"}</small></a><a href="/hq/review/"><span>Weekly Review</span><strong>Open</strong><small>Close loops and set direction</small></a></section>
    ${momentumChart(state.momentum)}
    <div class="dashboard-grid"><section class="dashboard-panel span-2"><header><div><p class="eyebrow">Attention</p><h2>What needs you now</h2></div></header>${list(attention.slice(0, 7), "Nothing urgent.")}</section>
      <section class="dashboard-panel"><header><div><p class="eyebrow">Today</p><h2>Schedule</h2></div><a href="/hq/calendar/">Calendar</a></header>${list(state.events.slice(0, 5).map((event) => ({ title: event.title, meta: event.all_day ? "All day" : formatDateTime(event.start_at), href: `/hq/calendar/?date=${dateKey(event.start_at)}` })), "No events today.")}</section>
      <section class="dashboard-panel"><header><div><p class="eyebrow">Today</p><h2>Scheduled goals</h2></div><a href="/hq/dashboard/?focus=1">Focus</a></header>${list(goalsToday(today).slice(0, 5).map((goal) => ({ title: goal.title, meta: goal.next_step || "Scheduled goal", href: `/hq/goals/?goal=${goal.id}` })), "No goals scheduled today.")}</section>
      <section class="dashboard-panel span-2"><header><div><p class="eyebrow">Next moves</p><h2>Project actions</h2></div><a href="/hq/projects/">Projects</a></header>${list(state.actions.slice(0, 6).map((action) => ({ title: action.task, meta: `${projectNames.get(action.project_id) || "Project"}${action.due_date ? ` · ${formatDate(action.due_date)}` : ""}`, href: `/hq/projects/?project=${action.project_id}` })), "No open project actions.")}</section>
      <section class="dashboard-panel span-2" id="waiting"><header><div><p class="eyebrow">Waiting on</p><h2>External dependencies</h2></div><button class="quiet-button compact" type="button" data-new-waiting>${icon("plus")}Waiting on</button></header>${waitingList(today)}</section>
      <section class="dashboard-panel span-2"><header><div><p class="eyebrow">This week</p><h2>Upcoming commitments</h2></div><a href="/hq/review/">Weekly Review</a></header>${list(thisWeek.slice(0, 7), "No additional commitments this week.")}</section></div>`;
  shell.content.querySelector("[data-new-waiting]").addEventListener("click", () => openWaitingForm());
  bindWaiting();
}

function momentumChart({ days, series }) {
  if (!days.length || !series.length) return "";
  const width = 900;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 34, left: 34 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(1, ...days.flatMap((day) => series.map((item) => day[item.key])));
  const x = (index) => padding.left + (index / Math.max(1, days.length - 1)) * plotWidth;
  const y = (value) => padding.top + plotHeight - (value / maximum) * plotHeight;
  const paths = series.map((item) => {
    const points = days.map((day, index) => `${x(index).toFixed(1)},${y(day[item.key]).toFixed(1)}`).join(" ");
    const dots = days.map((day, index) => `<circle cx="${x(index).toFixed(1)}" cy="${y(day[item.key]).toFixed(1)}" r="3"><title>${formatDate(day.date)} · ${item.label}: ${day[item.key]}</title></circle>`).join("");
    return `<g class="momentum-series ${item.className}"><polyline points="${points}"/>${dots}</g>`;
  }).join("");
  const tickCount = Math.min(maximum, 5);
  const grid = Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = (maximum / tickCount) * index;
    const gridY = y(value);
    return `<g class="momentum-gridline"><line x1="${padding.left}" y1="${gridY}" x2="${width - padding.right}" y2="${gridY}"/><text x="${padding.left - 9}" y="${gridY + 4}">${Number.isInteger(value) ? value : value.toFixed(1)}</text></g>`;
  }).join("");
  const labels = days.map((day, index) => index % 7 === 0 || index === days.length - 1 ? `<text class="momentum-date" x="${x(index)}" y="${height - 7}" text-anchor="middle">${formatDate(day.date, { month: "short", day: "numeric" })}</text>` : "").join("");
  const total = (key) => days.reduce((sum, day) => sum + day[key], 0);
  return `<section class="dashboard-panel momentum-panel"><header><div><h2>Founder momentum</h2><p class="subtle">Last 30 days</p></div><div class="momentum-legend">${series.map((item) => `<span class="${item.className}"><i></i>${item.label}<strong>${total(item.key)}</strong></span>`).join("")}</div></header><div class="momentum-chart-scroll"><svg class="momentum-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily project completions, completed goals, and meetings or events during the last 30 days">${grid}${paths}${labels}</svg></div></section>`;
}

function list(items, empty) {
  return items.length ? `<div class="dashboard-list">${items.map((item) => `<a href="${item.href}"><span><strong>${esc(item.title)}</strong><small>${esc(item.label || item.meta || "")}</small></span></a>`).join("")}</div>` : `<p class="subtle panel-empty">${empty}</p>`;
}

function waitingList(today) {
  if (!state.waiting.length) return '<p class="subtle panel-empty">Nothing is waiting on someone else.</p>';
  return `<div class="waiting-list">${state.waiting.slice(0, 8).map((item) => { const days = Math.max(0, Math.floor((startOfDay(today) - startOfDay(new Date(item.created_at))) / 86400000)); const overdue = waitingIsOverdue(item, today); return `<article class="waiting-row ${overdue ? "overdue" : ""}"><div><strong>${esc(item.title)}</strong><p>Waiting for ${esc(item.waiting_for)} · ${days} day${days === 1 ? "" : "s"}${item.follow_up_at ? ` · Follow up ${formatDate(item.follow_up_at)}` : ""}</p><small>${esc(projectName(item.related_project_id))}${overdue ? " · Follow-up overdue" : ""}</small></div><div class="item-actions"><button class="quiet-button compact" type="button" data-resolve-waiting="${item.id}">Resolve</button><button class="quiet-button compact" type="button" data-edit-waiting="${item.id}">Edit</button>${item.related_project_id ? `<a class="quiet-button compact" href="/hq/projects/?project=${item.related_project_id}">Open project</a>` : ""}</div></article>`; }).join("")}</div>`;
}

function bindWaiting() {
  shell.content.querySelectorAll("[data-resolve-waiting]").forEach((button) => button.addEventListener("click", async () => { await supabase.update("waiting_items", button.dataset.resolveWaiting, { status: "RESOLVED", resolved_at: new Date().toISOString() }); toast("Waiting item resolved."); await load(); }));
  shell.content.querySelectorAll("[data-edit-waiting]").forEach((button) => button.addEventListener("click", () => openWaitingForm(state.waiting.find((item) => item.id === button.dataset.editWaiting))));
}

function projectOptions(selected) { return `<option value="">No related project</option>${state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${esc(project.name)}</option>`).join("")}`; }

function openWaitingForm(item = null, projectId = null) {
  const dialog = openDialog({ title: item ? "Edit waiting item" : "Waiting on", description: "Track the dependency and the next follow-up.", className: "form-dialog", content: `<form class="entity-form" data-waiting-form><div class="form-grid"><label class="span-2">Title<input name="title" required value="${esc(item?.title)}"></label><label>Waiting for<input name="waiting_for" required value="${esc(item?.waiting_for)}"></label><label>Follow up<input name="follow_up_at" type="datetime-local" value="${localInputValue(item?.follow_up_at)}"></label><label class="span-2">Related project<select name="related_project_id">${projectOptions(item?.related_project_id || projectId)}</select></label><label class="span-2">Notes<textarea name="notes" rows="4">${esc(item?.notes)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">${item ? "Save changes" : "Add waiting item"}</button></div></form>` });
  dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-waiting-form]").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formValues(form); const error = form.querySelector("[data-form-error]");
    if (!values.title || !values.waiting_for) return showFormErrors(error, ["Title and waiting for are required."]);
    const payload = { title: values.title, waiting_for: values.waiting_for, related_project_id: values.related_project_id || null, follow_up_at: values.follow_up_at ? new Date(values.follow_up_at).toISOString() : null, notes: values.notes || null, status: "WAITING", resolved_at: null };
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Saving...");
    try { if (item) await supabase.update("waiting_items", item.id, payload); else await supabase.insert("waiting_items", { ...payload, user_id: shell.session.user.id }); dialog.close(); toast(item ? "Waiting item updated." : "Waiting item added."); await load(); }
    catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

function handleRequestedWaiting() {
  const params = new URLSearchParams(location.search);
  if (params.get("waiting") === "new") { const projectId = params.get("project"); history.replaceState(null, "", "/hq/dashboard/#waiting"); openWaitingForm(null, projectId); }
  else if (params.get("waiting") === "show") history.replaceState(null, "", "/hq/dashboard/#waiting");
}

function focusHref(focus) {
  if (focus.entity_type === "GOAL") return `/hq/goals/?goal=${focus.entity_id}`;
  if (focus.entity_type === "PROJECT") return `/hq/projects/?project=${focus.entity_id}`;
  if (focus.entity_type === "PROJECT_ACTION") { const action = state.actions.find((item) => item.id === focus.entity_id); return action ? `/hq/projects/?project=${action.project_id}` : "/hq/projects/"; }
  return "#";
}

function renderFocus(today) {
  const suggestion = suggestNextAction(state, today);
  const focus = state.focus;
  const deadlines = [
    ...state.projects.filter((item) => item.deadline === dateKey(today)).map((item) => ({ title: item.name, meta: "Project deadline", href: `/hq/projects/?project=${item.id}` })),
    ...state.goals.filter((item) => !item.completed && item.due_date === dateKey(today)).map((item) => ({ title: item.title, meta: "Goal deadline", href: `/hq/goals/?goal=${item.id}` })),
  ];
  const blockers = urgentBlockers(today).map((item) => ({ title: item.name, meta: item.blocker || "Urgent blocker", href: `/hq/projects/?project=${item.id}` }));
  shell.content.innerHTML = `<div class="focus-view"><header class="focus-date"><p class="eyebrow">Today</p><h2>${formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</h2></header><section class="focus-primary ${focus?.completed ? "complete" : ""}"><p class="eyebrow">${focus ? "Today's focus" : "Suggested next action"}</p><h2>${esc(focus?.label || suggestion?.label || "Choose the work that matters most.")}</h2>${focus ? `<a class="text-link" href="${focusHref(focus)}">Open related work</a><button class="hq-action" type="button" data-complete-focus ${focus.completed ? "disabled" : ""}>${focus.completed ? "Focus completed" : "Mark focus complete"}</button>` : suggestion ? `<p class="subtle">Suggested from priority, deadline, and stale-work signals.</p><button class="hq-action" type="button" data-select-focus>Focus on this</button>` : '<p class="subtle">Add a project next action or active goal to generate a suggestion.</p>'}</section><div class="focus-grid"><section class="dashboard-panel"><header><div><p class="eyebrow">Today's schedule</p><h2>Events</h2></div></header>${list(state.events.map((item) => ({ title: item.title, meta: item.all_day ? "All day" : formatDateTime(item.start_at), href: `/hq/calendar/?date=${dateKey(today)}` })), "Calendar is clear.")}</section><section class="dashboard-panel"><header><div><p class="eyebrow">Goals today</p><h2>Scheduled goals</h2></div></header>${list(goalsToday(today).map((item) => ({ title: item.title, meta: item.next_step || "Scheduled today", href: `/hq/goals/?goal=${item.id}` })), "No goals scheduled today.")}</section><section class="dashboard-panel"><header><div><p class="eyebrow">Deadlines</p><h2>Due today</h2></div></header>${list(deadlines, "No deadlines today.")}</section><section class="dashboard-panel"><header><div><p class="eyebrow">Blockers</p><h2>Urgent only</h2></div></header>${list(blockers, "No urgent blockers.")}</section></div></div>`;
  shell.content.querySelector("[data-select-focus]")?.addEventListener("click", async () => { await supabase.insert("daily_focus", { user_id: shell.session.user.id, focus_date: dateKey(today), entity_type: suggestion.entity_type, entity_id: suggestion.entity_id, label: suggestion.label, completed: false }); toast("Today's focus selected."); await load(); });
  shell.content.querySelector("[data-complete-focus]")?.addEventListener("click", async () => { await supabase.update("daily_focus", focus.id, { completed: true }); toast("Focus complete."); await load(); });
}
