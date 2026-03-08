const STORAGE_KEY = "naadixLab:founderCalendarEvents";
const eventForm = document.getElementById("eventForm");
const eventIdInput = document.getElementById("eventId");
const titleInput = document.getElementById("eventTitle");
const dateInput = document.getElementById("eventDate");
const timeInput = document.getElementById("eventTime");
const categoryInput = document.getElementById("eventCategory");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const toggleViewBtn = document.getElementById("toggleView");
const calendarView = document.getElementById("calendarView");
const tableView = document.getElementById("tableView");
const calendarGrid = document.getElementById("calendarGrid");
const eventTableBody = document.getElementById("eventTableBody");

const categoryClass = {
  Exam: "cat-exam",
  Meeting: "cat-meeting",
  Project: "cat-project",
  Study: "cat-study",
  Vacation: "cat-vacation"
};

const today = new Date();
let activeMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let showTable = false;

const readEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeEvents = (events) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

const sortByDate = (a, b) => {
  const ad = `${a.date} ${a.time || "23:59"}`;
  const bd = `${b.date} ${b.time || "23:59"}`;
  return ad.localeCompare(bd);
};

const clearForm = () => {
  eventIdInput.value = "";
  titleInput.value = "";
  dateInput.value = "";
  timeInput.value = "";
  categoryInput.value = "Exam";
};

const fillForm = (event) => {
  eventIdInput.value = event.id;
  titleInput.value = event.title;
  dateInput.value = event.date;
  timeInput.value = event.time || "";
  categoryInput.value = event.category;
};

const renderTable = () => {
  const events = readEvents().sort(sortByDate);
  eventTableBody.innerHTML = "";

  events.forEach((item) => {
    const tr = document.createElement("tr");
    const time = item.time || "---";
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${time}</td>
      <td>${item.title}</td>
      <td>${item.category}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="secondary" data-edit="${item.id}">Edit</button>
          <button type="button" data-delete="${item.id}">Delete</button>
        </div>
      </td>
    `;
    eventTableBody.appendChild(tr);
  });
};

const renderMonth = () => {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  monthLabel.textContent = activeMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const events = readEvents();

  calendarGrid.innerHTML = "";
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    const head = document.createElement("div");
    head.className = "calendar-cell";
    head.innerHTML = `<strong>${day}</strong>`;
    calendarGrid.appendChild(head);
  });

  for (let i = 0; i < firstDay; i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell";
    calendarGrid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d);
    const dateKey = date.toISOString().slice(0, 10);
    const items = events.filter((event) => event.date === dateKey);

    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    const rows = items
      .slice(0, 3)
      .map((event) => `<span class="event-pill ${categoryClass[event.category] || ""}">${event.time || "--:--"} ${event.title}</span>`)
      .join("");
    const more = items.length > 3 ? `<span class="mini-note">+${items.length - 3} more</span>` : "";
    cell.innerHTML = `<strong>${d}</strong>${rows}${more}`;
    calendarGrid.appendChild(cell);
  }
};

const renderViews = () => {
  calendarView.hidden = showTable;
  tableView.hidden = !showTable;
  toggleViewBtn.textContent = showTable ? "Switch to Calendar View" : "Switch to Table View";
  renderMonth();
  renderTable();
};

if (eventForm) {
  const seedEvents = [
    { id: "seed-1", title: "Physics Exam", date: "2026-07-12", time: "10:00", category: "Exam" },
    { id: "seed-2", title: "Summer Vacation Start", date: "2026-07-20", time: "", category: "Vacation" }
  ];
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeEvents(seedEvents);
  }

  eventForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const category = categoryInput.value;
    if (!title || !date || !category) return;

    const events = readEvents();
    const eventId = eventIdInput.value;
    const payload = {
      id: eventId || `evt-${Date.now()}`,
      title,
      date,
      time,
      category
    };

    const index = events.findIndex((item) => item.id === eventId);
    if (index >= 0) {
      events[index] = payload;
    } else {
      events.push(payload);
    }

    writeEvents(events);
    clearForm();
    renderViews();
  });

  eventTableBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const editId = target.getAttribute("data-edit");
    const deleteId = target.getAttribute("data-delete");
    const events = readEvents();

    if (editId) {
      const item = events.find((entry) => entry.id === editId);
      if (item) {
        fillForm(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (deleteId) {
      const next = events.filter((entry) => entry.id !== deleteId);
      writeEvents(next);
      renderViews();
    }
  });

  prevMonthBtn.addEventListener("click", () => {
    activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
    renderMonth();
  });

  nextMonthBtn.addEventListener("click", () => {
    activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1);
    renderMonth();
  });

  toggleViewBtn.addEventListener("click", () => {
    showTable = !showTable;
    renderViews();
  });

  renderViews();
}