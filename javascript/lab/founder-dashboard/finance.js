const FINANCE_KEY = "naadixLab:financeEntriesV2";
const financeForm = document.getElementById("financeForm");
const financeList = document.getElementById("financeList");
const financeChart = document.getElementById("financeChart");

const incomeValue = document.getElementById("incomeValue");
const expenseValue = document.getElementById("expenseValue");
const savingsValue = document.getElementById("savingsValue");
const investmentValue = document.getElementById("investmentValue");

const readEntries = () => {
  try {
    return JSON.parse(localStorage.getItem(FINANCE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveEntries = (entries) => localStorage.setItem(FINANCE_KEY, JSON.stringify(entries));

const totalByType = (entries, type) => entries
  .filter((entry) => entry.type === type)
  .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

const render = () => {
  const entries = readEntries();
  const income = totalByType(entries, "income");
  const expense = totalByType(entries, "expense");
  const savings = totalByType(entries, "savings");
  const investment = totalByType(entries, "investment");

  incomeValue.textContent = `Rs ${income}`;
  expenseValue.textContent = `Rs ${expense}`;
  savingsValue.textContent = `Rs ${savings}`;
  investmentValue.textContent = `Rs ${investment}`;

  const stats = [
    { label: "Income", value: income },
    { label: "Expense", value: expense },
    { label: "Savings", value: savings },
    { label: "Investment", value: investment }
  ];
  const max = Math.max(1, ...stats.map((item) => item.value));

  financeChart.innerHTML = "";
  stats.forEach((item) => {
    const width = Math.round((item.value / max) * 100);
    const row = document.createElement("div");
    row.className = "chart-bar";
    row.innerHTML = `
      <span>${item.label}</span>
      <div class="chart-bar-track"><span style="width:${width}%"></span></div>
      <strong>Rs ${item.value}</strong>
    `;
    financeChart.appendChild(row);
  });

  financeList.innerHTML = "";
  entries.slice().reverse().slice(0, 20).forEach((entry) => {
    const line = document.createElement("div");
    line.className = "inline";
    line.innerHTML = `
      <span class="chip">${entry.type}</span>
      <span>Rs ${entry.amount}</span>
      <span class="mini-note">${entry.note}</span>
    `;
    financeList.appendChild(line);
  });
};

if (financeForm) {
  financeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const type = document.getElementById("financeType").value;
    const amount = Number(document.getElementById("financeAmount").value);
    const note = document.getElementById("financeNote").value.trim();

    if (Number.isNaN(amount) || amount <= 0 || !note) return;

    const entries = readEntries();
    entries.push({
      id: `fin-${Date.now()}`,
      type,
      amount,
      note,
      createdAt: new Date().toISOString()
    });
    saveEntries(entries);
    financeForm.reset();
    render();
  });

  render();
}