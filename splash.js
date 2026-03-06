let logo = document.getElementById("logo")

window.addEventListener("scroll", function(){

let scroll = window.scrollY

let scale = 1 + scroll/300

logo.style.transform = "scale(" + scale + ")"

})