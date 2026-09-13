const RULES = [
  { priority: 'high', category: 'Deadline', pattern: /\b(urgent|asap|today|tomorrow|deadline|due\s+(today|tomorrow)|before\s+\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i },
  { priority: 'high', category: 'Action', pattern: /\b(please reply|need your reply|response needed|approval|required|blocked|blocking|follow up|follow-up)\b/i },
  { priority: 'high', category: 'Finance', pattern: /\b(invoice|payment|paid|overdue|refund|receipt|billing)\b/i },
  { priority: 'normal', category: 'Meeting', pattern: /\b(meeting|call|schedule|reschedule|calendar|appointment)\b/i },
  { priority: 'normal', category: 'Lead', pattern: /\b(client|customer|lead|prospect|proposal|demo|project inquiry)\b/i },
  { priority: 'normal', category: 'Project', pattern: /\b(project|milestone|launch|deliverable|bug|issue)\b/i },
];

function classify(text) {
  for (const rule of RULES) if (rule.pattern.test(text)) return { priority: rule.priority, category: rule.category };
  return { priority: 'low', category: 'General' };
}

function summarise(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 112) return clean;
  return `${clean.slice(0, 109).replace(/\s+\S*$/, '')}…`;
}

function enhance() {
  const stack = document.querySelector('.inbox-stack');
  const container = document.querySelector('#inbox-items');
  if (!stack || !container || stack.dataset.intelligenceReady === 'true') return;
  stack.dataset.intelligenceReady = 'true';

  const cards = [...container.querySelectorAll('.inbox-item')];
  const classified = cards.map((card) => {
    const text = card.querySelector('.inbox-copy p')?.textContent?.trim() || '';
    const meta = classify(text);
    card.dataset.priority = meta.priority;
    card.dataset.category = meta.category;
    const copy = card.querySelector('.inbox-copy');
    if (copy && !copy.querySelector('.nx-inbox-meta')) {
      const row = document.createElement('div');
      row.className = 'nx-inbox-meta';
      row.innerHTML = `<span class="priority-chip" data-priority="${meta.priority}">${meta.priority === 'high' ? 'Needs attention' : meta.priority === 'normal' ? 'Review' : 'Low signal'}</span><span>${meta.category}</span>`;
      copy.prepend(row);
    }
    return { card, text, ...meta };
  });

  const high = classified.filter((item) => item.priority === 'high');
  const normal = classified.filter((item) => item.priority === 'normal');
  const toolbar = document.createElement('section');
  toolbar.className = 'nx-inbox-toolbar';
  toolbar.innerHTML = `<div class="nx-inbox-stats"><span><strong>${classified.length}</strong> inbox</span><span><strong>${high.length}</strong> attention</span><span><strong>${normal.length}</strong> review</span></div><div class="nx-inbox-filters" role="group" aria-label="Inbox filters"><button class="quiet-button compact is-active" type="button" data-filter="all">All</button><button class="quiet-button compact" type="button" data-filter="high">Attention</button><button class="quiet-button compact" type="button" data-filter="normal">Review</button><button class="quiet-button compact" type="button" data-filter="low">Low signal</button><button class="hq-action compact" type="button" data-founder-brief>Founder brief</button></div>`;
  stack.querySelector('.section-heading')?.insertAdjacentElement('afterend', toolbar);

  toolbar.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    toolbar.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
    const filter = button.dataset.filter;
    classified.forEach((item) => { item.card.hidden = filter !== 'all' && item.priority !== filter; });
  }));

  toolbar.querySelector('[data-founder-brief]')?.addEventListener('click', () => {
    document.querySelector('.nx-founder-brief')?.remove();
    const panel = document.createElement('section');
    panel.className = 'nx-founder-brief';
    const attention = high.slice(0, 5);
    panel.innerHTML = `<header><div><p class="eyebrow">Founder brief</p><h3>${attention.length ? `${attention.length} item${attention.length === 1 ? '' : 's'} deserve attention` : 'No urgent signals'}</h3></div><button class="quiet-button compact" type="button" data-close-brief>Close</button></header>${attention.length ? `<ol>${attention.map((item) => `<li><span>${item.category}</span><p>${summarise(item.text)}</p></li>`).join('')}</ol>` : '<p class="subtle">Nothing in the current inbox matches the high-signal rules. Review items remain available below.</p>'}<footer><span>Local triage · no message content sent to an external AI</span></footer>`;
    toolbar.insertAdjacentElement('afterend', panel);
    panel.querySelector('[data-close-brief]').addEventListener('click', () => panel.remove());
  });
}

export function setupInboxIntelligence() {
  const scan = () => enhance();
  scan();
  const observer = new MutationObserver(() => {
    const stack = document.querySelector('.inbox-stack');
    if (stack && stack.dataset.intelligenceReady !== 'true') enhance();
  });
  observer.observe(document.querySelector('#hq-root') || document.body, { childList: true, subtree: true });
}
