const familyLocationTable = document.querySelector(".table tbody");
const familyLocationPanel = document.querySelector(".panel");
const familyLocationKey = "naadixLab:familyLocations";

if (familyLocationPanel && familyLocationTable) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="memberName" placeholder="Member name">
    <input id="memberArea" placeholder="Current area">
    <input id="memberTime" placeholder="Updated time">
    <button id="addMember">Add / Update</button>
  `;
  familyLocationPanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    familyLocationTable.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.member}</td><td>${row.area}</td><td>${row.time}</td>`;
      familyLocationTable.appendChild(tr);
    });
  };

  const saved = JSON.parse(localStorage.getItem(familyLocationKey) || "[]");
  render(saved);

  form.querySelector("#addMember").addEventListener("click", () => {
    const row = {
      member: form.querySelector("#memberName").value.trim(),
      area: form.querySelector("#memberArea").value.trim(),
      time: form.querySelector("#memberTime").value.trim()
    };
    if (!row.member || !row.area || !row.time) return;
    const rows = JSON.parse(localStorage.getItem(familyLocationKey) || "[]");
    rows.push(row);
    localStorage.setItem(familyLocationKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
