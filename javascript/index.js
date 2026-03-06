const logo = document.getElementById("logo");

window.addEventListener("scroll", function() {

const scrollY = window.scrollY;

const scale = 1 + scrollY / 300;

logo.style.transform = "scale(" + scale + ")";

});