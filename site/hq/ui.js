import { esc, isFormField } from "./core.js";
import { requireSession } from "./auth.js";
import { supabase } from "./supabase.js";

const icons = {
  dashboard: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z"/></svg>',
  inbox: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4h14v12H3zM3 11h4l2 2h2l2-2h4"/></svg>',
  projects: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h5l1.5 2H17v8.5H3z"/></svg>',
  calendar: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4.5h12v12H4zM4 8h12M7 2.5v4M13 2.5v4"/></svg>',
  goals: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/></svg>',
  meetings: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="10" rx="2"/><path d="M7 17h6M10 14v3M6.5 8.5h7M6.5 11h4"/></svg>',
  finances: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6.5h14v10H3zM5 6.5V4h10v2.5M6.5 11.5h3M14 10v3"/></svg>',
  decisions: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h10v14H5zM8 7h4M8 10h4M8 13h3"/></svg>',
  review: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v4h4"/></svg>',
  search: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>',
  plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>',
  menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14"/></svg>',
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>',
  chevron: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg>',
};

export const icon = (name) => `<span class="hq-icon">${icons[name] || ""}</span>`;

function navigation(active) {
  return [
    ["dashboard", "Overview", "/hq/dashboard/"],
    ["inbox", "Inbox", "/hq/inbox/"],
    ["projects", "Projects", "/hq/projects/"],
    ["calendar", "Calendar", "/hq/calendar/"],
    ["goals", "Goals", "/hq/goals/"],
    ["meetings", "Meetings", "/hq/meetings/"],
    ["finances", "Finances", "/hq/finances/"],
  ].map(([key, label, href]) => `<a href="${href}" ${key === active ? 'aria-current="page" class="active"' : ""}>${icon(key)}<span>${label}</span></a>`).join("");
}

export async function mountShell({ active, title, description }) {
  const session = await requireSession();
  if (!session) return null;
  document.body.innerHTML = `<div class="hq-app">
    <div class="hq-sidebar-scrim" data-close-menu></div>
    <aside class="hq-sidebar" aria-label="Founder HQ navigation">
      <div class="hq-sidebar-head"><a class="hq-brand" href="/hq/dashboard/"><strong>NAADIX</strong><span>Founder HQ</span></a><button class="icon-button mobile-only" type="button" data-close-menu aria-label="Close navigation">${icon("close")}</button></div>
      <nav>${navigation(active)}</nav>
      <div class="hq-sidebar-foot"><div class="founder-presence"><span class="presence-dot"></span><div><strong>Founder workspace</strong><span>${esc(session.user?.email || "Authenticated")}</span></div></div><button class="quiet-button" type="button" data-action="logout">Log out</button></div>
    </aside>
    <main class="hq-main">
      <header class="hq-topbar"><button class="icon-button mobile-only" type="button" data-open-menu aria-label="Open navigation">${icon("menu")}</button><div class="hq-crumb"><span>Founder HQ</span><span>/</span><strong>${esc(title)}</strong></div><button class="command-trigger" type="button" data-open-command aria-label="Quick actions">${icon("search")}<span>Quick actions</span><kbd>⌘ K</kbd></button></header>
      <section class="hq-page-heading"><div><p class="eyebrow">${esc(active)} workspace</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="hq-page-actions" id="hq-page-actions"></div></section>
      <div id="hq-content" aria-live="polite">${skeleton(5)}</div>
    </main>
    <div class="toast-region" aria-live="polite" aria-atomic="true"></div>
  </div>`;
  bindShell();
  updateInboxCount();
  return { session, content: document.querySelector("#hq-content"), actions: document.querySelector("#hq-page-actions") };
}

function bindShell() {
  const app = document.querySelector(".hq-app");
  document.querySelector("[data-open-menu]")?.addEventListener("click", () => app.classList.add("menu-open"));
  document.querySelectorAll("[data-close-menu]").forEach((element) => element.addEventListener("click", () => app.classList.remove("menu-open")));
  document.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener("click", logout));
  document.querySelector("[data-open-command]")?.addEventListener("click", openCommandPalette);
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "c" && !isFormField(event.target) && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      openQuickCapture();
    }
  });
}

async function updateInboxCount() {
  try {
    const items = await supabase.query("inbox_items", { select: "id", filters: { status: "eq.INBOX" }, limit: 1000 });
    if (!items.length) return;
    const link = document.querySelector('.hq-sidebar nav a[href="/hq/inbox/"]');
    if (link) link.insertAdjacentHTML("beforeend", `<span class="nav-count">${items.length}</span>`);
  } catch {}
}

async function logout() {
  await supabase.auth.signOut();
  location.replace("/hq/");
}

function openCommandPalette() {
  const commands = [
    ["Overview", "Open the operating dashboard", "/hq/dashboard/", "dashboard"],
    ["Inbox", "Open unprocessed capture", "/hq/inbox/", "inbox"],
    ["Focus Mode", "Show only today's execution view", "/hq/dashboard/?focus=1", "dashboard"],
    ["Projects", "Open projects", "/hq/projects/", "projects"],
    ["Calendar", "Open calendar", "/hq/calendar/", "calendar"],
    ["Goals", "Open goals", "/hq/goals/", "goals"],
    ["Meetings", "Open meetings and live transcripts", "/hq/meetings/", "meetings"],
    ["Finances", "Open the financial operating view", "/hq/finances/", "finances"],
    ["Decisions", "Open the decision log", "/hq/decisions/", "decisions"],
    ["Weekly Review", "Start the guided review", "/hq/review/", "review"],
    ["New Project", "Create a project", "/hq/projects/?new=1", "projects"],
    ["New Goal", "Create a goal", "/hq/goals/?new=1", "goals"],
    ["New Event", "Create a calendar event", "/hq/calendar/?new=1", "calendar"],
    ["New Meeting", "Start a meeting record", "/hq/meetings/?new=1", "meetings"],
    ["New Transaction", "Record income or an expense", "/hq/finances/?new=1", "finances"],
    ["New Waiting Item", "Track an external dependency", "/hq/dashboard/?waiting=new#waiting", "inbox"],
    ["Record Decision", "Capture context for a choice", "/hq/decisions/?new=1", "decisions"],
    ["Blocked projects", "Filter urgent project blockers", "/hq/projects/?status=BLOCKED", "projects"],
    ["At-risk goals", "Filter outcomes at risk", "/hq/goals/?filter=AT_RISK", "goals"],
    ["Waiting items", "Show unresolved dependencies", "/hq/dashboard/?waiting=show#waiting", "inbox"],
    ["Unprocessed inbox", "Clarify captured thoughts", "/hq/inbox/", "inbox"],
  ];
  const dialog = openDialog({
    title: "Quick actions",
    description: "Navigate or create without leaving the keyboard.",
    className: "command-dialog",
    content: `<div class="command-list"><button type="button" data-command-capture>${icon("plus")}<span><strong>Quick capture</strong><small>Send a thought to Inbox</small></span><kbd>C</kbd></button>${commands.map(([label, hint, href, name]) => `<a href="${href}">${icon(name)}<span><strong>${label}</strong><small>${hint}</small></span></a>`).join("")}<button type="button" data-command-logout>${icon("close")}<span><strong>Log out</strong><small>End this session</small></span></button></div>`,
  });
  dialog.querySelector("[data-command-capture]").addEventListener("click", () => { dialog.close(); openQuickCapture(); });
  dialog.querySelector("[data-command-logout]").addEventListener("click", logout);
}

export function openQuickCapture() {
  const dialog = openDialog({ title: "Quick capture", description: "Capture now. Clarify later.", className: "quick-capture-dialog", content: `<form data-quick-capture><label><span class="sr-only">What's on your mind?</span><textarea name="content" rows="4" maxlength="4000" placeholder="What's on your mind?" required></textarea></label><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><span class="subtle">Enter to capture · Shift+Enter for a new line</span><button class="hq-action" type="submit">Capture</button></div></form>` });
  const form = dialog.querySelector("[data-quick-capture]");
  const textarea = form.querySelector("textarea");
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = textarea.value.trim();
    const error = form.querySelector("[data-form-error]");
    if (!content) return showFormErrors(error, ["Write something to capture."]);
    const button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, "Capturing...");
    try {
      await supabase.insert("inbox_items", { content, source: "quick_capture", status: "INBOX" });
      dialog.close();
      toast("Captured to Inbox.");
      window.dispatchEvent(new CustomEvent("hq:captured"));
    } catch (requestError) {
      showFormErrors(error, [humanError(requestError)]);
      setButtonBusy(button, false);
    }
  });
  return dialog;
}

export function openDialog({ title, description = "", content, className = "" }) {
  const dialog = document.createElement("dialog");
  dialog.className = `hq-dialog ${className}`.trim();
  dialog.innerHTML = `<div class="dialog-frame"><header><div><p class="eyebrow">Founder HQ</p><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ""}</div><button class="icon-button" type="button" data-dialog-close aria-label="Close dialog">${icon("close")}</button></header><div class="dialog-content">${content}</div></div>`;
  document.body.append(dialog);
  dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
  requestAnimationFrame(() => dialog.querySelector("input, select, textarea, button, a")?.focus());
  return dialog;
}

export function confirmAction({ title, message, confirmLabel = "Delete" }) {
  return new Promise((resolve) => {
    const dialog = openDialog({ title, description: message, className: "confirm-dialog", content: `<div class="dialog-actions"><button class="quiet-button" type="button" data-cancel>Cancel</button><button class="danger-button" type="button" data-confirm>${esc(confirmLabel)}</button></div>` });
    let decided = false;
    dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-confirm]").addEventListener("click", () => { decided = true; resolve(true); dialog.close(); });
    dialog.addEventListener("close", () => { if (!decided) resolve(false); }, { once: true });
  });
}

export function toast(message, type = "success") {
  const region = document.querySelector(".toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = "toast";
  item.dataset.type = type;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 3200);
}

export function skeleton(rows = 4) {
  return `<div class="skeleton-stack" aria-label="Loading"><span class="sr-only">Loading workspace</span>${Array.from({ length: rows }, () => '<div class="skeleton-row"></div>').join("")}</div>`;
}

export function errorState(message) {
  return `<section class="state-panel error-state"><span class="state-mark">!</span><div><h2>Could not load this workspace</h2><p>${esc(humanError(message))}</p><button class="quiet-button" type="button" data-retry>Try again</button></div></section>`;
}

export function emptyState(title, message, actionLabel, action = "new") {
  return `<section class="state-panel empty-state"><span class="state-mark">+</span><div><h2>${esc(title)}</h2><p>${esc(message)}</p>${actionLabel ? `<button class="hq-action" type="button" data-empty-action="${esc(action)}">${icon("plus")}${esc(actionLabel)}</button>` : ""}</div></section>`;
}

export function humanError(error) {
  const message = String(error?.message || error || "Something went wrong.").replace(/[\r\n]+/g, " ").slice(0, 220);
  return message || "Something went wrong.";
}

export function setButtonBusy(button, busy, label = "Saving…") {
  if (!button) return;
  if (busy) {
    button.dataset.previousLabel = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.previousLabel || "Save";
    button.disabled = false;
  }
}

export function formValues(form) {
  const values = {};
  for (const [key, value] of new FormData(form)) values[key] = typeof value === "string" ? value.trim() : value;
  form.querySelectorAll('input[type="checkbox"][name]').forEach((input) => { values[input.name] = input.checked; });
  return values;
}

export function showFormErrors(target, errors) {
  target.textContent = errors.join(" ");
  target.hidden = errors.length === 0;
}
