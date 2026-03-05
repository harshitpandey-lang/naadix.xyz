function addTask(){

let input=document.getElementById("taskInput");

let task=input.value;

if(task==="") return;

let li=document.createElement("li");

li.textContent=task;

document.getElementById("taskList").appendChild(li);

input.value="";

}

const ctx=document.getElementById('productivityChart');

new Chart(ctx, {

type:'bar',

data:{

labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],

datasets:[{

label:'Tasks Completed',

data:[3,4,2,5,6,4,7],

borderWidth:1

}]

},

options:{

scales:{

y:{beginAtZero:true}

}

}

});