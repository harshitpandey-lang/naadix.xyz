// Perspective-projected 3D topology on Canvas2D: deliberately lightweight, tactile and dependency-free.
export function setupNetwork(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const stage = canvas.parentElement;
  const fallback = stage.querySelector("svg");
  const button = document.querySelector("#motion-toggle");
  const state = document.querySelector("#network-state");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const small = matchMedia("(max-width:800px)");

  if (!document.querySelector('link[data-nx-motion]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/motion-layer.css";
    link.dataset.nxMotion = "true";
    document.head.append(link);
  }

  const labels = ["HUMAN", "DATA", "TOOLS", "MODEL", "MEMORY", "WORKFLOW", "API"];
  const nodes = labels.map((label, i) => ({
    label,
    x: Math.cos((i * Math.PI * 2) / labels.length) * (0.9 + (i % 3) * 0.13),
    y: Math.sin((i * Math.PI * 2) / labels.length) * (0.72 + (i % 2) * 0.16),
    z: [-0.95, 0.1, 0.86][i % 3],
    layer: i % 3,
    drift: 0.7 + (i % 4) * 0.13,
  }));
  const ambient = Array.from({ length: small.matches ? 15 : 32 }, (_, i) => ({
    x: Math.cos(i * 2.17) * (0.35 + (i % 9) * 0.11),
    y: Math.sin(i * 1.73) * (0.24 + (i % 7) * 0.09),
    z: -1.25 + (i % 8) * 0.35,
    layer: i % 3,
    phase: i * 0.61,
  }));

  const floatCards = [
    ["AGENT", "tool use"],
    ["MEMORY", "context"],
    ["HUMAN", "checkpoint"],
    ["WORKFLOW", "action"],
  ];
  if (!stage.querySelector(".network-float-cards")) {
    const wrap = document.createElement("div");
    wrap.className = "network-float-cards";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = floatCards.map(([a, b], i) => `<span class="network-float-card nfc-${i}"><b>${a}</b><small>${b}</small></span>`).join("");
    stage.append(wrap);
  }

  if (button) button.hidden = false;
  let w = 500, h = 560, angle = 0.2, raf = 0, visible = true, paused = false;
  let pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let last = 0, pulseClock = 0;

  function resize() {
    const box = stage.getBoundingClientRect();
    w = box.width;
    h = box.height;
    const dpr = Math.min(devicePixelRatio || 1, small.matches ? 1.35 : 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function project(p, t = 0) {
    const yaw = Math.sin(angle * 0.82) * 0.43 + pointer.x * 0.16;
    const breathing = reduced.matches ? 1 : 1 + Math.sin(angle * 3 + t) * 0.016;
    const x0 = p.x * breathing;
    const y0 = p.y * breathing;
    const x = x0 * Math.cos(yaw) + p.z * Math.sin(yaw);
    const z = p.z * Math.cos(yaw) - x0 * Math.sin(yaw);
    const y = y0 + pointer.y * (0.045 + (p.layer || 0) * 0.012);
    const perspective = 3 / (3 + z);
    return {
      x: w / 2 + x * w * 0.29 * perspective,
      y: h / 2 + y * h * 0.27 * perspective,
      z,
      scale: perspective,
    };
  }

  function softLine(a, b, alpha = 0.2, width = 0.7) {
    ctx.strokeStyle = `rgba(138,170,232,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    const connection = reduced.matches ? 1 : Math.min(1, 0.18 + scrollY / Math.max(h * 1.05, 1));
    const phase = connection < 0.4 ? 0 : connection < 0.65 ? 1 : connection < 0.9 ? 2 : 3;
    if (state) state.textContent = ["01 / FRAGMENTED", "02 / CONNECTED", "03 / AUTOMATED", "04 / COORDINATED"][phase];

    const center = { x: w / 2, y: h / 2 };
    const breath = reduced.matches ? 0.74 : 0.68 + Math.sin(angle * 4.2) * 0.08;
    const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, w * 0.34);
    glow.addColorStop(0, `rgba(116,151,255,${0.17 + breath * 0.08})`);
    glow.addColorStop(0.35, "rgba(100,116,255,.065)");
    glow.addColorStop(1, "rgba(92,116,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ambient.forEach((p, i) => {
      const q = project({ ...p, x: p.x + Math.sin(angle * 0.7 + p.phase) * 0.025, y: p.y + Math.cos(angle * 0.6 + p.phase) * 0.02 }, p.phase);
      const alpha = [0.1, 0.17, 0.26][p.layer] * (0.72 + connection * 0.4);
      ctx.fillStyle = `rgba(174,197,241,${alpha})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, (0.9 + p.layer * 0.55) * q.scale, 0, Math.PI * 2);
      ctx.fill();
      if (i % 5 === 0 && connection > 0.55) {
        const r = project(ambient[(i + 3) % ambient.length]);
        softLine(q, r, 0.035 + connection * 0.045, 0.5);
      }
    });

    const projected = nodes.map((n, i) => project({ ...n, x: n.x + Math.sin(angle * n.drift + i) * 0.018, y: n.y + Math.cos(angle * n.drift + i) * 0.014 }, i));
    ctx.setLineDash(connection < 0.5 ? [3, 7] : []);
    projected.forEach((p, i) => {
      const depthAlpha = [0.1, 0.2, 0.34][nodes[i].layer];
      softLine(center, p, depthAlpha + connection * 0.2, 0.55 + nodes[i].layer * 0.22);
      if (connection > 0.48) softLine(p, projected[(i + 1) % nodes.length], 0.06 + connection * 0.07, 0.55);
      if (connection > 0.78 && i % 2 === 0) softLine(p, projected[(i + 3) % nodes.length], 0.05, 0.5);

      if (!reduced.matches && !paused) {
        const t = (pulseClock * (0.18 + nodes[i].layer * 0.035) + i / nodes.length) % 1;
        const px = center.x + (p.x - center.x) * t;
        const py = center.y + (p.y - center.y) * t;
        const pg = ctx.createRadialGradient(px, py, 0, px, py, 11);
        pg.addColorStop(0, i % 3 === phase % 3 ? "rgba(214,199,255,.95)" : "rgba(175,202,255,.9)");
        pg.addColorStop(1, "rgba(142,174,255,0)");
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.setLineDash([]);

    for (let ring = 0; ring < 3; ring++) {
      ctx.strokeStyle = `rgba(115,150,211,${0.055 + ring * 0.025})`;
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, w * (0.16 + ring * 0.085), h * (0.095 + ring * 0.025), angle * (0.13 + ring * 0.03) + ring * 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }

    projected.forEach((p, i) => {
      ctx.globalAlpha = [0.42, 0.7, 1][nodes[i].layer];
      ctx.fillStyle = "#0b1220";
      ctx.strokeStyle = "#9cb9ea";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (4.6 + nodes[i].layer * 0.6) * p.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c6d6ef";
      ctx.font = `${small.matches ? 9 : 10}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = "center";
      if (i === phase || i === (phase + 3) % nodes.length || connection > 0.86) ctx.fillText(labels[i], p.x, p.y + 24);
      ctx.globalAlpha = 1;
    });

    const core = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 16 + breath * 8);
    core.addColorStop(0, "rgba(242,246,255,1)");
    core.addColorStop(0.28, "rgba(203,220,255,.96)");
    core.addColorStop(1, "rgba(128,159,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 18 + breath * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b9cdff";
    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("INTELLIGENCE", center.x, center.y + 31);

    if (fallback) fallback.style.display = "none";
    stage.style.setProperty("--nx", pointer.x.toFixed(3));
    stage.style.setProperty("--ny", pointer.y.toFixed(3));
  }

  function tick(time) {
    raf = 0;
    if (!visible || document.hidden || paused || reduced.matches) return;
    const elapsed = Math.min(50, time - last || 16);
    last = time;
    angle += elapsed * 0.00009;
    pulseClock += elapsed * 0.0004;
    render();
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    render();
    if (button) {
      button.textContent = reduced.matches ? "Motion reduced" : paused ? "Resume motion" : "Pause motion";
      button.setAttribute("aria-pressed", String(paused || reduced.matches));
      button.disabled = reduced.matches;
    }
    if (visible && !document.hidden && !paused && !reduced.matches) raf = requestAnimationFrame(tick);
  }

  button?.addEventListener("click", () => { paused = !paused; sync(); });
  stage.addEventListener("pointermove", (event) => {
    if (small.matches || reduced.matches) return;
    const r = stage.getBoundingClientRect();
    pointer.tx = (event.clientX - r.left) / Math.max(r.width, 1) - 0.5;
    pointer.ty = (event.clientY - r.top) / Math.max(r.height, 1) - 0.5;
  });
  stage.addEventListener("pointerleave", () => { pointer.tx = 0; pointer.ty = 0; });
  stage.addEventListener("pointerdown", (event) => {
    if (reduced.matches) return;
    const r = stage.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "network-ripple";
    ripple.style.left = `${event.clientX - r.left}px`;
    ripple.style.top = `${event.clientY - r.top}px`;
    stage.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });

  const tactile = [...document.querySelectorAll(".lab-card,.solutions-grid article,.method-grid article")];
  tactile.forEach((card) => {
    card.classList.add("nx-tactile");
    card.addEventListener("pointermove", (event) => {
      if (small.matches || reduced.matches) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--px", ((event.clientX - r.left) / r.width - 0.5).toFixed(3));
      card.style.setProperty("--py", ((event.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--px", "0"); card.style.setProperty("--py", "0"); });
  });

  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }).observe(stage);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  resize();
  sync();
}
