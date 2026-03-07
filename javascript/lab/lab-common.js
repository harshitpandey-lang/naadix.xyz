const nowLabel = document.getElementById("nowLabel");

if (nowLabel) {
  const renderNow = () => {
    const now = new Date();
    nowLabel.textContent = now.toLocaleString();
  };
  renderNow();
  setInterval(renderNow, 1000);
}
