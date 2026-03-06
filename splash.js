let logo = document.getElementById("logo");

let triggered = false;

window.addEventListener("wheel", function(event){

if(triggered) return;

if(event.deltaY > 0){

triggered = true;

logo.classList.add("zoomLogo");

setTimeout(()=>{

document.body.classList.add("fadeOut");

},900);

setTimeout(()=>{

window.location.href="home.html";

},1600);

}

});