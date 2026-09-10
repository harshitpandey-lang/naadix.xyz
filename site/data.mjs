export const company = {
  name: "NaadiX",
  domain: "https://naadix.xyz",
  founder: "Harshit Pandey",
  email: "harshitpandey3519@gmail.com",
  github: "https://github.com/harshitpandey-lang/naadix.xyz",
  linkedin: "https://www.linkedin.com/in/harshit-pandey-digital/",
  hq: "/hq",
  tagline: "Intelligence, engineered.",
  description:
    "NaadiX designs AI agents, automations and intelligent systems that help businesses improve operations and build AI-native workflows.",
};
export const navigation = [
  ["Capabilities", "/capabilities/"],
  ["Solutions", "/solutions/"],
  ["Method", "/method/"],
  ["Labs", "/labs/"],
  ["About", "/founder/"],
];
export const capabilities = [
  [
    "AI Strategy",
    "Find the work worth changing.",
    "Map bottlenecks, assess data readiness and choose opportunities with a clear operational purpose.",
    "A prioritized roadmap, feasibility checks and a small first system.",
  ],
  [
    "AI Agents",
    "Give intelligence a job to do.",
    "Design agents that research, use tools and complete multi-step work within explicit boundaries.",
    "Tool permissions, source-backed outputs and human checkpoints.",
  ],
  [
    "Business Automation",
    "Automate the work between tools.",
    "Connect repetitive handoffs across teams and software, with clear rules for exceptions.",
    "Triggers, approvals, retries and a visible record of every step.",
  ],
  [
    "Custom AI Systems",
    "Build around your operating reality.",
    "Create internal applications that fit your people, information and daily decisions.",
    "A useful interface, structured data and a maintainable system.",
  ],
  [
    "Knowledge Intelligence",
    "Make information usable.",
    "Bring scattered documents into retrieval systems that help people find answers and check their sources.",
    "Permission-aware retrieval, citations and evaluation against real questions.",
  ],
  [
    "AI Integrations",
    "Connect to what already works.",
    "Connect models with email, CRM, documents, databases, Slack, APIs and internal applications.",
    "Scoped access, structured tool calls and reliable data exchange.",
  ],
];
export const solutions = [
  [
    "Sales",
    "Lead enrichment, qualification and follow-ups.",
    "Connect research to the CRM so people enter a conversation prepared.",
  ],
  [
    "Operations",
    "Workflow coordination and reporting.",
    "Give routine handoffs a consistent path, and bring exceptions to the right person.",
  ],
  [
    "Customer Support",
    "Triage, retrieval and response assistance.",
    "Find relevant knowledge and route requests with human review where it matters.",
  ],
  [
    "Research",
    "Company research and document synthesis.",
    "Collect evidence, organize findings and preserve the source behind each conclusion.",
  ],
  [
    "Internal Knowledge",
    "Document search and employee assistance.",
    "Help people query information they are allowed to access.",
  ],
  [
    "Leadership",
    "Reporting and decision support.",
    "Turn operational information into reviewable summaries, with uncertainty made visible.",
  ],
];
export const method = [
  [
    "Discover",
    "Start with the work.",
    "Map the process, its people, bottlenecks and data. Decide where AI makes sense—and where a simple rule is enough.",
    "Workflow map + opportunity brief",
  ],
  [
    "Architect",
    "Make the system explicit.",
    "Choose models, tools and integrations. Define data access, evaluation criteria, security boundaries and human approvals.",
    "Architecture + acceptance criteria",
  ],
  [
    "Build",
    "Turn a diagram into a tool.",
    "Develop the agents, interfaces and automations. Test realistic cases and failure paths before expanding access.",
    "Working system + operating guide",
  ],
  [
    "Evolve",
    "Learn from real use.",
    "Review quality and exceptions. Improve prompts, retrieval and architecture as workflows change.",
    "Evaluation + improvement backlog",
  ],
];
export const labs = [
  {
    slug: "content-agent",
    title: "Agentic Interfaces",
    status: "PROTOTYPE",
    category: "HUMAN + AI",
    description:
      "Interface patterns that make tool use, evidence and human approval visible.",
    why: "Explore how people can inspect and direct an agent instead of trusting an opaque chat response.",
    tech: "Interaction design · JavaScript · Agent architecture",
    state:
      "A public interaction prototype. It demonstrates interface thinking, not a deployed client system.",
  },
  {
    slug: "affiliate-agent",
    title: "Research Agents",
    status: "EXPERIMENT",
    category: "RESEARCH SYSTEMS",
    description:
      "Source-aware research flows that separate collection, comparison and review.",
    why: "Explore how research agents can preserve evidence and surface uncertainty for a human decision.",
    tech: "Retrieval concepts · Workflow design · Evaluation",
    state:
      "A documented experiment derived from earlier research-agent concepts. No production deployment or commercial result is claimed.",
  },
  {
    slug: "workflow-intelligence",
    title: "Workflow Intelligence",
    status: "CONCEPT",
    category: "BUSINESS SYSTEMS",
    description: "A visual model for triggers, tools, decisions, exceptions and human checkpoints.",
    why: "Make the architecture underneath business automation understandable before anything is built.",
    tech: "Systems design · Deterministic simulation · Canvas2D",
    state: "A public concept expressed through the Intelligence Architect. It is not a production automation product.",
    source: "site/templates.mjs",
  },
];

export const architectures = {
  sales: { title: "Sales", steps: [["Lead arrives","TRIGGER","Inbound form or CRM event"],["Qualification agent","MODEL","Apply explicit fit criteria"],["CRM","DATA","Read and update approved fields"],["Research agent","TOOLS","Collect source-backed context"],["Human approval","HUMAN","Review evidence and decide"],["Follow-up","ACTION","Send only after approval"]] },
  operations: { title: "Operations", steps: [["Work request","TRIGGER","A request enters the queue"],["Workflow agent","MODEL","Classify and choose an allowed path"],["Operating rules","MEMORY","Retrieve current process guidance"],["Business tools","TOOLS","Coordinate approved systems"],["Exception review","HUMAN","Resolve uncertainty or risk"],["Record outcome","ACTION","Complete and log the handoff"]] },
  knowledge: { title: "Knowledge", steps: [["Question","TRIGGER","A person asks within their access"],["Retrieval","TOOLS","Search permitted sources"],["Knowledge index","DATA","Return relevant passages"],["Answer model","MODEL","Synthesize with citations"],["Confidence check","DECISION","Test evidence and uncertainty"],["Human use","HUMAN","Inspect sources and act"]] },
  support: { title: "Support", steps: [["Request","TRIGGER","A customer message arrives"],["Triage agent","MODEL","Classify intent and urgency"],["Knowledge base","MEMORY","Retrieve approved guidance"],["Draft response","ACTION","Prepare a cited response"],["Human review","HUMAN","Edit, approve or escalate"],["Route + record","TOOLS","Send and update the case"]] },
  research: { title: "Research", steps: [["Research brief","TRIGGER","Define the question and boundaries"],["Planner","MODEL","Break work into evidence tasks"],["Search tools","TOOLS","Collect allowed public sources"],["Evidence store","MEMORY","Preserve claims and provenance"],["Synthesis","DECISION","Compare findings and gaps"],["Analyst review","HUMAN","Challenge and approve conclusions"]] },
};
export const faq = [
  [
    "What does NaadiX build?",
    "AI agents, workflow automations, internal applications, knowledge systems and the integrations that connect them to everyday work.",
  ],
  [
    "What is an AI agent?",
    "Software that uses a model to choose steps and interact with tools toward a defined task. Useful agents need permissions, limits, evaluation and a clear path to human review.",
  ],
  [
    "Does every project require custom AI?",
    "No. A simpler integration or rules-based automation may be the better fit. Discovery starts with the workflow and the outcome, not a preferred model.",
  ],
  [
    "Can you integrate with existing software?",
    "Integration depends on available APIs, permissions and data quality. We assess those constraints before committing to an architecture.",
  ],
  [
    "Can an existing workflow be automated?",
    "Often parts of it can. We map its inputs, exceptions and decisions, then identify what should remain with people.",
  ],
  [
    "How do projects begin?",
    "Share the process you want to improve. The next step is to understand the work, assess feasibility and agree on a focused scope.",
  ],
  [
    "Do you build prototypes?",
    "Yes. A bounded prototype can test assumptions before a larger implementation. A prototype is not presented as a production deployment.",
  ],
  [
    "What industries do you work with?",
    "Projects are evaluated by workflow, feasibility, data access and risk. We do not claim industry experience or client deployments that have not been established.",
  ],
];
export const workflows = {
  research: {
    title: "Lead research",
    manual: [
      "Search for a company",
      "Read its website",
      "Compare sources",
      "Write research notes",
      "Enter findings in CRM",
    ],
    system: [
      "Lead trigger",
      "Research agent",
      "Search / website tools",
      "Structured findings",
      "Human review",
      "CRM update",
    ],
    benefit:
      "Less repeated searching. Consistent research structure. Sources a person can inspect.",
  },
  support: {
    title: "Support triage",
    manual: [
      "Read every request",
      "Search internal documents",
      "Decide the category",
      "Find the right team",
      "Draft a response",
    ],
    system: [
      "New request",
      "Triage agent",
      "Knowledge retrieval",
      "Draft + citations",
      "Human review",
      "Route to team",
    ],
    benefit:
      "A clearer queue, source-backed drafts and explicit escalation for uncertain answers.",
  },
  reporting: {
    title: "Operational reporting",
    manual: [
      "Export data",
      "Merge spreadsheets",
      "Check inconsistencies",
      "Write a summary",
      "Email the team",
    ],
    system: [
      "Scheduled trigger",
      "Data integrations",
      "Validation rules",
      "Summary agent",
      "Human review",
      "Report distribution",
    ],
    benefit:
      "Repeatable data collection and a visible review step before a report is shared.",
  },
};
