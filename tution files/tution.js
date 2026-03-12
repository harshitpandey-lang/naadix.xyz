const sectionConfig = {
  topics: {
    fieldId: "topicText",
    storageKey: "naadix-tution-topics"
  },
  exams: {
    fieldId: "examText",
    storageKey: "naadix-tution-exams"
  },
  leaves: {
    fieldId: "leaveText",
    storageKey: "naadix-tution-leaves"
  },
  notes: {
    fieldId: "notesText",
    storageKey: "naadix-tution-notes"
  }
};

const statusTimers = new Map();

function showPage(id) {
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll("[data-page-target]");

  pages.forEach((page) => {
    page.classList.toggle("active", page.id === id);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.pageTarget === id);
  });
}

function setStatus(sectionName, message) {
  const status = document.querySelector(`[data-status-for="${sectionName}"]`);

  if (!status) {
    return;
  }

  status.textContent = message;

  if (statusTimers.has(sectionName)) {
    clearTimeout(statusTimers.get(sectionName));
  }

  const timeoutId = window.setTimeout(() => {
    status.textContent = "";
    statusTimers.delete(sectionName);
  }, 2200);

  statusTimers.set(sectionName, timeoutId);
}

function saveSection(sectionName) {
  const config = sectionConfig[sectionName];

  if (!config) {
    return;
  }

  const field = document.getElementById(config.fieldId);

  if (!field) {
    return;
  }

  localStorage.setItem(config.storageKey, field.value);
  setStatus(sectionName, "Saved locally");
}

function loadSavedSections() {
  Object.values(sectionConfig).forEach((config) => {
    const field = document.getElementById(config.fieldId);

    if (!field) {
      return;
    }

    field.value = localStorage.getItem(config.storageKey) || "";
  });
}

function generateCalendar() {
  const grid = document.getElementById("calendarGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = new Date(year, month, dayNumber);
    const dayCard = document.createElement("article");
    const label = document.createElement("span");
    const note = document.createElement("p");

    dayCard.className = "day";
    label.className = "day-label";
    note.className = "day-note";

    label.textContent = `Day ${dayNumber} - ${weekdayFormatter.format(date)}`;
    note.textContent = "Use this slot for class focus, homework, or revision targets.";

    dayCard.append(label, note);
    grid.appendChild(dayCard);
  }
}

function bindPageButtons() {
  const pageButtons = document.querySelectorAll("[data-page-target]");

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.pageTarget);
    });
  });
}

function bindSaveButtons() {
  const saveButtons = document.querySelectorAll("[data-save-target]");

  saveButtons.forEach((button) => {
    button.addEventListener("click", () => {
      saveSection(button.dataset.saveTarget);
    });
  });
}

function initPlanner() {
  loadSavedSections();
  generateCalendar();
  bindPageButtons();
  bindSaveButtons();
  showPage("calendar");
}

function saveTopics() {
  saveSection("topics");
}

function saveExams() {
  saveSection("exams");
}

function saveLeaves() {
  saveSection("leaves");
}

function saveNotes() {
  saveSection("notes");
}

window.addEventListener("DOMContentLoaded", initPlanner);
