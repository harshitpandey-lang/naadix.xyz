function login(){

// Get input values
let username = document.getElementById("username").value.trim();
let password = document.getElementById("password").value.trim();
let message = document.getElementById("login-message");

// Convert username to lower case for safer comparison
let user = username.toLowerCase();

// Check if fields are empty
if(username === "" || password === ""){
message.innerText = "Please enter username and password.";
return;
}


// Founder Login
if(user === "harshit.harivanshi" && password === "ShreeHarivansh"){

window.location.href = "founder-dashboard.html";

}


// Family Login
else if(user === "family.pandey" && password === "Shreeradha"){

window.location.href = "family-dashboard.html";

}


// Friends Login
else if(user === "friends.pandey" && password === "Harekrishna"){

window.location.href = "friends-dashboard.html";

}


// Invalid Login
else{

message.innerText = "Invalid username or password.";

}

}