const goalRows = document.querySelectorAll(".progress-row");
const goalsKey = "naadixLab:goals";

if (goalRows.length) {
  const defaults = Array.from(goalRows).map((row) => {
    const text = row.querySelector("p").textContent;
    return Number((text.match(/(\\d+)%/) || [0, 0])[1]);
  });

  const saved = JSON.parse(localStorage.getItem(goalsKey) || "null");
  const values = Array.isArray(saved) && saved.length === goalRows.length ? saved : defaults;

  goalRows.forEach((row, index) => {
    const label = row.querySelector("p");
    const bar = row.querySelector("span");
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.value = String(values[index]);
    bar.style.width = `${values[index]}%`;
    label.textContent = label.textContent.replace(/\\d+%/, `${values[index]}%`);
    input.addEventListener("input", () => {
      const val = Number(input.value);
      bar.style.width = `${val}%`;
      label.textContent = label.textContent.replace(/\\d+%/, `${val}%`);
      values[index] = val;
      localStorage.setItem(goalsKey, JSON.stringify(values));
    });
    row.appendChild(input);
  });
}
