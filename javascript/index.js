const logo = document.getElementById("logo");

// Logo scaling effect
window.addEventListener("scroll", function () {

const scrollY = window.scrollY;
const scale = 1 + scrollY / 300;

logo.style.transform = "scale(" + scale + ")";

// Redirect to home page when user scrolls down
if (scrollY > 150) {

window.location.href = "webpages/home.html";

}

});