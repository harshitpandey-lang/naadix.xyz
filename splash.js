let logo = document.getElementById("logo");
let triggered = false;

window.addEventListener("scroll", function(){

if(triggered) return;

if(window.scrollY > 40){

triggered = true;

logo.classList.add("zoomLogo");

setTimeout(()=>{

document.body.style.opacity="0";

},900);

setTimeout(()=>{

window.location.href="home.html";

},1700);

}

});