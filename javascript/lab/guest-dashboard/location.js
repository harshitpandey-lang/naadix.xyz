const guestLocPanel = document.querySelector(".panel");
const guestLocBody = document.querySelector(".table tbody");
const guestLocKey = "naadixLab:guestLocations";

if (guestLocPanel && guestLocBody) {
  const form = document.createElement("div");
  form.className = "form-grid";
  form.innerHTML = `
    <input id="guestName" placeholder="Name">
    <input id="guestCity" placeholder="City">
    <select id="guestStatus">
      <option value="Available">Available</option>
      <option value="Traveling">Traveling</option>
      <option value="Busy">Busy</option>
    </select>
    <button id="guestAdd">Add Entry</button>
  `;
  guestLocPanel.appendChild(form);

  const render = (rows) => {
    if (!rows.length) return;
    guestLocBody.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.name}</td><td>${row.city}</td><td>${row.status}</td>`;
      guestLocBody.appendChild(tr);
    });
  };

  render(JSON.parse(localStorage.getItem(guestLocKey) || "[]"));

  form.querySelector("#guestAdd").addEventListener("click", () => {
    const row = {
      name: form.querySelector("#guestName").value.trim(),
      city: form.querySelector("#guestCity").value.trim(),
      status: form.querySelector("#guestStatus").value
    };
    if (!row.name || !row.city) return;
    const rows = JSON.parse(localStorage.getItem(guestLocKey) || "[]");
    rows.push(row);
    localStorage.setItem(guestLocKey, JSON.stringify(rows));
    render(rows);
    form.querySelectorAll("input").forEach((i) => (i.value = ""));
  });
}
