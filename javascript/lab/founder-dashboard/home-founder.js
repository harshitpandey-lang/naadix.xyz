const TODO_KEY = "naadixLab:founderTodos";
const GOALS_KEY = "naadixLab:goalsV2";
const EDUCATION_KEY = "naadixLab:educationSubjects";
const FINANCE_KEY = "naadixLab:financeEntriesV2";
const HEALTH_KEY = "naadixLab:healthStateV2";
const LOCATION_KEY = "naadixLab:founderLocation";

const todoForm = document.getElementById("todoForm");
const todoTitle = document.getElementById("todoTitle");
const todoCategory = document.getElementById("todoCategory");
const todoList = document.getElementById("todoList");

const goalMetric = document.getElementById("goalMetric");
const educationMetric = document.getElementById("educationMetric");
const financeMetric = document.getElementById("financeMetric");
const healthMetric = document.getElementById("healthMetric");

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const saveTodos = (items) => {
  localStorage.setItem(TODO_KEY, JSON.stringify(items));
};

const readTodos = () => readJson(TODO_KEY, []);

const renderTodos = () => {
  const todos = readTodos();
  todoList.innerHTML = "";

  if (!todos.length) {
    todoList.innerHTML = '<p class="mini-note">No tasks yet. Add your first task.</p>';
    return;
  }

  todos.forEach((todo) => {
    const row = document.createElement("div");
    row.className = "inline";
    const checked = todo.done ? "checked" : "";
    row.innerHTML = `
      <label style="flex:1"><input type="checkbox" data-toggle="${todo.id}" ${checked}> ${todo.title} <span class="mini-note">(${todo.category})</span></label>
      <button type="button" class="secondary" data-delete="${todo.id}">Delete</button>
    `;
    todoList.appendChild(row);
  });
};

if (todoForm) {
  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = todoTitle.value.trim();
    const category = todoCategory.value;
    if (!title) return;

    const todos = readTodos();
    todos.push({
      id: `todo-${Date.now()}`,
      title,
      category,
      done: false
    });
    saveTodos(todos);
    todoForm.reset();
    renderTodos();
  });

  todoList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteId = target.getAttribute("data-delete");
    if (!deleteId) return;

    const todos = readTodos().filter((todo) => todo.id !== deleteId);
    saveTodos(todos);
    renderTodos();
  });

  todoList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const toggleId = target.getAttribute("data-toggle");
    if (!toggleId) return;

    const todos = readTodos().map((todo) => (
      todo.id === toggleId ? { ...todo, done: target.checked } : todo
    ));
    saveTodos(todos);
    renderTodos();
  });

  renderTodos();
}

const renderMetrics = () => {
  const goals = readJson(GOALS_KEY, []);
  const education = readJson(EDUCATION_KEY, []);
  const finance = readJson(FINANCE_KEY, []);
  const health = readJson(HEALTH_KEY, { sleep: false, exercise: false, meditation: false, diet: false });

  if (goalMetric) {
    const avg = goals.length
      ? Math.round(goals.reduce((sum, item) => sum + Number(item.progress || 0), 0) / goals.length)
      : 0;
    goalMetric.textContent = `${avg}%`;
  }

  if (educationMetric) {
    const avg = education.length
      ? Math.round(education.reduce((sum, item) => sum + Number(item.progress || 0), 0) / education.length)
      : 0;
    educationMetric.textContent = `${avg}%`;
  }

  if (financeMetric) {
    let net = 0;
    finance.forEach((entry) => {
      const amount = Number(entry.amount || 0);
      if (entry.type === "income") net += amount;
      if (entry.type === "expense") net -= amount;
      if (entry.type === "investment") net -= amount;
      if (entry.type === "savings") net += amount;
    });
    financeMetric.textContent = `Rs ${net}`;
  }

  if (healthMetric) {
    const values = Object.values(health);
    const done = values.filter(Boolean).length;
    const score = values.length ? Math.round((done / values.length) * 100) : 0;
    healthMetric.textContent = `${score}%`;
  }
};

const publishLocation = () => {
  if (!("geolocation" in navigator)) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCATION_KEY, JSON.stringify(payload));
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
  );
};

renderMetrics();
publishLocation();
setInterval(publishLocation, 60000);
