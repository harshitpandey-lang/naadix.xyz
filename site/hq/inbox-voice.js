const attached = new WeakSet();
let activeRecognition = null;
let shouldListen = false;
let restartTimer = null;

function ensureStyles() {
  if (document.querySelector('link[data-inbox-enhancements]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/hq/inbox-enhancements.css';
  link.dataset.inboxEnhancements = 'true';
  document.head.append(link);
}

function decorate(form) {
  if (!form || attached.has(form)) return;
  attached.add(form);
  ensureStyles();
  form.closest('.inbox-capture')?.classList.add('nx-capture');
  const textarea = form.querySelector('textarea[name="content"]');
  const footer = form.querySelector('.capture-footer');
  if (!textarea || !footer) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const actions = document.createElement('div');
  actions.className = 'capture-actions';
  const captureButton = footer.querySelector('button[type="submit"]');
  if (captureButton) actions.append(captureButton);

  if (!SpeechRecognition) {
    const note = document.createElement('span');
    note.className = 'subtle';
    note.textContent = 'Voice unavailable in this browser';
    actions.prepend(note);
    footer.append(actions);
    return;
  }

  const voiceButton = document.createElement('button');
  voiceButton.type = 'button';
  voiceButton.className = 'quiet-button compact voice-toggle';
  voiceButton.setAttribute('aria-pressed', 'false');
  voiceButton.innerHTML = '<span>Start dictation</span>';
  const state = document.createElement('span');
  state.className = 'voice-state';
  state.setAttribute('aria-live', 'polite');
  const interim = document.createElement('p');
  interim.className = 'voice-interim';
  interim.setAttribute('aria-live', 'polite');
  textarea.insertAdjacentElement('afterend', interim);
  form.insertBefore(state, footer);
  actions.prepend(voiceButton);
  footer.append(actions);

  function setUi(mode, message = '') {
    const on = mode === 'active' || mode === 'starting' || mode === 'restarting';
    voiceButton.setAttribute('aria-pressed', String(on));
    voiceButton.classList.toggle('is-listening', on);
    voiceButton.querySelector('span').textContent = on ? 'Stop dictation' : 'Start dictation';
    state.dataset.state = mode;
    state.textContent = message || (mode === 'active' ? 'Listening · speak naturally' : mode === 'restarting' ? 'Reconnecting…' : '');
  }

  function stop() {
    shouldListen = false;
    clearTimeout(restartTimer);
    restartTimer = null;
    const current = activeRecognition;
    activeRecognition = null;
    if (current) {
      current.onend = null;
      try { current.stop(); } catch {}
    }
    interim.textContent = '';
    setUi('idle');
  }

  function start() {
    const recognition = new SpeechRecognition();
    activeRecognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-IN';
    recognition.onstart = () => setUi('active');
    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim();
        if (!text) continue;
        if (result.isFinal) finalChunk += `${finalChunk ? ' ' : ''}${text}`;
        else interimChunk += `${interimChunk ? ' ' : ''}${text}`;
      }
      if (finalChunk) {
        const current = textarea.value.trimEnd();
        const separator = current ? (/[.!?]["']?$/.test(current) ? '\n' : ' ') : '';
        textarea.value = `${current}${separator}${finalChunk}`;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      interim.textContent = interimChunk ? `Hearing: ${interimChunk}` : '';
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListen = false;
        setUi('denied', 'Microphone blocked · enable it in site permissions');
        interim.textContent = 'Text capture still works normally.';
        return;
      }
      if (event.error === 'audio-capture') {
        shouldListen = false;
        setUi('error', 'No usable microphone detected');
        return;
      }
      setUi('error', 'Voice service unavailable · text capture still works');
    };
    recognition.onend = () => {
      if (!shouldListen) return;
      setUi('restarting');
      clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (!shouldListen) return;
        try { start(); activeRecognition.start(); }
        catch { shouldListen = false; setUi('error', 'Voice capture stopped · press Start dictation to retry'); }
      }, 250);
    };
    recognition.start();
  }

  voiceButton.addEventListener('click', () => {
    if (shouldListen) {
      stop();
      return;
    }
    shouldListen = true;
    setUi('starting', 'Requesting microphone…');
    try { start(); }
    catch { shouldListen = false; setUi('error', 'Voice capture could not start'); }
  });
  form.addEventListener('submit', stop, { capture: true });
  window.addEventListener('pagehide', stop, { once: true });
}

export function setupVoiceCapture() {
  const scan = () => document.querySelectorAll('[data-inbox-capture]').forEach(decorate);
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.querySelector('#hq-root') || document.body, { childList: true, subtree: true });
}
