import { company } from "./config.js";
import { prepareBrief } from "./contact-service.js";
const stage = document.querySelector(".w-stage");
if (stage) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const button = document.querySelector("#web-motion");
  let paused = false,
    visible = true;
  const update = () => {
    const allowed = !motion.matches && !navigator.connection?.saveData;
    stage.classList.toggle("w-motion-on", allowed);
    stage.classList.toggle(
      "w-motion-paused",
      paused || !visible || document.hidden,
    );
    button.hidden = !allowed;
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Resume motion" : "Pause motion";
  };
  button.addEventListener("click", () => {
    paused = !paused;
    update();
  });
  motion.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window)
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }).observe(stage);
  update();
}
const form = document.querySelector("#web-quote-form");
if (form) {
  const button = form.querySelector("button[type=submit]");
  const status = document.querySelector("#web-form-status");
  const result = document.querySelector("#web-brief");
  button.disabled = false;
  document.querySelectorAll("[data-service]").forEach((link) =>
    link.addEventListener("click", () => {
      form.elements.interest.value = link.dataset.service;
    }),
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (
      ["name", "company", "workflow"].some(
        (key) => !form.elements[key].value.trim(),
      )
    ) {
      status.textContent =
        "Please complete your name, business and project description.";
      return;
    }
    button.disabled = true;
    button.textContent = "Preparing brief…";
    status.textContent = "";
    try {
      const data = Object.fromEntries(new FormData(form));
      if (data.budget) data.workflow += `\n\nBudget: ${data.budget}`;
      const brief = await Promise.resolve(
        prepareBrief(data, null, company.email),
      );
      document.querySelector("#web-brief-text").textContent = brief.text;
      document.querySelector("#web-send").href = brief.href;
      form.hidden = true;
      result.hidden = false;
      result.focus();
    } catch {
      status.textContent =
        "Your draft could not be prepared. Please email us directly or try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Prepare email brief ↗";
    }
  });
  document.querySelector("#web-edit").addEventListener("click", () => {
    result.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
}
// Location is secondary to the prerendered service content and contact actions.
const loadLocation = () =>
  import("./web-location.js")
    .then((module) => module.setupLocation())
    .catch(() => {});
if ("requestIdleCallback" in window)
  requestIdleCallback(loadLocation, { timeout: 2000 });
else setTimeout(loadLocation, 0);
