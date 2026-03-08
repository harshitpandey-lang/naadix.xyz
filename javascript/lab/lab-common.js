const nowLabel = document.getElementById("nowLabel");

if (nowLabel) {
  const renderNow = () => {
    const now = new Date();
    nowLabel.textContent = now.toLocaleString();
  };
  renderNow();
  setInterval(renderNow, 1000);
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const topbar = document.querySelector(".topbar");
  if (!topbar || document.getElementById("pwaInstallBtn")) return;

  const installBtn = document.createElement("button");
  installBtn.id = "pwaInstallBtn";
  installBtn.type = "button";
  installBtn.textContent = "Install App";
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  topbar.appendChild(installBtn);
});