import { esc, formatDate } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { areas: [], skills: [], milestones: [], reflections: [] };

export async function mount() {
  shell = await mountShell({ active: "development", title: "Development", description: "Track the capabilities, reviews, and milestones that compound over time." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="quiet-button" type="button" data-new-skill>${icon("plus")}Skill</button><button class="hq-action" type="button" data-new-area>${icon("plus")}Area</button>`;
  shell.actions.querySelector("[data-new-area]").addEventListener("click", () => openAreaForm());
  shell.actions.querySelector("[data-new-skill]").addEventListener("click", () => openSkillForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  try {
    [state.areas, state.skills, state.milestones, state.reflections] = await Promise.all([
      supabase.query("development_areas", { select: "id,name,description,current_focus,priority,status,created_at,updated_at", order: "priority.asc,updated_at.desc", limit: 300 }),
      supabase.query("skills", { select: "id,development_area_id,name,current_level,target_level,status,priority,notes,last_reviewed,created_at,updated_at", order: "priority.asc,updated_at.desc", limit: 500 }),
      supabase.query("development_milestones", { select: "id,development_area_id,title,target_date,completed,created_at,updated_at", order: "target_date.asc", limit: 300 }),
      supabase.query("development_reflections", { select: "id,body,reflected_on,created_at,updated_at", order: "reflected_on.desc", limit: 20 }),
    ]);
    render();
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "area") { history.replaceState(null, "", "/hq/development/"); openAreaForm(); }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function areaName(id) { return state.areas.find((area) => area.id === id)?.name || "Unassigned"; }
function areaOptions(selected) { return `<option value="">Unassigned</option>${state.areas.map((area) => `<option value="${area.id}" ${area.id === selected ? "selected" : ""}>${esc(area.name)}</option>`).join("")}`; }

function render() {
  if (!state.areas.length && !state.skills.length) {
    shell.content.innerHTML = emptyState("No development system yet", "Create a growth area and connect skills to it.", "Create development area");
    shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openAreaForm());
    return;
  }
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Development summary">
    <article><span>Areas</span><strong>${state.areas.length}</strong><small>${state.areas.filter((item) => item.status === "active").length} active</small></article>
    <article><span>Skills</span><strong>${state.skills.length}</strong><small>${state.skills.filter((item) => item.status === "building").length} building</small></article>
    <article><span>Milestones</span><strong>${state.milestones.filter((item) => !item.completed).length}</strong><small>open targets</small></article>
  </section><div class="dashboard-grid">
    <section class="dashboard-panel span-2"><header><div><p class="eyebrow">Capability areas</p><h2>Development map</h2></div></header><div class="entity-list">${state.areas.map(areaRow).join("")}</div></section>
    <section class="dashboard-panel"><header><div><p class="eyebrow">Skills</p><h2>Current focus</h2></div></header><div class="detail-list">${state.skills.slice(0, 12).map(skillRow).join("") || '<p class="subtle panel-empty">No skills tracked.</p>'}</div></section>
    <section class="dashboard-panel span-2"><header><div><p class="eyebrow">Milestones</p><h2>Next capability proofs</h2></div><button class="quiet-button compact" type="button" data-new-milestone>${icon("plus")}Milestone</button></header><div class="detail-list">${state.milestones.slice(0, 10).map(milestoneRow).join("") || '<p class="subtle panel-empty">No milestones yet.</p>'}</div></section>
    <section class="dashboard-panel span-2"><header><div><p class="eyebrow">Reflections</p><h2>Learning notes</h2></div><button class="quiet-button compact" type="button" data-new-reflection>${icon("plus")}Reflection</button></header><div class="detail-list">${state.reflections.map(reflectionRow).join("") || '<p class="subtle panel-empty">No reflections yet.</p>'}</div></section>
  </div>`;
  shell.content.querySelectorAll("[data-edit-area]").forEach((button) => button.addEventListener("click", () => openAreaForm(state.areas.find((item) => item.id === button.dataset.editArea))));
  shell.content.querySelectorAll("[data-edit-skill]").forEach((button) => button.addEventListener("click", () => openSkillForm(state.skills.find((item) => item.id === button.dataset.editSkill))));
  shell.content.querySelector("[data-new-milestone]")?.addEventListener("click", () => openMilestoneForm());
  shell.content.querySelectorAll("[data-toggle-milestone]").forEach((button) => button.addEventListener("click", () => toggleMilestone(button.dataset.toggleMilestone)));
  shell.content.querySelector("[data-new-reflection]")?.addEventListener("click", () => openReflectionForm());
}

function areaRow(area) {
  const skills = state.skills.filter((skill) => skill.development_area_id === area.id);
  return `<article class="project-card"><div><p class="eyebrow">${esc(area.status)} / priority ${area.priority}</p><h2>${esc(area.name)}</h2><p>${esc(area.description || "No description recorded.")}</p><small>${skills.length} skills${area.current_focus ? ` &middot; Focus: ${esc(area.current_focus)}` : ""}</small></div><button class="quiet-button compact" type="button" data-edit-area="${area.id}">Edit</button></article>`;
}

function skillRow(skill) {
  return `<article class="compact-row"><span><strong>${esc(skill.name)}</strong><small>${esc(areaName(skill.development_area_id))} &middot; level ${skill.current_level}/${skill.target_level} &middot; ${esc(skill.status)}${skill.last_reviewed ? ` &middot; reviewed ${formatDate(skill.last_reviewed)}` : ""}</small></span><button class="quiet-button compact" type="button" data-edit-skill="${skill.id}">Edit</button></article>`;
}

function milestoneRow(item) {
  return `<article class="compact-row"><span><strong>${esc(item.title)}</strong><small>${esc(areaName(item.development_area_id))}${item.target_date ? ` &middot; ${formatDate(item.target_date)}` : ""}</small></span><button class="quiet-button compact" type="button" data-toggle-milestone="${item.id}">${item.completed ? "Reopen" : "Complete"}</button></article>`;
}

function reflectionRow(item) {
  return `<article class="compact-row"><span><strong>${formatDate(item.reflected_on)}</strong><small>${esc(item.body)}</small></span></article>`;
}

function openAreaForm(item = null) {
  const dialog = openDialog({ title: item ? "Edit development area" : "New development area", description: "Define a durable capability track.", className: "form-dialog", content: `<form class="entity-form" data-area-form><div class="form-grid"><label class="span-2">Name<input name="name" required value="${esc(item?.name)}"></label><label>Status<select name="status">${["active","paused","complete"].map((status) => `<option ${item?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label>Priority<input name="priority" type="number" min="1" max="5" value="${esc(item?.priority || 3)}"></label><label class="span-2">Current focus<input name="current_focus" value="${esc(item?.current_focus)}"></label><label class="span-2">Description<textarea name="description" rows="4">${esc(item?.description)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions">${item ? '<button class="danger-button" type="button" data-delete-area>Delete</button>' : ""}<button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  bindForm(dialog, "[data-area-form]", async (values) => {
    const payload = { name: values.name, description: values.description || null, current_focus: values.current_focus || null, priority: Number(values.priority || 3), status: values.status || "active" };
    if (!payload.name) throw new Error("Area name is required.");
    if (item) await supabase.update("development_areas", item.id, payload);
    else await supabase.insert("development_areas", { ...payload, user_id: shell.session.user.id });
  });
  dialog.querySelector("[data-delete-area]")?.addEventListener("click", async () => { if (await confirmAction({ title: "Delete area?", message: "Skills will remain unassigned." })) { await supabase.remove("development_areas", item.id); dialog.close(); toast("Development area deleted."); await load(); } });
}

function openSkillForm(item = null) {
  const dialog = openDialog({ title: item ? "Edit skill" : "New skill", description: "Track capability level, priority, and review cadence.", className: "form-dialog", content: `<form class="entity-form" data-skill-form><div class="form-grid"><label class="span-2">Skill<input name="name" required value="${esc(item?.name)}"></label><label>Area<select name="development_area_id">${areaOptions(item?.development_area_id)}</select></label><label>Status<select name="status">${["building","active","learning","paused"].map((status) => `<option ${item?.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label>Current level<input name="current_level" type="number" min="1" max="5" value="${esc(item?.current_level || 1)}"></label><label>Target level<input name="target_level" type="number" min="1" max="5" value="${esc(item?.target_level || 3)}"></label><label>Priority<input name="priority" type="number" min="1" max="5" value="${esc(item?.priority || 3)}"></label><label>Last reviewed<input name="last_reviewed" type="date" value="${esc(item?.last_reviewed)}"></label><label class="span-2">Notes<textarea name="notes" rows="4">${esc(item?.notes)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions">${item ? '<button class="danger-button" type="button" data-delete-skill>Delete</button>' : ""}<button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  bindForm(dialog, "[data-skill-form]", async (values) => {
    const payload = { name: values.name, development_area_id: values.development_area_id || null, status: values.status || "building", current_level: Number(values.current_level || 1), target_level: Number(values.target_level || 3), priority: Number(values.priority || 3), last_reviewed: values.last_reviewed || null, notes: values.notes || null };
    if (!payload.name) throw new Error("Skill name is required.");
    if (item) await supabase.update("skills", item.id, payload);
    else await supabase.insert("skills", { ...payload, user_id: shell.session.user.id });
  });
  dialog.querySelector("[data-delete-skill]")?.addEventListener("click", async () => { if (await confirmAction({ title: "Delete skill?", message: "Learning items attached to it will become unassigned." })) { await supabase.remove("skills", item.id); dialog.close(); toast("Skill deleted."); await load(); } });
}

function openMilestoneForm() {
  const dialog = openDialog({ title: "New milestone", description: "Define the proof that a capability improved.", className: "form-dialog", content: `<form class="entity-form" data-milestone-form><div class="form-grid"><label class="span-2">Title<input name="title" required></label><label>Area<select name="development_area_id">${areaOptions()}</select></label><label>Target date<input name="target_date" type="date"></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  bindForm(dialog, "[data-milestone-form]", async (values) => {
    if (!values.title) throw new Error("Milestone title is required.");
    await supabase.insert("development_milestones", { user_id: shell.session.user.id, title: values.title, development_area_id: values.development_area_id || null, target_date: values.target_date || null, completed: false });
  });
}

function openReflectionForm() {
  const dialog = openDialog({ title: "New reflection", description: "Capture a concise note on what changed.", className: "form-dialog", content: `<form class="entity-form" data-reflection-form><div class="form-grid"><label>Reflected on<input name="reflected_on" type="date" value="${new Date().toISOString().slice(0, 10)}"></label><label class="span-2">Reflection<textarea name="body" rows="5" required></textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  bindForm(dialog, "[data-reflection-form]", async (values) => {
    if (!values.body) throw new Error("Reflection is required.");
    await supabase.insert("development_reflections", { user_id: shell.session.user.id, body: values.body, reflected_on: values.reflected_on || new Date().toISOString().slice(0, 10) });
  });
}

async function toggleMilestone(id) {
  const item = state.milestones.find((entry) => entry.id === id);
  if (!item) return;
  await supabase.update("development_milestones", id, { completed: !item.completed });
  toast(item.completed ? "Milestone reopened." : "Milestone completed.");
  await load();
}

function bindForm(dialog, selector, save) {
  dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector(selector).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector("[data-form-error]");
    setButtonBusy(button, true, "Saving...");
    try { await save(formValues(form)); dialog.close(); toast("Saved."); await load(); }
    catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

