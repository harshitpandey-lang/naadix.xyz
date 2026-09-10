import { HQ_CONFIG } from "./config.js";
import { supabase } from "./supabase.js";

export const founderEmail = HQ_CONFIG.founderEmail;

export function founderLogin(value) {
  return value.trim().toLowerCase() === "founder" ? founderEmail : value.trim();
}

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
