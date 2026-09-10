// Perspective-projected 3D topology on Canvas2D: no WebGL dependency or textures.
export function setupNetwork(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const stage = canvas.parentElement,
    fallback = stage.querySelector("svg"),
    button = document.querySelector("#motion-toggle"),
    state = document.querySelector("#network-state");
  button.hidden = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
    small = matchMedia("(max-width:800px)");
  const labels = ["HUMAN", "DATA", "TOOLS", "MODEL", "MEMORY", "WORKFLOW", "API"];
  const nodes = labels.map((label, i) => ({
    label,
    x: Math.cos((i * Math.PI * 2) / labels.length) * (0.9 + (i % 3) * 0.13),
    y: Math.sin((i * Math.PI * 2) / labels.length) * (0.72 + (i % 2) * 0.16),
    z: [-0.9, 0.15, 0.8][i % 3],
    layer: i % 3,
  }));
  let w = 500,
    h = 560,
    angle = 0.2,
    raf = 0,
    visible = true,
    paused = false,
    pointer = { x: 0, y: 0 },
    last = 0;
  function resize() {
    const box = stage.getBoundingClientRect();
    w = box.width;
    h = box.height;
    const dpr = Math.min(devicePixelRatio || 1, small.matches ? 1.5 : 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function project(p) {
    const a = Math.sin(angle) * 0.38 + pointer.x * 0.1,
      x = p.x * Math.cos(a) + p.z * Math.sin(a),
      z = p.z * Math.cos(a) - p.x * Math.sin(a),
      y = p.y + pointer.y * 0.05;
    const perspective = 3 / (3 + z);
    return {
      x: w / 2 + x * w * 0.29 * perspective,
      y: h / 2 + y * h * 0.27 * perspective,
      z,
      scale: perspective,
    };
  }
  function render() {
    ctx.clearRect(0, 0, w, h);
    const connection = reduced.matches
      ? 1
      : Math.min(1, 0.2 + scrollY / Math.max(h, 1));
    const phase =
      connection < 0.4 ? 0 : connection < 0.65 ? 1 : connection < 0.9 ? 2 : 3;
    state.textContent = [
      "01 / FRAGMENTED",
      "02 / CONNECTED",
      "03 / AUTOMATED",
      "04 / COORDINATED",
    ][phase];
    const center = { x: w / 2, y: h / 2 };
    const glow = ctx.createRadialGradient(
      center.x,
      center.y,
      0,
      center.x,
      center.y,
      w * 0.25,
    );
    glow.addColorStop(0, "#709dff35");
    glow.addColorStop(1, "#709dff00");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const projected = nodes.map(project);
    ctx.setLineDash(connection < 0.5 ? [3, 7] : []);
    projected.forEach((p, i) => {
      const depthAlpha = [0.12, 0.22, 0.34][nodes[i].layer];
      ctx.strokeStyle = `rgba(133,165,229,${depthAlpha + connection * 0.26})`;
      ctx.lineWidth = 0.5 + nodes[i].layer * 0.22;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (connection > 0.5) {
        const q = projected[(i + 1) % nodes.length];
        ctx.strokeStyle = "#87a5e526";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      if (!reduced.matches && !paused) {
        const t = (angle * (0.3 + nodes[i].layer * 0.08) + i / nodes.length) % 1;
        ctx.fillStyle = i % 3 === phase % 3 ? "#cab8ff" : "#a4bcff";
        ctx.beginPath();
        ctx.arc(
          center.x + (p.x - center.x) * t,
          center.y + (p.y - center.y) * t,
          1.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });
    ctx.setLineDash([]);
    ctx.strokeStyle = "#7396d326";
    for (let ring = 0; ring < 2; ring++) {
      ctx.beginPath();
      ctx.ellipse(
        center.x,
        center.y,
        w * (0.18 + ring * 0.11),
        h * 0.12,
        angle * 0.2 + ring * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    projected.forEach((p, i) => {
      ctx.globalAlpha = [0.48, 0.72, 1][nodes[i].layer];
      ctx.fillStyle = "#0b1220";
      ctx.strokeStyle = "#8fafe0";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#bdcce4";
      ctx.font = `${small.matches ? 10 : 11}px monospace`;
      ctx.textAlign = "center";
      if (i === phase || i === (phase + 3) % nodes.length || connection > 0.84)
        ctx.fillText(labels[i], p.x, p.y + 25);
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = "#d6e2ff";
    ctx.beginPath();
    ctx.arc(center.x, center.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a4bcff";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("INTELLIGENCE", center.x, center.y + 29);
    fallback.style.display = "none";
  }
  function tick(time) {
    raf = 0;
    if (!visible || document.hidden || paused || reduced.matches) return;
    const elapsed = Math.min(50, time - last || 16);
    last = time;
    angle += elapsed * 0.00008;
    render();
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    render();
    button.textContent = reduced.matches
      ? "Motion reduced"
      : paused
        ? "Resume motion"
        : "Pause motion";
    button.setAttribute("aria-pressed", String(paused || reduced.matches));
    button.disabled = reduced.matches;
    if (visible && !document.hidden && !paused && !reduced.matches)
      raf = requestAnimationFrame(tick);
  }
  button.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  stage.addEventListener("pointermove", (e) => {
    if (small.matches || reduced.matches) return;
    const r = stage.getBoundingClientRect();
    pointer = {
      x: (e.clientX - r.left) / w - 0.5,
      y: (e.clientY - r.top) / h - 0.5,
    };
  });
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    sync();
  }).observe(stage);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  resize();
  sync();
}
