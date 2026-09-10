import { HQ_CONFIG } from "./config.js";
import { supabase } from "./supabase.js";

export const founderEmail = HQ_CONFIG.founderEmail;
export function founderLogin(value) { return value.trim().toLowerCase() === "founder" ? founderEmail : value.trim(); }

export async function requireSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const next = `${location.pathname}${location.search}`;
    location.replace(`/hq/?next=${encodeURIComponent(next)}`);
    return null;
  }
  return data.session;
}

export function showMessage(target, text, type = "error") {
  target.textContent = text;
  target.dataset.type = type;
  target.hidden = !text;
}

export function shellNav(active) {
  return `<aside class="hq-sidebar"><a class="hq-brand" href="/hq/dashboard/"><strong>NAADIX</strong><span>FOUNDER SYSTEM</span></a><nav aria-label="Founder HQ"><a class="${active === "dashboard" ? "active" : ""}" href="/hq/dashboard/">Today</a><a class="${active === "projects" ? "active" : ""}" href="/hq/projects/">Projects</a><a class="${active === "calendar" ? "active" : ""}" href="/hq/calendar/">Calendar</a><a class="${active === "goals" ? "active" : ""}" href="/hq/goals/">Goals</a></nav><button class="quiet-button" data-action="logout">Log out</button></aside>`;
}

export async function startPrivatePage({ active, title, description }) {
  const session = await requireSession();
  if (!session) return null;
  document.body.innerHTML = `<div class="hq-app">${shellNav(active)}<main class="hq-main"><header class="hq-top"><span>PRIVATE NODE / LIVE</span><span>${session.user?.email || "Founder"}</span></header><section class="hq-heading"><div><p class="eyebrow">FOUNDER HQ / ${active.toUpperCase()}</p><h1>${title}</h1><p>${description}</p></div><button class="hq-action" data-action="logout">Log out</button></section><div id="hq-content"><p class="muted">Loading private workspace...</p></div></main></div>`;
  document.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener("click", async () => { await supabase.auth.signOut(); location.replace("/hq/"); }));
  return session;
}
