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

const horizontalTracks = [...document.querySelectorAll(".certificate-scroll, .project-scroll, .testimonial-scroll")];

horizontalTracks.forEach((track) => {
  track.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      if (track.scrollWidth <= track.clientWidth) return;
      event.preventDefault();
      track.scrollBy({ left: event.deltaY, behavior: "smooth" });
    },
    { passive: false }
  );
});
