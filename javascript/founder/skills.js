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
