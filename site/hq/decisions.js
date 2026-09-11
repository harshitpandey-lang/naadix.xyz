import { esc, formatDate, formatDateTime, localInputValue } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { decisions: [], projects: [] };

export async function mount() {
  shell = await mountShell({ active: "decisions", title: "Decisions", description: "Preserve what was chosen, why it mattered, and what happened next." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-decision>${icon("plus")}Record decision</button>`;
  shell.actions.querySelector("[data-new-decision]").addEventListener("click", () => openDecisionForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(5);
  try {
    [state.decisions, state.projects] = await Promise.all([
      supabase.query("decisions", { select: "id,title,decision,reasoning,project_id,decided_at,review_at,outcome,created_at,updated_at", order: "decided_at.desc", limit: 300 }),
      supabase.query("projects", { select: "id,name", order: "name.asc", limit: 300 }),
    ]);
    render();
    const params = new URLSearchParams(location.search);
    if (params.get("new") === "1") { history.replaceState(null, "", "/hq/decisions/"); openDecisionForm(null, params.get("project")); }
    else if (params.get("decision")) { const id = params.get("decision"); history.replaceState(null, "", "/hq/decisions/"); openDecision(id); }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function projectName(id) { return state.projects.find((project) => project.id === id)?.name || "No related project"; }
function projectOptions(selected) { return `<option value="">No related project</option>${state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${esc(project.name)}</option>`).join("")}`; }

function render() {
  if (!state.decisions.length) {
    shell.content.innerHTML = emptyState("No decisions recorded", "Record consequential choices so future work retains its context.", "Record first decision");
    shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openDecisionForm());
    return;
  }
  shell.content.innerHTML = `<div class="decision-list">${state.decisions.map((item) => `<button class="decision-row" type="button" data-decision="${item.id}"><div><p class="eyebrow">${formatDate(item.decided_at)}</p><h2>${esc(item.title)}</h2><p>${esc(item.decision)}</p></div><div class="decision-meta"><span>${esc(projectName(item.project_id))}</span>${item.review_at ? `<span>Review ${formatDate(item.review_at)}</span>` : ""}${icon("chevron")}</div></button>`).join("")}</div>`;
  shell.content.querySelectorAll("[data-decision]").forEach((button) => button.addEventListener("click", () => openDecision(button.dataset.decision)));
}

function decisionForm(item = {}, prefilledProject = null) {
  return `<form class="entity-form" data-decision-form><div class="form-grid"><label class="span-2">Decision title<input name="title" required maxlength="160" value="${esc(item.title)}"></label><label class="span-2">Decision<textarea name="decision" rows="3" required>${esc(item.decision)}</textarea></label><label class="span-2">Why<textarea name="reasoning" rows="5">${esc(item.reasoning)}</textarea></label><label>Related project<select name="project_id">${projectOptions(item.project_id || prefilledProject)}</select></label><label>Decided<input name="decided_at" type="datetime-local" required value="${localInputValue(item.decided_at || new Date())}"></label><label>Review date<input name="review_at" type="datetime-local" value="${localInputValue(item.review_at)}"></label><label class="span-2">Outcome<textarea name="outcome" rows="3">${esc(item.outcome)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">${item.id ? "Save changes" : "Record decision"}</button></div></form>`;
}

function openDecisionForm(item = null, projectId = null, parent = null) {
  const dialog = openDialog({ title: item ? "Edit decision" : "Record decision", description: "Capture enough context to understand this choice later.", className: "form-dialog", content: decisionForm(item || {}, projectId) });
  dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-decision-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    if (!values.title || !values.decision || !values.decided_at) return showFormErrors(error, ["Title, decision, and decided date are required."]);
    const payload = { title: values.title, decision: values.decision, reasoning: values.reasoning || null, project_id: values.project_id || null, decided_at: new Date(values.decided_at).toISOString(), review_at: values.review_at ? new Date(values.review_at).toISOString() : null, outcome: values.outcome || null };
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Saving...");
    try { if (item) await supabase.update("decisions", item.id, payload); else await supabase.insert("decisions", { ...payload, user_id: shell.session.user.id }); dialog.close(); parent?.close(); toast(item ? "Decision updated." : "Decision recorded."); await load(); }
    catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

function openDecision(id) {
  const item = state.decisions.find((entry) => entry.id === id);
  if (!item) return;
  const dialog = openDialog({ title: item.title, description: item.decision, className: "hq-drawer", content: `<section class="detail-section"><p class="eyebrow">Decision</p><p class="detail-copy">${esc(item.decision)}</p></section><section class="detail-section"><p class="eyebrow">Why</p><p class="detail-copy">${esc(item.reasoning || "No reasoning recorded.")}</p></section><section class="detail-section"><dl class="detail-definition"><div><dt>Related project</dt><dd>${item.project_id ? `<a class="text-link" href="/hq/projects/?project=${item.project_id}">${esc(projectName(item.project_id))}</a>` : "None"}</dd></div><div><dt>Decided</dt><dd>${formatDateTime(item.decided_at)}</dd></div><div><dt>Review date</dt><dd>${formatDateTime(item.review_at)}</dd></div></dl></section><section class="detail-section"><p class="eyebrow">Outcome</p><p class="detail-copy">${esc(item.outcome || "No outcome recorded yet.")}</p></section><div class="drawer-actions"><button class="hq-action" type="button" data-edit-decision>Edit</button><button class="quiet-button" type="button" data-outcome-decision>Add outcome</button><button class="quiet-button" type="button" data-review-decision>Change review date</button><button class="danger-button" type="button" data-delete-decision>Delete</button></div>` });
  dialog.querySelector("[data-edit-decision]").addEventListener("click", () => openDecisionForm(item, null, dialog));
  dialog.querySelector("[data-outcome-decision]").addEventListener("click", () => openDecisionForm(item, null, dialog));
  dialog.querySelector("[data-review-decision]").addEventListener("click", () => openDecisionForm(item, null, dialog));
  dialog.querySelector("[data-delete-decision]").addEventListener("click", async () => { if (await confirmAction({ title: "Delete decision?", message: "This historical context will be permanently removed." })) { await supabase.remove("decisions", item.id); dialog.close(); toast("Decision deleted."); await load(); } });
}
