import { architectures, workflows } from "./system-data.js";
export function setupArchitecture() {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let nodes = $$(".flow-node"),
    flowTimer = null,
    index = 0,
    xray = false,
    activeArchitecture = "sales";
  function inspect(i) {
    if (!nodes.length) return;
    index = i;
    nodes.forEach((node, j) =>
      node.setAttribute("aria-pressed", String(j === i)),
    );
    $("#node-detail").textContent = nodes[i].dataset.detail;
  }
  function stopFlow() {
    clearInterval(flowTimer);
    flowTimer = null;
    if ($("#run-flow")) $("#run-flow").textContent = "Run signal →";
  }
  function bindArchitectureNodes() {
    nodes = $$(".flow-node");
    nodes.forEach((node, i) => {
      node.addEventListener("click", () => {
        stopFlow();
        inspect(i);
      });
      node.addEventListener("mouseenter", () => {
        if (!flowTimer) inspect(i);
      });
      node.addEventListener("focus", () => {
        if (!flowTimer) inspect(i);
      });
    });
  }
  function renderArchitecture(key) {
    stopFlow();
    activeArchitecture = key;
    const architecture = architectures[key];
    $("#architecture-title").textContent =
      `${architecture.title.toUpperCase()} / SYSTEM MAP`;
    const flow = $("#architecture-flow");
    flow.replaceChildren(
      ...architecture.steps.map(([name, type, detail], i) => {
        const li = document.createElement("li"),
          button = document.createElement("button"),
          kind = document.createElement("span"),
          strong = document.createElement("strong"),
          signal = document.createElement("span");
        button.className = "flow-node";
        button.dataset.node = i;
        button.dataset.type = type;
        button.dataset.detail = detail;
        button.setAttribute("aria-pressed", String(i === 0));
        kind.className = `node-type${type === "HUMAN" ? " human" : ""}`;
        kind.textContent = type;
        strong.textContent = name;
        signal.className = "naadix-signal";
        signal.setAttribute("aria-hidden", "true");
        signal.textContent = type === "HUMAN" ? "◈" : "○";
        button.append(kind, strong, signal);
        li.append(button);
        return li;
      }),
    );
    $$("[data-architecture]").forEach((tab) =>
      tab.setAttribute(
        "aria-selected",
        String(tab.dataset.architecture === key),
      ),
    );
    $("#architecture").classList.toggle("xray-active", xray);
    bindArchitectureNodes();
    inspect(0);
  }
  $$("[data-architecture]").forEach((tab) =>
    tab.addEventListener("click", () =>
      renderArchitecture(tab.dataset.architecture),
    ),
  );
  $("#xray-flow")?.addEventListener("click", (event) => {
    xray = !xray;
    event.currentTarget.setAttribute("aria-pressed", String(xray));
    event.currentTarget.firstChild.textContent = xray
      ? "Hide system X-ray "
      : "View system X-ray ";
    $("#architecture").classList.toggle("xray-active", xray);
    $("#node-detail").textContent = xray
      ? "System X-ray reveals the technical role beneath every business step."
      : architectures[activeArchitecture].steps[index][2];
  });
  bindArchitectureNodes();
  $("#run-flow")?.addEventListener("click", () => {
    if (flowTimer) {
      stopFlow();
      return;
    }
    if (motion.matches) {
      inspect((index + 1) % nodes.length);
      return;
    }
    inspect(0);
    $("#run-flow").textContent = "Pause signal";
    flowTimer = setInterval(() => {
      if (index === nodes.length - 1) {
        stopFlow();
        return;
      }
      inspect(index + 1);
      if (nodes[index]?.dataset.type === "HUMAN") {
        stopFlow();
        $("#node-detail").textContent +=
          " Signal paused at the human checkpoint.";
      }
    }, 1300);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopFlow();
  });
  if ($("#architecture") && "IntersectionObserver" in window)
    new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) stopFlow();
    }).observe($("#architecture"));
  function list(el, items) {
    el.replaceChildren(
      ...items.map((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        return li;
      }),
    );
  }
  $("#workflow-choice")?.addEventListener("change", (e) => {
    const w = workflows[e.target.value];
    list($("#manual-steps"), w.manual);
    list($("#system-steps"), w.system);
    $("#sim-benefit").textContent = w.benefit;
  });
}
