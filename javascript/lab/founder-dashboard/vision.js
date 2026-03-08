const VISION_KEY = "naadixLab:visionItems";
const MISSION_KEY = "naadixLab:missionText";

const visionForm = document.getElementById("visionForm");
const visionTitle = document.getElementById("visionTitle");
const visionImage = document.getElementById("visionImage");
const visionNotes = document.getElementById("visionNotes");
const missionText = document.getElementById("missionText");
const visionList = document.getElementById("visionList");

const readItems = () => {
  try {
    return JSON.parse(localStorage.getItem(VISION_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveItems = (items) => localStorage.setItem(VISION_KEY, JSON.stringify(items));

const renderItems = () => {
  const items = readItems();
  visionList.innerHTML = "";

  if (!items.length) {
    visionList.innerHTML = '<p class="mini-note">No vision items yet.</p>';
    return;
  }

  items.forEach((item) => {
    const block = document.createElement("div");
    block.className = "panel";
    const image = item.image
      ? `<img src="${item.image}" alt="${item.title}">`
      : "";
    block.innerHTML = `
      ${image}
      <h4>${item.title}</h4>
      <p class="mini-note">${item.notes || "No notes"}</p>
      <button type="button" data-delete="${item.id}">Remove</button>
    `;
    visionList.appendChild(block);
  });
};

if (visionForm) {
  if (!localStorage.getItem(VISION_KEY)) {
    saveItems([
      { id: "v1", title: "Build Naadix AI platform", image: "", notes: "Product + education stack" },
      { id: "v2", title: "Create robotics lab", image: "", notes: "Student innovation center" },
      { id: "v3", title: "Launch education startup", image: "", notes: "Scale learning impact" }
    ]);
  }

  visionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = visionTitle.value.trim();
    if (!title) return;

    const items = readItems();
    items.push({
      id: `vision-${Date.now()}`,
      title,
      image: visionImage.value.trim(),
      notes: visionNotes.value.trim()
    });
    saveItems(items);
    visionForm.reset();
    renderItems();
  });

  visionList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const id = target.getAttribute("data-delete");
    if (!id) return;
    const next = readItems().filter((item) => item.id !== id);
    saveItems(next);
    renderItems();
  });

  missionText.value = localStorage.getItem(MISSION_KEY) || "";
  missionText.addEventListener("input", () => {
    localStorage.setItem(MISSION_KEY, missionText.value);
  });

  renderItems();
}