const FAMILY_KEY = "naadixLab:familyImportantDates";
const FOUNDER_CAL_KEY = "naadixLab:founderCalendarEvents";

const form = document.getElementById("familyDateForm");
const body = document.getElementById("familyAcademicBody");

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const render = () => {
  const familyDates = read(FAMILY_KEY).map((item) => ({ ...item, source: "Family" }));
  const founderDates = read(FOUNDER_CAL_KEY)
    .filter((item) => ["Exam", "Vacation", "Meeting"].includes(item.category))
    .map((item) => ({
      id: item.id,
      date: item.date,
      event: item.title,
      type: item.category,
      source: "Founder Calendar",
      readonly: true
    }));

  const rows = [...familyDates, ...founderDates].sort((a, b) => a.date.localeCompare(b.date));
  body.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const action = row.readonly
      ? "<span class=\"mini-note\">Locked</span>"
      : `<button type=\"button\" class=\"secondary\" data-delete=\"${row.id}\">Delete</button>`;
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.event}</td>
      <td>${row.type}</td>
      <td>${row.source}</td>
      <td>${action}</td>
    `;
    body.appendChild(tr);
  });
};

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = document.getElementById("familyDate").value;
    const entry = document.getElementById("familyEvent").value.trim();
    const type = document.getElementById("familyType").value;
    if (!date || !entry) return;

    const rows = read(FAMILY_KEY);
    rows.push({ id: `fam-${Date.now()}`, date, event: entry, type });
    save(FAMILY_KEY, rows);
    form.reset();
    render();
  });

  body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const id = target.getAttribute("data-delete");
    if (!id) return;

    const rows = read(FAMILY_KEY).filter((row) => row.id !== id);
    save(FAMILY_KEY, rows);
    render();
  });

  render();
}