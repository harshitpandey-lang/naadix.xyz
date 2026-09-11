import { esc, formatDate, formatDateTime, localInputValue } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
let recognition = null;
let saveTimer = null;
const state = { meetings: [] };

export async function mount() {
  shell = await mountShell({ active: "meetings", title: "Meetings", description: "Run conversations with a live, searchable working record." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-meeting>${icon("plus")}New meeting</button>`;
  shell.actions.querySelector("[data-new-meeting]").addEventListener("click", () => openMeetingForm());
  await load();
  if (new URLSearchParams(location.search).get("new") === "1") {
    history.replaceState(null, "", "/hq/meetings/");
    openMeetingForm();
  }
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  try {
    state.meetings = await supabase.query("meetings", {
      select: "id,title,scheduled_at,ended_at,attendees,status,transcript,notes,outcome,action_items,created_at,updated_at",
      filters: { scheduled_at: `gte.${from.toISOString()}` },
      order: "scheduled_at.desc",
      limit: 250,
    });
    render();
  } catch (error) {
    shell.content.innerHTML = errorState(error);
    shell.content.querySelector("[data-retry]")?.addEventListener("click", load);
  }
}

function render() {
  const now = new Date();
  const live = state.meetings.find((meeting) => meeting.status === "LIVE");
  const upcoming = state.meetings.filter((meeting) => meeting.status === "PLANNED" && new Date(meeting.scheduled_at) >= now).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const completed = state.meetings.filter((meeting) => meeting.status === "COMPLETED");
  const withTranscript = state.meetings.filter((meeting) => meeting.transcript.trim()).length;
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Meeting summary">
      <article><span>Upcoming</span><strong>${upcoming.length}</strong><small>${upcoming[0] ? formatDateTime(upcoming[0].scheduled_at) : "Nothing scheduled"}</small></article>
      <article><span>Live now</span><strong>${live ? "Active" : "Clear"}</strong><small>${live ? esc(live.title) : "No active meeting"}</small></article>
      <article><span>Working records</span><strong>${withTranscript}</strong><small>${completed.length} completed meetings</small></article>
    </section>
    <section class="workspace-panel meeting-index">
      <header class="workspace-panel-head"><div><p class="eyebrow">Meeting log</p><h2>Conversations and transcripts</h2></div></header>
      ${state.meetings.length ? `<div class="meeting-list">${state.meetings.map(meetingRow).join("")}</div>` : emptyState("No meetings yet", "Create a meeting to capture its transcript, notes, outcome, and actions.", "New meeting")}
    </section>`;
  shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openMeetingForm());
  shell.content.querySelectorAll("[data-open-meeting]").forEach((button) => button.addEventListener("click", () => openMeetingWorkspace(state.meetings.find((meeting) => meeting.id === button.dataset.openMeeting))));
}

function meetingRow(meeting) {
  const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
  const actionCount = Array.isArray(meeting.action_items) ? meeting.action_items.length : 0;
  return `<button class="meeting-row" type="button" data-open-meeting="${meeting.id}">
    <span class="meeting-date"><strong>${formatDate(meeting.scheduled_at, { day: "2-digit" })}</strong><small>${formatDate(meeting.scheduled_at, { month: "short" })}</small></span>
    <span class="meeting-row-copy"><strong>${esc(meeting.title)}</strong><small>${formatDateTime(meeting.scheduled_at)}${attendeeCount ? ` · ${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"}` : ""}${actionCount ? ` · ${actionCount} action${actionCount === 1 ? "" : "s"}` : ""}</small></span>
    <span class="status-pill" data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span>${icon("chevron")}
  </button>`;
}

function openMeetingForm(meeting = null) {
  const attendees = Array.isArray(meeting?.attendees) ? meeting.attendees.join(", ") : "";
  const dialog = openDialog({
    title: meeting ? "Edit meeting" : "New meeting",
    description: "Set the context before the conversation starts.",
    className: "form-dialog",
    content: `<form class="entity-form" data-meeting-form><div class="form-grid">
      <label class="span-2">Meeting title<input name="title" maxlength="180" required value="${esc(meeting?.title)}"></label>
      <label>Scheduled for<input name="scheduled_at" type="datetime-local" required value="${localInputValue(meeting?.scheduled_at || new Date())}"></label>
      <label>Attendees<input name="attendees" value="${esc(attendees)}" placeholder="Comma-separated names"></label>
    </div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-cancel>Cancel</button><button class="hq-action" type="submit">${meeting ? "Save changes" : "Create meeting"}</button></div></form>`,
  });
  dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-meeting-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    const scheduled = new Date(values.scheduled_at);
    if (!values.title || Number.isNaN(scheduled.getTime())) return showFormErrors(error, ["A title and valid meeting time are required."]);
    const payload = { title: values.title, scheduled_at: scheduled.toISOString(), attendees: values.attendees.split(",").map((value) => value.trim()).filter(Boolean) };
    const button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, "Saving...");
    try {
      const saved = meeting ? await supabase.update("meetings", meeting.id, payload) : await supabase.insert("meetings", { ...payload, user_id: shell.session.user.id });
      dialog.close();
      toast(meeting ? "Meeting updated." : "Meeting created.");
      await load();
      if (!meeting) openMeetingWorkspace(saved);
    } catch (requestError) {
      showFormErrors(error, [humanError(requestError)]);
      setButtonBusy(button, false);
    }
  });
}

function openMeetingWorkspace(meeting) {
  const speechSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const actions = Array.isArray(meeting.action_items) ? meeting.action_items.map((item) => typeof item === "string" ? item : item?.text).filter(Boolean).join("\n") : "";
  const dialog = openDialog({
    title: meeting.title,
    description: formatDateTime(meeting.scheduled_at),
    className: "meeting-dialog",
    content: `<div class="meeting-workspace">
      <div class="meeting-toolbar"><span class="status-pill" data-meeting-status data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span><span class="subtle">${meeting.attendees?.length ? esc(meeting.attendees.join(", ")) : "No attendees listed"}</span><div class="meeting-toolbar-actions"><button class="quiet-button compact" type="button" data-edit-meeting>Edit details</button><button class="danger-button compact" type="button" data-delete-meeting>Delete</button></div></div>
      <section class="transcript-panel"><header><div><p class="eyebrow">Live transcript</p><h3>Conversation record</h3></div><div class="transcript-controls"><span class="recording-indicator" data-recording hidden><i></i>Listening</span><button class="hq-action compact" type="button" data-toggle-listening ${speechSupported ? "" : "disabled"}>${meeting.status === "LIVE" ? "Resume listening" : "Start listening"}</button></div></header>
        ${speechSupported ? "" : '<p class="browser-note">Live speech recognition is unavailable in this browser. You can type or paste the transcript below.</p>'}
        <textarea data-transcript rows="15" placeholder="The live transcript will appear here. You can also type or paste notes directly.">${esc(meeting.transcript)}</textarea><p class="interim-transcript" data-interim aria-live="polite"></p>
      </section>
      <form class="meeting-notes" data-meeting-notes><div class="form-grid"><label>Outcome<textarea name="outcome" rows="4" placeholder="Decision or result">${esc(meeting.outcome)}</textarea></label><label>Action items<textarea name="action_items" rows="4" placeholder="One action per line">${esc(actions)}</textarea></label><label class="span-2">Private notes<textarea name="notes" rows="4" placeholder="Context, follow-ups, and observations">${esc(meeting.notes)}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><span class="subtle" data-save-state>Changes are saved when you press save.</span><button class="quiet-button" type="submit">Save record</button><button class="hq-action" type="button" data-complete-meeting>${meeting.status === "COMPLETED" ? "Reopen meeting" : "Complete meeting"}</button></div></form>
    </div>`,
  });
  const transcript = dialog.querySelector("[data-transcript]");
  const toggle = dialog.querySelector("[data-toggle-listening]");
  const indicator = dialog.querySelector("[data-recording]");
  let listening = false;

  const saveTranscript = async () => {
    clearTimeout(saveTimer);
    await supabase.update("meetings", meeting.id, { transcript: transcript.value.trim() });
    const stateLabel = dialog.querySelector("[data-save-state]");
    if (stateLabel) stateLabel.textContent = "Transcript saved.";
  };
  transcript.addEventListener("input", () => {
    const stateLabel = dialog.querySelector("[data-save-state]");
    if (stateLabel) stateLabel.textContent = "Saving transcript...";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveTranscript().catch(() => { if (stateLabel) stateLabel.textContent = "Transcript could not be saved."; }), 900);
  });

  if (speechSupported) toggle.addEventListener("click", async () => {
    if (listening) {
      recognition?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "en-IN";
    recognition.onstart = async () => {
      listening = true;
      toggle.textContent = "Stop listening";
      indicator.hidden = false;
      await supabase.update("meetings", meeting.id, { status: "LIVE", ended_at: null }).catch(() => {});
      updateMeetingStatus(dialog, "LIVE");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const phrase = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalText += `${phrase} `;
        else interimText += `${phrase} `;
      }
      if (finalText) {
        transcript.value = `${transcript.value.trim()}${transcript.value.trim() ? "\n" : ""}${finalText.trim()}`;
        transcript.dispatchEvent(new Event("input"));
      }
      dialog.querySelector("[data-interim]").textContent = interimText.trim();
    };
    recognition.onerror = (event) => { if (event.error !== "aborted") toast(`Listening stopped: ${event.error}.`, "error"); };
    recognition.onend = () => {
      listening = false;
      toggle.textContent = "Resume listening";
      indicator.hidden = true;
      dialog.querySelector("[data-interim]").textContent = "";
    };
    try { recognition.start(); } catch { toast("The microphone could not be started.", "error"); }
  });

  dialog.querySelector("[data-meeting-notes]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, "Saving...");
    try {
      await supabase.update("meetings", meeting.id, { transcript: transcript.value.trim(), notes: values.notes, outcome: values.outcome || null, action_items: values.action_items.split("\n").map((text) => text.trim()).filter(Boolean).map((text) => ({ text })) });
      toast("Meeting record saved.");
      setButtonBusy(button, false);
      dialog.querySelector("[data-save-state]").textContent = "All changes saved.";
      await load();
    } catch (requestError) {
      showFormErrors(form.querySelector("[data-form-error]"), [humanError(requestError)]);
      setButtonBusy(button, false);
    }
  });
  dialog.querySelector("[data-complete-meeting]").addEventListener("click", async (event) => {
    recognition?.stop();
    const reopening = meeting.status === "COMPLETED";
    await supabase.update("meetings", meeting.id, { status: reopening ? "PLANNED" : "COMPLETED", ended_at: reopening ? null : new Date().toISOString(), transcript: transcript.value.trim() });
    dialog.close();
    toast(reopening ? "Meeting reopened." : "Meeting completed.");
    await load();
  });
  dialog.querySelector("[data-edit-meeting]").addEventListener("click", () => { dialog.close(); openMeetingForm(meeting); });
  dialog.querySelector("[data-delete-meeting]").addEventListener("click", async () => {
    if (await confirmAction({ title: "Delete meeting?", message: "The transcript and meeting record will be permanently removed." })) {
      await supabase.remove("meetings", meeting.id);
      dialog.close();
      toast("Meeting deleted.");
      await load();
    }
  });
  dialog.addEventListener("close", () => {
    clearTimeout(saveTimer);
    recognition?.stop();
    recognition = null;
    if (transcript.value.trim() !== meeting.transcript.trim()) supabase.update("meetings", meeting.id, { transcript: transcript.value.trim() }).catch(() => {});
  }, { once: true });
}

function updateMeetingStatus(dialog, status) {
  const badge = dialog.querySelector("[data-meeting-status]");
  if (!badge) return;
  badge.dataset.status = status;
  badge.textContent = status === "LIVE" ? "Live" : status === "COMPLETED" ? "Completed" : "Planned";
}
