const educationPanel = document.querySelector(".card-grid .span-12");
const educationKey = "naadixLab:educationNotes";

if (educationPanel) {
  const block = document.createElement("div");
  block.className = "stack";
  block.innerHTML = `
    <h3>Study Notes</h3>
    <textarea id="educationNotes" rows="6" placeholder="Add learning notes, resources, and revision tasks..."></textarea>
    <p class="mini-note">Notes are auto-saved in your browser.</p>
  `;
  educationPanel.appendChild(block);
  const area = block.querySelector("#educationNotes");
  area.value = localStorage.getItem(educationKey) || "";
  area.addEventListener("input", () => {
    localStorage.setItem(educationKey, area.value);
  });
}
