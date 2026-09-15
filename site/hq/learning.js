import { esc, formatDate } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { items: [], skills: [], projects: [], filter: "all", search: "" };

export async function mount() {
  shell = await mountShell({ active: "learning", title: "Learning", description: "Manage books, papers, topics, courses, and experiments as one execution queue." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-learning>${icon("plus")}Learning item</button>`;
  shell.actions.querySelector("[data-new-learning]").addEventListener("click", () => openItemForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(5);
  try {
    [state.items, state.skills, state.projects] = await Promise.all([
      supabase.query("learning_items", { select: "id,skill_id,project_id,title,item_type,status,source_url,notes,progress,created_at,updated_at", order: "updated_at.desc", limit: 500 }),
      supabase.query("skills", { select: "id,name", order: "name.asc", limit: 300 }),
      supabase.query("projects", { select: "id,name", order: "name.asc", limit: 300 }),
    ]);
    render();
    if (new URLSearchParams(location.search).get("new") === "1") { history.replaceState(null, "", "/hq/learning/"); openItemForm(); }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function label(list, id, fallback = "Unassigned") { return list.find((item) => item.id === id)?.name || fallback; }
function options(list, selected, fallback) { return `<option value="">${fallback}</option>${list.map((item) => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${esc(item.name)}</option>`).join("")}`; }

function visibleItems() {
  const q = state.search.toLowerCase().trim();
  return state.items.filter((item) => (state.filter === "all" || item.status === state.filter) && (!q || `${item.title} ${item.notes || ""} ${item.item_type}`.toLowerCase().includes(q)));
}

function render() {
  const visible = visibleItems();
  if (!state.items.length) {
    shell.content.innerHTML = emptyState("No learning queue yet", "Add courses, papers, books, topics, or experiments and connect them to skills.", "Add learning item");
    shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openItemForm());
    return;
  }
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Learning summary">
    <article><span>Queue</span><strong>${state.items.filter((item) => item.status === "queue").length}</strong><small>waiting</small></article>
    <article><span>Active</span><strong>${state.items.filter((item) => item.status === "active").length}</strong><small>in motion</small></article>
    <article><span>Complete</span><strong>${state.items.filter((item) => item.status === "complete").length}</strong><small>finished</small></article>
  </section><section class="inbox-stack"><header class="section-heading inbox-heading"><div><p class="eyebrow">Learning queue</p><h2>${visible.length} visible</h2></div><label class="inbox-search"><span class="sr-only">Search learning</span><input type="search" data-learning-search placeholder="Search learning" value="${esc(state.search)}"></label></header><div class="inbox-filters" role="tablist" aria-label="Learning filters">${["all","queue","active","complete"].map((key) => `<button type="button" data-learning-filter="${key}" aria-pressed="${state.filter === key}">${key}</button>`).join("")}</div><div class="entity-list">${visible.map(itemRow).join("") || emptyState("Nothing matches", "Adjust the search or filter.", null)}</div></section>`;
  shell.content.querySelector("[data-learning-search]")?.addEventListener("input", (event) => { state.search = event.target.value; render(); });
  shell.content.querySelectorAll("[data-learning-filter]").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.learningFilter; render(); }));
  shell.content.querySelectorAll("[data-edit-learning]").forEach((button) => button.addEventListener("click", () => openItemForm(state.items.find((item) => item.id === button.dataset.editLearning))));
  shell.content.querySelectorAll("[data-learning-status]").forEach((button) => button.addEventListener("click", () => changeStatus(button.dataset.learningStatus)));
}

function itemRow(item) {
  return `<article class="project-card"><div><p class="eyebrow">${esc(item.item_type)} / ${esc(item.status)}</p><h2>${esc(item.title)}</h2><p>${esc(item.notes || "No notes recorded.")}</p><small>${esc(label(state.skills, item.skill_id, "No skill"))} &middot; ${esc(label(state.projects, item.project_id, "No project"))}${item.source_url ? ` &middot; <a class="text-link" href="${esc(item.source_url)}" target="_blank" rel="noreferrer">Source</a>` : ""}</small><div class="progress-track"><span style="width:${Number(item.progress || 0)}%"></span></div></div><div class="item-actions"><button class="quiet-button compact" type="button" data-learning-status="${item.id}">${item.status === "complete" ? "Reopen" : "Advance"}</button><button class="quiet-button compact" type="button" data-edit-learning="${item.id}">Edit</button></div></article>`;
}

function openItemForm(item = null) {
  const dialog = openDialog({ title: item ? "Edit learning item" : "New learning item", description: "Keep learning attached to the work it supports.", className: "form-dialog", content: `<form class="entity-form" data-learning-form><div class="form-grid"><label class="span-2">Title<input name="title" required value="${esc(item?.title)}"></label><label>Type<select name="item_type">${["course","book","paper","article","tutorial","experiment","topic"].map((type) => `<option ${item?.item_type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label>Status<select name="status">${["queue","active","complete"].map((status) => `<option ${item?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label>Progress<input name="progress" type="number" min="0" max="100" value="${esc(item?.progress || 0)}"></label><label>Skill<select name="skill_id">${options(state.skills, item?.skill_id, "No skill")}</select></label><label>Project<select name="project_id">${options(state.projects, item?.project_id, "No project")}</select></label><label class="span-2">Source URL<input name="source_url" type="url" value="${esc(item?.source_url)}"></label><label class="span-2">Notes<textarea name="notes" rows="5">${esc(item?.notes)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions">${item ? '<button class="danger-button" type="button" data-delete-learning>Delete</button>' : ""}<button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-learning-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    if (!values.title) return showFormErrors(error, ["Title is required."]);
    const payload = { title: values.title, item_type: values.item_type || "article", status: values.status || "queue", source_url: values.source_url || null, notes: values.notes || null, skill_id: values.skill_id || null, project_id: values.project_id || null, progress: Math.max(0, Math.min(100, Number(values.progress || 0))) };
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Saving...");
    try { if (item) await supabase.update("learning_items", item.id, payload); else await supabase.insert("learning_items", { ...payload, user_id: shell.session.user.id }); dialog.close(); toast("Learning item saved."); await load(); }
    catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
  dialog.querySelector("[data-delete-learning]")?.addEventListener("click", async () => { if (await confirmAction({ title: "Delete learning item?", message: "This removes the item from the queue." })) { await supabase.remove("learning_items", item.id); dialog.close(); toast("Learning item deleted."); await load(); } });
}

async function changeStatus(id) {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return;
  const next = item.status === "queue" ? "active" : item.status === "active" ? "complete" : "active";
  await supabase.update("learning_items", id, { status: next, progress: next === "complete" ? 100 : item.progress });
  toast("Learning status updated.");
  await load();
}

