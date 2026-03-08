const SPIRITUAL_KEY = "naadixLab:spiritualStateV2";
const JOURNAL_KEY = "naadixLab:spiritualJournalV2";

const spiritualForm = document.getElementById("spiritualForm");
const progressLabel = document.getElementById("spiritualProgressLabel");
const journal = document.getElementById("spiritualJournal");

const readState = () => {
  try {
    return JSON.parse(localStorage.getItem(SPIRITUAL_KEY) || "{}");
  } catch {
    return {};
  }
};

const render = () => {
  const state = readState();
  const checks = Array.from(spiritualForm.querySelectorAll('input[type="checkbox"]'));
  checks.forEach((box) => {
    box.checked = Boolean(state[box.value]);
  });

  const done = checks.filter((box) => box.checked).length;
  const score = checks.length ? Math.round((done / checks.length) * 100) : 0;
  progressLabel.textContent = `Completion: ${score}%`;
};

if (spiritualForm) {
  spiritualForm.addEventListener("change", () => {
    const checks = Array.from(spiritualForm.querySelectorAll('input[type="checkbox"]'));
    const state = checks.reduce((acc, box) => ({ ...acc, [box.value]: box.checked }), {});
    localStorage.setItem(SPIRITUAL_KEY, JSON.stringify(state));
    render();
  });

  journal.value = localStorage.getItem(JOURNAL_KEY) || "";
  journal.addEventListener("input", () => {
    localStorage.setItem(JOURNAL_KEY, journal.value);
  });

  render();
}