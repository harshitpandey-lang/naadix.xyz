const SUBJECT_KEY = "naadixLab:educationSubjects";
const NOTES_KEY = "naadixLab:educationNotesV2";

const subjectForm = document.getElementById("subjectForm");
const subjectList = document.getElementById("subjectList");
const notesArea = document.getElementById("educationNotes");

const readSubjects = () => {
  try {
    return JSON.parse(localStorage.getItem(SUBJECT_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveSubjects = (items) => localStorage.setItem(SUBJECT_KEY, JSON.stringify(items));

const renderSubjects = () => {
  const subjects = readSubjects();
  subjectList.innerHTML = "";

  if (!subjects.length) {
    subjectList.innerHTML = '<p class="mini-note">No subjects tracked yet.</p>';
    return;
  }

  subjects.forEach((subject) => {
    const row = document.createElement("div");
    row.className = "panel";
    const resources = subject.resources && subject.resources.length
      ? subject.resources.map((item) => `<span class="chip">${item}</span>`).join("")
      : '<span class="mini-note">No resources yet.</span>';
    row.innerHTML = `
      <h4>${subject.name}</h4>
      <div class="progress-bar"><span style="width:${subject.progress}%"></span></div>
      <p class="mini-note">Progress: ${subject.progress}%</p>
      <div class="chips">${resources}</div>
      <button type="button" class="secondary" data-delete="${subject.id}">Delete</button>
    `;
    subjectList.appendChild(row);
  });
};

if (subjectForm) {
  if (!localStorage.getItem(SUBJECT_KEY)) {
    saveSubjects([
      { id: "s1", name: "Physics", progress: 65, resources: ["Lecture Notes", "Problem Sets"] },
      { id: "s2", name: "Mathematics", progress: 58, resources: ["Past Papers"] },
      { id: "s3", name: "Japanese", progress: 30, resources: ["Anki", "Grammar Book"] },
      { id: "s4", name: "Programming", progress: 72, resources: ["Docs", "Projects"] },
      { id: "s5", name: "Electronics", progress: 42, resources: ["Datasheets"] },
      { id: "s6", name: "AI", progress: 55, resources: ["Research Papers"] }
    ]);
  }

  subjectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("subjectName").value.trim();
    const progress = Number(document.getElementById("subjectProgress").value);
    const resourcesRaw = document.getElementById("subjectResources").value.trim();
    if (!name || Number.isNaN(progress)) return;

    const resources = resourcesRaw
      ? resourcesRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const subjects = readSubjects();
    subjects.push({
      id: `subject-${Date.now()}`,
      name,
      progress: Math.max(0, Math.min(100, progress)),
      resources
    });
    saveSubjects(subjects);
    subjectForm.reset();
    renderSubjects();
  });

  subjectList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const id = target.getAttribute("data-delete");
    if (!id) return;

    const subjects = readSubjects().filter((subject) => subject.id !== id);
    saveSubjects(subjects);
    renderSubjects();
  });

  notesArea.value = localStorage.getItem(NOTES_KEY) || "";
  notesArea.addEventListener("input", () => {
    localStorage.setItem(NOTES_KEY, notesArea.value);
  });

  renderSubjects();
}