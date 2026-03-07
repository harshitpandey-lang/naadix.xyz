const visionQuotePanel = document.querySelector(".card-grid .span-12");
const visionKey = "naadixLab:visionQuote";

if (visionQuotePanel) {
  const wrap = document.createElement("div");
  wrap.className = "stack";
  wrap.innerHTML = `
    <input id="visionQuoteInput" placeholder="Set your focus quote or mission sentence">
    <p class="mini-note">Saved mission statement appears on this vision board.</p>
  `;
  visionQuotePanel.appendChild(wrap);
  const input = wrap.querySelector("#visionQuoteInput");
  const saved = localStorage.getItem(visionKey);
  if (saved) {
    const quote = visionQuotePanel.querySelector(".muted");
    if (quote) quote.textContent = saved;
    input.value = saved;
  }
  input.addEventListener("change", () => {
    const value = input.value.trim();
    if (!value) return;
    localStorage.setItem(visionKey, value);
    const quote = visionQuotePanel.querySelector(".muted");
    if (quote) quote.textContent = value;
  });
}
