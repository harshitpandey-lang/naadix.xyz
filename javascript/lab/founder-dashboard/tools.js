let timerSeconds = 25 * 60;
let timerId = null;

const timerLabel = document.getElementById("timerLabel");
const startTimer = document.getElementById("startTimer");
const resetTimer = document.getElementById("resetTimer");
const quickNote = document.getElementById("quickNote");
const calcA = document.getElementById("calcA");
const calcB = document.getElementById("calcB");
const calcOp = document.getElementById("calcOp");
const calcRun = document.getElementById("calcRun");
const calcOut = document.getElementById("calcOut");

const NOTE_KEY = "naadixLab:quickNoteV2";

const drawTimer = () => {
  const min = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const sec = String(timerSeconds % 60).padStart(2, "0");
  timerLabel.textContent = `${min}:${sec}`;
};

if (startTimer && resetTimer) {
  startTimer.addEventListener("click", () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      startTimer.textContent = "Start";
      return;
    }

    startTimer.textContent = "Pause";
    timerId = setInterval(() => {
      timerSeconds -= 1;
      drawTimer();
      if (timerSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerSeconds = 25 * 60;
        startTimer.textContent = "Start";
        drawTimer();
      }
    }, 1000);
  });

  resetTimer.addEventListener("click", () => {
    clearInterval(timerId);
    timerId = null;
    timerSeconds = 25 * 60;
    startTimer.textContent = "Start";
    drawTimer();
  });

  drawTimer();
}

if (quickNote) {
  quickNote.value = localStorage.getItem(NOTE_KEY) || "";
  quickNote.addEventListener("input", () => {
    localStorage.setItem(NOTE_KEY, quickNote.value);
  });
}

if (calcRun) {
  calcRun.addEventListener("click", () => {
    const a = Number(calcA.value);
    const b = Number(calcB.value);
    const op = calcOp.value;

    if (Number.isNaN(a) || Number.isNaN(b)) {
      calcOut.textContent = "Result: enter valid numbers";
      return;
    }

    let result = 0;
    if (op === "+") result = a + b;
    if (op === "-") result = a - b;
    if (op === "*") result = a * b;
    if (op === "/") result = b === 0 ? NaN : a / b;

    calcOut.textContent = Number.isNaN(result) ? "Result: invalid operation" : `Result: ${result}`;
  });
}