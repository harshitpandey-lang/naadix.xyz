import { esc, formatDate, formatDateTime, localInputValue } from "./core.js";
import { confirmAction, emptyState, errorState, formValues, humanError, icon, mountShell, openDialog, setButtonBusy, showFormErrors, skeleton, toast } from "./ui.js";
import { supabase } from "./supabase.js";

let shell;
let saveTimer = null;
const state = { meetings: [] };

const meetingTime = (meeting) => meeting?.starts_at || meeting?.scheduled_at || "";
const parseLocalDateTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};
const attendeesValue = (value) => String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);

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
      select: "id,title,starts_at,ends_at,scheduled_at,ended_at,attendees,status,transcript,notes,outcome,action_items,created_at,updated_at",
      filters: { starts_at: `gte.${from.toISOString()}` },
      order: "starts_at.desc",
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
  const upcoming = state.meetings.filter((meeting) => meeting.status === "SCHEDULED" && new Date(meetingTime(meeting)) >= now).sort((a, b) => new Date(meetingTime(a)) - new Date(meetingTime(b)));
  const completed = state.meetings.filter((meeting) => meeting.status === "COMPLETED");
  const withTranscript = state.meetings.filter((meeting) => (meeting.transcript || "").trim()).length;
  shell.content.innerHTML = `<section class="summary-grid" aria-label="Meeting summary"><article><span>Upcoming</span><strong>${upcoming.length}</strong><small>${upcoming[0] ? formatDateTime(meetingTime(upcoming[0])) : "Nothing scheduled"}</small></article><article><span>Recorder</span><strong>Ready</strong><small>Start inside a meeting</small></article><article><span>Working records</span><strong>${withTranscript}</strong><small>${completed.length} completed meetings</small></article></section><section class="workspace-panel meeting-index"><header class="workspace-panel-head"><div><p class="eyebrow">Meeting log</p><h2>Conversations and transcripts</h2></div></header>${state.meetings.length ? `<div class="meeting-list">${state.meetings.map(meetingRow).join("")}</div>` : emptyState("No meetings yet", "Create a meeting to capture its transcript, notes, outcome, and actions.", "New meeting")}</section>`;
  shell.content.querySelector("[data-empty-action]")?.addEventListener("click", () => openMeetingForm());
  shell.content.querySelectorAll("[data-open-meeting]").forEach((button) => button.addEventListener("click", () => openMeetingWorkspace(state.meetings.find((meeting) => meeting.id === button.dataset.openMeeting))));
}

function meetingRow(meeting) {
  const startsAt = meetingTime(meeting);
  const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
  const actionCount = Array.isArray(meeting.action_items) ? meeting.action_items.length : 0;
  return `<button class="meeting-row" type="button" data-open-meeting="${meeting.id}"><span class="meeting-date"><strong>${formatDate(startsAt, { day: "2-digit" })}</strong><small>${formatDate(startsAt, { month: "short" })}</small></span><span class="meeting-row-copy"><strong>${esc(meeting.title)}</strong><small>${formatDateTime(startsAt)}${attendeeCount ? ` &middot; ${attendeeCount} attendee${attendeeCount === 1 ? "" : "s"}` : ""}${actionCount ? ` &middot; ${actionCount} action${actionCount === 1 ? "" : "s"}` : ""}</small></span><span class="status-pill" data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span>${icon("chevron")}</button>`;
}

function openMeetingForm(meeting = null) {
  const attendees = Array.isArray(meeting?.attendees) ? meeting.attendees.join(", ") : "";
  const dialog = openDialog({
    title: meeting ? "Edit meeting" : "New meeting",
    description: "Set the context before the conversation starts.",
    className: "form-dialog",
    content: `<form class="entity-form" data-meeting-form><div class="form-grid"><label class="span-2">Meeting title<input name="title" maxlength="180" required value="${esc(meeting?.title || "")}"></label><label>Scheduled for<input name="starts_at" type="datetime-local" required value="${localInputValue(meetingTime(meeting) || new Date())}"></label><label>Attendees<input name="attendees" value="${esc(attendees)}" placeholder="Comma-separated names"></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><button class="quiet-button" type="button" data-cancel>Cancel</button><button class="hq-action" type="submit">${meeting ? "Save changes" : "Create meeting"}</button></div></form>`,
  });
  dialog.querySelector("[data-cancel]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-meeting-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const error = form.querySelector("[data-form-error]");
    const startsAt = parseLocalDateTime(values.starts_at);
    if (!values.title) return showFormErrors(error, ["Meeting title is required."]);
    if (!startsAt) return showFormErrors(error, ["Choose a valid meeting date and time."]);
    const timestamp = startsAt.toISOString();
    const payload = {
      title: values.title,
      starts_at: timestamp,
      scheduled_at: timestamp,
      attendees: attendeesValue(values.attendees),
      status: meeting?.status || "SCHEDULED",
    };
    const button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, meeting ? "Saving..." : "Creating...");
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

export function applyRecognitionResults(event, transcript, interim, processedFinalResults = new Set()) {
  let finalChunk = "", interimChunk = "";
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const text = result[0]?.transcript?.trim();
    if (!text) continue;
    if (result.isFinal) {
      const signature = text.toLowerCase().replace(/\s+/g, " ");
      if (!processedFinalResults.has(signature)) {
        processedFinalResults.add(signature);
        finalChunk += `${finalChunk ? " " : ""}${text}`;
      }
    } else interimChunk += `${interimChunk ? " " : ""}${text}`;
  }
  if (finalChunk) {
    const current = transcript.value.trimEnd();
    if (!current.endsWith(finalChunk)) {
      const separator = current ? (/[.!?]["']?$/.test(current) ? "\n" : " ") : "";
      transcript.value = `${current}${separator}${finalChunk}`;
      transcript.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  interim.textContent = interimChunk;
}

const normalizedWords = (value) => String(value || "").toLowerCase().replace(/\[[^\]]+\]/g, " ").replace(/[^a-z0-9']+/g, " ").trim().split(/\s+/).filter(Boolean);

export function dedupeWhisperSegment(existingTranscript, candidate, recentSegments = []) {
  const clean = String(candidate || "").replace(/\s+/g, " ").trim();
  if (!clean || /^\[(blank_audio|silence|music|inaudible)\]$/i.test(clean)) return "";
  const words = normalizedWords(clean);
  if (!words.length) return "";
  const signature = words.join(" ");
  const recent = recentSegments.map((value) => normalizedWords(value).join(" ")).filter(Boolean);
  if (recent.some((value) => value === signature || (signature.length > 12 && value.includes(signature)))) return "";
  const priorWords = normalizedWords(existingTranscript).slice(-80);
  const priorSignature = priorWords.join(" ");
  if (words.length >= 3 && priorSignature.includes(signature)) return "";
  if (words.length >= 6) {
    const grams = Array.from({ length: words.length - 2 }, (_, index) => words.slice(index, index + 3).join(" "));
    const matching = grams.filter((gram) => priorSignature.includes(gram)).length;
    if (matching / grams.length >= 0.7) return "";
  }
  const maximum = Math.min(priorWords.length, words.length);
  let overlap = 0;
  for (let count = maximum; count >= 3; count -= 1) {
    if (priorWords.slice(-count).join(" ") === words.slice(0, count).join(" ")) { overlap = count; break; }
  }
  return overlap === words.length ? "" : clean.split(/\s+/).slice(overlap).join(" ");
}

const parseSpeakerSegments = (value) => String(value || "").split("\n").map((line, index) => {
  const match = line.trim().match(/^(Me|Client|Other):\s+(.+)$/i);
  if (!match) return null;
  const speaker = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  return { id: `saved-${index}`, speakerId: speaker, text: match[2].trim(), renderedText: line.trim(), source: "saved", finalized: true };
}).filter(Boolean);

function openMeetingWorkspace(meeting) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = Boolean(SpeechRecognition);
  const recordingSupported = Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia);
  const actions = Array.isArray(meeting.action_items) ? meeting.action_items.map((item) => typeof item === "string" ? item : item?.text).filter(Boolean).join("\n") : "";
  const dialog = openDialog({
    title: meeting.title,
    description: formatDateTime(meetingTime(meeting)),
    className: "meeting-dialog",
    content: `<div class="meeting-workspace"><div class="meeting-toolbar"><span class="status-pill" data-meeting-status data-status="${meeting.status}">${meeting.status === "LIVE" ? "Live" : meeting.status === "COMPLETED" ? "Completed" : "Planned"}</span><span class="subtle">${meeting.attendees?.length ? esc(meeting.attendees.join(", ")) : "No attendees listed"}</span><div class="meeting-toolbar-actions"><button class="quiet-button compact" type="button" data-edit-meeting>Edit details</button><button class="danger-button compact" type="button" data-delete-meeting>Delete</button></div></div><section class="transcript-panel"><header><div><p class="eyebrow">Meeting recorder</p><h3>Conversation record</h3><p class="local-transcription-note">Transcription runs locally on this device.</p></div><div class="transcript-controls"><span class="recording-indicator" data-recording hidden><i></i><span data-recording-label>Recording</span></span><span class="transcription-state" data-mic-state>Ready</span><button class="hq-action compact" type="button" data-start-recording>Start recording</button><button class="quiet-button compact" type="button" data-retry-transcription hidden>Retry</button><button class="quiet-button compact" type="button" data-pause-recording disabled>Pause</button><button class="quiet-button compact" type="button" data-resume-recording disabled>Resume</button><button class="danger-button compact" type="button" data-stop-recording disabled>Stop recording</button></div></header>${!recordingSupported ? '<p class="browser-note">Audio recording is unavailable in this browser. You can still type or paste the transcript.</p>' : ""}<textarea data-transcript rows="15" placeholder="Finalized transcript appears here. Existing text is preserved.">${esc(meeting.transcript || "")}</textarea><p class="interim-transcript" data-interim aria-live="polite"></p><div class="transcript-segments" data-transcript-segments hidden><p class="eyebrow">Optional speaker labels</p><div data-transcript-segment-list></div></div></section><form class="meeting-notes" data-meeting-notes><div class="form-grid"><label>Outcome<textarea name="outcome" rows="4" placeholder="Decision or result">${esc(meeting.outcome || "")}</textarea></label><label>Action items<textarea name="action_items" rows="4" placeholder="One action per line">${esc(actions)}</textarea></label><label class="span-2">Private notes<textarea name="notes" rows="4" placeholder="Context, follow-ups, and observations">${esc(meeting.notes || "")}</textarea></label></div><p class="form-error" data-form-error hidden></p><div class="dialog-actions"><span class="subtle" data-save-state>Changes are saved when you press save.</span><button class="quiet-button" type="submit">Save record</button><button class="hq-action" type="button" data-complete-meeting>${meeting.status === "COMPLETED" ? "Reopen meeting" : "Complete meeting"}</button></div></form></div>`,
  });

  const transcript = dialog.querySelector("[data-transcript]");
  const interim = dialog.querySelector("[data-interim]");
  const indicator = dialog.querySelector("[data-recording]");
  const indicatorLabel = dialog.querySelector("[data-recording-label]");
  const micState = dialog.querySelector("[data-mic-state]");
  const startButton = dialog.querySelector("[data-start-recording]");
  const retryButton = dialog.querySelector("[data-retry-transcription]");
  const pauseButton = dialog.querySelector("[data-pause-recording]");
  const resumeButton = dialog.querySelector("[data-resume-recording]");
  const stopButton = dialog.querySelector("[data-stop-recording]");
  const segmentPanel = dialog.querySelector("[data-transcript-segments]");
  const segmentList = dialog.querySelector("[data-transcript-segment-list]");
  let stream = null, recorder = null, recognition = null, restartTimer = null, transcriptionWatchTimer = null, disposed = false, wantsRecognition = false, recognitionRunning = false, recordingState = "idle";
  let recognitionRetryDelay = 350, hasSpeechResult = false;
  let localEngine = null, localReady = false, stopPromise = null;
  const recentFinals = new Map();
  const transcriptSegments = parseSpeakerSegments(transcript.value);
  const recentLocalSegments = [];

  const transcriptStateLabel = (mode, progress) => ({
    preparing: "Preparing transcriptionâ€¦",
    downloading: `Downloading local speech modelâ€¦ ${progress || 0}%`,
    "model-ready": "Preparing transcriptionâ€¦",
    ready: "Ready",
    listening: "Listeningâ€¦",
    transcribing: "Transcribingâ€¦",
    paused: "Paused",
    error: "Transcription error",
  }[mode] || "Ready");

  const setTranscriptionState = (mode, progress) => {
    micState.textContent = transcriptStateLabel(mode, progress);
    micState.dataset.state = mode;
    retryButton.hidden = mode !== "error";
  };

  const dispatchTranscriptInput = () => transcript.dispatchEvent(new Event("input", { bubbles: true }));
  const renderSpeakerSegments = () => {
    segmentPanel.hidden = transcriptSegments.length === 0;
    segmentList.innerHTML = transcriptSegments.map((segment) => `<label class="transcript-segment" data-segment-id="${segment.id}"><span>${esc(segment.text)}</span><select aria-label="Speaker for transcript segment"><option value=""${segment.speakerId ? "" : " selected"}>No label</option>${["Me", "Client", "Other"].map((speaker) => `<option value="${speaker}"${segment.speakerId === speaker ? " selected" : ""}>${speaker}</option>`).join("")}</select></label>`).join("");
    segmentList.querySelectorAll("[data-segment-id]").forEach((row) => row.querySelector("select").addEventListener("change", (event) => {
      const segment = transcriptSegments.find((item) => item.id === row.dataset.segmentId);
      if (!segment) return;
      const previous = segment.renderedText;
      segment.speakerId = event.currentTarget.value || null;
      segment.renderedText = segment.speakerId ? `${segment.speakerId}: ${segment.text}` : segment.text;
      const index = transcript.value.lastIndexOf(previous);
      if (index >= 0) transcript.value = `${transcript.value.slice(0, index)}${segment.renderedText}${transcript.value.slice(index + previous.length)}`;
      dispatchTranscriptInput();
    }));
  };

  const appendFinalSegment = (text, metadata = {}) => {
    const unique = dedupeWhisperSegment(transcript.value, text, recentLocalSegments);
    if (!unique) return;
    const current = transcript.value.trimEnd();
    transcript.value = `${current}${current ? "\n" : ""}${unique}`;
    const segment = { id: `local-${Date.now()}-${transcriptSegments.length}`, speakerId: null, text: unique, renderedText: unique, source: "whisper.cpp", finalized: true, ...metadata };
    transcriptSegments.push(segment);
    recentLocalSegments.push(unique);
    if (recentLocalSegments.length > 12) recentLocalSegments.shift();
    interim.textContent = "";
    renderSpeakerSegments();
    dispatchTranscriptInput();
  };
  renderSpeakerSegments();

  const setUi = (mode, message = "") => {
    recordingState = mode;
    const active = mode === "recording", paused = mode === "paused", starting = mode === "starting";
    indicator.hidden = !(active || paused);
    indicatorLabel.textContent = paused ? "Paused" : "Recording";
    startButton.disabled = active || paused || starting;
    pauseButton.disabled = !active;
    resumeButton.disabled = !paused;
    stopButton.disabled = !(active || paused || starting);
    if (message) micState.textContent = message;
    else if (paused) setTranscriptionState("paused");
    else if (!active && mode === "idle") setTranscriptionState(localReady ? "ready" : "ready");
  };
  const stopTracks = () => { if (stream) for (const track of stream.getTracks()) track.stop(); stream = null; };
  const clearTranscriptionTimers = () => { clearTimeout(restartTimer); clearTimeout(transcriptionWatchTimer); restartTimer = null; transcriptionWatchTimer = null; };
  const armTranscriptionWatch = () => {
    clearTimeout(transcriptionWatchTimer);
    transcriptionWatchTimer = setTimeout(() => {
      if (wantsRecognition && recognitionRunning && !hasSpeechResult && recordingState === "recording") {
        if (!localReady) micState.textContent = "Listeningâ€¦";
      }
    }, 7000);
  };
  const stopRecognition = () => { wantsRecognition = false; clearTranscriptionTimers(); const r = recognition; recognition = null; recognitionRunning = false; if (r) { r.onend = null; r.onerror = null; r.onresult = null; try { r.stop(); } catch {} } interim.textContent = ""; };
  const appendResults = (event) => {
    let finals = "", live = "";
    const now = Date.now();
    for (const [key, time] of recentFinals) if (now - time > 4000) recentFinals.delete(key);
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index], text = result[0]?.transcript?.trim();
      if (!text) continue;
      if (result.isFinal) {
        const key = text.toLowerCase().replace(/\s+/g, " ");
        if (!recentFinals.has(key)) { recentFinals.set(key, now); finals += `${finals ? " " : ""}${text}`; }
      } else live += `${live ? " " : ""}${text}`;
    }
    if (finals) {
      const current = transcript.value.trimEnd(), separator = current ? (/[.!?]["']?$/.test(current) ? "\n" : " ") : "";
      transcript.value = `${current}${separator}${finals}`;
      transcript.dispatchEvent(new Event("input", { bubbles: true }));
    }
    interim.textContent = live;
    if (finals || live) {
      hasSpeechResult = true;
      recognitionRetryDelay = 350;
      if (!localReady) micState.textContent = finals ? "Ready" : "Listeningâ€¦";
      armTranscriptionWatch();
    }
  };
  const scheduleRestart = (delay = recognitionRetryDelay) => {
    if(!wantsRecognition || disposed || recordingState!=="recording") return;
    clearTimeout(restartTimer);
    if (!localReady) micState.textContent = "Listeningâ€¦";
    restartTimer = setTimeout(() => {
      if(!wantsRecognition || disposed || recordingState!=="recording") return;
      startRecognition();
    }, delay);
  };
  const startRecognition = () => {
    if (!speechSupported || !wantsRecognition || disposed || recordingState !== "recording" || recognitionRunning) return;
    try {
      const r = new SpeechRecognition();
      recognition = r;
      r.continuous=true; r.interimResults=true; r.maxAlternatives=1; r.lang="en-IN";
      r.onstart = () => { if (recognition !== r) return; recognitionRunning = true; armTranscriptionWatch(); };
      r.onresult = (event) => {
        if (!localReady) { appendResults(event); return; }
        let enhancement = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) enhancement += `${enhancement ? " " : ""}${event.results[index][0]?.transcript?.trim() || ""}`;
        if (enhancement) interim.textContent = enhancement;
      };
      r.onerror = (event) => {
        if (recognition !== r) return;
        if (event.error==="not-allowed"||event.error==="service-not-allowed") {
          wantsRecognition = false;
          if (!localReady) micState.textContent = "Transcription error";
        } else if (event.error === "audio-capture") {
          wantsRecognition = false;
          if (!localReady) micState.textContent = "Transcription error";
        } else if (event.error === "no-speech") {
          if (!localReady) micState.textContent = "Listeningâ€¦";
        } else if (event.error === "network") {
          recognitionRetryDelay = Math.min(Math.round(recognitionRetryDelay * 1.7), 2500);
          if (!localReady) micState.textContent = "Listeningâ€¦";
        } else if (event.error !== "aborted") console.error("Speech recognition error:", event.error);
      };
      r.onend=()=>{ if (recognition !== r) return; recognitionRunning = false; recognition = null; interim.textContent = ""; clearTimeout(transcriptionWatchTimer); scheduleRestart(); };
      r.start();
    } catch (error) {
      recognitionRunning = false;
      recognition = null;
      console.error("Speech recognition start failed:", error);
      scheduleRestart();
    }
  };

  const createLocalEngine = async () => {
    const { LocalWhisperTranscriber } = await import("./whisper-local.js");
    localEngine?.destroy();
    localEngine = new LocalWhisperTranscriber({
      onState: setTranscriptionState,
      onTemporary: (text) => { if (text) interim.textContent = text; },
      onSegment: appendFinalSegment,
      onError: (error) => {
        console.error("Local transcription failed:", error);
        localReady = false;
        setTranscriptionState("error");
        toast(error?.message || "Local transcription failed. Press Retry.", "error");
      },
    });
    await localEngine.prepare();
    localReady = true;
  };

  const startRecording = async () => {
    if (recordingState !== "idle") return;
    if (!window.isSecureContext) { toast("Recording requires HTTPS.", "error"); return; }
    if (!navigator.mediaDevices?.getUserMedia) { toast("Microphone access is not supported in this browser.", "error"); return; }
    setUi("starting");
    micState.textContent = "Requesting microphone permissionâ€¦";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (error) {
      setUi("idle", error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "Microphone permission denied - allow microphone access and try again" : "Microphone unavailable");
      toast(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "Microphone permission was denied. Allow microphone access for naadix.xyz, then press Start recording again." : "A usable microphone could not be opened.", "error");
      return;
    }
    setTranscriptionState("preparing");
    try {
      await createLocalEngine();
    } catch (error) {
      console.error("Local transcription initialization failed:", error);
      localReady = false;
      stopTracks();
      setUi("idle");
      setTranscriptionState("error");
      retryButton.hidden = false;
      toast(error?.message || "Local transcription could not be prepared on this device.", "error");
      return;
    }
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== "live") { stopTracks(); setUi("idle", "No live microphone track"); toast("No live microphone track is available.", "error"); return; }
    if (!window.MediaRecorder) { stopTracks(); setUi("idle", "Audio recording unsupported in this browser"); toast("This browser cannot create an audio recording. You can still type the transcript.", "error"); return; }
    try {
      await localEngine.start(stream);
      recorder = new MediaRecorder(stream);
      recorder.onstart=()=>{ setUi("recording"); setTranscriptionState("listening"); wantsRecognition = speechSupported; hasSpeechResult = false; recognitionRetryDelay = 350; if (wantsRecognition) startRecognition(); supabase.update("meetings", meeting.id, { ended_at: null, ends_at: null }).catch(() => {}); updateMeetingStatus(dialog, "LIVE"); };
      recorder.onpause = () => { setUi("paused"); setTranscriptionState("paused"); };
      recorder.onresume = () => { setUi("recording"); setTranscriptionState("listening"); wantsRecognition = speechSupported; if (wantsRecognition) startRecognition(); };
      recorder.onerror = () => { toast("Browser audio recording encountered an error.", "error"); };
      track.addEventListener("ended", () => { if (recordingState !== "idle" && !stopPromise) { void stopRecording(); toast("Microphone access ended.", "error"); } }, { once: true });
      recorder.start(1000);
    } catch (error) {
      stopRecognition(); stopTracks(); recorder = null; setUi("idle", "Recording could not start");
      localReady = false;
      setTranscriptionState("error");
      retryButton.hidden = false;
      console.error("MediaRecorder start failed:", error);
      toast("Recording could not start in this browser.", "error");
    }
  };
  const pauseRecording = async () => { if (recorder?.state !== "recording") return; stopRecognition(); try { recorder.pause(); } catch {} await localEngine?.pause(); };
  const resumeRecording = async () => { if (recorder?.state !== "paused") return; await localEngine?.resume(); try { recorder.resume(); } catch {} };
  const stopRecording = async () => {
    if (stopPromise) return stopPromise;
    stopPromise = (async () => {
      stopRecognition();
      if (localEngine && (recordingState === "recording" || recordingState === "paused")) {
        setTranscriptionState("transcribing");
        try { await localEngine.finalize(); } catch (error) { console.error("Final local transcription failed:", error); setTranscriptionState("error"); }
      }
      const activeRecorder = recorder;
      if (activeRecorder && activeRecorder.state !== "inactive") {
        await new Promise((resolve) => {
          activeRecorder.addEventListener("stop", resolve, { once: true });
          try { activeRecorder.stop(); } catch { resolve(); }
        });
      }
      recorder = null;
      stopTracks();
      setUi("idle");
      if (localReady) setTranscriptionState("ready");
      await saveTranscript().catch(() => {});
    })().finally(() => { stopPromise = null; });
    return stopPromise;
  };

  const saveTranscript = async () => {
    clearTimeout(saveTimer);
    await supabase.update("meetings", meeting.id, { transcript: transcript.value.trim() });
    const label = dialog.querySelector("[data-save-state]");
    if (label) label.textContent = "Transcript saved.";
  };
  transcript.addEventListener("input", () => {
    const label = dialog.querySelector("[data-save-state]");
    if (label) label.textContent = "Saving transcript...";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveTranscript().catch(() => { if (label) label.textContent = "Transcript could not be saved."; }), 900);
  });
  startButton.addEventListener("click", startRecording);
  retryButton.addEventListener("click", async () => {
    retryButton.hidden = true;
    try {
      await createLocalEngine();
      if (stream && (recordingState === "recording" || recordingState === "paused")) {
        await localEngine.start(stream);
        if (recordingState === "paused") await localEngine.pause();
      }
    } catch (error) {
      setTranscriptionState("error");
      toast(error?.message || "Local transcription retry failed.", "error");
    }
  });
  pauseButton.addEventListener("click", pauseRecording);
  resumeButton.addEventListener("click", resumeRecording);
  stopButton.addEventListener("click",stopRecording);

  dialog.querySelector("[data-meeting-notes]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget, values = formValues(form), button = form.querySelector('[type="submit"]');
    setButtonBusy(button, true, "Saving...");
    try {
      await supabase.update("meetings", meeting.id, { transcript: transcript.value.trim(), notes: values.notes, outcome: values.outcome || null, action_items: values.action_items.split("\n").map((text) => text.trim()).filter(Boolean).map((text) => ({ text })) });
      toast("Meeting record saved.");
      setButtonBusy(button, false);
      dialog.querySelector("[data-save-state]").textContent = "All changes saved.";
      await load();
    } catch (error) {
      showFormErrors(form.querySelector("[data-form-error]"), [humanError(error)]);
      setButtonBusy(button, false);
    }
  });
  dialog.querySelector("[data-complete-meeting]").addEventListener("click", async () => {
    await stopRecording();
    const reopening = meeting.status === "COMPLETED";
    const endedAt = reopening ? null : new Date().toISOString();
    await supabase.update("meetings", meeting.id, { status: reopening ? "SCHEDULED" : "COMPLETED", ended_at: endedAt, ends_at: endedAt, transcript: transcript.value.trim() });
    dialog.close();
    toast(reopening ? "Meeting reopened." : "Meeting completed.");
    await load();
  });
  dialog.querySelector("[data-edit-meeting]").addEventListener("click", async () => { await stopRecording(); dialog.close(); openMeetingForm(meeting); });
  dialog.querySelector("[data-delete-meeting]").addEventListener("click", async () => {
    if (await confirmAction({ title: "Delete meeting?", message: "The transcript and meeting record will be permanently removed." })) {
      await stopRecording();
      await supabase.remove("meetings", meeting.id);
      dialog.close();
      toast("Meeting deleted.");
      await load();
    }
  });
  const handlePageHide = () => { stopRecognition(); localEngine?.destroy(); try { recorder?.stop(); } catch {} stopTracks(); };
  window.addEventListener("pagehide", handlePageHide);
  dialog.addEventListener("close", () => {
    disposed = true;
    stopRecognition();
    localEngine?.destroy();
    try { recorder?.stop(); } catch {}
    stopTracks();
    window.removeEventListener("pagehide", handlePageHide);
    clearTimeout(saveTimer);
    if (transcript.value.trim() !== (meeting.transcript || "").trim()) supabase.update("meetings", meeting.id, { transcript: transcript.value.trim() }).catch(() => {});
  }, { once: true });
  setUi("idle");
  setTranscriptionState("ready");
}

function updateMeetingStatus(dialog, status) {
  const badge = dialog.querySelector("[data-meeting-status]");
  if (!badge) return;
  badge.dataset.status = status;
  badge.textContent = status === "LIVE" ? "Live" : status === "COMPLETED" ? "Completed" : "Planned";
}


