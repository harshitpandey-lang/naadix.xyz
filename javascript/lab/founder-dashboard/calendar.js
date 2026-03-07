const calendarPanel = document.querySelector(".panel");
const calendarTableBody = document.querySelector(".table tbody");
const calendarStorageKey = "naadixLab:calendarRows";

if (calendarPanel && calendarTableBody) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="calDay" placeholder="Day (e.g., Sat)">
    <input id="calMorning" placeholder="Morning plan">
    <input id="calAfternoon" placeholder="Afternoon plan">
    <input id="calEvening" placeholder="Evening plan">
    <button id="calAdd">Add Event Row</button>
  `;
  calendarPanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    calendarTableBody.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.day}</td><td>${row.morning}</td><td>${row.afternoon}</td><td>${row.evening}</td>`;
      calendarTableBody.appendChild(tr);
    });
  };

  const saved = JSON.parse(localStorage.getItem(calendarStorageKey) || "[]");
  render(saved);

  form.querySelector("#calAdd").addEventListener("click", () => {
    const row = {
      day: form.querySelector("#calDay").value.trim(),
      morning: form.querySelector("#calMorning").value.trim(),
      afternoon: form.querySelector("#calAfternoon").value.trim(),
      evening: form.querySelector("#calEvening").value.trim()
    };
    if (!row.day || !row.morning || !row.afternoon || !row.evening) return;
    const rows = JSON.parse(localStorage.getItem(calendarStorageKey) || "[]");
    rows.push(row);
    localStorage.setItem(calendarStorageKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
