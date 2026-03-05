function login(){

let username=document.getElementById("username").value;
let password=document.getElementById("password").value;

if(username==="Harshit.Harivanshi" && password==="ShreeHarivansh"){

window.location.href="founder-dashboard.html";

}

else if(username==="Family.Pandey" && password==="Shreeradha"){

window.location.href="family-dashboard.html";

}

else if(username==="friends.Pandey" && password==="Harekrishna"){

window.location.href="friends-dashboard.html";

}

else{

document.getElementById("login-message").innerText="Invalid username or password";

}

}