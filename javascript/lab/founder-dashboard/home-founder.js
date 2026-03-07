const taskPanel = document.querySelector(".card-grid .span-3");
const notesPanel = document.querySelectorAll(".card-grid .span-6")[1];

if (taskPanel) {
  const taskInput = document.createElement("input");
  taskInput.placeholder = "Add a daily task";
  const taskButton = document.createElement("button");
  taskButton.textContent = "Add Task";
  const taskList = taskPanel.querySelector("ul");

  const saveTasks = () => {
    const items = Array.from(taskList.querySelectorAll("li")).map((li) => li.textContent);
    localStorage.setItem("naadixLab:founderTasks", JSON.stringify(items));
  };

  const loadTasks = () => {
    const items = JSON.parse(localStorage.getItem("naadixLab:founderTasks") || "[]");
    if (items.length) {
      taskList.innerHTML = "";
      items.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        taskList.appendChild(li);
      });
    }
  };

  taskButton.addEventListener("click", () => {
    const text = taskInput.value.trim();
    if (!text) return;
    const li = document.createElement("li");
    li.textContent = text;
    taskList.appendChild(li);
    taskInput.value = "";
    saveTasks();
  });

  taskPanel.appendChild(taskInput);
  taskPanel.appendChild(taskButton);
  loadTasks();
}

if (notesPanel) {
  const area = document.createElement("textarea");
  area.rows = 5;
  area.placeholder = "Write founder control notes...";
  area.value = localStorage.getItem("naadixLab:founderNote") || "";
  area.addEventListener("input", () => {
    localStorage.setItem("naadixLab:founderNote", area.value);
  });
  notesPanel.appendChild(area);
}
