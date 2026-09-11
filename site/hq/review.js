import { addDays, dateKey, esc, formatDate, startOfWeek, weeklyReviewSummary } from "./core.js";
import { errorState, formValues, humanError, mountShell, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
const state = { projects: [], goals: [], events: [], waiting: [], inbox: [], decisions: [], actions: [], review: null };

export async function mount() {
  shell = await mountShell({ active: "review", title: "Weekly Review", description: "Close the loop, clear friction, and choose what matters next." });
  if (!shell) return;
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(7);
  const week = dateKey(startOfWeek(new Date()));
  try {
    const [projects, goals, events, waiting, inbox, decisions, actions, reviews] = await Promise.all([
      supabase.query("projects", { select: "id,name,status,priority,health,deadline,updated_at", limit: 500 }),
      supabase.query("goals", { select: "id,title,completed,completed_at,due_date,priority,current_value,target_value,updated_at", limit: 500 }),
      supabase.query("calendar_events", { select: "id,title,start_at,end_at,category", order: "start_at.asc", limit: 500 }),
      supabase.query("waiting_items", { select: "id,title,waiting_for,follow_up_at,status,related_project_id", limit: 500 }),
      supabase.query("inbox_items", { select: "id,status,created_at", limit: 500 }),
      supabase.query("decisions", { select: "id,title,decided_at,project_id", limit: 500 }),
      supabase.query("project_actions", { select: "id,project_id,task,due_date,status", filters: { status: "neq.DONE" }, limit: 500 }),
      supabase.query("weekly_reviews", { select: "id,week_of,moved_forward,slowed_down,learned,stop_doing,priorities_next_week,top_outcome,completed_at", filters: { week_of: `eq.${week}` }, limit: 1 }),
    ]);
    Object.assign(state, { projects, goals, events, waiting, inbox, decisions, actions, review: reviews[0] || null });
    render();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function render() {
  const summary = weeklyReviewSummary(state);
  const review = state.review || {};
  const metrics = [
    ["Projects", [["Advanced", summary.projectsAdvanced], ["Stale", summary.projectsStale], ["Blocked", summary.projectsBlocked]]],
    ["Goals", [["Completed", summary.goalsCompleted], ["At risk", summary.goalsAtRisk], ["Overdue", summary.goalsOverdue]]],
    ["Calendar", [["Past this week", summary.eventsPast], ["Upcoming", summary.upcomingEvents]]],
    ["Open loops", [["Waiting", summary.waitingUnresolved], ["Inbox", summary.inboxUnprocessed], ["Decisions", summary.decisionsMade]]],
  ];
  shell.content.innerHTML = `<section class="review-summary"><header class="section-heading"><div><p class="eyebrow">Automatic summary</p><h2>Week of ${formatDate(startOfWeek(new Date()))}</h2></div>${review.completed_at ? `<span class="status-pill" data-status="COMPLETED">Completed ${formatDate(review.completed_at)}</span>` : ""}</header><div class="review-metrics">${metrics.map(([title, items]) => `<article><h3>${title}</h3>${items.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}</article>`).join("")}</div></section>
    <section class="review-form-panel"><form data-review-form><p class="eyebrow">Guided review</p>${question("moved_forward", "What moved forward?", review.moved_forward)}${question("slowed_down", "What got stuck?", review.slowed_down)}${question("learned", "What did I learn?", review.learned)}${question("stop_doing", "What should I stop doing?", review.stop_doing)}${question("priorities_next_week", "What matters most next week?", review.priorities_next_week)}${question("top_outcome", "What is the single most important outcome for next week?", review.top_outcome, true)}<p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="hq-action" type="submit">Complete weekly review</button></div></form></section>${review.completed_at ? nextWeek(review) : ""}`;
  shell.content.querySelector("[data-review-form]").addEventListener("submit", saveReview);
}

function question(name, label, value, required = false) {
  return `<label class="review-question"><span>${label}</span><textarea name="${name}" rows="3" ${required ? "required" : ""}>${esc(value)}</textarea></label>`;
}

function nextWeek(review) {
  const projectById = new Map(state.projects.map((item) => [item.id, item]));
  const importantGoals = state.goals.filter((item) => !item.completed && Number(item.priority) >= 3).slice(0, 4);
  const importantActions = state.actions.filter((item) => Number(projectById.get(item.project_id)?.priority) >= 3).slice(0, 4);
  const followUps = state.waiting.filter((item) => item.status === "WAITING" && item.follow_up_at && new Date(item.follow_up_at) < addDays(new Date(), 8)).slice(0, 4);
  const links = [
    ...importantGoals.map((item) => [item.title, `/hq/goals/?goal=${item.id}`, "Important goal"]),
    ...importantActions.map((item) => [item.task, `/hq/projects/?project=${item.project_id}`, "Project action"]),
    ...followUps.map((item) => [item.title, `/hq/dashboard/?waiting=show#waiting`, `Follow up ${formatDate(item.follow_up_at)}`]),
  ];
  return `<section class="dashboard-panel next-week"><header><div><p class="eyebrow">Next week</p><h2>${esc(review.top_outcome)}</h2></div></header>${links.length ? `<div class="dashboard-list">${links.map(([label, href, meta]) => `<a href="${href}"><span><strong>${esc(label)}</strong><small>${esc(meta)}</small></span></a>`).join("")}</div>` : '<p class="subtle panel-empty">No linked priorities or follow-ups yet.</p>'}</section>`;
}

async function saveReview(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = formValues(form);
  const error = form.querySelector("[data-form-error]");
  if (!values.top_outcome) return showFormErrors(error, ["Choose the single most important outcome for next week."]);
  const payload = { moved_forward: values.moved_forward || null, slowed_down: values.slowed_down || null, learned: values.learned || null, stop_doing: values.stop_doing || null, priorities_next_week: values.priorities_next_week || null, top_outcome: values.top_outcome, completed_at: new Date().toISOString() };
  const button = form.querySelector('[type="submit"]'); setButtonBusy(button, true, "Completing...");
  try {
    if (state.review) await supabase.update("weekly_reviews", state.review.id, payload);
    else await supabase.insert("weekly_reviews", { ...payload, user_id: shell.session.user.id, week_of: dateKey(startOfWeek(new Date())) });
    toast("Weekly review completed."); await load();
  } catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
}
