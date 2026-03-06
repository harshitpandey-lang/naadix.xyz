// ---------- LOAD SAVED DATA WHEN PAGE OPENS ----------

document.addEventListener("DOMContentLoaded", function(){

loadTasks();
loadNotes();
createChart();

});


// ---------- TASK SYSTEM ----------

// Load saved tasks from localStorage
function loadTasks(){

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

tasks.forEach(task => addTaskToList(task));

}


// Add new task
function addTask(){

let input = document.getElementById("taskInput");

let task = input.value.trim();

if(task === "") return;

addTaskToList(task);

saveTask(task);

input.value = "";

}


// Add task to HTML list
function addTaskToList(task){

let li = document.createElement("li");

li.textContent = task;

document.getElementById("taskList").appendChild(li);

}


// Save task to browser storage
function saveTask(task){

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

tasks.push(task);

localStorage.setItem("tasks", JSON.stringify(tasks));

}


// ---------- RESEARCH NOTES SYSTEM ----------

// Load saved notes
function loadNotes(){

let savedNotes = localStorage.getItem("researchNotes");

if(savedNotes){

document.getElementById("notesInput").value = savedNotes;

}

}


// Save notes
function saveNotes(){

let notes = document.getElementById("notesInput").value;

localStorage.setItem("researchNotes", notes);

alert("Notes saved successfully!");

}


// ---------- PRODUCTIVITY CHART ----------

function createChart(){

const ctx = document.getElementById("productivityChart");

if(!ctx) return;

new Chart(ctx, {

type: "bar",

data: {

labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],

datasets: [{

label: "Tasks Completed",

data: [3,4,2,5,6,4,7],

backgroundColor: "#facc15"

}]

},

options: {

responsive: true,

scales: {

y: {

beginAtZero: true

}

}

}

});

}