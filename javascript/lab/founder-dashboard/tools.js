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
