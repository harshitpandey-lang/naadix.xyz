const sectionLinks = [...document.querySelectorAll(".section-nav a")];
const sections = [...document.querySelectorAll(".content .section")];

if (sectionLinks.length && sections.length) {
  const byId = new Map(sectionLinks.map((link) => [link.getAttribute("href")?.slice(1), link]));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => link.classList.remove("active"));
        const active = byId.get(entry.target.id);
        if (active) active.classList.add("active");
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

const certTrack = document.getElementById("certTrack");
const certPrev = document.getElementById("certPrev");
const certNext = document.getElementById("certNext");

if (certTrack && certPrev && certNext) {
  certPrev.addEventListener("click", () => {
    certTrack.scrollBy({ left: -320, behavior: "smooth" });
  });

  certNext.addEventListener("click", () => {
    certTrack.scrollBy({ left: 320, behavior: "smooth" });
  });
}
