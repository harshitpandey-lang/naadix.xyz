const logo = document.getElementById("logo");
const scrollIndicator = document.querySelector(".scrollIndicator");

const goToHome = () => {
  window.location.href = "webpages/home.html";
};

if (logo) {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const scale = 1 + scrollY / 300;
    logo.style.transform = `scale(${scale})`;

    if (scrollY > 150) {
      goToHome();
    }
  });

  logo.addEventListener("click", goToHome);
}

if (scrollIndicator) {
  scrollIndicator.addEventListener("click", goToHome);
  scrollIndicator.addEventListener("touchstart", goToHome, { passive: true });
}
