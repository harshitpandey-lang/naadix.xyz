const GOAL_KEY = "naadixLab:goalsV2";
const goalForm = document.getElementById("goalForm");
const goalList = document.getElementById("goalList");

const readGoals = () => {
  try {
    return JSON.parse(localStorage.getItem(GOAL_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveGoals = (goals) => localStorage.setItem(GOAL_KEY, JSON.stringify(goals));

const renderGoals = () => {
  const goals = readGoals();
  goalList.innerHTML = "";

  if (!goals.length) {
    goalList.innerHTML = '<p class="mini-note">No goals yet.</p>';
    return;
  }

  goals.forEach((goal) => {
    const row = document.createElement("div");
    row.className = "panel";
    row.innerHTML = `
      <h4>${goal.title}</h4>
      <p class="mini-note">${goal.description}</p>
      <p class="mini-note">Deadline: ${goal.deadline}</p>
      <div class="progress-bar"><span style="width:${goal.progress}%"></span></div>
      <div class="inline">
        <input type="range" min="0" max="100" value="${goal.progress}" data-slider="${goal.id}">
        <span>${goal.progress}%</span>
        <button type="button" data-delete="${goal.id}" class="secondary">Delete</button>
      </div>
    `;
    goalList.appendChild(row);
  });
};

if (goalForm) {
  if (!localStorage.getItem(GOAL_KEY)) {
    saveGoals([
      { id: "g1", title: "AI Startup Development", description: "Product and market validation", progress: 60, deadline: "2026-12-31" },
      { id: "g2", title: "Robotics Project", description: "Prototype and testing", progress: 40, deadline: "2026-09-30" }
    ]);
  }

  goalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("goalTitle").value.trim();
    const description = document.getElementById("goalDescription").value.trim();
    const progress = Number(document.getElementById("goalProgress").value);
    const deadline = document.getElementById("goalDeadline").value;

    if (!title || !description || Number.isNaN(progress) || !deadline) return;

    const goals = readGoals();
    goals.push({
      id: `goal-${Date.now()}`,
      title,
      description,
      progress: Math.max(0, Math.min(100, progress)),
      deadline
    });
    saveGoals(goals);
    goalForm.reset();
    renderGoals();
  });

  goalList.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const id = target.getAttribute("data-slider");
    if (!id) return;

    const goals = readGoals().map((goal) => (
      goal.id === id ? { ...goal, progress: Number(target.value) } : goal
    ));
    saveGoals(goals);
    renderGoals();
  });

  goalList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const id = target.getAttribute("data-delete");
    if (!id) return;

    const goals = readGoals().filter((goal) => goal.id !== id);
    saveGoals(goals);
    renderGoals();
  });

  renderGoals();
}