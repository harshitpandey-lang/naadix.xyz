let timerSeconds = 25 * 60;
let timerId = null;
const timerLabel = document.getElementById("timerLabel");
const startButton = document.getElementById("startTimer");

const drawTimer = () => {
  const min = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const sec = String(timerSeconds % 60).padStart(2, "0");
  timerLabel.textContent = `${min}:${sec}`;
};

if (startButton && timerLabel) {
  startButton.addEventListener("click", () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      startButton.textContent = "Start";
      return;
    }
    startButton.textContent = "Pause";
    timerId = setInterval(() => {
      timerSeconds -= 1;
      drawTimer();
      if (timerSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerSeconds = 25 * 60;
        startButton.textContent = "Start";
        drawTimer();
      }
    }, 1000);
  });
  drawTimer();
}

const noteArea = document.getElementById("quickNote");
if (noteArea) {
  noteArea.value = localStorage.getItem("naadixLab:quickNote") || "";
  noteArea.addEventListener("input", () => {
    localStorage.setItem("naadixLab:quickNote", noteArea.value);
  });
}

const calculatorPanel = Array.from(document.querySelectorAll(".panel")).find((panel) => {
  const h3 = panel.querySelector("h3");
  return h3 && h3.textContent.trim() === "Calculator";
});

if (calculatorPanel) {
  const block = document.createElement("div");
  block.className = "form-grid";
  block.innerHTML = `
    <input id="calcA" type="number" placeholder="Value A">
    <select id="calcOp">
      <option value="+">+</option>
      <option value="-">-</option>
      <option value="*">*</option>
      <option value="/">/</option>
    </select>
    <input id="calcB" type="number" placeholder="Value B">
    <button id="calcRun">Calculate</button>
  `;
  const out = document.createElement("p");
  out.className = "mini-note";
  out.id = "calcOut";
  calculatorPanel.appendChild(block);
  calculatorPanel.appendChild(out);

  block.querySelector("#calcRun").addEventListener("click", () => {
    const a = Number(block.querySelector("#calcA").value);
    const b = Number(block.querySelector("#calcB").value);
    const op = block.querySelector("#calcOp").value;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    let result = 0;
    if (op === "+") result = a + b;
    if (op === "-") result = a - b;
    if (op === "*") result = a * b;
    if (op === "/") result = b === 0 ? NaN : a / b;
    out.textContent = Number.isNaN(result) ? "Result: invalid operation" : `Result: ${result}`;
  });
}
