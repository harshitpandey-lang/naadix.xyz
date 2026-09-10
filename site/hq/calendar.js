import { EVENT_CATEGORIES, addDays, calendarDays, dateKey, esc, formatDate, formatDateTime, itemOccursOn, localInputValue, startOfDay, validateEvent } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

const requestedDate = new URLSearchParams(location.search).get("date");
const state = { anchor: requestedDate ? new Date(`${requestedDate}T12:00:00`) : new Date(), view: sessionStorage.getItem("hq_calendar_view") || "month", events: [], goals: [] };
let shell;

export async function mount() {
  shell = await mountShell({ active: "calendar", title: "Calendar", description: "See commitments and scheduled goals in one calm planning surface." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-event>${icon("plus")}New event</button>`;
  shell.actions.querySelector("[data-new-event]").addEventListener("click", () => openEventForm());
  window.addEventListener("hq:new", () => openEventForm());
  await load();
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  const days = calendarDays(state.anchor, state.view);
  const rangeStart = startOfDay(days[0].date);
  const rangeEnd = addDays(startOfDay(days.at(-1).date), 1);
  try {
    [state.events, state.goals] = await Promise.all([
      supabase.query("calendar_events", { select: "id,title,description,start_at,end_at,all_day,location,category,created_at,updated_at", filters: { start_at: [`gte.${rangeStart.toISOString()}`, `lt.${rangeEnd.toISOString()}`] }, order: "start_at.asc", limit: 300 }),
      supabase.query("goals", { select: "id,title,description,goal_type,target_value,unit,due_date,scheduled_start,scheduled_end,completed", filters: { scheduled_start: [`gte.${rangeStart.toISOString()}`, `lt.${rangeEnd.toISOString()}`] }, order: "scheduled_start.asc", limit: 200 }),
    ]);
    renderWorkspace();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function renderWorkspace() {
  const days = calendarDays(state.anchor, state.view);
  const label = state.view === "month" ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(state.anchor) : `${formatDate(days[0].date, { month: "short", day: "numeric" })} – ${formatDate(days.at(-1).date, { month: "short", day: "numeric", year: "numeric" })}`;
  shell.content.innerHTML = `<section class="calendar-toolbar"><div class="calendar-navigation"><button class="quiet-button compact" type="button" data-calendar-today>Today</button><div class="button-group"><button class="icon-button" type="button" data-calendar-previous aria-label="Previous ${state.view}">‹</button><button class="icon-button" type="button" data-calendar-next aria-label="Next ${state.view}">›</button></div><h2>${esc(label)}</h2></div><div class="view-switch" role="group" aria-label="Calendar view"><button type="button" data-calendar-view="month" class="${state.view === "month" ? "active" : ""}">Month</button><button type="button" data-calendar-view="week" class="${state.view === "week" ? "active" : ""}">Week</button></div></section>
    <div class="calendar-layout"><section class="calendar-surface" aria-label="${esc(label)}"><div class="calendar-weekdays">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => `<span>${day}</span>`).join("")}</div><div class="calendar-grid ${state.view === "week" ? "week-view" : ""}">${days.map(dayCell).join("")}</div></section>${agenda()}</div>`;
  shell.content.querySelector("[data-calendar-today]").addEventListener("click", () => { state.anchor = new Date(); load(); });
  shell.content.querySelector("[data-calendar-previous]").addEventListener("click", () => navigate(-1));
  shell.content.querySelector("[data-calendar-next]").addEventListener("click", () => navigate(1));
  shell.content.querySelectorAll("[data-calendar-view]").forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.calendarView; sessionStorage.setItem("hq_calendar_view", state.view); load(); }));
  shell.content.querySelectorAll("[data-new-date]").forEach((button) => button.addEventListener("click", () => openEventForm(null, button.dataset.newDate)));
  shell.content.querySelectorAll("[data-open-event]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); openEvent(button.dataset.openEvent); }));
}

function navigate(direction) {
  const next = new Date(state.anchor);
  if (state.view === "month") next.setMonth(next.getMonth() + direction);
  else next.setDate(next.getDate() + direction * 7);
  state.anchor = next;
  load();
}

function dayCell(day) {
  const events = state.events.filter((event) => itemOccursOn(event, day.key, "start_at"));
  const goals = state.goals.filter((goal) => itemOccursOn(goal, day.key, "scheduled_start"));
  const items = [...events.map((event) => ({ kind: "event", value: event })), ...goals.map((goal) => ({ kind: "goal", value: goal }))];
  return `<article class="calendar-day ${day.isToday ? "today" : ""} ${!day.isCurrentMonth && state.view === "month" ? "outside" : ""}" data-date="${day.key}"><button class="day-number" type="button" data-new-date="${day.key}" aria-label="Create event on ${formatDate(day.date)}"><time datetime="${day.key}">${day.day}</time>${day.isToday ? "<span>Today</span>" : ""}</button><div class="day-items">${items.slice(0, 3).map(calendarItem).join("")}${items.length > 3 ? `<span class="calendar-overflow">+${items.length - 3} more</span>` : ""}</div></article>`;
}

function calendarItem(item) {
  if (item.kind === "goal") return `<a class="calendar-item goal-item" href="/hq/goals/?goal=${item.value.id}" title="${esc(item.value.title)}"><span></span>${esc(item.value.title)}</a>`;
  return `<button class="calendar-item event-item" type="button" data-category="${esc(item.value.category || "Other")}" data-open-event="${item.value.id}" title="${esc(item.value.title)}"><span></span>${item.value.all_day ? "" : `<time>${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(item.value.start_at))}</time>`}${esc(item.value.title)}</button>`;
}

function agenda() {
  const today = dateKey(new Date());
  const events = state.events.filter((event) => itemOccursOn(event, today, "start_at"));
  const goals = state.goals.filter((goal) => itemOccursOn(goal, today, "scheduled_start"));
  const upcoming = state.events.filter((event) => new Date(event.start_at) > new Date() && !itemOccursOn(event, today, "start_at")).slice(0, 4);
  return `<aside class="agenda-panel"><header><p class="eyebrow">Today</p><h2>${formatDate(new Date(), { weekday: "long", month: "short", day: "numeric" })}</h2></header><div class="agenda-section"><span>Schedule</span>${events.length || goals.length ? [...events.map((event) => `<button type="button" data-open-event="${event.id}"><i data-category="${esc(event.category || "Other")}"></i><span><strong>${esc(event.title)}</strong><small>${event.all_day ? "All day" : formatDateTime(event.start_at)}</small></span></button>`), ...goals.map((goal) => `<a href="/hq/goals/?goal=${goal.id}"><i class="goal-dot"></i><span><strong>${esc(goal.title)}</strong><small>Scheduled goal</small></span></a>`)].join("") : '<p class="subtle">No items scheduled today.</p>'}</div><div class="agenda-section"><span>Upcoming</span>${upcoming.length ? upcoming.map((event) => `<button type="button" data-open-event="${event.id}"><i data-category="${esc(event.category || "Other")}"></i><span><strong>${esc(event.title)}</strong><small>${formatDateTime(event.start_at)}</small></span></button>`).join("") : '<p class="subtle">No upcoming events in this view.</p>'}</div></aside>`;
}

function eventForm(event = {}, date = null) {
  const defaultStart = date ? new Date(`${date}T09:00:00`) : addDays(new Date(), 0);
  if (!event.start_at && !date) defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 30) * 30, 0, 0);
  const start = event.start_at || defaultStart;
  const end = event.end_at || new Date(new Date(start).getTime() + 60 * 60 * 1000);
  return `<form class="entity-form" data-event-form novalidate><div class="form-grid"><label class="span-2">Event title<input name="title" required maxlength="160" value="${esc(event.title)}"></label><label>Starts<input name="start_at" type="datetime-local" required value="${localInputValue(start)}"></label><label>Ends<input name="end_at" type="datetime-local" required value="${localInputValue(end)}"></label><label>Category<select name="category"><option value="">No category</option>${EVENT_CATEGORIES.map((category) => `<option ${category === event.category ? "selected" : ""}>${category}</option>`).join("")}</select></label><label>Location<input name="location" value="${esc(event.location)}"></label><label class="checkbox-field span-2"><input name="all_day" type="checkbox" ${event.all_day ? "checked" : ""}><span>All-day event</span></label><label class="span-2">Description<textarea name="description" rows="4">${esc(event.description)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-dialog-close>Cancel</button>${event.id ? '<button class="danger-button" type="button" data-delete-event>Delete</button>' : ""}<button class="hq-action" type="submit">${event.id ? "Save changes" : "Create event"}</button></div></form>`;
}

function openEventForm(event = null, date = null) {
  const dialog = openDialog({ title: event ? event.title : "New event", description: event ? "Review or update this commitment." : "Reserve time for a commitment that belongs on the calendar.", className: "form-dialog", content: eventForm(event || {}, date) });
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  dialog.querySelector("[data-delete-event]")?.addEventListener("click", async () => { if (await confirmAction({ title: `Delete ${event.title}?`, message: "This calendar event will be permanently removed.", confirmLabel: "Delete event" })) { await supabase.remove("calendar_events", event.id); dialog.close(); toast("Event deleted."); await load(); } });
  dialog.querySelector("[data-event-form]").addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const result = validateEvent(formValues(submitEvent.currentTarget));
    const error = submitEvent.currentTarget.querySelector("[data-form-error]");
    showFormErrors(error, result.errors);
    if (!result.valid) return;
    const button = submitEvent.currentTarget.querySelector('[type="submit"]'); setButtonBusy(button, true, event ? "Saving…" : "Creating…");
    try {
      if (event) await supabase.update("calendar_events", event.id, result.values);
      else await supabase.insert("calendar_events", { ...result.values, user_id: shell.session.user.id });
      dialog.close(); toast(event ? "Event updated." : "Event created."); await load();
    } catch (requestError) { showFormErrors(error, [humanError(requestError)]); setButtonBusy(button, false); }
  });
}

function openEvent(id) {
  const event = state.events.find((item) => item.id === id);
  if (event) openEventForm(event);
}
