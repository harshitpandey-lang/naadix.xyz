import { founderLogin, showMessage } from "./auth.js";
import { setRecoverySession, supabase } from "./supabase.js";

const page = document.body.dataset.hqPage;
const value = (form, name) => String(new FormData(form).get(name) || "").trim();

async function login() {
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#message");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const loginValue = value(form, "login");
    const password = value(form, "password");
    if (!loginValue || !password) return showMessage(message, "Enter your Founder ID and password.");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Authenticating…";
    const { error } = await supabase.auth.signInWithPassword({ email: founderLogin(loginValue), password });
    if (error) {
      showMessage(message, "Invalid email or password.");
      button.disabled = false;
      button.textContent = "Enter HQ";
      return;
    }
    const next = new URLSearchParams(location.search).get("next");
    location.replace(next?.startsWith("/hq/") ? next : "/hq/dashboard/");
  });
}

async function resetPassword() {
  const form = document.querySelector("#reset-form");
  const updateForm = document.querySelector("#update-form");
  const message = document.querySelector("#message");
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get("access_token") && hash.get("refresh_token")) {
    setRecoverySession(hash.get("access_token"), hash.get("refresh_token"));
    form.hidden = true;
    updateForm.hidden = false;
    history.replaceState(null, "", "/hq/reset-password/");
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = value(form, "email");
    if (!/^\S+@\S+\.\S+$/.test(email)) return showMessage(message, "Enter a valid email address.");
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/hq/reset-password/` });
      showMessage(message, "If that account exists, a reset link has been sent.", "success");
    } catch {
      showMessage(message, "Unable to send a reset link right now.");
      button.disabled = false;
    }
  });
  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = value(updateForm, "password");
    if (password.length < 8) return showMessage(message, "Use a password with at least 8 characters.");
    if (password !== value(updateForm, "confirmation")) return showMessage(message, "Passwords do not match.");
    const button = updateForm.querySelector('button[type="submit"]');
    button.disabled = true;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      showMessage(message, "Unable to update the password.");
      button.disabled = false;
      return;
    }
    showMessage(message, "Password updated. Redirecting…", "success");
    setTimeout(() => location.replace("/hq/dashboard/"), 500);
  });
}

const privatePages = {
  dashboard: () => import("./dashboard.js"),
  inbox: () => import("./inbox.js"),
  projects: () => import("./projects.js"),
  calendar: () => import("./calendar.js"),
  goals: () => import("./goals.js"),
  meetings: () => import("./meetings.js"),
  finances: () => import("./finances.js"),
  decisions: () => import("./decisions.js"),
  review: () => import("./review.js"),
};

if (page === "login") login();
else if (page === "reset") resetPassword();
else if (privatePages[page]) {
  privatePages[page]().then((module) => module.mount()).catch(() => {
    document.body.innerHTML = '<main class="fatal-state"><h1>Founder HQ could not start.</h1><p>Reload the page or return to the HQ sign-in.</p><a class="hq-action" href="/hq/">Return to HQ</a></main>';
  });
}
