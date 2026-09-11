import { esc } from "./core.js";
import { requireSession } from "./auth.js";
import { supabase } from "./supabase.js";

const icons = {
  dashboard: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h5v5H3zM12 3h5v5h-5zM3 12h5v5H3zM12 12h5v5h-5z"/></svg>',
  projects: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h5l1.5 2H17v8.5H3z"/></svg>',
  calendar: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4.5h12v12H4zM4 8h12M7 2.5v4M13 2.5v4"/></svg>',
  goals: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/></svg>',
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
    ["projects", "Projects", "/hq/projects/"],
    ["calendar", "Calendar", "/hq/calendar/"],
    ["goals", "Goals", "/hq/goals/"],
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
  });
}

async function logout() {
  await supabase.auth.signOut();
  location.replace("/hq/");
}

function openCommandPalette() {
  const commands = [
    ["Overview", "Go to dashboard", "/hq/dashboard/", "dashboard"],
    ["Projects", "Go to projects", "/hq/projects/", "projects"],
    ["Calendar", "Go to calendar", "/hq/calendar/", "calendar"],
    ["Goals", "Go to goals", "/hq/goals/", "goals"],
    ["Today", "Go to today's calendar", "/hq/calendar/?date=today", "calendar"],
    ["Blocked projects", "Show blocked projects", "/hq/projects/?status=BLOCKED", "projects"],
    ["Goals at risk", "Show goals at risk", "/hq/goals/?filter=AT_RISK", "goals"],
  ];
  const dialog = openDialog({
    title: "Quick actions",
    description: "Navigate or create without leaving the keyboard.",
    className: "command-dialog",
    content: `<div class="command-list">${commands.map(([label, hint, href, name]) => `<a href="${href}">${icon(name)}<span><strong>${label}</strong><small>${hint}</small></span></a>`).join("")}<button type="button" data-command-new>${icon("plus")}<span><strong>New item</strong><small>Create on the current page</small></span></button><button type="button" data-command-logout>${icon("close")}<span><strong>Log out</strong><small>End this session</small></span></button></div>`,
  });
  dialog.querySelector("[data-command-new]").addEventListener("click", () => { dialog.close(); window.dispatchEvent(new CustomEvent("hq:new")); });
  dialog.querySelector("[data-command-logout]").addEventListener("click", logout);
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
