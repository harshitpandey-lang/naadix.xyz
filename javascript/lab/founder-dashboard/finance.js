const financePanel = document.querySelector(".card-grid .span-12");
const financeKey = "naadixLab:financeEntries";

if (financePanel) {
  const entryForm = document.createElement("div");
  entryForm.className = "form-grid";
  entryForm.innerHTML = `
    <select id="finType">
      <option value="Income">Income</option>
      <option value="Expense">Expense</option>
      <option value="Investment">Investment</option>
    </select>
    <input id="finAmount" type="number" placeholder="Amount">
    <input id="finNote" placeholder="Note">
    <button id="finAdd">Add Entry</button>
  `;
  const list = document.createElement("div");
  list.className = "stack";
  financePanel.appendChild(entryForm);
  financePanel.appendChild(list);

  const render = () => {
    const entries = JSON.parse(localStorage.getItem(financeKey) || "[]");
    list.innerHTML = "";
    entries.slice(-6).reverse().forEach((item) => {
      const line = document.createElement("p");
      line.className = "mini-note";
      line.textContent = `${item.type}: Rs ${item.amount} - ${item.note}`;
      list.appendChild(line);
    });
  };

  entryForm.querySelector("#finAdd").addEventListener("click", () => {
    const type = entryForm.querySelector("#finType").value;
    const amount = Number(entryForm.querySelector("#finAmount").value);
    const note = entryForm.querySelector("#finNote").value.trim();
    if (!amount || !note) return;
    const entries = JSON.parse(localStorage.getItem(financeKey) || "[]");
    entries.push({ type, amount, note });
    localStorage.setItem(financeKey, JSON.stringify(entries));
    entryForm.querySelector("#finAmount").value = "";
    entryForm.querySelector("#finNote").value = "";
    render();
  });

  render();
}
