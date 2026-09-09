import { company, workflows } from "./config.js";
import { assess } from "./assessment.js";
import { track } from "./analytics.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let toastTimer;
export function toast(message) {
  const el = $(".toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4500);
}
const menu = $("#mobile-menu"),
  toggle = $("#menu-toggle");
function closeMenu() {
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  $("main").inert = false;
  $("footer").inert = false;
}
toggle.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  document.body.style.overflow = open ? "hidden" : "";
  $("main").inert = open;
  $("footer").inert = open;
  if (open) menu.querySelector("a").focus();
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (!menu.hidden && e.key === "Escape") {
    closeMenu();
    toggle.focus();
  }
  if (!menu.hidden && e.key === "Tab") {
    const items = [toggle, ...menu.querySelectorAll("a")],
      i = items.indexOf(document.activeElement);
    if (e.shiftKey && i === 0) {
      e.preventDefault();
      items.at(-1).focus();
    } else if (!e.shiftKey && i === items.length - 1) {
      e.preventDefault();
      toggle.focus();
    }
  }
});
matchMedia("(min-width:801px)").addEventListener("change", (e) => {
  if (e.matches) closeMenu();
});
const dialog = $("#command-menu"),
  search = $("#command-search");
function openCommand() {
  closeMenu();
  if (!dialog.open) dialog.showModal();
  search.value = "";
  filterCommands();
  search.focus();
}
function filterCommands() {
  let visible = 0;
  dialog.querySelectorAll("nav a,nav button").forEach((el) => {
    el.hidden = !el.textContent
      .toLowerCase()
      .includes(search.value.toLowerCase());
    if (!el.hidden) visible++;
  });
  $("#command-empty").hidden = visible > 0;
}
$(".command-trigger").addEventListener("click", openCommand);
$("[data-close-command]").addEventListener("click", () => dialog.close());
search.addEventListener("input", filterCommands);
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    dialog.open ? dialog.close() : openCommand();
  }
});
dialog.addEventListener("keydown", (e) => {
  if (["ArrowDown", "ArrowUp"].includes(e.key)) {
    e.preventDefault();
    const items = [
      search,
      ...dialog.querySelectorAll(
        "nav a:not([hidden]),nav button:not([hidden])",
      ),
    ];
    const next =
      (items.indexOf(document.activeElement) +
        (e.key === "ArrowDown" ? 1 : -1) +
        items.length) %
      items.length;
    items[next].focus();
  }
  if (e.key === "Enter" && document.activeElement === search) {
    e.preventDefault();
    dialog
      .querySelector("nav a:not([hidden]),nav button:not([hidden])")
      ?.click();
  }
});
dialog.addEventListener("click", (e) => {
  if (e.target.closest("nav a")) dialog.close();
});
$$("[data-copy-email]").forEach((b) =>
  b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(company.email);
      toast("Email address copied.");
    } catch {
      toast(`Email: ${company.email}`);
    }
  }),
);
$$(".capability").forEach((el) =>
  el.addEventListener("toggle", () => {
    if (el.open)
      track("capability_opened", {
        capability: el.querySelector("h3").textContent,
      });
  }),
);
$$(".hero-actions a").forEach((el) =>
  el.addEventListener("click", () =>
    track("hero_cta_clicked", { destination: el.pathname }),
  ),
);
$$(".socials a").forEach((el) =>
  el.addEventListener("click", () =>
    track("social_link_clicked", { label: el.textContent.trim() }),
  ),
);
let scrollPending = false;
function progress() {
  scrollPending = false;
  const d = document.documentElement;
  $(".reading-progress").style.transform =
    `scaleX(${d.scrollHeight > d.clientHeight ? scrollY / (d.scrollHeight - d.clientHeight) : 0})`;
}
addEventListener(
  "scroll",
  () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(progress);
    }
  },
  { passive: true },
);
progress();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(".method-grid article,.lab-card,.solutions-grid article").forEach((el) => {
    if (!motion.matches) el.classList.add("reveal-ready");
    observer.observe(el);
  });
}
const nodes = $$(".flow-node");
let flowTimer = null,
  index = 0;
function inspect(i) {
  index = i;
  nodes.forEach((node, j) =>
    node.setAttribute("aria-pressed", String(j === i)),
  );
  $("#node-detail").textContent = nodes[i].dataset.detail;
}
function stopFlow() {
  clearInterval(flowTimer);
  flowTimer = null;
  if ($("#run-flow")) $("#run-flow").textContent = "Run example →";
}
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
  $("#run-flow").textContent = "Pause example";
  flowTimer = setInterval(() => {
    if (index === nodes.length - 1) {
      stopFlow();
      return;
    }
    inspect(index + 1);
    if (index === 5) {
      stopFlow();
      $("#node-detail").textContent +=
        " Example paused: select Follow-up to inspect the approved path.";
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
let assessment = null;
$("#scanner-form")?.addEventListener(
  "focusin",
  () => track("scanner_started"),
  { once: true },
);
$("#scanner-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const result = assess(data);
  assessment = { ...data, ...result, created: Date.now() };
  $("#opportunity-title").textContent = result.title;
  $("#opportunity-reason").textContent = result.reason;
  list($("#opportunity-parts"), result.parts);
  $("#opportunity-next").textContent = result.next;
  e.target.hidden = true;
  $("#scanner-result").hidden = false;
  $("#scanner-result").focus();
  track("scanner_completed", { department: data.department });
});
$("#scanner-reset")?.addEventListener("click", () => {
  $("#scanner-result").hidden = true;
  $("#scanner-form").hidden = false;
  $("#department").focus();
});
$(".scanner-cta")?.addEventListener("click", () => {
  try {
    sessionStorage.setItem("naadix-assessment", JSON.stringify(assessment));
  } catch {
    toast("Storage is unavailable. Include the opportunity in your brief.");
  }
});
if ($("#contact-form"))
  import("./contact.js")
    .then((m) => m.setupContact(company, toast))
    .catch(() =>
      toast("Brief builder unavailable. Please use the email link."),
    );
const canvas = $("#intelligence-network");
if (canvas) {
  const load = () =>
    import("./network.js")
      .then((m) => m.setupNetwork(canvas))
      .catch(() => {
        $("#motion-toggle").hidden = true;
      });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          io.disconnect();
          load();
        }
      },
      { rootMargin: "100px" },
    );
    io.observe(canvas);
  } else load();
}
const cursor = $("#precision-cursor"),
  fine = matchMedia("(pointer:fine) and (hover:hover)");
document.addEventListener(
  "pointermove",
  (e) => {
    if (!fine.matches || motion.matches) {
      cursor.classList.remove("active");
      return;
    }
    cursor.classList.add("active");
    const inspect = !!e.target.closest("a,button,summary");
    cursor.classList.toggle("inspect", inspect);
    cursor.style.transform = `translate(${e.clientX - (inspect ? 19 : 11)}px,${e.clientY - (inspect ? 19 : 11)}px)`;
  },
  { passive: true },
);
document.addEventListener("pointerleave", () =>
  cursor.classList.remove("active"),
);
