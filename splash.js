const logo = document.getElementById("logo");
window.addEventListener("scroll", function() {
  // Compute a scale factor based on how far the user has scrolled
  const scrollY = window.scrollY;
  const scale = 1 + scrollY / 300;
  logo.style.transform = "scale(" + scale + ")";
});
