import { esc, formatDate, formatDateTime, localInputValue } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
let saveTimer = null;
const state = { meetings: [] };

export async function mount() {
  shell = await mountShell({ active: "meetings", title: "Meetings", description: "Run conversations with a live, searchable working record." });
  if (!shell) return;
  shell.actions.innerHTML = `<button class="hq-action" type="button" data-new-meeting>${icon("plus")}New meeting</button>`;
  shell.actions.querySelector("[data-new-meeting]").addEventListener("click", () => openMeetingForm());
  await load();
  if (new URLSearchParams(location.search).get("new") === "1") { history.replaceState(null, "", "/hq/meetings/"); openMeetingForm(); }
}

async function load() {
  shell.content.innerHTML = skeleton(6);
  const from = new Date(); from.setFullYear(from.getFullYear() - 1);
  try {
    state.meetings = await supabase.query("meetings", { select: "id,title,scheduled_at,ended_at,attendees,status,transcript,notes,outcome,action_items,created_at,updated_at", filters: { scheduled_at: `gte.${from.toISOString()}` }, order: "scheduled_at.desc", limit: 250 });
    render();
  } catch (error) { shell.content.innerHTML = errorState(error); shell.content.querySelector("[data-retry]")?.addEventListener("click", load); }
}

function render() {
  const now = new Date();
  const live = state.meetings.find((m) => m.status === "LIVE");
  const upcoming = state.meetings.filter((m) => m.status === "PLANNED" && new Date(m.scheduled_at) >= now).sort((a,b) => new Date(a.scheduled_at)-new Date(b.scheduled_at));
  const completed = state.meetings.filter((m) => m.status === "COMPLETED");
  const withTranscript = state.meetings.filter((m) => (m.transcript || "").trim()).length;
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Meeting summary"><article><span>Upcoming</span><strong>${upcoming.length}</strong><small>${upcoming[0] ? formatDateTime(upcoming[0].scheduled_at) : "Nothing scheduled"}</small></article><article><span>Live now</span><strong>${live ? "Active" : "Clear"}</strong><small>${live ? esc(live.title) : "No active meeting"}</small></article><article><span>Working records</span><strong>${withTranscript}</strong><small>${completed.length} completed meetings</small></article></section><section class="workspace-panel meeting-index"><header class="workspace-panel-head"><div><p class="eyebrow">Meeting log</p><h2>Conversations and transcripts</h2></div></header>${state.meetings.length ? `<div class="meeting-list">${state.meetings.map(meetingRow).join("")}</div>` : emptyState("No meetings yet", "Create a meeting to capture its transcript, notes, outcome, and actions.", "New meeting")}</section>`;
  shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openMeetingForm());
  shell.content.querySelectorAll("[data-open-meeting]").forEach((b) => b.addEventListener("click", () => openMeetingWorkspace(state.meetings.find((m) => m.id === b.dataset.openMeeting))));
}

function meetingRow(meeting) {
  const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
  const actionCount = Array.isArray(meeting.action_items) ? meeting.action_items.length : 0;
  return `<button class="meeting-row" type="button" data-open-meeting="${meeting.id}"><span class="meeting-date"><strong>${formatDate(meeting.scheduled_at,{day:"2-digit"})}</strong><small>${formatDate(meeting.scheduled_at,{month:"short"})}</small></span><span class="meeting-row-copy"><strong>${esc(meeting.title)}</strong><small>${formatDateTime(meeting.scheduled_at)}${attendeeCount ? ` · ${attendeeCount} attendee${attendeeCount===1?"":"s"}`:""}${actionCount ? ` · ${actionCount} action${actionCount===1?"":"s"}`:""}</small></span><span class="status-pill" data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span>${icon("chevron")}</button>`;
}

function openMeetingForm(meeting = null) {
  const attendees = Array.isArray(meeting?.attendees) ? meeting.attendees.join(", ") : "";
  const dialog = openDialog({ title: meeting ? "Edit meeting" : "New meeting", description: "Set the context before the conversation starts.", className: "form-dialog", content: `<form class="entity-form" data-meeting-form><div class="form-grid"><label class="span-2">Meeting title<input name="title" maxlength="180" required value="${esc(meeting?.title || "")}"></label><label>Scheduled for<input name="scheduled_at" type="datetime-local" required value="${localInputValue(meeting?.scheduled_at || new Date())}"></label><label>Attendees<input name="attendees" value="${esc(attendees)}" placeholder="Comma-separated names"></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-cancel>Cancel</button><button class="hq-action" type="submit">${meeting ? "Save changes" : "Create meeting"}</button></div></form>` });
  dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-meeting-form]").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const values = formValues(form); const error = form.querySelector("[data-form-error]"); const scheduled = new Date(values.scheduled_at);
    if (!values.title || Number.isNaN(scheduled.getTime())) return showFormErrors(error,["A title and valid meeting time are required."]);
    const payload = { title: values.title, scheduled_at: scheduled.toISOString(), attendees: values.attendees.split(",").map((v)=>v.trim()).filter(Boolean) };
    const button = form.querySelector('[type="submit"]'); setButtonBusy(button,true,"Saving...");
    try { const saved = meeting ? await supabase.update("meetings",meeting.id,payload) : await supabase.insert("meetings",{...payload,user_id:shell.session.user.id}); dialog.close(); toast(meeting?"Meeting updated.":"Meeting created."); await load(); if(!meeting) openMeetingWorkspace(saved); }
    catch (requestError) { showFormErrors(error,[humanError(requestError)]); setButtonBusy(button,false); }
  });
}

export function applyRecognitionResults(event, transcript, interim, processedFinalResults = new Set()) {
  let finalChunk = "", interimChunk = "";
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index]; const text = result[0]?.transcript?.trim(); if (!text) continue;
    if (result.isFinal) { const signature = text.toLowerCase().replace(/\s+/g, " "); if (!processedFinalResults.has(signature)) { processedFinalResults.add(signature); finalChunk += `${finalChunk ? " " : ""}${text}`; } }
    else interimChunk += `${interimChunk ? " " : ""}${text}`;
  }
  if (finalChunk) { const current = transcript.value.trimEnd(); if (!current.endsWith(finalChunk)) { const separator = current ? (/[.!?]["']?$/.test(current) ? "\n" : " ") : ""; transcript.value = `${current}${separator}${finalChunk}`; transcript.dispatchEvent(new Event("input", { bubbles: true })); } }
  interim.textContent = interimChunk;
}

function openMeetingWorkspace(meeting) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = Boolean(SpeechRecognition);
  const recordingSupported = Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);
  const actions = Array.isArray(meeting.action_items) ? meeting.action_items.map((x)=>typeof x === "string" ? x : x?.text).filter(Boolean).join("\n") : "";
  const dialog = openDialog({ title: meeting.title, description: formatDateTime(meeting.scheduled_at), className: "meeting-dialog", content: `<div class="meeting-workspace"><div class="meeting-toolbar"><span class="status-pill" data-meeting-status data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span><span class="subtle">${meeting.attendees?.length ? esc(meeting.attendees.join(", ")) : "No attendees listed"}</span><div class="meeting-toolbar-actions"><button class="quiet-button compact" type="button" data-edit-meeting>Edit details</button><button class="danger-button compact" type="button" data-delete-meeting>Delete</button></div></div><section class="transcript-panel"><header><div><p class="eyebrow">Meeting recorder</p><h3>Conversation record</h3></div><div class="transcript-controls"><span class="recording-indicator" data-recording hidden><i></i><span data-recording-label>Recording</span></span><span class="subtle" data-mic-state>Ready</span><button class="hq-action compact" type="button" data-start-recording>Start recording</button><button class="quiet-button compact" type="button" data-pause-recording disabled>Pause</button><button class="quiet-button compact" type="button" data-resume-recording disabled>Resume</button><button class="danger-button compact" type="button" data-stop-recording disabled>Stop recording</button></div></header>${!recordingSupported ? '<p class="browser-note">Audio recording is unavailable in this browser. You can still type or paste the transcript.</p>' : ""}${!speechSupported ? '<p class="browser-note">Automatic live transcription is unavailable in this browser. Audio recording can still run where MediaRecorder is supported; type or paste the transcript before saving.</p>' : ""}<textarea data-transcript rows="15" placeholder="Final transcript appears here. Existing text is preserved.">${esc(meeting.transcript || "")}</textarea><p class="interim-transcript" data-interim aria-live="polite"></p></section><form class="meeting-notes" data-meeting-notes><div class="form-grid"><label>Outcome<textarea name="outcome" rows="4" placeholder="Decision or result">${esc(meeting.outcome || "")}</textarea></label><label>Action items<textarea name="action_items" rows="4" placeholder="One action per line">${esc(actions)}</textarea></label><label class="span-2">Private notes<textarea name="notes" rows="4" placeholder="Context, follow-ups, and observations">${esc(meeting.notes || "")}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><span class="subtle" data-save-state>Changes are saved when you press save.</span><button class="quiet-button" type="submit">Save record</button><button class="hq-action" type="button" data-complete-meeting>${meeting.status === "COMPLETED" ? "Reopen meeting" : "Complete meeting"}</button></div></form></div>` });

  const transcript = dialog.querySelector("[data-transcript]"), interim = dialog.querySelector("[data-interim]"), indicator = dialog.querySelector("[data-recording]"), indicatorLabel = dialog.querySelector("[data-recording-label]"), micState = dialog.querySelector("[data-mic-state]");
  const startButton = dialog.querySelector("[data-start-recording]"), pauseButton = dialog.querySelector("[data-pause-recording]"), resumeButton = dialog.querySelector("[data-resume-recording]"), stopButton = dialog.querySelector("[data-stop-recording]");
  let stream = null, recorder = null, recognition = null, restartTimer = null, disposed = false, wantsRecognition = false, recognitionRunning = false, recordingState = "idle";
  const recentFinals = new Map();

  const setUi = (mode, message = "") => {
    recordingState = mode;
    const active = mode === "recording", paused = mode === "paused", starting = mode === "starting";
    indicator.hidden = !(active || paused); indicatorLabel.textContent = paused ? "Paused" : "Recording";
    startButton.disabled = active || paused || starting; pauseButton.disabled = !active; resumeButton.disabled = !paused; stopButton.disabled = !(active || paused || starting);
    micState.textContent = message || (active ? (speechSupported ? "Microphone active · transcribing" : "Microphone active · transcription unavailable") : paused ? "Recording paused" : "Ready");
  };
  const stopTracks = () => { if (stream) for (const track of stream.getTracks()) track.stop(); stream = null; };
  const stopRecognition = () => { wantsRecognition = false; clearTimeout(restartTimer); restartTimer = null; const r = recognition; recognition = null; recognitionRunning = false; if (r) { r.onend = null; try { r.stop(); } catch {} } interim.textContent = ""; };
  const appendResults = (event) => {
    let finals = "", live = ""; const now = Date.now();
    for (const [key,time] of recentFinals) if (now-time > 4000) recentFinals.delete(key);
    for (let i=event.resultIndex;i<event.results.length;i+=1) { const result=event.results[i], text=result[0]?.transcript?.trim(); if(!text) continue; if(result.isFinal){ const key=text.toLowerCase().replace(/\s+/g," "); if(!recentFinals.has(key)){ recentFinals.set(key,now); finals += `${finals?" ":""}${text}`; } } else live += `${live?" ":""}${text}`; }
    if(finals){ const current=transcript.value.trimEnd(), separator=current ? (/[.!?]["']?$/.test(current)?"\n":" ") : ""; transcript.value=`${current}${separator}${finals}`; transcript.dispatchEvent(new Event("input",{bubbles:true})); }
    interim.textContent=live;
  };
  const scheduleRestart = () => { if(!wantsRecognition || disposed || recordingState!=="recording") return; clearTimeout(restartTimer); restartTimer=setTimeout(()=>{ if(!wantsRecognition || disposed || recordingState!=="recording") return; startRecognition(); },350); };
  const startRecognition = () => {
    if(!speechSupported || !wantsRecognition || disposed || recordingState!=="recording" || recognitionRunning) return;
    try {
      const r=new SpeechRecognition(); recognition=r; r.continuous=true; r.interimResults=true; r.maxAlternatives=1; r.lang="en-IN";
      r.onstart=()=>{ if(recognition!==r) return; recognitionRunning=true; micState.textContent="Microphone active · transcribing"; };
      r.onresult=appendResults;
      r.onerror=(event)=>{ if(recognition!==r) return; if(event.error==="not-allowed"||event.error==="service-not-allowed"){ wantsRecognition=false; micState.textContent="Recording audio · speech recognition permission denied"; toast("Speech recognition permission was denied. Audio recording can continue.","error"); } else if(event.error==="audio-capture"){ wantsRecognition=false; micState.textContent="Recording audio · transcription unavailable"; } else if(event.error!=="aborted"&&event.error!=="no-speech"&&event.error!=="network") console.error("Speech recognition error:",event.error); };
      r.onend=()=>{ if(recognition!==r) return; recognitionRunning=false; recognition=null; interim.textContent=""; scheduleRestart(); };
      r.start();
    } catch(error){ recognitionRunning=false; recognition=null; console.error("Speech recognition start failed:",error); scheduleRestart(); }
  };

  const startRecording = async () => {
    if(recordingState!=="idle") return;
    if(!window.isSecureContext){ toast("Recording requires HTTPS.","error"); return; }
    if(!navigator.mediaDevices?.getUserMedia){ toast("Microphone access is not supported in this browser.","error"); return; }
    setUi("starting","Requesting microphone permission…");
    try { stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}}); }
    catch(error){ setUi("idle", error?.name==="NotAllowedError"||error?.name==="SecurityError" ? "Microphone permission denied · allow microphone access and try again" : "Microphone unavailable"); toast(error?.name==="NotAllowedError"||error?.name==="SecurityError" ? "Microphone permission was denied. Allow microphone access for naadix.xyz, then press Start recording again." : "A usable microphone could not be opened.","error"); return; }
    const track=stream.getAudioTracks()[0]; if(!track || track.readyState!=="live"){ stopTracks(); setUi("idle","No live microphone track"); toast("No live microphone track is available.","error"); return; }
    if(!window.MediaRecorder){ stopTracks(); setUi("idle","Audio recording unsupported in this browser"); toast("This browser cannot create an audio recording. You can still type the transcript.","error"); return; }
    try {
      recorder=new MediaRecorder(stream); recorder.onstart=()=>{ setUi("recording"); wantsRecognition=speechSupported; if(wantsRecognition) startRecognition(); supabase.update("meetings",meeting.id,{status:"LIVE",ended_at:null}).catch(()=>{}); updateMeetingStatus(dialog,"LIVE"); }; recorder.onpause=()=>setUi("paused"); recorder.onresume=()=>{ setUi("recording"); wantsRecognition=speechSupported; startRecognition(); }; recorder.onerror=()=>{ toast("Browser audio recording encountered an error.","error"); }; recorder.onstop=()=>{ stopRecognition(); stopTracks(); recorder=null; setUi("idle","Recording stopped · transcript preserved"); void saveTranscript().catch(()=>{}); }; track.addEventListener("ended",()=>{ if(recordingState!=="idle"){ stopRecognition(); recorder=null; stopTracks(); setUi("idle","Microphone access ended"); toast("Microphone access ended.","error"); } },{once:true}); recorder.start(1000);
    } catch(error){ stopRecognition(); stopTracks(); recorder=null; setUi("idle","Recording could not start"); console.error("MediaRecorder start failed:",error); toast("Recording could not start in this browser.","error"); }
  };
  const pauseRecording=()=>{ if(recorder?.state!=="recording") return; stopRecognition(); try{recorder.pause();}catch{} };
  const resumeRecording=()=>{ if(recorder?.state!=="paused") return; try{recorder.resume();}catch{} };
  const stopRecording=()=>{ if(!recorder || recorder.state==="inactive"){ stopRecognition(); stopTracks(); setUi("idle","Recording stopped · transcript preserved"); return; } stopRecognition(); try{recorder.stop();}catch{stopTracks(); recorder=null; setUi("idle","Recording stopped · transcript preserved");} };

  const saveTranscript=async()=>{ clearTimeout(saveTimer); await supabase.update("meetings",meeting.id,{transcript:transcript.value.trim()}); const label=dialog.querySelector("[data-save-state]"); if(label) label.textContent="Transcript saved."; };
  transcript.addEventListener("input",()=>{ const label=dialog.querySelector("[data-save-state]"); if(label) label.textContent="Saving transcript..."; clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveTranscript().catch(()=>{if(label)label.textContent="Transcript could not be saved.";}),900); });
  startButton.addEventListener("click",startRecording); pauseButton.addEventListener("click",pauseRecording); resumeButton.addEventListener("click",resumeRecording); stopButton.addEventListener("click",stopRecording);

  dialog.querySelector("[data-meeting-notes]").addEventListener("submit",async(event)=>{ event.preventDefault(); const form=event.currentTarget, values=formValues(form), button=form.querySelector('[type="submit"]'); setButtonBusy(button,true,"Saving..."); try{ await supabase.update("meetings",meeting.id,{transcript:transcript.value.trim(),notes:values.notes,outcome:values.outcome||null,action_items:values.action_items.split("\n").map((text)=>text.trim()).filter(Boolean).map((text)=>({text}))}); toast("Meeting record saved."); setButtonBusy(button,false); dialog.querySelector("[data-save-state]").textContent="All changes saved."; await load(); }catch(error){showFormErrors(form.querySelector("[data-form-error]"),[humanError(error)]);setButtonBusy(button,false);} });
  dialog.querySelector("[data-complete-meeting]").addEventListener("click",async()=>{ stopRecording(); const reopening=meeting.status==="COMPLETED"; await supabase.update("meetings",meeting.id,{status:reopening?"PLANNED":"COMPLETED",ended_at:reopening?null:new Date().toISOString(),transcript:transcript.value.trim()}); dialog.close(); toast(reopening?"Meeting reopened.":"Meeting completed."); await load(); });
  dialog.querySelector("[data-edit-meeting]").addEventListener("click",()=>{ stopRecording(); dialog.close(); openMeetingForm(meeting); });
  dialog.querySelector("[data-delete-meeting]").addEventListener("click",async()=>{ if(await confirmAction({title:"Delete meeting?",message:"The transcript and meeting record will be permanently removed."})){ stopRecording(); await supabase.remove("meetings",meeting.id); dialog.close(); toast("Meeting deleted."); await load(); } });
  const handlePageHide=()=>stopRecording(); window.addEventListener("pagehide",handlePageHide);
  dialog.addEventListener("close",()=>{ disposed=true; stopRecording(); window.removeEventListener("pagehide",handlePageHide); clearTimeout(saveTimer); if(transcript.value.trim()!==(meeting.transcript||"").trim()) supabase.update("meetings",meeting.id,{transcript:transcript.value.trim()}).catch(()=>{}); },{once:true});
  setUi("idle", speechSupported ? "Ready · microphone requested only when you start" : "Ready · live transcription unsupported in this browser");
}

function updateMeetingStatus(dialog,status){ const badge=dialog.querySelector("[data-meeting-status]"); if(!badge)return; badge.dataset.status=status; badge.textContent=status==="LIVE"?"Live":status==="COMPLETED"?"Completed":"Planned"; }
