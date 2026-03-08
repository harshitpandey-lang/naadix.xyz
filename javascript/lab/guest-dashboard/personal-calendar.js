const CAL_KEY = "naadixLab:founderCalendarEvents";
const body = document.getElementById("guestCalendarBody");

const readRows = () => {
  try {
    return JSON.parse(localStorage.getItem(CAL_KEY) || "[]");
  } catch {
    return [];
  }
};

const rows = readRows().sort((a, b) => `${a.date} ${a.time || "23:59"}`.localeCompare(`${b.date} ${b.time || "23:59"}`));
body.innerHTML = "";

if (!rows.length) {
  body.innerHTML = '<tr><td colspan="4">No shared events available.</td></tr>';
}

rows.forEach((row) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${row.date}</td><td>${row.time || "---"}</td><td>${row.title}</td><td>${row.category}</td>`;
  body.appendChild(tr);
});