import {
  company as c,
  navigation,
  capabilities,
  solutions,
  method,
  labs,
  faq,
} from "./data.mjs";
export const escape = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (x) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        x
      ],
  );
const link = (text, href, cls = "text-link") =>
  `<a class="${cls}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;
const label = (n, text) => `<p class="eyebrow"><span>${n}</span> / ${text}</p>`;
const intro = (n, title, description) =>
  `${label(n, "NAADIX / SYSTEMS FOR WORK")}<h1>${title}</h1><p class="lede">${description}</p>`;
const options = (values) =>
  values.map((x) => `<option>${escape(x)}</option>`).join("");
export function layout(path, title, description, body) {
  const url = c.domain + path;
  const socials = `${link("GitHub", c.github)}${c.linkedin ? link("LinkedIn", c.linkedin) : ""}${link("Email", `mailto:${c.email}`)}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: c.name,
      url: c.domain,
      email: c.email,
      founder: { "@type": "Person", name: c.founder },
      sameAs: [c.github, ...(c.linkedin ? [c.linkedin] : [])],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: c.name,
      url: c.domain,
    },
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#050505"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:image" content="${c.domain}/assets/social-card.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${c.domain}/assets/social-card.png"><link rel="icon" href="/assets/naadix-logo.png" type="image/png"><link rel="apple-touch-icon" href="/assets/naadix-logo.png"><link rel="stylesheet" href="/assets/site.css"><script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script><script type="module" src="/assets/app.js"></script></head><body>
 <a class="skip" href="#main">Skip to content</a><div class="reading-progress" aria-hidden="true"></div>
 <header class="header"><a class="brand" href="/" aria-label="NaadiX home"><span class="brand-mark" aria-hidden="true"><img src="/assets/naadix-logo.png" alt=""></span><span class="brand-word">NAADIX</span></a><nav class="desktop-nav" aria-label="Primary">${navigation.map(([t, h]) => `<a href="${h}" ${path === h ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav><div class="nav-actions"><button class="command-trigger" aria-label="Open command menu" title="Ctrl or Command K">⌘ K</button>${link("Discuss a project", "/contact/", "button small")}<button id="menu-toggle" aria-expanded="false" aria-controls="mobile-menu">Menu</button></div></header>
 <nav id="mobile-menu" aria-label="Mobile" hidden>${link("Home", "/")}${navigation.map(([t, h]) => link(t, h)).join("")}${link("Contact", "/contact/")}</nav>
 <main id="main">${body}</main>
 <footer><div class="footer-top"><div><a class="brand" href="/" aria-label="NaadiX home"><span class="brand-mark" aria-hidden="true"><img src="/assets/naadix-logo.png" alt=""></span><span class="brand-word">NAADIX</span></a><p>${c.tagline}<br>Useful AI. Connected to real work.</p></div><nav aria-label="Footer">${navigation.map(([t, h]) => link(t, h)).join("")}${link("FAQ", "/faq/")}${link("Privacy", "/privacy/")}</nav><div>${link("Start a conversation", "/contact/", "button")}<div class="socials">${socials}</div><button data-copy-email class="text-link">Copy email <span aria-hidden="true">↗</span></button></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${c.name}</span><span>INDEPENDENT THINKING. CONNECTED SYSTEMS.</span><span>naadix.xyz</span></div></footer>
 <dialog id="command-menu" aria-labelledby="command-title"><div class="dialog-top"><h2 id="command-title">Where next?</h2><button data-close-command aria-label="Close command menu">Esc</button></div><label for="command-search">Search pages and actions</label><input id="command-search" type="search" autocomplete="off"><nav aria-label="Commands">${link("Home", "/")}${navigation.map(([t, h]) => link(t, h)).join("")}${link("Discuss a project", "/contact/")}${link("Open GitHub", c.github)}${c.linkedin ? link("Open LinkedIn", c.linkedin) : ""}<button data-copy-email>Copy email</button></nav><p id="command-empty" hidden>No matching commands.</p></dialog><div class="toast" role="status" aria-live="polite"></div><div id="precision-cursor" aria-hidden="true"></div></body></html>`;
}
export function capabilitySection(full = false) {
  return `<section class="section" id="capabilities"><div class="section-heading">${label("02", "CAPABILITIES")}<h2>Useful intelligence.<br><span>Built around you.</span></h2><p>From finding the right opportunity to making a system work in the real world.</p></div><div class="capability-grid">${capabilities.map(([name, tag, desc, output], i) => `<details class="capability"><summary><span class="micro-diagram" aria-hidden="true">${["◎—○", "◇→◇", "○─┬─○", "[ ◇ ]", "⋮─◎", "○⇄○"][i]}</span><span class="number">0${i + 1}</span><h3>${name}</h3><p>${tag}</p><span class="explore">Explore <span aria-hidden="true">+</span></span></summary><div class="detail-copy"><p>${desc}</p><p><strong>What this can include</strong><br>${output}</p>${link("Discuss this capability", `/contact/?interest=${encodeURIComponent(name)}`)}</div></details>`).join("")}</div>${full ? '<p class="note">Scope, tools and delivery approach are agreed after discovery. Capabilities describe what we can design, not a list of past client deployments.</p>' : ""}</section>`;
}
export function architecture() {
  const nodes = [
    [
      "Website lead",
      "TRIGGER",
      "A new inquiry starts the workflow. Only agreed fields enter the system.",
    ],
    [
      "Qualification",
      "AI",
      "Evaluate fit against defined criteria. Uncertain cases go to a person.",
    ],
    ["CRM record", "DATA", "Store structured context with a traceable source."],
    [
      "Company research",
      "AI",
      "Use approved search and website tools to collect evidence.",
    ],
    [
      "Proposal draft",
      "AI",
      "Prepare a draft from verified context. It is not sent automatically.",
    ],
    [
      "Human approval",
      "HUMAN",
      "A person reviews the evidence, edits the draft and decides whether to proceed.",
    ],
    [
      "Follow-up",
      "AUTOMATION",
      "Send only after approval and record the action.",
    ],
  ];
  return `<section class="section architecture" id="architecture">${label("03", "EXAMPLE ARCHITECTURE")}<div class="split-heading"><h2>See the work.<br><span>Then connect it.</span></h2><p>A conceptual sales workflow. Inspect each component to see where AI helps—and where a person decides.</p></div><div class="architecture-panel"><div class="panel-bar"><span>LEAD INTELLIGENCE / SYSTEM EXAMPLE</span><button id="run-flow" type="button">Run example <span aria-hidden="true">→</span></button></div><ol class="flow">${nodes.map(([name, type, detail], i) => `<li><button class="flow-node" data-node="${i}" data-detail="${escape(detail)}" aria-pressed="${i === 0}"><span class="node-type ${type === "HUMAN" ? "human" : ""}">${type}</span><strong>${name}</strong><span aria-hidden="true">${i === 5 ? "◈" : "○"}</span></button></li>`).join("")}</ol><p id="node-detail" role="status">${nodes[0][2]}</p><div class="legend"><span>○ AI / Automation</span><span>◈ Human checkpoint</span><span>CRM + search: integrations</span></div></div></section>`;
}
export function solutionSection() {
  return `<section class="section" id="solutions">${label("04", "APPLICATION AREAS")}<h2>Same intelligence.<br><span>Different kinds of work.</span></h2><p class="lede">Examples of where systems could help. Every engagement starts with feasibility.</p><div class="solutions-grid">${solutions.map(([name, tag, desc], i) => `<article><span class="number">0${i + 1}</span><h3>${name}</h3><p>${tag}</p><p class="muted">${desc}</p>${link("Explore the opportunity", `/contact/?area=${encodeURIComponent(name)}`)}</article>`).join("")}</div></section>`;
}
export function simulator() {
  return `<section class="section simulator" id="simulator">${label("05", "SYSTEM SIMULATOR")}<div class="split-heading"><h2>A different way<br><span>to get there.</span></h2><p>Compare a manual process with a proposed system. These are illustrations, not measured performance claims.</p></div><label for="workflow-choice">Choose a workflow</label><select id="workflow-choice"><option value="research">Lead research</option><option value="support">Support triage</option><option value="reporting">Operational reporting</option></select><div class="sim-grid"><article><p class="eyebrow">TODAY / MANUAL HANDOFFS</p><ol id="manual-steps"><li>Search for a company</li><li>Read its website</li><li>Compare sources</li><li>Write research notes</li><li>Enter findings in CRM</li></ol></article><article><p class="eyebrow">PROPOSED / CONNECTED SYSTEM</p><ol id="system-steps"><li>Lead trigger</li><li>Research agent</li><li>Search / website tools</li><li>Structured findings</li><li>Human review</li><li>CRM update</li></ol></article></div><p id="sim-benefit" role="status">Less repeated searching. Consistent research structure. Sources a person can inspect.</p><noscript><p>The default comparison is shown. Enable JavaScript to switch workflows.</p></noscript></section>`;
}
export function methodSection() {
  return `<section class="section" id="method">${label("06", "THE NAADIX METHOD")}<div class="split-heading"><h2>From first question<br><span>to working system.</span></h2><p>Four stages. Clear decisions at each one. A focused first scope that can earn the right to grow.</p></div><div class="method-grid">${method.map(([name, tag, desc, output], i) => `<article><span class="number">0${i + 1}</span><h3>${name}</h3><h4>${tag}</h4><p>${desc}</p><span class="deliverable">${output}</span></article>`).join("")}</div></section>`;
}
export function scanner() {
  return `<section class="section scanner" id="scanner"><div>${label("07", "OPPORTUNITY SCANNER")}<h2>Where could<br><span>intelligence help?</span></h2><p>A short, rule-based starting point. Four answers help surface a workflow worth discussing.</p><p class="note">This is an initial assessment, not an AI analysis or a delivery estimate. Your answers stay in this browser until you choose to share them.</p></div><div class="instrument"><form id="scanner-form"><label for="department">01 / What part of the company?</label><select name="department" id="department" required><option value="">Choose a department</option>${options(["Sales", "Operations", "Customer Support", "Marketing", "Research", "Finance", "HR", "Leadership", "Technology"])}</select><label for="problem">02 / What problem appears most often?</label><select name="problem" id="problem" required><option value="">Choose a problem</option>${options(["Repetitive manual work", "Too much information", "Slow research", "Disconnected tools", "Slow customer responses", "Manual reporting", "Data entry", "Knowledge scattered across documents", "Other"])}</select><label for="size">03 / Company size</label><select id="size" name="size" required><option value="">Choose company size</option>${options(["1–10", "11–50", "51–200", "201+"])}</select><label for="maturity">04 / Current AI use</label><select id="maturity" name="maturity" required><option value="">Choose a stage</option>${options(["No AI currently", "Using AI tools informally", "Running experiments", "Building systems already"])}</select><button class="button primary" type="submit">Find a starting point <span aria-hidden="true">↗</span></button><noscript><p>JavaScript is needed for recommendations. ${link("Discuss your workflow", "/contact/")}</p></noscript></form><div id="scanner-result" hidden tabindex="-1"><p class="eyebrow">INITIAL OPPORTUNITY</p><h3 id="opportunity-title"></h3><p id="opportunity-reason"></p><ul id="opportunity-parts"></ul><p id="opportunity-next"></p>${link("Discuss this opportunity", "/contact/", "button primary scanner-cta")}<button class="text-link" id="scanner-reset">Change answers</button></div></div></section>`;
}
export function labsSection() {
  return `<section class="section labs" id="labs">${label("08", "NAADIX LABS")}<div class="split-heading"><h2>Curiosity,<br><span>with a workbench.</span></h2><p>Public experiments in software, agents and physical systems. Early ideas, clearly labeled. A place to explore what might come next.</p></div><div class="lab-grid">${labs.map((p, i) => `<a class="lab-card" href="/labs/${p.slug}/"><div class="lab-art art-${i}" aria-hidden="true"><span>+ ─ ◇ ─ +</span></div><div class="lab-card-copy"><div class="panel-bar"><span>${p.category}</span><span class="badge">${p.status}</span></div><h3>${p.title} <span aria-hidden="true">↗</span></h3><p>${p.description}</p></div></a>`).join("")}</div><p class="note">Labs is our public technology exploration. Personal workspaces and internal tools are a separate NaadiX HQ initiative.</p></section>`;
}
export function founderSection() {
  return `<section class="section founder" id="founder">${label("09", "FOUNDER")}<div class="founder-grid"><div class="founder-monogram" aria-hidden="true">H<span>P</span><small>BUILDER / NAADIX</small></div><div><h2>Built with curiosity.<br><span>Grounded in engineering.</span></h2><p class="lede">${c.founder}<span class="role">Founder, ${c.name}</span></p><p>NaadiX brings together an interest in AI, automation, software and connected hardware. The focus is on understanding how things work, then building systems that make that understanding useful.</p><p>This is an early company. The public work is a starting point: clear system examples, honest experiments and a practical approach to the work ahead.</p><div class="socials">${link("GitHub", c.github)}${c.linkedin ? link("LinkedIn", c.linkedin) : ""}${link("Email", `mailto:${c.email}`)}</div></div></div></section>`;
}
export function faqSection() {
  return `<section class="section faq">${label("10", "GOOD QUESTIONS")}<h2>Before we<br><span>build anything.</span></h2><div>${faq.map(([q, a]) => `<details><summary>${q}<span aria-hidden="true">+</span></summary><p>${a}</p></details>`).join("")}</div></section>`;
}
export function contact() {
  const interest = [
    "AI Agent",
    "Automation",
    "AI Strategy",
    "Internal AI Application",
    "Knowledge System",
    "AI Integration",
    "Custom AI System",
    "Other",
  ];
  return `<section class="section contact"><div>${intro("11", "Make room for<br><span>better work.</span>", "Tell us what is repetitive, fragmented or ready to change. Start with the workflow, not the technology.")}<p>${link(c.email, `mailto:${c.email}`)}</p><p class="note">This flow prepares an email brief. You review and send it in your email app. No information is submitted automatically.</p></div><form id="contact-form" class="instrument" novalidate><div class="panel-bar"><span>PROJECT BRIEF</span><span id="contact-progress" aria-live="polite">01 / 05</span></div>
 <fieldset data-step="0"><legend>What are you interested in?</legend><div class="radio-grid">${interest.map((x, i) => `<label class="radio-option"><input type="radio" name="interest" value="${x}" required ${i === 0 ? 'id="interest-first"' : ""}><span>${x}</span></label>`).join("")}</div></fieldset>
 <fieldset data-step="1"><legend>Tell us about the company.</legend><label for="person-name">Your name</label><input id="person-name" name="name" autocomplete="name" required maxlength="100"><label for="company-name">Company</label><input id="company-name" name="company" autocomplete="organization" required maxlength="120"><label for="role">Role <span>(optional)</span></label><input id="role" name="role" autocomplete="organization-title" maxlength="100"><label for="website">Website <span>(optional, https://…)</span></label><input id="website" name="website" type="url" autocomplete="url" maxlength="300"><label for="company-size">Company size</label><select id="company-size" name="companySize" required><option value="">Choose company size</option>${options(["1–10", "11–50", "51–200", "201+"])}</select></fieldset>
 <fieldset data-step="2"><legend>Describe the workflow.</legend><label for="workflow">What currently requires too much manual work?</label><textarea id="workflow" name="workflow" rows="6" required minlength="20" maxlength="2000" aria-describedby="workflow-hint"></textarea><p id="workflow-hint" class="note">At least 20 characters. Include the steps and tools involved; avoid confidential information.</p><div id="scanner-context" hidden><p class="eyebrow">FROM YOUR OPPORTUNITY SCAN</p><p id="scanner-context-text"></p><button type="button" id="clear-context" class="text-link">Remove assessment context</button></div></fieldset>
 <fieldset data-step="3"><legend>Where are you in the process?</legend><label for="project-stage">Project stage</label><select id="project-stage" name="stage" required><option value="">Choose a stage</option>${options(["Exploring", "Planning", "Ready to build"])}</select><label for="timeline">Timeline or priority <span>(optional)</span></label><input id="timeline" name="timeline" maxlength="200"></fieldset>
 <fieldset data-step="4"><legend>How can we reach you?</legend><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="254"><label for="phone">Phone <span>(optional)</span></label><input id="phone" name="phone" type="tel" autocomplete="tel" maxlength="40"><label class="consent"><input type="checkbox" name="consent" required><span>I agree to be contacted about this inquiry. <a href="/privacy/">Privacy information</a>.</span></label></fieldset>
 <div class="honeypot" aria-hidden="true"><label for="extra-field">Leave empty</label><input id="extra-field" name="extra" tabindex="-1" autocomplete="off"></div><p id="form-error" role="alert"></p><div class="form-actions"><button id="contact-back" type="button" class="button" hidden>Back</button><button id="contact-next" type="button" class="button primary" hidden>Continue <span aria-hidden="true">→</span></button><button id="contact-submit" class="button primary" type="submit">Prepare email brief <span aria-hidden="true">↗</span></button></div><noscript><p>Please email us directly using the address above. JavaScript enables this step-by-step brief builder.</p></noscript>
 </form><div id="contact-result" class="instrument" hidden tabindex="-1"><p class="eyebrow">READY FOR YOUR REVIEW</p><h2>Your brief<br><span>is ready.</span></h2><p>Nothing has been sent yet. Review your brief, then send it using your email app. You can also copy it or download a text file.</p><pre id="brief-preview"></pre><a id="send-email" class="button primary">Open email draft ↗</a><div class="form-actions"><button id="copy-brief" class="button">Copy brief</button><button id="download-brief" class="button">Download brief</button><button id="edit-brief" class="text-link">Edit answers</button></div></div></section>`;
}
export const cta = () =>
  `<section class="section closing">${label("NEXT", "START A CONVERSATION")}<h2>What could your<br><span>business do differently?</span></h2>${link("Discuss a project", "/contact/", "button primary")}${link("Find an opportunity", "/solutions/#scanner")}</section>`;
export function home() {
  return `<section class="hero"><div class="hero-copy">${label("01", "AI SYSTEMS / AUTOMATION / AGENTS")}<h1>Build an<br><span>AI-native</span><br>business.</h1><p class="lede">NaadiX designs AI agents, automations and intelligent systems that connect intelligence to the work your business actually does.</p><div class="hero-actions">${link("Discuss a project", "/contact/", "button primary")}${link("Explore capabilities", "/capabilities/")}</div><div class="hero-signoff"><span>${c.tagline}</span><span>SCROLL TO CONNECT ↓</span></div></div><div class="network-stage" role="img" aria-label="An intelligence network connects people, data, tools, AI, decisions and workflows"><svg class="network-fallback" viewBox="0 0 600 600" aria-hidden="true"><g fill="none" stroke="#587cce"><ellipse cx="300" cy="300" rx="190" ry="120"/><ellipse cx="300" cy="300" rx="100" ry="200"/><path d="M100 200L500 400M100 400L500 200M300 80V520"/></g><g fill="#9fbaff"><circle cx="300" cy="300" r="12"/><circle cx="100" cy="200" r="5"/><circle cx="500" cy="400" r="5"/><circle cx="100" cy="400" r="5"/><circle cx="500" cy="200" r="5"/><circle cx="300" cy="80" r="5"/><circle cx="300" cy="520" r="5"/></g></svg><canvas id="intelligence-network" aria-hidden="true"></canvas><div class="network-top"><span>NAADIX / INTELLIGENCE NETWORK</span><span>CORE_01</span></div><div class="network-bottom"><span id="network-state">01 / FRAGMENTED</span><button id="motion-toggle" type="button" aria-pressed="false">Pause motion</button></div></div></section>
 <section class="section problem"><div>${label("WHY", "THE REAL AI PROBLEM")}<h2>AI isn't the strategy.<br><span>Better systems are.</span></h2></div><div><p class="lede">A new tool doesn't fix a disconnected process.</p><p>Chatbots and isolated pilots can help individuals. To change operations, intelligence needs access to the right information, a place in the workflow and a clear handoff to people.</p><p>We start there. Map the work. Connect the tools. Build a system that can be checked, used and improved.</p><div class="connection-strip"><span>People</span><i aria-hidden="true">→</i><span>Tools + data</span><i aria-hidden="true">→</i><strong>Connected work</strong></div></div></section>${capabilitySection()}${architecture()}${solutionSection()}${simulator()}${methodSection()}${scanner()}${labsSection()}${founderSection()}${faqSection()}${cta()}`;
}
export function pages() {
  return [
    [
      "/",
      "NaadiX — AI Agents, Automation & Intelligent Systems",
      c.description,
      home(),
    ],
    [
      "/capabilities/",
      "Capabilities — NaadiX",
      "AI strategy, agents, automation, knowledge systems and integrations, designed around business workflows.",
      capabilitySection(true) + architecture() + cta(),
    ],
    [
      "/solutions/",
      "Solutions — NaadiX",
      "Explore AI system examples for sales, operations, support, research, internal knowledge and leadership.",
      solutionSection() + simulator() + scanner() + cta(),
    ],
    [
      "/method/",
      "Our Method — NaadiX",
      "Discover, architect, build and evolve useful AI systems with clear human checkpoints.",
      methodSection() + architecture() + cta(),
    ],
    [
      "/labs/",
      "NaadiX Labs — Experiments & Concepts",
      "Explore early NaadiX ideas in agents, automation and connected physical systems.",
      labsSection() + cta(),
    ],
    [
      "/founder/",
      "Harshit Pandey — Founder, NaadiX",
      "Meet the founder behind NaadiX and its exploration of AI, automation and engineering.",
      founderSection() + labsSection() + cta(),
    ],
    [
      "/contact/",
      "Discuss a Project — NaadiX",
      "Describe your workflow and prepare a project brief for NaadiX.",
      contact(),
    ],
    [
      "/faq/",
      "Questions & Answers — NaadiX",
      "Practical questions about AI agents, integration, prototypes and starting a project.",
      faqSection() + cta(),
    ],
    [
      "/privacy/",
      "Privacy — NaadiX",
      "How the NaadiX public website handles inquiry details and browser data.",
      `<section class="section prose">${intro("INFO", "Privacy, in plain language.", "The public website uses no advertising trackers or analytics cookies by default.")}<h2>Assessment answers</h2><p>The opportunity scanner runs in your browser. When you choose to discuss the result, its answers are temporarily stored in session storage to populate the inquiry. You can remove that context in the form. It expires after one hour.</p><h2>Project inquiries</h2><p>The form prepares a brief locally. Details are not submitted to a backend. Opening an email draft passes your brief to your chosen email application; you must send it yourself. Your email provider handles it under its own terms. Share only information relevant to the inquiry.</p><h2>Hosting and external links</h2><p>The hosting provider may process normal request logs, including IP addresses, for delivery and security. External sites such as GitHub have their own privacy practices. There are no third-party fonts or tracking scripts loaded by this site.</p><h2>Contact and deletion requests</h2><p>Contact <a href="mailto:${c.email}">${c.email}</a> about information you have sent. NaadiX uses inquiry emails to respond to your request.</p></section>`,
    ],
    ...labs.map((p) => [
      `/labs/${p.slug}/`,
      `${p.title} — NaadiX Labs`,
      p.description,
      `<section class="section prose">${link("All Labs projects", "/labs/")}<p class="eyebrow">${p.category} / ${p.status}</p><h1>${p.title}</h1><p class="lede">${p.description}</p><h2>What it explores</h2><p>${p.why}</p><h2>Technology direction</h2><p>${p.tech}</p><h2>Current state</h2><p>${p.state}</p><p class="note">Status is based on the source available in this repository. This is not a commercial case study.</p>${link("Discuss a related system", "/contact/", "button primary")}</section>`,
    ]),
  ];
}
