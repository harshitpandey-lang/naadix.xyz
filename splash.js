let logo = document.getElementById("logo");

let triggered = false;

window.addEventListener("wheel", function(event){

if(triggered) return;

if(event.deltaY > 0){

triggered = true;

/* zoom logo */

logo.classList.add("zoom");

/* fade screen */

setTimeout(()=>{

document.body.classList.add("fade");

},900);

/* go to next page */

setTimeout(()=>{

window.location.href="home.html";

},1700);

}

});