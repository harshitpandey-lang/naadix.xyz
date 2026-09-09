import { prepareBrief } from "./contact-service.js";
import { track } from "./analytics.js";
export function setupContact(company, toast) {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  const $ = (s) => document.querySelector(s),
    steps = [...form.querySelectorAll("fieldset")];
  let step = 0,
    context = null,
    brief = null;
  try {
    const stored = JSON.parse(sessionStorage.getItem("naadix-assessment"));
    if (
      stored &&
      Date.now() - stored.created < 3600000 &&
      typeof stored.title === "string"
    ) {
      context = stored;
    } else sessionStorage.removeItem("naadix-assessment");
  } catch {
    /* Storage may be disabled. */
  }
  if (context) {
    $("#scanner-context").hidden = false;
    $("#scanner-context-text").textContent =
      `${context.title} · ${context.department} · ${context.problem} · ${context.maturity}`;
    form.elements.companySize.value = context.size;
  }
  $("#clear-context").addEventListener("click", () => {
    context = null;
    $("#scanner-context").hidden = true;
    try {
      sessionStorage.removeItem("naadix-assessment");
    } catch {}
  });
  const params = new URLSearchParams(location.search),
    interest = params.get("interest");
  if (interest) {
    const aliases = {
      "AI Agents": "AI Agent",
      "Business Automation": "Automation",
      "Knowledge Intelligence": "Knowledge System",
      "AI Integrations": "AI Integration",
      "Custom AI Systems": "Custom AI System",
    };
    const input = [...form.querySelectorAll("[name=interest]")].find(
      (i) => i.value === (aliases[interest] || interest),
    );
    if (input) input.checked = true;
  }
  const area = params.get("area");
  if (area)
    form.elements.workflow.value = `Area to improve: ${area.slice(0, 80)}.\n\n`;
  function show(focus = true) {
    steps.forEach((s, i) => (s.hidden = i !== step));
    $("#contact-back").hidden = step === 0;
    $("#contact-next").hidden = step === 4;
    $("#contact-submit").hidden = step !== 4;
    $("#contact-progress").textContent = `0${step + 1} / 05`;
    $("#form-error").textContent = "";
    if (focus) steps[step].querySelector("input,select,textarea")?.focus();
  }
  function validate() {
    const fields = [...steps[step].querySelectorAll("input,select,textarea")];
    fields.forEach((f) => f.removeAttribute("aria-invalid"));
    const bad = fields.find(
      (f) =>
        !f.checkValidity() ||
        (f.required &&
          f.type !== "checkbox" &&
          f.type !== "radio" &&
          !f.value.trim()),
    );
    if (bad) {
      bad.setAttribute("aria-invalid", "true");
      $("#form-error").textContent =
        bad.validationMessage || "Please complete this field.";
      bad.focus();
      return false;
    }
    return true;
  }
  show(false);
  $("#contact-submit").disabled = false;
  $("#contact-next").addEventListener("click", () => {
    if (validate()) {
      step++;
      show();
    }
  });
  $("#contact-back").addEventListener("click", () => {
    step--;
    show();
  });
  form.addEventListener("focusin", () => track("contact_started"), {
    once: true,
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (step < 4) {
      step++;
      show();
      return;
    }
    const btn = $("#contact-submit");
    btn.disabled = true;
    btn.textContent = "Preparing brief…";
    try {
      if (form.elements.extra.value)
        throw new Error(
          "Please clear the unexpected extra field and try again.",
        );
      const data = Object.fromEntries(new FormData(form));
      brief = await Promise.resolve(prepareBrief(data, context, company.email));
      $("#brief-preview").textContent = brief.text;
      $("#send-email").href = brief.href;
      form.hidden = true;
      $("#contact-result").hidden = false;
      $("#contact-result").focus();
      track("contact_brief_prepared");
    } catch (error) {
      $("#form-error").textContent =
        error.message ||
        "The brief could not be prepared. Please email us directly.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Prepare email brief ↗";
    }
  });
  $("#edit-brief").addEventListener("click", () => {
    $("#contact-result").hidden = true;
    form.hidden = false;
    show();
  });
  $("#copy-brief").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(brief.text);
      toast("Brief copied.");
    } catch {
      toast("Copy is unavailable. Download the brief instead.");
    }
  });
  $("#download-brief").addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([brief.text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "naadix-project-brief.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $("#send-email").addEventListener("click", () =>
    track("contact_email_opened"),
  );
}
