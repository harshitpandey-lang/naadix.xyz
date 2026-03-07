const familyHomePanel = document.querySelector(".card-grid .span-6");
const familyNoteKey = "naadixLab:familyAnnouncement";

if (familyHomePanel) {
  const block = document.createElement("div");
  block.className = "stack";
  block.innerHTML = `
    <input id="familyAnnouncement" placeholder="Add a new family announcement">
    <p class="mini-note">Announcement is saved and can be updated anytime.</p>
  `;
  familyHomePanel.appendChild(block);
  const input = block.querySelector("#familyAnnouncement");
  const existing = localStorage.getItem(familyNoteKey) || "";
  if (existing) {
    input.value = existing;
    const list = familyHomePanel.querySelector("ul");
    if (list) {
      const first = list.querySelector("li");
      if (first) first.textContent = existing;
    }
  }
  input.addEventListener("change", () => {
    const value = input.value.trim();
    if (!value) return;
    localStorage.setItem(familyNoteKey, value);
    const list = familyHomePanel.querySelector("ul");
    if (list) {
      const first = list.querySelector("li");
      if (first) first.textContent = value;
    }
  });
}
