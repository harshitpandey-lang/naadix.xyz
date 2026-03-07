const collegePanel = document.querySelector(".panel");
const collegeRows = document.querySelector(".table tbody");
const collegeKey = "naadixLab:collegeData";

if (collegePanel && collegeRows) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="fieldName" placeholder="Field name">
    <input id="fieldValue" placeholder="Field value">
    <button id="fieldAdd">Add Field</button>
  `;
  collegePanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    collegeRows.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.field}</td><td>${row.value}</td>`;
      collegeRows.appendChild(tr);
    });
  };

  render(JSON.parse(localStorage.getItem(collegeKey) || "[]"));

  form.querySelector("#fieldAdd").addEventListener("click", () => {
    const row = {
      field: form.querySelector("#fieldName").value.trim(),
      value: form.querySelector("#fieldValue").value.trim()
    };
    if (!row.field || !row.value) return;
    const rows = JSON.parse(localStorage.getItem(collegeKey) || "[]");
    rows.push(row);
    localStorage.setItem(collegeKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
