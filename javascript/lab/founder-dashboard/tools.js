let timerSeconds = 25 * 60;
let timerId = null;

const timerLabel = document.getElementById("timerLabel");
const timerStatus = document.getElementById("timerStatus");
const timerMinutes = document.getElementById("timerMinutes");
const startTimer = document.getElementById("startTimer");
const resetTimer = document.getElementById("resetTimer");
const quickNote = document.getElementById("quickNote");
const copyNote = document.getElementById("copyNote");
const exportNote = document.getElementById("exportNote");
const clearNote = document.getElementById("clearNote");
const noteMeta = document.getElementById("noteMeta");
const calcA = document.getElementById("calcA");
const calcB = document.getElementById("calcB");
const calcOp = document.getElementById("calcOp");
const calcRun = document.getElementById("calcRun");
const calcOut = document.getElementById("calcOut");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const taskSummary = document.getElementById("taskSummary");
const toolSearch = document.getElementById("toolSearch");
const toolCategory = document.getElementById("toolCategory");
const toolResults = document.getElementById("toolResults");
const toolCount = document.getElementById("toolCount");

const NOTE_KEY = "naadixLab:quickNoteV3";
const NOTE_META_KEY = "naadixLab:quickNoteMetaV1";
const TASKS_KEY = "naadixLab:tasksV1";
const TIMER_KEY = "naadixLab:timerV1";

const TOOL_CATALOG = [
  { name: "Notion", category: "Workspace", pricing: "Free + Paid", url: "https://www.notion.so", tags: ["docs", "wiki", "project"], summary: "All-in-one docs, databases, and team planning." },
  { name: "Todoist", category: "Tasks", pricing: "Free + Paid", url: "https://todoist.com", tags: ["to-do", "reminders", "personal"], summary: "Simple task planning with recurring schedules." },
  { name: "ClickUp", category: "Project Management", pricing: "Free + Paid", url: "https://clickup.com", tags: ["projects", "roadmap", "team"], summary: "Project management, docs, and goals in one place." },
  { name: "Trello", category: "Project Management", pricing: "Free + Paid", url: "https://trello.com", tags: ["kanban", "cards", "workflow"], summary: "Kanban-style task boards and checklists." },
  { name: "Asana", category: "Project Management", pricing: "Free + Paid", url: "https://asana.com", tags: ["teams", "planning", "tracking"], summary: "Work tracking for teams, projects, and timelines." },
  { name: "Obsidian", category: "Knowledge Base", pricing: "Free + Paid", url: "https://obsidian.md", tags: ["notes", "markdown", "pkm"], summary: "Local-first knowledge graph for linked notes." },
  { name: "Google Calendar", category: "Scheduling", pricing: "Free", url: "https://calendar.google.com", tags: ["calendar", "meetings", "planning"], summary: "Time blocking and event scheduling." },
  { name: "Clockify", category: "Time Tracking", pricing: "Free + Paid", url: "https://clockify.me", tags: ["timers", "timesheets", "reports"], summary: "Track focused hours across projects." },
  { name: "RescueTime", category: "Focus Analytics", pricing: "Paid", url: "https://www.rescuetime.com", tags: ["focus", "analytics", "habits"], summary: "Automatic activity tracking and focus insights." },
  { name: "Zapier", category: "Automation", pricing: "Free + Paid", url: "https://zapier.com", tags: ["automation", "workflows", "integrations"], summary: "Automate repetitive tasks between apps." }
];

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const drawTimer = () => {
  if (!timerLabel) return;
  const min = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const sec = String(timerSeconds % 60).padStart(2, "0");
  timerLabel.textContent = `${min}:${sec}`;
};

const updateTimerStatus = (text) => {
  if (timerStatus) timerStatus.textContent = text;
};

const persistTimer = () => {
  saveJson(TIMER_KEY, {
    timerSeconds,
    minutes: Number(timerMinutes && timerMinutes.value) || 25,
    running: Boolean(timerId)
  });
};

const notifyTimerEnd = () => {
  updateTimerStatus("Sprint complete. Take a short break.");
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Pomodoro complete", { body: "Great focus sprint. Time for a break." });
  }

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio is optional and might fail on restricted browsers.
  }
};

const resetTimerToConfiguredMinutes = () => {
  timerSeconds = Math.max(1, Number(timerMinutes && timerMinutes.value) || 25) * 60;
  drawTimer();
  persistTimer();
};

if (startTimer && resetTimer && timerMinutes) {
  const timerState = readJson(TIMER_KEY, null);
  if (timerState && Number(timerState.timerSeconds) > 0) {
    timerSeconds = Number(timerState.timerSeconds);
    timerMinutes.value = String(Math.max(1, Number(timerState.minutes) || 25));
  }
  drawTimer();

  startTimer.addEventListener("click", () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      startTimer.textContent = "Start";
      updateTimerStatus("Paused. Resume when ready.");
      persistTimer();
      return;
    }

    if (timerSeconds <= 0) {
      resetTimerToConfiguredMinutes();
    }

    startTimer.textContent = "Pause";
    updateTimerStatus("Focus sprint running...");
    timerId = setInterval(() => {
      timerSeconds -= 1;
      drawTimer();
      persistTimer();
      if (timerSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        startTimer.textContent = "Start";
        notifyTimerEnd();
        timerSeconds = Math.max(1, Number(timerMinutes.value) || 25) * 60;
        drawTimer();
        persistTimer();
      }
    }, 1000);
  });

  resetTimer.addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    startTimer.textContent = "Start";
    resetTimerToConfiguredMinutes();
    updateTimerStatus("Timer reset.");
  });

  timerMinutes.addEventListener("change", () => {
    const sanitized = Math.min(180, Math.max(1, Number(timerMinutes.value) || 25));
    timerMinutes.value = String(sanitized);
    if (!timerId) resetTimerToConfiguredMinutes();
    updateTimerStatus(`Configured for ${sanitized} minutes.`);
  });
}

if (quickNote) {
  const noteText = localStorage.getItem(NOTE_KEY) || "";
  quickNote.value = noteText;
  const lastSaved = localStorage.getItem(NOTE_META_KEY);
  if (noteMeta && lastSaved) noteMeta.textContent = `Last saved: ${new Date(Number(lastSaved)).toLocaleString()}`;

  quickNote.addEventListener("input", () => {
    localStorage.setItem(NOTE_KEY, quickNote.value);
    const now = Date.now();
    localStorage.setItem(NOTE_META_KEY, String(now));
    if (noteMeta) noteMeta.textContent = `Last saved: ${new Date(now).toLocaleString()} (${quickNote.value.length} chars)`;
  });
}

if (copyNote && quickNote && noteMeta) {
  copyNote.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(quickNote.value || "");
      noteMeta.textContent = "Copied to clipboard.";
    } catch {
      noteMeta.textContent = "Clipboard copy failed in this browser.";
    }
  });
}

if (exportNote && quickNote && noteMeta) {
  exportNote.addEventListener("click", () => {
    const blob = new Blob([quickNote.value || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `naadix-note-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    noteMeta.textContent = "Note exported.";
  });
}

if (clearNote && quickNote && noteMeta) {
  clearNote.addEventListener("click", () => {
    quickNote.value = "";
    localStorage.removeItem(NOTE_KEY);
    localStorage.removeItem(NOTE_META_KEY);
    noteMeta.textContent = "Note cleared.";
  });
}

const runCalculation = () => {
  if (!calcA || !calcB || !calcOp || !calcOut) return;
  const a = Number(calcA.value);
  const b = Number(calcB.value);
  const op = calcOp.value;

  if (Number.isNaN(a) || Number.isNaN(b)) {
    calcOut.textContent = "Result: enter valid numbers";
    return;
  }

  let result = 0;
  if (op === "+") result = a + b;
  if (op === "-") result = a - b;
  if (op === "*") result = a * b;
  if (op === "/") result = b === 0 ? NaN : a / b;
  calcOut.textContent = Number.isNaN(result) ? "Result: invalid operation" : `Result: ${result}`;
};

if (calcRun) {
  calcRun.addEventListener("click", runCalculation);
}

[calcA, calcB].forEach((field) => {
  if (!field) return;
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runCalculation();
    }
  });
});

const getTasks = () => readJson(TASKS_KEY, []);
const saveTasks = (tasks) => saveJson(TASKS_KEY, tasks);

const renderTasks = () => {
  if (!taskList || !taskSummary) return;
  const tasks = getTasks();
  taskList.innerHTML = "";
  tasks
    .sort((a, b) => Number(a.done) - Number(b.done))
    .forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item ${task.done ? "done" : ""}`;

      const title = document.createElement("label");
      title.className = "task-title";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = Boolean(task.done);
      check.addEventListener("change", () => {
        const next = getTasks().map((entry) => (entry.id === task.id ? { ...entry, done: check.checked } : entry));
        saveTasks(next);
        renderTasks();
      });

      const text = document.createElement("span");
      text.textContent = `${task.title} (${task.priority})`;
      title.appendChild(check);
      title.appendChild(text);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        saveTasks(getTasks().filter((entry) => entry.id !== task.id));
        renderTasks();
      });

      item.appendChild(title);
      item.appendChild(remove);
      taskList.appendChild(item);
    });

  const doneCount = tasks.filter((task) => task.done).length;
  taskSummary.textContent = `${tasks.length} tasks, ${doneCount} completed`;
};

if (taskForm && taskInput && taskPriority) {
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = String(taskInput.value || "").trim();
    if (!title) return;
    const tasks = getTasks();
    tasks.push({
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      priority: taskPriority.value,
      done: false
    });
    saveTasks(tasks);
    taskInput.value = "";
    renderTasks();
  });
  renderTasks();
}

const renderToolFinder = () => {
  if (!toolResults || !toolCount || !toolSearch || !toolCategory) return;
  const query = String(toolSearch.value || "").trim().toLowerCase();
  const category = toolCategory.value || "All";
  const matches = TOOL_CATALOG.filter((tool) => {
    const categoryMatch = category === "All" || tool.category === category;
    if (!categoryMatch) return false;
    if (!query) return true;
    const haystack = `${tool.name} ${tool.summary} ${tool.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query);
  });

  toolResults.innerHTML = "";
  matches.forEach((tool) => {
    const card = document.createElement("article");
    card.className = "tool-card";
    card.innerHTML = `
      <h4>${tool.name}</h4>
      <p class="mini-note">${tool.summary}</p>
      <p class="mini-note">Category: ${tool.category} | Pricing: ${tool.pricing}</p>
      <div class="chips">${tool.tags.map((tag) => `<span class="chip">${tag}</span>`).join("")}</div>
      <a class="btn-link" href="${tool.url}" target="_blank" rel="noreferrer">Open Tool</a>
    `;
    toolResults.appendChild(card);
  });
  toolCount.textContent = `${matches.length} tools matched`;
};

if (toolCategory) {
  const categories = ["All", ...Array.from(new Set(TOOL_CATALOG.map((tool) => tool.category))).sort()];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    toolCategory.appendChild(option);
  });
}

if (toolSearch && toolCategory) {
  toolSearch.addEventListener("input", renderToolFinder);
  toolCategory.addEventListener("change", renderToolFinder);
  renderToolFinder();
}
