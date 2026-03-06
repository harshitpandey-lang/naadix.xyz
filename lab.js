function login(){

let username = document.getElementById("username").value.trim();
let password = document.getElementById("password").value.trim();
let message = document.getElementById("login-message");

let user = username.toLowerCase();

if(username === "" || password === ""){
message.innerText = "Please enter username and password.";
return;
}

if(user === "harshit.harivanshi" && password === "ShreeHarivansh"){
window.location.href = "founder-dashboard.html";
}

else if(user === "family.pandey" && password === "Shreeradha"){
window.location.href = "family-dashboard.html";
}

else if(user === "friends.pandey" && password === "Harekrishna"){
window.location.href = "friends-dashboard.html";
}

else{
message.innerText = "Invalid username or password.";
}

}