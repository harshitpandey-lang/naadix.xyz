import { founderLogin, showMessage, startPrivatePage } from "./auth.js";
import { setRecoverySession, supabase } from "./supabase.js";

const page = document.body.dataset.hqPage;
const esc = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
const formValue = (form, name) => String(new FormData(form).get(name) || "").trim();

async function login() {
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#message");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const login = formValue(form, "login");
    const password = formValue(form, "password");
    if (!login || !password) return showMessage(message, "Enter your Founder ID and password.");
    const button = form.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Authenticating...";
    const { error } = await supabase.auth.signInWithPassword({ email: founderLogin(login), password });
    if (error) { showMessage(message, "Invalid email or password."); button.disabled = false; button.textContent = "Enter HQ"; return; }
    const next = new URLSearchParams(location.search).get("next"); location.replace(next && next.startsWith("/hq/") ? next : "/hq/dashboard/");
  });
}

async function resetPassword() {
  const form = document.querySelector("#reset-form"); const updateForm = document.querySelector("#update-form"); const message = document.querySelector("#message");
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get("access_token") && hash.get("refresh_token")) { setRecoverySession(hash.get("access_token"), hash.get("refresh_token")); form.hidden = true; updateForm.hidden = false; history.replaceState(null, "", "/hq/reset-password/"); }
  form.addEventListener("submit", async (event) => { event.preventDefault(); const email = formValue(form, "email"); if (!/^\S+@\S+\.\S+$/.test(email)) return showMessage(message, "Enter a valid email address."); try { await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/hq/reset-password/` }); showMessage(message, "If that account exists, a reset link has been sent.", "success"); } catch (error) { showMessage(message, error.message); } });
  updateForm.addEventListener("submit", async (event) => { event.preventDefault(); const password = formValue(updateForm, "password"); const confirmation = formValue(updateForm, "confirmation"); if (password.length < 8) return showMessage(message, "Use a password with at least 8 characters."); if (password !== confirmation) return showMessage(message, "Passwords do not match."); const { error } = await supabase.auth.updateUser({ password }); if (error) return showMessage(message, error.message); showMessage(message, "Password updated. Redirecting...", "success"); setTimeout(() => location.replace("/hq/dashboard/"), 500); });
}

function field(label, name, type = "text", required = false, options = []) { return `<label>${label}${type === "select" ? `<select name="${name}" ${required ? "required" : ""}><option value="">Choose</option>${options.map((option) => `<option>${option}</option>`).join("")}</select>` : type === "textarea" ? `<textarea name="${name}" rows="3" ${required ? "required" : ""}></textarea>` : `<input name="${name}" type="${type}" ${required ? "required" : ""}/>`}</label>`; }

const definitions = {
  projects: { title: "Projects", description: "Plan the work, track the active edge, and preserve what was learned.", select: "id,name,short_description,category,status,priority,progress,deadline,github_url,notes,updated_at", titleField: "name", descriptionField: "short_description", fields: [field("Name", "name", "text", true), field("Description", "short_description", "textarea"), field("Category", "category", "select", true, ["Company","Client","Internal tools","Research","AI & Automation"]), field("Priority (1-5)", "priority", "number"), field("Status", "status", "select", true, ["PLANNED","ACTIVE","PAUSED","COMPLETED","ARCHIVED"]), field("Progress %", "progress", "number"), field("Deadline", "deadline", "date"), field("Primary link", "github_url", "url"), field("Notes", "notes", "textarea")] },
  goals: { title: "Goals", description: "Keep the next meaningful outcomes visible and owned.", select: "id,title,description,goal_type,target_value,unit,due_date,scheduled_start,scheduled_end,completed,completed_at,created_at", titleField: "title", descriptionField: "description", fields: [field("Title", "title", "text", true), field("Description", "description", "textarea"), field("Type", "goal_type", "select", true, ["daily","weekly","monthly","quarterly","project"]), field("Target", "target_value", "number"), field("Unit", "unit"), field("Due date", "due_date", "date")] },
};

async function recordsPage(kind) {
  const definition = definitions[kind];
  const session = await startPrivatePage({ active: kind, title: definition.title, description: definition.description }); if (!session) return;
  const content = document.querySelector("#hq-content");
  const render = async () => {
    try {
      const records = await supabase.query(kind, { select: definition.select, order: "created_at.desc" });
      content.innerHTML = `<div class="workspace-toolbar"><label class="workspace-search"><span>Search</span><input id="record-search" placeholder="Filter records" /></label><button class="hq-action" id="new-record">New</button></div><div id="record-form" hidden></div><div class="record-grid" id="record-grid">${records.length ? records.map((record) => `<article class="record-card hq-panel" data-record="${esc(JSON.stringify(record))}"><div class="record-top"><div><span class="record-status">${esc(record.status || (record.completed ? "COMPLETED" : "OPEN"))}</span><h2>${esc(record[definition.titleField])}</h2></div><button data-delete="${record.id}" aria-label="Delete record">Delete</button></div><p>${esc(record[definition.descriptionField])}</p><dl>${Object.entries(record).filter(([key, value]) => !["id","user_id",definition.titleField,definition.descriptionField,"created_at","updated_at"].includes(key) && value !== null && value !== "").slice(0,5).map(([key,value]) => `<div><dt>${esc(key.replaceAll("_"," "))}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>${kind === "goals" ? `<label class="check-row"><input type="checkbox" data-complete="${record.id}" ${record.completed ? "checked" : ""}/> Completed</label>` : ""}</article>`).join("") : `<div class="empty-state hq-panel"><h2>Nothing here yet.</h2><p class="muted">Create the first private record.</p></div>`}</div>`;
      document.querySelector("#new-record").onclick = () => { const form = document.querySelector("#record-form"); form.hidden = false; form.innerHTML = `<form class="workspace-form hq-panel" id="create-form">${definition.fields.join("")}<div class="wide form-row"><button class="hq-action">Save record</button><button type="button" class="quiet-button" id="cancel-form">Cancel</button></div><p class="message" id="form-message" hidden></p></form>`; document.querySelector("#cancel-form").onclick = () => { form.hidden = true; }; document.querySelector("#create-form").onsubmit = async (event) => { event.preventDefault(); const values = {}; for (const fieldElement of new FormData(event.currentTarget).entries()) if (fieldElement[1]) values[fieldElement[0]] = fieldElement[1]; if (kind === "projects") { values.progress = Number(values.progress || 0); values.priority = Number(values.priority || 0); values.slug = `${String(values.name).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${crypto.randomUUID().slice(0,6)}`; } if (kind === "goals" && values.target_value) values.target_value = Number(values.target_value); try { await supabase.insert(kind, values); await render(); } catch (error) { showMessage(document.querySelector("#form-message"), error.message); } }; };
      document.querySelectorAll("[data-delete]").forEach((button) => button.onclick = async () => { if (confirm("Delete this private record?")) { await supabase.remove(kind, button.dataset.delete); await render(); } });
      document.querySelectorAll("[data-complete]").forEach((input) => input.onchange = async () => { await supabase.update("goals", input.dataset.complete, { completed: input.checked, completed_at: input.checked ? new Date().toISOString() : null }); await render(); });
      document.querySelector("#record-search").oninput = (event) => document.querySelectorAll("[data-record]").forEach((card) => { card.hidden = !card.dataset.record.toLowerCase().includes(event.target.value.toLowerCase()); });
    } catch (error) { content.innerHTML = `<p class="message" data-type="error">${esc(error.message)}</p>`; }
  }; await render();
}

async function calendar() {
  const session = await startPrivatePage({ active: "calendar", title: "Calendar", description: "Keep the commitments that deserve a place in time visible." }); if (!session) return;
  const content = document.querySelector("#hq-content");
  async function render() { const events = await supabase.query("calendar_events", { select: "id,title,description,start_at,end_at,all_day,location,category", order: "start_at.asc" }); content.innerHTML = `<div class="workspace-toolbar"><button class="hq-action" id="new-event">New event</button></div><div id="event-form" hidden></div><div class="calendar-list">${events.length ? events.map((event) => `<article class="hq-panel"><div><time>${esc(new Date(event.start_at).toLocaleString())}</time><h2>${esc(event.title)}</h2><p class="muted">${esc(event.description || event.location || "")}</p></div><button data-delete="${event.id}">Delete</button></article>`).join("") : `<div class="empty-state hq-panel"><h2>No events yet.</h2><p class="muted">Add a commitment when it becomes real.</p></div>`}</div>`; document.querySelector("#new-event").onclick = () => { const target = document.querySelector("#event-form"); target.hidden = false; target.innerHTML = `<form class="workspace-form hq-panel" id="create-event">${field("Title","title","text",true)}${field("Description","description","textarea")}${field("Starts","start_at","datetime-local",true)}${field("Ends","end_at","datetime-local",true)}${field("Location","location")}<div class="wide"><button class="hq-action">Save event</button></div><p class="message" id="form-message" hidden></p></form>`; document.querySelector("#create-event").onsubmit = async (event) => { event.preventDefault(); const values = {}; for (const [key,value] of new FormData(event.currentTarget).entries()) if(value) values[key] = value; if(new Date(values.end_at) <= new Date(values.start_at)) return showMessage(document.querySelector("#form-message"), "End time must be after start time."); try { await supabase.insert("calendar_events", values); await render(); } catch(error) { showMessage(document.querySelector("#form-message"), error.message); } }; }; document.querySelectorAll("[data-delete]").forEach((button) => button.onclick = async () => { if(confirm("Delete this event?")){await supabase.remove("calendar_events",button.dataset.delete); await render();} }); }
  try { await render(); } catch (error) { content.innerHTML = `<p class="message" data-type="error">${esc(error.message)}</p>`; }
}

async function dashboard() { const session = await startPrivatePage({ active: "dashboard", title: `Good ${new Date().toLocaleTimeString([], { hour: "2-digit" }).includes("AM") ? "morning" : "day"}, Founder.`, description: "A quiet operating view for the work that matters now." }); if (!session) return; const content = document.querySelector("#hq-content"); const [projects, goals, events] = await Promise.all([supabase.query("projects", { select: "id,status", limit: 100 }), supabase.query("goals", { select: "id,completed", limit: 100 }), supabase.query("calendar_events", { select: "id", limit: 100 })]); content.innerHTML = `<div class="hq-content-grid"><div class="hq-panel hq-stat"><strong>${projects.length}</strong><span>Projects</span></div><div class="hq-panel hq-stat"><strong>${goals.filter((goal) => !goal.completed).length}</strong><span>Open goals</span></div><div class="hq-panel hq-stat"><strong>${events.length}</strong><span>Calendar events</span></div></div><div class="hq-panel" style="margin-top:14px"><p class="eyebrow">NEXT MOVE</p><h2>Keep the system honest.</h2><p class="muted">Use Projects, Calendar, and Goals to capture only work that is real enough to act on.</p></div>`; }

if (page === "login") login();
if (page === "reset") resetPassword();
if (page === "dashboard") dashboard();
if (page === "projects" || page === "goals") recordsPage(page);
if (page === "calendar") calendar();
