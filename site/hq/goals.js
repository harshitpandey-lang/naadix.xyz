import { GOAL_TYPES, completionPayload, esc, formatDate, formatDateTime, goalMatches, goalProgress, isGoalAtRisk, localInputValue, validateGoal } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

const state = { goals: [], projects: [], milestones: [], query: "", filter: "ACTIVE", type: "ALL" };
let shell;

export async function mount() {
  shell = await mountShell({ active: "goals", title: "Goals", description: "Hold the outcomes that matter, schedule deliberate effort, and close the loop." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-goal>${icon("plus")}New goal</button>`;
  shell.actions.querySelector("[data-new-goal]").addEventListener("click", () => openGoalForm());
  window.addEventListener("hq:new", () => openGoalForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  try {
    [state.goals, state.projects, state.milestones] = await Promise.all([supabase.query("goals", { select: "id,title,description,goal_type,target_value,current_value,unit,due_date,scheduled_start,scheduled_end,completed,completed_at,priority,next_step,project_id,created_at,updated_at", order: "due_date.asc", limit: 250 }), supabase.query("projects", { select: "id,name", limit: 250 }), supabase.query("goal_milestones", { select: "id,goal_id,title,completed,completed_at,position", order: "position.asc", limit: 500 })]);
    renderWorkspace();
    const requested = new URLSearchParams(location.search).get("goal");
    if (requested && state.goals.some((goal) => goal.id === requested)) {
      history.replaceState(null, "", "/hq/goals/");
      openGoal(requested);
    }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function renderWorkspace() {
  const completed = state.goals.filter((goal) => goal.completed).length;
  const active = state.goals.length - completed;
  const dueSoon = state.goals.filter((goal) => goalMatches(goal, { state: "DUE_SOON" })).length;
  const completion = state.goals.length ? Math.round((completed / state.goals.length) * 100) : 0;
  const atRisk = state.goals.filter((goal) => isGoalAtRisk(goal, goalProgress(goal, state.milestones))).length;
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Goal summary"><article><span>Active goals</span><strong>${active}</strong></article><article><span>Completed</span><strong>${completed}</strong></article><article><span>Due in 7 days</span><strong>${dueSoon}</strong></article><article><span>At risk</span><strong>${atRisk}</strong></article></section>
    <section class="workspace-controls" aria-label="Goal controls"><label class="search-control">${icon("search")}<span class="sr-only">Search goals</span><input type="search" placeholder="Search goals" value="${esc(state.query)}" data-goal-search></label><div class="filter-tabs" role="group" aria-label="Filter goal status">${[["ACTIVE","Active"],["DUE_SOON","Due soon"],["AT_RISK","At risk"],["COMPLETED","Completed"],["ALL","All"]].map(([value,label]) => `<button type="button" data-goal-filter="${value}" class="${state.filter === value ? "active" : ""}">${label}</button>`).join("")}</div><label class="select-control"><span class="sr-only">Filter goal type</span><select data-goal-type><option value="ALL">All types</option>${GOAL_TYPES.map((type) => `<option value="${type}" ${state.type === type ? "selected" : ""}>${type[0].toUpperCase() + type.slice(1)}</option>`).join("")}</select></label></section><div id="goal-results"></div>`;
  shell.content.querySelector("[data-goal-search]").addEventListener("input", (event) => { state.query = event.target.value; renderResults(); });
  shell.content.querySelectorAll("[data-goal-filter]").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.goalFilter; renderWorkspace(); }));
  shell.content.querySelector("[data-goal-type]").addEventListener("change", (event) => { state.type = event.target.value; renderResults(); });
  renderResults();
}

function renderResults() {
  const target = document.querySelector("#goal-results");
  const goals = state.goals.filter((goal) => (state.filter === "AT_RISK" ? isGoalAtRisk(goal, goalProgress(goal, state.milestones)) : goalMatches(goal, { query: state.query, state: state.filter, type: state.type })));
  if (!state.goals.length) {
    target.innerHTML = emptyState("No goals yet", "Define the first outcome worth protecting with a date and a clear measure.", "Create first goal");
    target.querySelector("[data-empty-action]")?.addEventListener("click", () => openGoalForm());
    return;
  }
  if (!goals.length) {
    target.innerHTML = emptyState("No matching goals", "Try a different status, type, or search term.", "Clear filters", "clear");
    target.querySelector("[data-empty-action]")?.addEventListener("click", () => { state.query = ""; state.filter = "ALL"; state.type = "ALL"; renderWorkspace(); });
    return;
  }
  target.innerHTML = `<div class="goal-list">${goals.map(goalRow).join("")}</div>`;
  target.querySelectorAll("[data-open-goal]").forEach((button) => button.addEventListener("click", () => openGoal(button.dataset.openGoal)));
  target.querySelectorAll("[data-toggle-goal]").forEach((button) => button.addEventListener("click", async (event) => {
    event.stopPropagation();
    const goal = state.goals.find((item) => item.id === button.dataset.toggleGoal);
    button.disabled = true;
    try { await supabase.update("goals", goal.id, completionPayload(!goal.completed)); toast(goal.completed ? "Goal reopened." : "Goal completed."); await load(); }
    catch (error) { toast(humanError(error), "error"); button.disabled = false; }
  }));
}

function goalRow(goal) {
  const progress = goalProgress(goal, state.milestones);
  const measurable = goal.goal_type !== "task" && goal.target_value;
  return `<article class="goal-row ${goal.completed ? "completed" : ""}"><button class="status-check ${goal.completed ? "done" : ""}" type="button" data-toggle-goal="${goal.id}" aria-label="${goal.completed ? "Reopen" : "Complete"} ${esc(goal.title)}"><span></span></button><button class="goal-main" type="button" data-open-goal="${goal.id}"><span class="goal-title"><strong>${esc(goal.title)}</strong><small>${esc(goal.description || "No description")}</small></span><span class="goal-type">${esc(goal.goal_type)}</span><span class="goal-measure">${measurable ? `${esc(goal.current_value ?? 0)} / ${esc(goal.target_value)} ${esc(goal.unit || "")}` : `${progress}%`}</span><span class="goal-date"><strong>${formatDate(goal.due_date)}</strong><small>${isGoalAtRisk(goal, progress) ? "At risk" : goal.scheduled_start ? `Scheduled ${formatDateTime(goal.scheduled_start)}` : "Not scheduled"}</small></span>${icon("chevron")}</button></article>`;
}

function goalForm(goal = {}) {
  return `<form class="entity-form" data-goal-form novalidate><div class="form-grid"><label class="span-2">Goal title<input name="title" required maxlength="160" value="${esc(goal.title)}"></label><label>Type<select name="goal_type">${GOAL_TYPES.map((type) => `<option value="${type}" ${type === (goal.goal_type || "task") ? "selected" : ""}>${type[0].toUpperCase() + type.slice(1)}</option>`).join("")}</select></label><label>Priority<select name="priority">${[1,2,3,4].map((value) => `<option value="${value}" ${Number(goal.priority ?? 3) === value ? "selected" : ""}>${["Low","Medium","High","Critical"][value - 1]}</option>`).join("")}</select></label><label>Due date<input name="due_date" type="date" required value="${esc(goal.due_date)}"></label><label>Target value<input name="target_value" type="number" min="0" step="any" value="${esc(goal.target_value)}" placeholder="For duration or quantity"></label><label>Current value<input name="current_value" type="number" min="0" step="any" value="${esc(goal.current_value)}"></label><label>Unit<input name="unit" value="${esc(goal.unit)}" placeholder="hours, users, pages…"></label><label>Related project<select name="project_id"><option value="">No project</option>${state.projects.map((project) => `<option value="${project.id}" ${project.id === goal.project_id ? "selected" : ""}>${esc(project.name)}</option>`).join("")}</select></label><label>Scheduled start<input name="scheduled_start" type="datetime-local" value="${localInputValue(goal.scheduled_start)}"></label><label>Scheduled end<input name="scheduled_end" type="datetime-local" value="${localInputValue(goal.scheduled_end)}"></label><label class="span-2">Next step<input name="next_step" value="${esc(goal.next_step)}"></label><label class="span-2">Description<textarea name="description" rows="4">${esc(goal.description)}</textarea></label></div><p class="form-hint">Task goals do not use target values. Duration and quantity goals require a positive target and unit.</p><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">${goal.id ? "Save changes" : "Create goal"}</button></div></form>`;
}

function openGoalForm(goal = null, parentDialog = null) {
  const dialog = openDialog({ title: goal ? "Edit goal" : "New goal", description: goal ? "Refine the outcome, measure, or schedule." : "Add an outcome with a clear due date.", className: "form-dialog", content: goalForm(goal || {}) });
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  dialog.querySelector("[data-goal-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = validateGoal(formValues(event.currentTarget));
    const error = event.currentTarget.querySelector("[data-form-error]");
    showFormErrors(error, result.errors);
    if (!result.valid) return;
    const button = event.currentTarget.querySelector('[type="submit"]'); setButtonBusy(button, true, goal ? "Saving…" : "Creating…");
    try {
      if (goal) await supabase.update("goals", goal.id, result.values);
      else await supabase.insert("goals", { ...result.values, user_id: shell.session.user.id });
      dialog.close(); parentDialog?.close(); toast(goal ? "Goal updated." : "Goal created."); await load();
    } catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

function openGoal(id) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) return;
  const dialog = openDialog({ title: goal.title, description: goal.description || "Strategic outcome", className: "hq-drawer", content: `<div class="detail-meta"><span class="status-pill" data-status="${goal.completed ? "COMPLETED" : "ACTIVE"}">${goal.completed ? "Completed" : "Active"}</span><span>${esc(goal.goal_type)}</span><span>Due ${formatDate(goal.due_date)}</span></div><section class="detail-section"><p class="eyebrow">Outcome</p><h3>${esc(goal.title)}</h3><p class="detail-copy">${esc(goal.description || "No description has been added.")}</p></section><section class="detail-section"><p class="eyebrow">Measure and schedule</p><dl class="detail-definition"><div><dt>Target</dt><dd>${goal.goal_type === "task" ? "Outcome" : `${esc(goal.target_value)} ${esc(goal.unit || "")}`}</dd></div><div><dt>Due</dt><dd>${formatDate(goal.due_date)}</dd></div><div><dt>Scheduled start</dt><dd>${formatDateTime(goal.scheduled_start)}</dd></div><div><dt>Scheduled end</dt><dd>${formatDateTime(goal.scheduled_end)}</dd></div><div><dt>Completed</dt><dd>${formatDateTime(goal.completed_at)}</dd></div></dl>${goal.scheduled_start ? `<a class="text-link" href="/hq/calendar/?date=${goal.scheduled_start.slice(0,10)}">View in calendar →</a>` : ""}</section><div class="drawer-actions"><button class="hq-action" type="button" data-toggle-detail>${goal.completed ? "Reopen goal" : "Mark complete"}</button><button class="quiet-button" type="button" data-edit-detail>Edit goal</button><button class="danger-button" type="button" data-delete-detail>Delete</button></div>` });
  dialog.querySelector("[data-edit-detail]").addEventListener("click", () => openGoalForm(goal, dialog));
  dialog.querySelector("[data-toggle-detail]").addEventListener("click", async () => { await supabase.update("goals", goal.id, completionPayload(!goal.completed)); dialog.close(); toast(goal.completed ? "Goal reopened." : "Goal completed."); await load(); });
  dialog.querySelector("[data-delete-detail]").addEventListener("click", async () => { if (await confirmAction({ title: `Delete ${goal.title}?`, message: "This goal will be permanently removed.", confirmLabel: "Delete goal" })) { await supabase.remove("goals", goal.id); dialog.close(); toast("Goal deleted."); await load(); } });
}
