import { dateKey, esc, formatDate } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { month: new Date(), transactions: [], projects: [], type: "ALL", currency: "INR" };
const incomeCategories = ["Revenue", "Consulting", "Investment", "Refund", "Other income"];
const expenseCategories = ["Software", "Infrastructure", "Contractors", "Marketing", "Operations", "Travel", "Education", "Taxes", "Other expense"];

export async function mount() {
  state.month.setDate(1);
  state.month.setHours(0, 0, 0, 0);
  shell = await mountShell({ active: "finances", title: "Finances", description: "A clean operating view of cash movement and business spending." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-transaction>${icon("plus")}New transaction</button>`;
  shell.actions.querySelector("[data-new-transaction]").addEventListener("click", () => openTransactionForm());
  await load();
  if (new URLSearchParams(location.search).get("new") === "1") {
    history.replaceState(null, "", "/hq/finances/");
    openTransactionForm();
  }
}

function monthWindow() {
  const start = new Date(state.month.getFullYear(), state.month.getMonth(), 1);
  const end = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
  return { start: dateKey(start), end: dateKey(end) };
}

async function load() {
  shell.content.innerHTML = skeleton(7);
  const { start, end } = monthWindow();
  try {
    const [transactions, projects] = await Promise.all([
      supabase.query("finance_transactions", { select: "id,transaction_type,amount,currency,category,description,occurred_on,project_id,status,recurring,notes,created_at,updated_at", filters: { occurred_on: [`gte.${start}`, `lt.${end}`] }, order: "occurred_on.desc", limit: 500 }),
      state.projects.length ? Promise.resolve(state.projects) : supabase.query("projects", { select: "id,name", order: "name.asc", limit: 250 }),
    ]);
    state.transactions = transactions;
    state.projects = projects;
    const currencies = [...new Set(transactions.map((item) => item.currency))];
    if (currencies.length && !currencies.includes(state.currency)) state.currency = currencies[0];
    render();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function money(value, currency = state.currency) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `${currency} ${Number(value || 0).toFixed(2)}`; }
}

function render() {
  const currencies = [...new Set([state.currency, ...state.transactions.map((item) => item.currency)])];
  const selected = state.transactions.filter((item) => item.currency === state.currency);
  const cleared = selected.filter((item) => item.status === "CLEARED");
  const income = cleared.filter((item) => item.transaction_type === "INCOME").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = cleared.filter((item) => item.transaction_type === "EXPENSE").reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = selected.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + (item.transaction_type === "INCOME" ? Number(item.amount) : -Number(item.amount)), 0);
  const visible = selected.filter((item) => state.type === "ALL" || item.transaction_type === state.type);
  shell.content.innerHTML = `<div class="finance-controls"><div class="month-switcher"><button class="icon-button" type="button" data-month="-1" aria-label="Previous month">${icon("chevron")}</button><strong>${formatDate(state.month, { month: "long", year: "numeric" })}</strong><button class="icon-button next" type="button" data-month="1" aria-label="Next month">${icon("chevron")}</button></div><label class="compact-select"><span class="sr-only">Currency</span><select data-currency>${currencies.map((currency) => `<option value="${currency}" ${currency === state.currency ? "selected" : ""}>${currency}</option>`).join("")}</select></label></div>
    <section class="summary-grid" aria-label="Finance summary">
      <article><span>Net cash flow</span><strong class="${income - expenses < 0 ? "negative" : "positive"}">${money(income - expenses)}</strong><small>Cleared this month</small></article>
      <article><span>Income</span><strong>${money(income)}</strong><small>Cleared inflows</small></article>
      <article><span>Expenses</span><strong>${money(expenses)}</strong><small>Cleared outflows</small></article>
      <article><span>Pending net</span><strong>${money(pending)}</strong><small>Not included in cash flow</small></article>
    </section>
    <div class="finance-grid"><section class="workspace-panel finance-ledger"><header class="workspace-panel-head"><div><p class="eyebrow">Ledger</p><h2>Transactions</h2></div><div class="segmented-control" data-type-filter><button type="button" data-type="ALL" class="${state.type === "ALL" ? "active" : ""}">All</button><button type="button" data-type="INCOME" class="${state.type === "INCOME" ? "active" : ""}">Income</button><button type="button" data-type="EXPENSE" class="${state.type === "EXPENSE" ? "active" : ""}">Expenses</button></div></header>${visible.length ? `<div class="transaction-list">${visible.map(transactionRow).join("")}</div>` : emptyState("No transactions", "There are no matching transactions in this month.", "Add transaction")}</section>
      <section class="workspace-panel category-panel"><header class="workspace-panel-head"><div><p class="eyebrow">Expense mix</p><h2>By category</h2></div></header>${categoryBreakdown(selected.filter((item) => item.transaction_type === "EXPENSE" && item.status === "CLEARED"))}</section></div>`;
  shell.content.querySelectorAll("[data-month]").forEach((button) => button.addEventListener("click", async () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(button.dataset.month), 1); await load(); }));
  shell.content.querySelector("[data-currency]").addEventListener("change", (event) => { state.currency = event.target.value; render(); });
  shell.content.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => { state.type = button.dataset.type; render(); }));
  shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openTransactionForm());
  shell.content.querySelectorAll("[data-edit-transaction]").forEach((button) => button.addEventListener("click", () => openTransactionForm(state.transactions.find((item) => item.id === button.dataset.editTransaction))));
  shell.content.querySelectorAll("[data-delete-transaction]").forEach((button) => button.addEventListener("click", async () => {
    if (await confirmAction({ title: "Delete transaction?", message: "This financial record will be permanently removed." })) {
      await supabase.remove("finance_transactions", button.dataset.deleteTransaction);
      toast("Transaction deleted.");
      await load();
    }
  }));
}

function transactionRow(item) {
  const project = state.projects.find((candidate) => candidate.id === item.project_id);
  const signed = item.transaction_type === "INCOME" ? Number(item.amount) : -Number(item.amount);
  return `<article class="transaction-row"><span class="transaction-direction" data-type="${item.transaction_type}">${item.transaction_type === "INCOME" ? "+" : "−"}</span><div><strong>${esc(item.description)}</strong><p>${esc(item.category)} · ${formatDate(item.occurred_on)}${project ? ` · ${esc(project.name)}` : ""}${item.recurring ? " · Recurring" : ""}</p></div><span class="transaction-status" data-status="${item.status}">${item.status === "CLEARED" ? "Cleared" : "Pending"}</span><strong class="transaction-amount ${signed < 0 ? "negative" : "positive"}">${money(signed, item.currency)}</strong><div class="item-actions"><button class="quiet-button compact" type="button" data-edit-transaction="${item.id}">Edit</button><button class="icon-button danger-icon" type="button" data-delete-transaction="${item.id}" aria-label="Delete ${esc(item.description)}">${icon("close")}</button></div></article>`;
}

function categoryBreakdown(expenses) {
  const totals = new Map();
  for (const item of expenses) totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount));
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);
  if (!rows.length) return '<p class="subtle panel-empty">No cleared expenses for this month.</p>';
  return `<div class="category-breakdown">${rows.map(([category, amount]) => `<div><p><span>${esc(category)}</span><strong>${money(amount)}</strong></p><span class="category-track"><i style="width:${Math.max(2, Math.round((amount / total) * 100))}%"></i></span><small>${Math.round((amount / total) * 100)}% of expenses</small></div>`).join("")}</div>`;
}

function projectOptions(selected) {
  return `<option value="">No related project</option>${state.projects.map((project) => `<option value="${project.id}" ${project.id === selected ? "selected" : ""}>${esc(project.name)}</option>`).join("")}`;
}

function categoryOptions(selected) {
  const values = [...new Set([...incomeCategories, ...expenseCategories, selected].filter(Boolean))];
  return values.map((category) => `<option value="${esc(category)}" ${category === selected ? "selected" : ""}>${esc(category)}</option>`).join("");
}

function openTransactionForm(item = null) {
  const dialog = openDialog({
    title: item ? "Edit transaction" : "New transaction",
    description: "Record an actual or pending movement of money.",
    className: "form-dialog",
    content: `<form class="entity-form" data-transaction-form><div class="form-grid">
      <label>Type<select name="transaction_type"><option value="EXPENSE" ${item?.transaction_type !== "INCOME" ? "selected" : ""}>Expense</option><option value="INCOME" ${item?.transaction_type === "INCOME" ? "selected" : ""}>Income</option></select></label>
      <label>Amount<input name="amount" type="number" min="0.01" step="0.01" required value="${item?.amount ?? ""}"></label>
      <label>Currency<select name="currency">${["INR", "USD", "EUR", "GBP"].map((currency) => `<option value="${currency}" ${currency === (item?.currency || state.currency) ? "selected" : ""}>${currency}</option>`).join("")}</select></label>
      <label>Date<input name="occurred_on" type="date" required value="${item?.occurred_on || dateKey(new Date())}"></label>
      <label class="span-2">Description<input name="description" maxlength="220" required value="${esc(item?.description)}" placeholder="What was this for?"></label>
      <label>Category<select name="category">${categoryOptions(item?.category || "Software")}</select></label>
      <label>Status<select name="status"><option value="CLEARED" ${item?.status !== "PENDING" ? "selected" : ""}>Cleared</option><option value="PENDING" ${item?.status === "PENDING" ? "selected" : ""}>Pending</option></select></label>
      <label class="span-2">Related project<select name="project_id">${projectOptions(item?.project_id)}</select></label>
      <label class="checkbox-field"><input name="recurring" type="checkbox" ${item?.recurring ? "checked" : ""}>Recurring transaction</label>
      <label class="span-2">Notes<textarea name="notes" rows="3">${esc(item?.notes)}</textarea></label>
    </div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-cancel>Cancel</button><button class="hq-action" type="submit">${item ? "Save changes" : "Add transaction"}</button></div></form>`,
  });
  dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-transaction-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    const amount = Number(values.amount);
    if (!values.description || !values.category || !values.occurred_on || !Number.isFinite(amount) || amount <= 0) return showFormErrors(error, ["Description, category, date, and a positive amount are required."]);
    const payload = { transaction_type: values.transaction_type, amount, currency: values.currency, category: values.category, description: values.description, occurred_on: values.occurred_on, project_id: values.project_id || null, status: values.status, recurring: Boolean(values.recurring), notes: values.notes || null };
    const button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, "Saving...");
    try {
      if (item) await supabase.update("finance_transactions", item.id, payload);
      else await supabase.insert("finance_transactions", { ...payload, user_id: shell.session.user.id });
      dialog.close();
      toast(item ? "Transaction updated." : "Transaction added.");
      state.currency = values.currency;
      state.month = new Date(`${values.occurred_on}T00:00:00`);
      state.month.setDate(1);
      await load();
    } catch (requestError) {
      showFormErrors(error, [humanError(requestError)]);
      setButtonBusy(button, false);
    }
  });
}
