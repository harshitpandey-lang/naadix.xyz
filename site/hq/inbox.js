import { addDays, dateKey, esc, formatDateTime, inboxConversionPayload, localInputValue, slugify } from "./core.js";
import { emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
let items = [];

export async function mount() {
  shell = await mountShell({ active: "inbox", title: "Inbox", description: "Capture without deciding. Clarify when you are ready." });
  if (!shell) return;
  await load();
  window.addEventListener("hq:captured", load);
}

async function load() {
  shell.content.innerHTML = skeleton(5);
  try {
    items = await supabase.query("inbox_items", { select: "id,content,notes,source,status,created_at,updated_at,processed_at", filters: { status: "eq.INBOX" }, order: "created_at.desc", limit: 300 });
    render();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function render() {
  shell.content.innerHTML = `<section class="inbox-capture"><form data-inbox-capture><label><span class="sr-only">What's on your mind?</span><textarea name="content" rows="3" maxlength="4000" placeholder="What's on your mind?" required></textarea></label><div class="capture-footer"><span class="subtle">Enter to capture · Shift+Enter for a new line</span><button class="hq-action" type="submit">Capture</button></div><p class="form-error" data-form-error hidden></p></form></section>
    <section class="inbox-stack"><header class="section-heading"><div><p class="eyebrow">Inbox</p><h2>${items.length} unprocessed</h2></div></header><div id="inbox-items">${items.length ? items.map(itemCard).join("") : emptyState("Inbox clear", "Everything captured has been clarified.", null)}</div></section>`;
  const form = shell.content.querySelector("[data-inbox-capture]");
  const textarea = form.querySelector("textarea");
  textarea.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  form.addEventListener("submit", capture);
  bindItems();
}

function itemCard(item) {
  return `<article class="inbox-item" data-inbox-item="${item.id}"><div class="inbox-copy"><p>${esc(item.content).replaceAll("\n", "<br>")}</p>${item.notes ? `<small>${esc(item.notes)}</small>` : ""}<time>${formatDateTime(item.created_at)}</time></div><div class="item-actions"><button class="quiet-button compact" type="button" data-convert="PROJECT" data-id="${item.id}">Turn into Project</button><button class="quiet-button compact" type="button" data-convert="GOAL" data-id="${item.id}">Turn into Goal</button><button class="quiet-button compact" type="button" data-convert="EVENT" data-id="${item.id}">Turn into Event</button><button class="quiet-button compact" type="button" data-convert="WAITING" data-id="${item.id}">Turn into Waiting On</button><button class="quiet-button compact" type="button" data-archive="${item.id}">Archive</button></div></article>`;
}

function bindItems() {
  shell.content.querySelectorAll("[data-convert]").forEach((button) => button.addEventListener("click", () => openConversion(button.dataset.id, button.dataset.convert)));
  shell.content.querySelectorAll("[data-archive]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await supabase.update("inbox_items", button.dataset.archive, { status: "ARCHIVED" }); toast("Inbox item archived."); await load(); }
    catch (error) { toast(humanError(error), "error"); button.disabled = false; }
  }));
}

async function capture(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formValues(form);
  const error = form.querySelector("[data-form-error]");
  if (!values.content) return showFormErrors(error, ["Write something to capture."]);
  const button = form.querySelector('[type="submit"]');
  setButtonBusy(button, true, "Capturing...");
  try { await supabase.insert("inbox_items", { content: values.content, source: "inbox", status: "INBOX", user_id: shell.session.user.id }); toast("Captured."); await load(); }
  catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
}

function conversionFields(type, item) {
  const now = new Date();
  const start = new Date(now); start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1);
  const end = new Date(start); end.setHours(end.getHours() + 1);
  const title = `<label class="span-2">Title<input name="title" required maxlength="160" value="${esc(item.content.split("\n")[0].slice(0, 160))}"></label>`;
  if (type === "PROJECT") return `${title}<label>Category<select name="category"><option>Company</option><option>Client</option><option>Internal tools</option><option>Research</option><option>AI & Automation</option></select></label><label class="span-2">Notes<textarea name="notes" rows="3">${esc(item.notes)}</textarea></label>`;
  if (type === "GOAL") return `${title}<label>Due date<input name="due_date" type="date" required value="${dateKey(addDays(now, 7))}"></label>`;
  if (type === "EVENT") return `${title}<label>Starts<input name="start_at" type="datetime-local" required value="${localInputValue(start)}"></label><label>Ends<input name="end_at" type="datetime-local" required value="${localInputValue(end)}"></label><label>Category<select name="category"><option>Other</option><option>Project</option><option>Personal</option><option>Study</option><option>College</option></select></label>`;
  return `${title}<label>Waiting for<input name="waiting_for" required placeholder="Person, approval, payment..."></label><label>Follow up<input name="follow_up_at" type="datetime-local"></label><label class="span-2">Notes<textarea name="notes" rows="3">${esc(item.notes)}</textarea></label>`;
}

function openConversion(id, type) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  const label = { PROJECT: "Project", GOAL: "Goal", EVENT: "Event", WAITING: "Waiting On" }[type];
  const dialog = openDialog({ title: `Turn into ${label}`, description: "The Inbox source will remain in processed history.", className: "form-dialog", content: `<form class="entity-form" data-conversion><div class="form-grid">${conversionFields(type, item)}</div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Create ${label}</button></div></form>` });
  dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-conversion]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    if (!values.title || (type === "GOAL" && !values.due_date) || (type === "WAITING" && !values.waiting_for) || (type === "EVENT" && (!values.start_at || !values.end_at || new Date(values.end_at) <= new Date(values.start_at)))) return showFormErrors(error, ["Complete the required fields with valid dates."]);
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Creating...");
    try {
      const conversion = inboxConversionPayload(type, item, values);
      const payload = { ...conversion.values, user_id: shell.session.user.id };
      if (type === "PROJECT") payload.slug = slugify(payload.name);
      await supabase.insert(conversion.table, payload);
      await supabase.update("inbox_items", item.id, { status: "PROCESSED", processed_at: new Date().toISOString() });
      dialog.close(); toast(`Created ${label}.`); await load();
    } catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}
