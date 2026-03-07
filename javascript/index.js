const logo = document.getElementById("logo");

if (logo) {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const scale = 1 + scrollY / 300;
    logo.style.transform = `scale(${scale})`;

    if (scrollY > 150) {
      window.location.href = "webpages/home.html";
    }
  });
}
