const guestCalPanel = document.querySelector(".panel");
const guestCalBody = document.querySelector(".table tbody");
const guestCalKey = "naadixLab:guestCalendar";

if (guestCalPanel && guestCalBody) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="guestDate" placeholder="Date">
    <input id="guestTask" placeholder="Task">
    <select id="guestPriority">
      <option value="High">High</option>
      <option value="Medium">Medium</option>
      <option value="Low">Low</option>
    </select>
    <button id="guestTaskAdd">Add Task</button>
  `;
  guestCalPanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    guestCalBody.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.date}</td><td>${row.task}</td><td>${row.priority}</td>`;
      guestCalBody.appendChild(tr);
    });
  };

  render(JSON.parse(localStorage.getItem(guestCalKey) || "[]"));

  form.querySelector("#guestTaskAdd").addEventListener("click", () => {
    const row = {
      date: form.querySelector("#guestDate").value.trim(),
      task: form.querySelector("#guestTask").value.trim(),
      priority: form.querySelector("#guestPriority").value
    };
    if (!row.date || !row.task) return;
    const rows = JSON.parse(localStorage.getItem(guestCalKey) || "[]");
    rows.push(row);
    localStorage.setItem(guestCalKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
