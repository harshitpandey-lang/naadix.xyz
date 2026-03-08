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

  certTrack.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      if (certTrack.scrollWidth <= certTrack.clientWidth) return;
      event.preventDefault();
      certTrack.scrollBy({ left: event.deltaY, behavior: "smooth" });
    },
    { passive: false }
  );
}
