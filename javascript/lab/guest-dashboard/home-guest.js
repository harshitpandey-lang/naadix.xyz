const guestOverview = document.querySelector(".card-grid .span-6");
const guestNoteKey = "naadixLab:guestOverview";

if (guestOverview) {
  const area = document.createElement("textarea");
  area.rows = 5;
  area.placeholder = "Add guest dashboard overview or latest collaboration status...";
  area.value = localStorage.getItem(guestNoteKey) || "";
  area.addEventListener("input", () => {
    localStorage.setItem(guestNoteKey, area.value);
  });
  guestOverview.appendChild(area);
}
