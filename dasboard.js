// Load tasks when page opens
window.onload = function(){

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

tasks.forEach(task => addTaskToList(task));

};


// Add new task
function addTask(){

let input = document.getElementById("taskInput");

let task = input.value;

if(task === "") return;

addTaskToList(task);

saveTask(task);

input.value="";

}


// Add task to list visually
function addTaskToList(task){

let li = document.createElement("li");

li.textContent = task;

document.getElementById("taskList").appendChild(li);

}


// Save task in browser storage
function saveTask(task){

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

tasks.push(task);

localStorage.setItem("tasks", JSON.stringify(tasks));

}


// Productivity chart
const ctx = document.getElementById('productivityChart');

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