import { PROJECT_CATEGORIES, PROJECT_HEALTH, PROJECT_STATUSES, esc, formatDate, formatDateTime, isStaleProject, projectMatches, projectProgress, slugify, validateProject } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

const state = { projects: [], actions: [], items: [], goals: [], query: "", status: "ALL", view: sessionStorage.getItem("hq_project_view") || "list" };
let shell;

const statusLabels = { PLANNED: "Planning", ACTIVE: "Active", PAUSED: "On hold", COMPLETED: "Completed", ARCHIVED: "Archived" };
const statusOptions = (selected) => PROJECT_STATUSES.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${statusLabels[status]}</option>`).join("");
const categoryOptions = (selected) => [...new Set([selected, ...PROJECT_CATEGORIES].filter(Boolean))].map((category) => `<option ${category === selected ? "selected" : ""}>${esc(category)}</option>`).join("");

export async function mount() {
  shell = await mountShell({ active: "projects", title: "Projects", description: "Direct the work, expose the next action, and keep decisions attached to execution." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-project>${icon("plus")}New project</button>`;
  shell.actions.querySelector("[data-new-project]").addEventListener("click", () => openProjectForm());
  window.addEventListener("hq:new", () => openProjectForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  try {
    [state.projects, state.actions, state.items, state.goals] = await Promise.all([
      supabase.query("projects", { select: "id,name,slug,short_description,category,status,priority,health,next_action,blocker,progress,deadline,github_url,notes,overview,created_at,updated_at", order: "updated_at.desc", limit: 200 }),
      supabase.query("project_actions", { select: "id,project_id,task,due_date,status,position,updated_at", order: "position.asc", limit: 300 }),
      supabase.query("project_items", { select: "id,project_id,title,status,section,updated_at", order: "position.asc", limit: 500 }),
      supabase.query("goals", { select: "id,title,project_id", limit: 300 }),
    ]);
    renderWorkspace();
    const requested = new URLSearchParams(location.search).get("project");
    if (requested && state.projects.some((project) => project.id === requested)) {
      history.replaceState(null, "", "/hq/projects/");
      openProject(requested);
    }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function renderWorkspace() {
  shell.content.innerHTML = `<section class="workspace-controls" aria-label="Project controls">
    <label class="search-control">${icon("search")}<span class="sr-only">Search projects</span><input type="search" placeholder="Search projects" value="${esc(state.query)}" data-project-search></label>
    <div class="filter-tabs" role="group" aria-label="Filter projects">${[["ALL","All"],["ACTIVE","Active"],["PLANNED","Planning"],["PAUSED","On hold"],["COMPLETED","Completed"]].map(([value,label]) => `<button type="button" data-status-filter="${value}" class="${state.status === value ? "active" : ""}">${label}</button>`).join("")}</div>
    <div class="view-switch" role="group" aria-label="Project view"><button type="button" data-view="list" class="${state.view === "list" ? "active" : ""}">List</button><button type="button" data-view="board" class="${state.view === "board" ? "active" : ""}">Board</button></div>
  </section><div id="project-results"></div>`;
  shell.content.querySelector("[data-project-search]").addEventListener("input", (event) => { state.query = event.target.value; renderResults(); });
  shell.content.querySelectorAll("[data-status-filter]").forEach((button) => button.addEventListener("click", () => { state.status = button.dataset.statusFilter; renderWorkspace(); }));
  shell.content.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; sessionStorage.setItem("hq_project_view", state.view); renderWorkspace(); }));
  renderResults();
}

function nextAction(projectId) {
  return state.actions.find((action) => action.project_id === projectId && action.status !== "DONE");
}

function renderResults() {
  const target = document.querySelector("#project-results");
  const projects = state.projects.filter((project) => projectMatches(project, state));
  if (!state.projects.length) {
    target.innerHTML = emptyState("No projects yet", "Create a project to connect priorities, progress, notes, and next actions in one place.", "Create first project");
    target.querySelector("[data-empty-action]")?.addEventListener("click", () => openProjectForm());
    return;
  }
  if (!projects.length) {
    target.innerHTML = emptyState("No matching projects", "Adjust the search or status filter to see more work.", "Clear filters", "clear");
    target.querySelector("[data-empty-action]")?.addEventListener("click", () => { state.query = ""; state.status = "ALL"; renderWorkspace(); });
    return;
  }
  target.innerHTML = state.view === "board" ? renderBoard(projects) : renderTable(projects);
  target.querySelectorAll("[data-open-project]").forEach((button) => button.addEventListener("click", () => openProject(button.dataset.openProject)));
}

function renderTable(projects) {
  return `<div class="table-shell"><table class="data-table project-table"><thead><tr><th>Project</th><th>Status</th><th>Priority</th><th>Health</th><th>Progress</th><th>Next action</th><th>Deadline</th><th><span class="sr-only">Open</span></th></tr></thead><tbody>${projects.map((project) => {
    const action = nextAction(project.id);
    const progress = projectProgress(project, state.items);
    return `<tr class="${isStaleProject(project) ? "stale-row" : ""}"><td><button class="table-primary" type="button" data-open-project="${project.id}"><strong>${esc(project.name)}</strong><span>${esc(project.category || "Uncategorized")}${isStaleProject(project) ? " · Stale" : ""}</span></button></td><td><span class="status-pill" data-status="${project.status || "PLANNED"}">${statusLabels[project.status] || "Planning"}</span></td><td><span class="priority-mark">P${project.priority ?? 3}</span></td><td><span class="health-mark" data-health="${project.health || "ON_TRACK"}">${(project.health || "ON_TRACK").replaceAll("_", " ")}</span></td><td><div class="progress-cell"><span>${progress}%</span><i><b style="width:${progress}%"></b></i></div></td><td>${esc(project.next_action || action?.task || "No open action")}</td><td>${formatDate(project.deadline)}</td><td><button class="icon-button" type="button" data-open-project="${project.id}" aria-label="Open ${esc(project.name)}">${icon("chevron")}</button></td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function renderBoard(projects) {
  return `<div class="project-board">${projects.map((project) => {
    const action = nextAction(project.id);
    return `<button class="project-card" type="button" data-open-project="${project.id}"><div><span class="status-pill" data-status="${project.status || "PLANNED"}">${statusLabels[project.status] || "Planning"}</span><span class="priority-mark">P${project.priority ?? 3}</span></div><h2>${esc(project.name)}</h2><p>${esc(project.short_description || "No project description yet.")}</p><div class="project-card-progress"><span>Progress</span><strong>${project.progress ?? 0}%</strong><i><b style="width:${Math.max(0, Math.min(100, project.progress ?? 0))}%"></b></i></div><footer><span>${action ? esc(action.task) : "No open action"}</span><time>${formatDate(project.deadline)}</time></footer></button>`;
  }).join("")}</div>`;
}

function projectForm(project = {}) {
  return `<form class="entity-form" data-project-form novalidate>
    <div class="form-grid"><label class="span-2">Project name<input name="name" required maxlength="120" value="${esc(project.name)}"></label><label>Category<select name="category" required><option value="">Choose category</option>${categoryOptions(project.category)}</select></label><label>Status<select name="status">${statusOptions(project.status || "PLANNED")}</select></label><label>Priority<select name="priority">${[1,2,3,4].map((value) => `<option value="${value}" ${Number(project.priority ?? 3) === value ? "selected" : ""}>${["Low","Medium","High","Critical"][value - 1]}</option>`).join("")}</select></label><label>Health<select name="health">${PROJECT_HEALTH.map((value) => `<option value="${value}" ${value === (project.health || "ON_TRACK") ? "selected" : ""}>${value.replaceAll("_", " ")}</option>`).join("")}</select></label><label>Deadline<input name="deadline" type="date" value="${esc(project.deadline)}"></label><label>Next action<input name="next_action" value="${esc(project.next_action)}"></label><label class="span-2">Blocker<input name="blocker" value="${esc(project.blocker)}" placeholder="Leave empty when clear"></label><label>Progress override<input name="progress" type="number" min="0" max="100" value="${project.progress ?? 0}"></label><label>Primary link<input name="github_url" type="url" value="${esc(project.github_url)}" placeholder="https://"></label><label class="span-2">Short description<textarea name="short_description" rows="2" maxlength="500">${esc(project.short_description)}</textarea></label><label class="span-2">Overview<textarea name="overview" rows="4">${esc(project.overview)}</textarea></label><label class="span-2">Private notes<textarea name="notes" rows="4">${esc(project.notes)}</textarea></label></div>
    <p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">${project.id ? "Save changes" : "Create project"}</button></div>
  </form>`;
}

function openProjectForm(project = null) {
  const dialog = openDialog({ title: project ? "Edit project" : "New project", description: project ? "Update the operating details for this project." : "Create a focused workspace for work that is real enough to track.", className: "form-dialog", content: projectForm(project || {}) });
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  dialog.querySelector("[data-project-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = validateProject(formValues(event.currentTarget));
    const error = event.currentTarget.querySelector("[data-form-error]");
    showFormErrors(error, result.errors);
    if (!result.valid) return;
    const button = event.currentTarget.querySelector('[type="submit"]');
    setButtonBusy(button, true, project ? "Saving…" : "Creating…");
    try {
      if (project) await supabase.update("projects", project.id, result.values);
      else await supabase.insert("projects", { ...result.values, slug: slugify(result.values.name), user_id: shell.session.user.id });
      dialog.close();
      toast(project ? "Project updated." : "Project created.");
      await load();
    } catch (requestError) {
      showFormErrors(error, [humanError(requestError)]);
      setButtonBusy(button, false);
    }
  });
}

async function openProject(id) {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return;
  const dialog = openDialog({ title: project.name, description: project.short_description || "Project operating record", className: "hq-drawer", content: skeleton(5) });
  await renderDetail(dialog, project);
}

async function renderDetail(dialog, project) {
  const content = dialog.querySelector(".dialog-content");
  content.innerHTML = skeleton(5);
  try {
    const [items, actions] = await Promise.all([
      supabase.query("project_items", { select: "id,project_id,section,title,description,date,status,type,content,position,updated_at", filters: { project_id: `eq.${project.id}` }, order: "position.asc", limit: 100 }),
      supabase.query("project_actions", { select: "id,project_id,task,owner,due_date,status,position,updated_at", filters: { project_id: `eq.${project.id}` }, order: "position.asc", limit: 100 }),
    ]);
    const progress = projectProgress(project, items);
    const relatedGoals = state.goals.filter((goal) => goal.project_id === project.id);
    content.innerHTML = `<div class="detail-meta"><span class="status-pill" data-status="${project.status || "PLANNED"}">${statusLabels[project.status] || "Planning"}</span><span class="priority-mark">P${project.priority ?? 3}</span><span class="health-mark" data-health="${project.health || "ON_TRACK"}">${(project.health || "ON_TRACK").replaceAll("_", " ")}</span><span>${progress}% complete</span><span>${project.deadline ? `Due ${formatDate(project.deadline)}` : "No deadline"}</span></div>
      <section class="detail-section"><div class="section-heading"><div><p class="eyebrow">Project brief</p><h3>Direction</h3></div><button class="quiet-button compact" type="button" data-edit-project>Edit</button></div><p class="detail-copy">${esc(project.overview || project.short_description || "No overview has been added.")}</p>${project.notes ? `<div class="note-block"><span>Private notes</span><p>${esc(project.notes)}</p></div>` : ""}${project.github_url ? `<a class="text-link" href="${esc(project.github_url)}" target="_blank" rel="noreferrer">Open primary link ↗</a>` : ""}</section>
      <section class="detail-section"><div class="section-heading"><div><p class="eyebrow">Execution</p><h3>Next actions</h3></div><button class="quiet-button compact" type="button" data-toggle-action-form>${icon("plus")}Add action</button></div><form class="inline-form" data-action-form hidden><input name="task" placeholder="Next action" required><input name="due_date" type="datetime-local"><select name="status"><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select><button class="hq-action compact" type="submit">Add</button><p class="form-error span-4" data-form-error hidden></p></form><div class="detail-list">${actions.length ? actions.map(actionRow).join("") : '<p class="subtle">No project actions yet.</p>'}</div></section>
      <section class="detail-section"><div class="section-heading"><div><p class="eyebrow">Related goals</p><h3>Outcomes</h3></div></div>${relatedGoals.length ? `<div class="detail-list">${relatedGoals.map((goal) => `<a class="detail-row" href="/hq/goals/?goal=${goal.id}"><strong>${esc(goal.title)}</strong>${icon("chevron")}</a>`).join("")}</div>` : '<p class="subtle">No related goals yet.</p>'}</section>
      <section class="detail-section"><div class="section-heading"><div><p class="eyebrow">Working record</p><h3>Project items</h3></div><button class="quiet-button compact" type="button" data-toggle-item-form>${icon("plus")}Add item</button></div><form class="inline-form" data-item-form hidden><input name="title" placeholder="Item title" required><select name="section"><option value="current_work">Current work</option><option value="completed_work">Completed work</option><option value="learnings">Learning</option><option value="challenges">Challenge</option><option value="timeline">Timeline</option></select><input name="date" type="datetime-local"><button class="hq-action compact" type="submit">Add</button><textarea class="span-4" name="description" rows="2" placeholder="Optional context"></textarea><p class="form-error span-4" data-form-error hidden></p></form><div class="detail-list">${items.length ? items.map(itemRow).join("") : '<p class="subtle">No project items yet.</p>'}</div></section>
      <section class="danger-zone"><div><strong>Delete project</strong><p>Deletes the project and its related actions and items.</p></div><button class="danger-button" type="button" data-delete-project>Delete project</button></section>`;
    content.querySelector("[data-edit-project]").addEventListener("click", () => openProjectForm(project));
    content.querySelector("[data-toggle-action-form]").addEventListener("click", () => { content.querySelector("[data-action-form]").hidden = false; content.querySelector('[data-action-form] input[name="task"]').focus(); });
    content.querySelector("[data-toggle-item-form]").addEventListener("click", () => { content.querySelector("[data-item-form]").hidden = false; content.querySelector('[data-item-form] input[name="title"]').focus(); });
    content.querySelector("[data-action-form]").addEventListener("submit", async (event) => addAction(event, dialog, project));
    content.querySelector("[data-item-form]").addEventListener("submit", async (event) => addItem(event, dialog, project));
    content.querySelectorAll("[data-cycle-action]").forEach((button) => button.addEventListener("click", async () => {
      const action = actions.find((item) => item.id === button.dataset.cycleAction);
      const next = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" }[action.status];
      await supabase.update("project_actions", action.id, { status: next }); toast("Action status updated."); await renderDetail(dialog, project);
    }));
    content.querySelectorAll("[data-delete-action]").forEach((button) => button.addEventListener("click", async () => {
      if (await confirmAction({ title: "Delete action?", message: "This action will be permanently removed." })) { await supabase.remove("project_actions", button.dataset.deleteAction); toast("Action deleted."); await renderDetail(dialog, project); }
    }));
    content.querySelectorAll("[data-complete-item]").forEach((button) => button.addEventListener("click", async () => { await supabase.update("project_items", button.dataset.completeItem, { status: button.dataset.itemDone === "true" ? "OPEN" : "DONE" }); toast("Project item updated."); await renderDetail(dialog, project); }));
    content.querySelectorAll("[data-delete-item]").forEach((button) => button.addEventListener("click", async () => { if (await confirmAction({ title: "Delete item?", message: "This project item will be permanently removed." })) { await supabase.remove("project_items", button.dataset.deleteItem); toast("Project item deleted."); await renderDetail(dialog, project); } }));
    content.querySelector("[data-delete-project]").addEventListener("click", async () => {
      if (await confirmAction({ title: `Delete ${project.name}?`, message: "The project, its actions, and its items will be permanently removed.", confirmLabel: "Delete project" })) { await supabase.remove("projects", project.id); dialog.close(); toast("Project deleted."); await load(); }
    });
  } catch (error) {
    content.innerHTML = errorState(error);
    content.querySelector("[data-retry]")?.addEventListener("click", () => renderDetail(dialog, project));
  }
}

function actionRow(action) {
  return `<article class="detail-row"><button class="status-check ${action.status === "DONE" ? "done" : ""}" type="button" data-cycle-action="${action.id}" aria-label="Change status for ${esc(action.task)}"><span></span></button><div><strong>${esc(action.task)}</strong><p>${action.status.replaceAll("_", " ")}${action.due_date ? ` · ${formatDateTime(action.due_date)}` : ""}${action.owner ? ` · ${esc(action.owner)}` : ""}</p></div><button class="icon-button danger-icon" type="button" data-delete-action="${action.id}" aria-label="Delete ${esc(action.task)}">${icon("close")}</button></article>`;
}

function itemRow(item) {
  const done = item.status === "DONE" || item.section === "completed_work";
  return `<article class="detail-row"><button class="status-check ${done ? "done" : ""}" type="button" data-complete-item="${item.id}" data-item-done="${done}" aria-label="${done ? "Reopen" : "Complete"} ${esc(item.title)}"><span></span></button><div><strong>${esc(item.title)}</strong><p>${esc(item.description || item.content || item.section.replaceAll("_", " "))}${item.date ? ` · ${formatDateTime(item.date)}` : ""}</p></div><button class="icon-button danger-icon" type="button" data-delete-item="${item.id}" aria-label="Delete ${esc(item.title)}">${icon("close")}</button></article>`;
}

async function addAction(event, dialog, project) {
  event.preventDefault();
  const values = formValues(event.currentTarget);
  const error = event.currentTarget.querySelector("[data-form-error]");
  if (!values.task) return showFormErrors(error, ["Action title is required."]);
  const button = event.currentTarget.querySelector('[type="submit"]'); setButtonBusy(button, true, "Adding…");
  try { await supabase.insert("project_actions", { project_id: project.id, task: values.task, due_date: values.due_date ? new Date(values.due_date).toISOString() : null, status: values.status || "TODO" }); toast("Action added."); await renderDetail(dialog, project); }
  catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
}

async function addItem(event, dialog, project) {
  event.preventDefault();
  const values = formValues(event.currentTarget);
  const error = event.currentTarget.querySelector("[data-form-error]");
  if (!values.title) return showFormErrors(error, ["Item title is required."]);
  const button = event.currentTarget.querySelector('[type="submit"]'); setButtonBusy(button, true, "Adding…");
  try { await supabase.insert("project_items", { project_id: project.id, title: values.title, description: values.description || null, content: values.description || "", section: values.section || "current_work", type: "todo", date: values.date ? new Date(values.date).toISOString() : null, status: "OPEN" }); toast("Project item added."); await renderDetail(dialog, project); }
  catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
}
