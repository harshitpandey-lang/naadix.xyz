const spiritualPanel = document.querySelector(".card-grid .span-12");
const spiritualKey = "naadixLab:spiritualJournal";

if (spiritualPanel) {
  const journal = document.createElement("div");
  journal.className = "stack";
  journal.innerHTML = `
    <h3>Reflection Journal</h3>
    <textarea id="spiritualJournal" rows="6" placeholder="Write reflection, gratitude, and intention..."></textarea>
    <p class="mini-note">Private local note. Saved in your browser.</p>
  `;
  spiritualPanel.appendChild(journal);
  const area = journal.querySelector("#spiritualJournal");
  area.value = localStorage.getItem(spiritualKey) || "";
  area.addEventListener("input", () => {
    localStorage.setItem(spiritualKey, area.value);
  });
}
