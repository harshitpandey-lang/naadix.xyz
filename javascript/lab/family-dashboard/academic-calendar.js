const acadTable = document.querySelector(".table tbody");
const acadPanel = document.querySelector(".panel");
const acadKey = "naadixLab:familyAcademic";

if (acadPanel && acadTable) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="acadDate" placeholder="Date">
    <input id="acadEvent" placeholder="Event">
    <select id="acadType">
      <option value="Exam">Exam</option>
      <option value="Meeting">Meeting</option>
      <option value="Holiday">Holiday</option>
    </select>
    <button id="acadAdd">Add Date</button>
  `;
  acadPanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    acadTable.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.date}</td><td>${row.event}</td><td>${row.type}</td>`;
      acadTable.appendChild(tr);
    });
  };

  render(JSON.parse(localStorage.getItem(acadKey) || "[]"));

  form.querySelector("#acadAdd").addEventListener("click", () => {
    const row = {
      date: form.querySelector("#acadDate").value.trim(),
      event: form.querySelector("#acadEvent").value.trim(),
      type: form.querySelector("#acadType").value
    };
    if (!row.date || !row.event) return;
    const rows = JSON.parse(localStorage.getItem(acadKey) || "[]");
    rows.push(row);
    localStorage.setItem(acadKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
