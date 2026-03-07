const roleLinks = [
  { role: "founder", href: "founder-dashboard/home-founder.html" },
  { role: "family", href: "family-dashboard/home-family.html" },
  { role: "guest", href: "guest-dashboard/home-guest.html" }
];

const roleButtons = document.querySelectorAll(".btn-link");
roleButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    const chosen = roleLinks[index];
    if (chosen) {
      localStorage.setItem("naadixLab:lastRole", chosen.role);
      localStorage.setItem("naadixLab:lastPath", chosen.href);
    }
  });
});

const lastPath = localStorage.getItem("naadixLab:lastPath");
const lastRole = localStorage.getItem("naadixLab:lastRole");
if (lastPath && lastRole) {
  const conceptPanel = document.querySelector(".card-grid .span-12");
  if (conceptPanel) {
    const quick = document.createElement("a");
    quick.className = "btn-link";
    quick.href = lastPath;
    quick.textContent = `Continue Last Session (${lastRole})`;
    conceptPanel.appendChild(quick);
  }
}
