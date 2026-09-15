import { esc, formatDateTime } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { notes: [], projects: [], goals: [], type: "all", search: "" };

export async function mount() {
  shell = await mountShell({ active: "notes", title: "Notes", description: "Private strategy, research, learning, and meeting context that stays searchable." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-note>${icon("plus")}Note</button>`;
  shell.actions.querySelector("[data-new-note]").addEventListener("click", () => openNoteForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(5);
  try {
    [state.notes, state.projects, state.goals] = await Promise.all([
      supabase.query("notes", { select: "id,title,body,note_type,pinned,tags,project_id,goal_id,created_at,updated_at", order: "pinned.desc,updated_at.desc", limit: 500 }),
      supabase.query("projects", { select: "id,name", order: "name.asc", limit: 300 }),
      supabase.query("goals", { select: "id,title", order: "title.asc", limit: 300 }),
    ]);
    render();
    if (new URLSearchParams(location.search).get("new") === "1") { history.replaceState(null, "", "/hq/notes/"); openNoteForm(); }
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function label(list, id, key = "name") { return list.find((item) => item.id === id)?.[key] || ""; }
function options(list, selected, fallback, key = "name") { return `<option value="">${fallback}</option>${list.map((item) => `<option value="${item.id}" ${item.id === selected ? "selected" : ""}>${esc(item[key])}</option>`).join("")}`; }

function visibleNotes() {
  const q = state.search.toLowerCase().trim();
  return state.notes.filter((note) => (state.type === "all" || note.note_type === state.type) && (!q || `${note.title} ${note.body} ${(note.tags || []).join(" ")}`.toLowerCase().includes(q)));
}

function render() {
  const visible = visibleNotes();
  if (!state.notes.length) {
    shell.content.innerHTML = emptyState("No notes yet", "Capture durable context without burying it in chat or tasks.", "Create note");
    shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openNoteForm());
    return;
  }
  shell.content.innerHTML = `<section class="notes-toolbar"><label class="inbox-search"><span class="sr-only">Search notes</span><input type="search" data-notes-search placeholder="Search notes" value="${esc(state.search)}"></label><div class="inbox-filters" role="tablist" aria-label="Note types">${["all","idea","meeting","research","strategy","learning","general"].map((type) => `<button type="button" data-note-filter="${type}" aria-pressed="${state.type === type}">${type}</button>`).join("")}</div></section><section class="notes-grid">${visible.map(noteCard).join("") || emptyState("Nothing matches", "Adjust the search or filter.", null)}</section>`;
  shell.content.querySelector("[data-notes-search]")?.addEventListener("input", (event) => { state.search = event.target.value; render(); });
  shell.content.querySelectorAll("[data-note-filter]").forEach((button) => button.addEventListener("click", () => { state.type = button.dataset.noteFilter; render(); }));
  shell.content.querySelectorAll("[data-open-note]").forEach((button) => button.addEventListener("click", () => openNote(button.dataset.openNote)));
}

function noteCard(note) {
  const body = (note.body || "").replace(/\s+/g, " ").slice(0, 220);
  const links = [label(state.projects, note.project_id), label(state.goals, note.goal_id, "title")].filter(Boolean).join(" / ");
  return `<button class="note-card" type="button" data-open-note="${note.id}"><p class="eyebrow">${note.pinned ? "Pinned / " : ""}${esc(note.note_type)}</p><h2>${esc(note.title)}</h2><p>${esc(body || "No body yet.")}</p><small>${esc(links || formatDateTime(note.updated_at))}</small>${note.tags?.length ? `<div class="tag-row">${note.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>` : ""}</button>`;
}

function openNote(id) {
  const note = state.notes.find((entry) => entry.id === id);
  if (!note) return;
  const dialog = openDialog({ title: note.title, description: `${note.note_type} note`, className: "hq-drawer", content: `<section class="detail-section"><p class="detail-copy">${esc(note.body || "No body yet.").replaceAll("\n", "<br>")}</p></section><section class="detail-section"><dl class="detail-definition"><div><dt>Updated</dt><dd>${formatDateTime(note.updated_at)}</dd></div><div><dt>Project</dt><dd>${esc(label(state.projects, note.project_id) || "None")}</dd></div><div><dt>Goal</dt><dd>${esc(label(state.goals, note.goal_id, "title") || "None")}</dd></div></dl></section><div class="drawer-actions"><button class="hq-action" type="button" data-edit-note>Edit</button><button class="quiet-button" type="button" data-pin-note>${note.pinned ? "Unpin" : "Pin"}</button><button class="danger-button" type="button" data-delete-note>Delete</button></div>` });
  dialog.querySelector("[data-edit-note]").addEventListener("click", () => openNoteForm(note, dialog));
  dialog.querySelector("[data-pin-note]").addEventListener("click", async () => { await supabase.update("notes", note.id, { pinned: !note.pinned }); dialog.close(); toast(note.pinned ? "Note unpinned." : "Note pinned."); await load(); });
  dialog.querySelector("[data-delete-note]").addEventListener("click", async () => { if (await confirmAction({ title: "Delete note?", message: "This note will be permanently removed." })) { await supabase.remove("notes", note.id); dialog.close(); toast("Note deleted."); await load(); } });
}

function openNoteForm(note = null, parent = null) {
  const tags = Array.isArray(note?.tags) ? note.tags.join(", ") : "";
  const dialog = openDialog({ title: note ? "Edit note" : "New note", description: "Keep the content specific enough to find later.", className: "form-dialog", content: `<form class="entity-form" data-note-form><div class="form-grid"><label class="span-2">Title<input name="title" required value="${esc(note?.title)}"></label><label>Type<select name="note_type">${["idea","meeting","research","strategy","learning","general"].map((type) => `<option ${note?.note_type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label><label class="checkbox-line"><input name="pinned" type="checkbox" ${note?.pinned ? "checked" : ""}>Pinned</label><label>Project<select name="project_id">${options(state.projects, note?.project_id, "No project")}</select></label><label>Goal<select name="goal_id">${options(state.goals, note?.goal_id, "No goal", "title")}</select></label><label class="span-2">Tags<input name="tags" value="${esc(tags)}" placeholder="strategy, research"></label><label class="span-2">Body<textarea name="body" rows="10">${esc(note?.body)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Save</button></div></form>` });
  dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-note-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    if (!values.title) return showFormErrors(error, ["Title is required."]);
    const payload = { title: values.title, body: values.body || "", note_type: values.note_type || "general", pinned: Boolean(values.pinned), project_id: values.project_id || null, goal_id: values.goal_id || null, tags: String(values.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean) };
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Saving...");
    try { if (note) await supabase.update("notes", note.id, payload); else await supabase.insert("notes", { ...payload, user_id: shell.session.user.id }); dialog.close(); parent?.close(); toast("Note saved."); await load(); }
    catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

