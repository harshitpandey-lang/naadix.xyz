import { addDays, dateKey, esc, formatDateTime, inboxConversionPayload, localInputValue, slugify } from "./core.js";
import { emptyState, errorState, formValues, humanError, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { currentSession, supabase } from "./supabase.js";
import { HQ_CONFIG } from "./config.js";

let shell;
let items = [];
let filter = "all";
let search = "";

export async function mount() {
  shell = await mountShell({ active: "inbox", title: "Inbox", description: "Capture first. Let intelligence help you clarify what matters." });
  if (!shell) return;
  await load();
  window.addEventListener("hq:captured", load);
}

async function load() {
  shell.content.innerHTML = skeleton(5);
  try {
    items = await supabase.query("inbox_items", {
      select: "id,content,notes,source,status,created_at,updated_at,processed_at,ai_priority,ai_category,ai_summary,ai_reason,ai_suggested_action,ai_action_required,ai_processed_at,ai_model",
      filters: { status: "eq.INBOX" }, order: "created_at.desc", limit: 300,
    });
    render();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function visibleItems() {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    const matchFilter = filter === "all" || (filter === "important" && ["critical", "high"].includes(item.ai_priority)) || (filter === "action" && item.ai_action_required) || (filter === "unanalyzed" && !item.ai_processed_at);
    const haystack = `${item.content} ${item.ai_summary || ""} ${item.ai_category || ""}`.toLowerCase();
    return matchFilter && (!q || haystack.includes(q));
  });
}

function render() {
  const important = items.filter((item) => ["critical", "high"].includes(item.ai_priority)).length;
  const needsAction = items.filter((item) => item.ai_action_required).length;
  const unanalysed = items.filter((item) => !item.ai_processed_at).length;
  const visible = visibleItems();
  shell.actions.innerHTML = `<button class="quiet-button" type="button" data-ai-scan>Run AI scan</button><button class="hq-action" type="button" data-brief>Founder brief</button>`;
  shell.content.innerHTML = `
    <section class="summary-grid inbox-summary" aria-label="Inbox summary">
      <article><span>Unprocessed</span><strong>${items.length}</strong><small>Captured items</small></article>
      <article><span>Important</span><strong>${important}</strong><small>Critical + high priority</small></article>
      <article><span>Action needed</span><strong>${needsAction}</strong><small>Needs a decision or next step</small></article>
      <article><span>AI queue</span><strong>${unanalysed}</strong><small>Not analysed yet</small></article>
    </section>
    <section class="inbox-capture nx-capture"><form data-inbox-capture>
      <div class="capture-topline"><div><p class="eyebrow">Quick capture</p><span class="subtle">Thought · task · reminder · link · follow-up</span></div></div>
      <label><span class="sr-only">What's on your mind?</span><textarea name="content" rows="2" maxlength="4000" placeholder="Capture a thought, task, link or idea…" required></textarea></label>
      <div class="capture-footer"><span class="subtle">Enter to capture · Shift+Enter for a new line</span><button class="hq-action" type="submit">Capture</button></div><p class="form-error" data-form-error hidden></p>
    </form></section>
    <section class="inbox-stack">
      <header class="section-heading inbox-heading"><div><p class="eyebrow">Founder inbox</p><h2>${visible.length} visible</h2></div>
        <label class="inbox-search"><span class="sr-only">Search inbox</span><input type="search" data-inbox-search placeholder="Search inbox" value="${esc(search)}"></label>
      </header>
      <div class="inbox-filters" role="tablist" aria-label="Inbox filters">
        ${[["all","All"],["important","Important"],["action","Action needed"],["unanalyzed","AI queue"]].map(([key,label]) => `<button type="button" data-filter="${key}" aria-pressed="${filter === key}">${label}</button>`).join("")}
      </div>
      <div id="inbox-items">${visible.length ? visible.map(itemCard).join("") : emptyState("Inbox clear", search || filter !== "all" ? "No items match this view." : "Everything captured has been clarified.", null)}</div>
    </section>`;

  shell.content.querySelector("[data-inbox-search]")?.addEventListener("input", (event) => { search = event.target.value; render(); });
  shell.content.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => { filter = button.dataset.filter; render(); }));
  const form = shell.content.querySelector("[data-inbox-capture]");
  const textarea = form.querySelector("textarea");
  textarea.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  form.addEventListener("submit", capture);
  shell.actions.querySelector("[data-ai-scan]")?.addEventListener("click", runAiScan);
  shell.actions.querySelector("[data-brief]")?.addEventListener("click", openFounderBrief);
  bindItems();
}

function itemCard(item) {
  const priority = item.ai_priority || "pending";
  const ai = item.ai_processed_at ? `<div class="inbox-ai"><span class="priority-pill" data-priority="${priority}">${priority}</span><span>${esc(item.ai_category || "uncategorized")}</span>${item.ai_action_required ? '<span class="action-flag">Action needed</span>' : ""}</div>${item.ai_summary ? `<p class="ai-summary">${esc(item.ai_summary)}</p>` : ""}${item.ai_reason ? `<small class="ai-reason">Why flagged: ${esc(item.ai_reason)}</small>` : ""}${item.ai_suggested_action ? `<small class="ai-action">Next: ${esc(item.ai_suggested_action)}</small>` : ""}` : `<div class="inbox-ai"><span class="priority-pill" data-priority="pending">AI pending</span></div>`;
  return `<article class="inbox-item" data-inbox-item="${item.id}"><div class="inbox-copy"><p>${esc(item.content).replaceAll("\n", "<br>")}</p>${ai}<time>${formatDateTime(item.created_at)}</time></div><div class="item-actions"><button class="quiet-button compact" type="button" data-analyze="${item.id}">${item.ai_processed_at ? "Re-analyze" : "Analyze"}</button><button class="quiet-button compact" type="button" data-convert="PROJECT" data-id="${item.id}">Project</button><button class="quiet-button compact" type="button" data-convert="GOAL" data-id="${item.id}">Goal</button><button class="quiet-button compact" type="button" data-convert="EVENT" data-id="${item.id}">Event</button><button class="quiet-button compact" type="button" data-convert="WAITING" data-id="${item.id}">Waiting</button><button class="quiet-button compact" type="button" data-archive="${item.id}">Archive</button></div></article>`;
}

function bindItems() {
  shell.content.querySelectorAll("[data-analyze]").forEach((button) => button.addEventListener("click", () => analyzeItem(button.dataset.analyze, button)));
  shell.content.querySelectorAll("[data-convert]").forEach((button) => button.addEventListener("click", () => openConversion(button.dataset.id, button.dataset.convert)));
  shell.content.querySelectorAll("[data-archive]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await supabase.update("inbox_items", button.dataset.archive, { status: "ARCHIVED" }); toast("Inbox item archived."); await load(); }
    catch (error) { toast(humanError(error), "error"); button.disabled = false; }
  }));
}

async function invokeAI(body) {
  const session = currentSession();
  if (!session?.access_token) throw new Error("Your session has expired.");
  const response = await fetch(`${HQ_CONFIG.supabaseUrl}/functions/v1/inbox-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: HQ_CONFIG.publishableKey, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Inbox intelligence is unavailable.");
  return payload;
}

function localFallback(content) {
  const text = content.toLowerCase();
  const high = /(urgent|deadline|reply|respond|invoice|payment|meeting|approval|blocked|blocker|tomorrow|today|asap)/.test(text);
  return {
    priority: high ? "high" : "normal",
    actionRequired: high || /\?|please|need you|can you|could you/.test(text),
    category: /invoice|payment|budget|finance/.test(text) ? "finance" : /meeting|call|schedule/.test(text) ? "meeting" : /client|lead|customer|prospect/.test(text) ? "lead" : "general",
    summary: content.replace(/\s+/g, " ").trim().slice(0, 180),
    reason: high ? "Contains an explicit time-sensitive or action signal." : "No strong urgency signal detected.",
    suggestedAction: high ? "Review and decide the next step." : "Keep for normal review.",
  };
}

async function analyzeItem(id, button = null) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  if (button) setButtonBusy(button, true, "Analyzing...");
  try {
    let analysis;
    let model = "local-rules";
    try {
      const result = await invokeAI({ action: "classify", content: item.content });
      analysis = result.analysis;
      model = result.model || "gemini";
    } catch (error) {
      analysis = localFallback(item.content);
      toast(`${error.message} Used local priority rules instead.`, "error");
    }
    await supabase.update("inbox_items", id, {
      ai_priority: analysis.priority,
      ai_category: analysis.category,
      ai_summary: analysis.summary,
      ai_reason: analysis.reason,
      ai_suggested_action: analysis.suggestedAction,
      ai_action_required: Boolean(analysis.actionRequired),
      ai_processed_at: new Date().toISOString(),
      ai_model: model,
    });
    await load();
  } catch (error) {
    toast(humanError(error), "error");
    if (button) setButtonBusy(button, false);
  }
}

async function runAiScan() {
  const queue = items.filter((item) => !item.ai_processed_at).slice(0, 20);
  if (!queue.length) return toast("Inbox AI queue is already clear.");
  const button = shell.actions.querySelector("[data-ai-scan]");
  setButtonBusy(button, true, `Scanning ${queue.length}…`);
  for (const item of queue) await analyzeItem(item.id).catch(() => {});
  toast("Inbox scan complete.");
  await load();
}

async function openFounderBrief() {
  const analyzed = items.filter((item) => item.ai_processed_at);
  if (!analyzed.length) return toast("Analyze at least one inbox item first.", "error");
  const button = shell.actions.querySelector("[data-brief]");
  setButtonBusy(button, true, "Building brief...");
  try {
    let brief;
    let model = "local-rules";
    try {
      const result = await invokeAI({ action: "brief", items: analyzed.map((item) => ({ priority: item.ai_priority, summary: item.ai_summary, reason: item.ai_reason, actionRequired: item.ai_action_required })) });
      brief = result.brief; model = result.model || "gemini";
    } catch {
      brief = {
        needsAttention: analyzed.filter((item) => item.ai_action_required || ["critical","high"].includes(item.ai_priority)).slice(0,5).map((item) => item.ai_summary || item.content.slice(0,120)),
        importantNotUrgent: analyzed.filter((item) => item.ai_priority === "normal" && !item.ai_action_required).slice(0,5).map((item) => item.ai_summary || item.content.slice(0,120)),
        waitingFollowUp: [],
        noActionCount: analyzed.filter((item) => item.ai_priority === "low").length,
      };
    }
    await supabase.upsert("inbox_briefs", { user_id: shell.session.user.id, brief_date: dateKey(new Date()), content: brief, item_count: analyzed.length, model }, "user_id,brief_date");
    const section = (title, entries) => `<section><p class="eyebrow">${title}</p>${entries?.length ? `<ol>${entries.map((entry) => `<li>${esc(entry)}</li>`).join("")}</ol>` : '<p class="subtle">Nothing here.</p>'}</section>`;
    openDialog({ title: "Founder brief", description: "A concise view of what deserves attention.", className: "brief-dialog", content: `<div class="founder-brief">${section("Needs attention", brief.needsAttention)}${section("Important, not urgent", brief.importantNotUrgent)}${section("Waiting / follow-up", brief.waitingFollowUp)}<p class="subtle">${Number(brief.noActionCount || 0)} items need no action · ${esc(model)}</p></div>` });
  } catch (error) { toast(humanError(error), "error"); }
  finally { setButtonBusy(button, false); }
}

async function capture(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formValues(form);
  const error = form.querySelector("[data-form-error]");
  if (!values.content) return showFormErrors(error, ["Write something to capture."]);
  const button = form.querySelector('[type="submit"]');
  setButtonBusy(button, true, "Capturing...");
  try {
    const saved = await supabase.insert("inbox_items", { content: values.content, source: "inbox", status: "INBOX", user_id: shell.session.user.id });
    toast("Captured.");
    await load();
    const analyzeButton = shell.content.querySelector(`[data-analyze="${saved.id}"]`);
    analyzeItem(saved.id, analyzeButton).catch(() => {});
  } catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
}

function conversionFields(type, item) {
  const now = new Date();
  const start = new Date(now); start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1);
  const end = new Date(start); end.setHours(end.getHours() + 1);
  const title = `<label class="span-2">Title<input name="title" required maxlength="160" value="${esc(item.content.split("\n")[0].slice(0, 160))}"></label>`;
  if (type === "PROJECT") return `${title}<label>Category<select name="category"><option>Company</option><option>Client</option><option>Internal tools</option><option>Research</option><option>AI & Automation</option></select></label><label class="span-2">Notes<textarea name="notes" rows="3">${esc(item.notes || "")}</textarea></label>`;
  if (type === "GOAL") return `${title}<label>Due date<input name="due_date" type="date" required value="${dateKey(addDays(now, 7))}"></label>`;
  if (type === "EVENT") return `${title}<label>Starts<input name="start_at" type="datetime-local" required value="${localInputValue(start)}"></label><label>Ends<input name="end_at" type="datetime-local" required value="${localInputValue(end)}"></label><label>Category<select name="category"><option>Other</option><option>Project</option><option>Personal</option><option>Study</option><option>College</option></select></label>`;
  return `${title}<label>Waiting for<input name="waiting_for" required placeholder="Person, approval, payment..."></label><label>Follow up<input name="follow_up_at" type="datetime-local"></label><label class="span-2">Notes<textarea name="notes" rows="3">${esc(item.notes || "")}</textarea></label>`;
}

function openConversion(id, type) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  const label = { PROJECT: "Project", GOAL: "Goal", EVENT: "Event", WAITING: "Waiting On" }[type];
  const dialog = openDialog({ title: `Turn into ${label}`, description: "The Inbox source remains in processed history.", className: "form-dialog", content: `<form class="entity-form" data-conversion><div class="form-grid">${conversionFields(type, item)}</div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button><button class="hq-action" type="submit">Create ${label}</button></div></form>` });
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
