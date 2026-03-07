const habitPanel = document.querySelector(".card-grid .span-12");
const healthKey = "naadixLab:healthChecklist";

if (habitPanel) {
  const checklist = document.createElement("div");
  checklist.className = "stack";
  checklist.innerHTML = `
    <label><input type="checkbox" data-item="sleep"> Slept at least 7 hours</label>
    <label><input type="checkbox" data-item="exercise"> Workout completed</label>
    <label><input type="checkbox" data-item="meditation"> Meditation done</label>
    <label><input type="checkbox" data-item="hydration"> Hydration target met</label>
    <p class="mini-note" id="healthScore"></p>
  `;
  habitPanel.appendChild(checklist);

  const state = JSON.parse(localStorage.getItem(healthKey) || "{}");
  const boxes = checklist.querySelectorAll('input[type="checkbox"]');
  const scoreEl = checklist.querySelector("#healthScore");

  const updateScore = () => {
    let done = 0;
    boxes.forEach((box) => {
      if (box.checked) done += 1;
    });
    scoreEl.textContent = `Daily habit completion: ${Math.round((done / boxes.length) * 100)}%`;
  };

  boxes.forEach((box) => {
    box.checked = Boolean(state[box.dataset.item]);
    box.addEventListener("change", () => {
      state[box.dataset.item] = box.checked;
      localStorage.setItem(healthKey, JSON.stringify(state));
      updateScore();
    });
  });
  updateScore();
}
