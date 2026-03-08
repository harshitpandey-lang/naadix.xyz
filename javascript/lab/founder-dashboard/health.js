const HEALTH_KEY = "naadixLab:healthStateV2";
const healthForm = document.getElementById("healthForm");
const healthScore = document.getElementById("healthScore");
const healthChart = document.getElementById("healthChart");

const readState = () => {
  try {
    return JSON.parse(localStorage.getItem(HEALTH_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveState = (state) => localStorage.setItem(HEALTH_KEY, JSON.stringify(state));

const render = () => {
  const state = readState();
  const checks = Array.from(healthForm.querySelectorAll('input[type="checkbox"]'));
  checks.forEach((box) => {
    box.checked = Boolean(state[box.value]);
  });

  const done = checks.filter((box) => box.checked).length;
  const score = checks.length ? Math.round((done / checks.length) * 100) : 0;
  healthScore.textContent = `${score}%`;

  healthChart.innerHTML = "";
  checks.forEach((box) => {
    const row = document.createElement("div");
    row.className = "chart-bar";
    row.innerHTML = `
      <span>${box.value}</span>
      <div class="chart-bar-track"><span style="width:${box.checked ? 100 : 10}%"></span></div>
      <strong>${box.checked ? "Done" : "Pending"}</strong>
    `;
    healthChart.appendChild(row);
  });
};

if (healthForm) {
  healthForm.addEventListener("change", () => {
    const checks = Array.from(healthForm.querySelectorAll('input[type="checkbox"]'));
    const state = checks.reduce((acc, box) => ({ ...acc, [box.value]: box.checked }), {});
    saveState(state);
    render();
  });

  render();
}