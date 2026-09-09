export function assess({ department, problem, size, maturity }) {
  const byDepartment = {
    Sales: [
      "AI Lead Intelligence System",
      [
        "Company research",
        "Lead qualification",
        "CRM enrichment",
        "Sales preparation",
      ],
    ],
    Operations: [
      "Workflow Coordination System",
      [
        "Structured intake",
        "Tool integrations",
        "Exception routing",
        "Operational reporting",
      ],
    ],
    "Customer Support": [
      "Support Intelligence System",
      [
        "Request triage",
        "Knowledge retrieval",
        "Response drafts",
        "Human escalation",
      ],
    ],
    Marketing: [
      "Content Operations System",
      [
        "Brief collection",
        "Research synthesis",
        "Draft assistance",
        "Editorial approval",
      ],
    ],
    Research: [
      "Research Intelligence System",
      [
        "Source collection",
        "Document synthesis",
        "Structured findings",
        "Evidence review",
      ],
    ],
    Finance: [
      "Reporting Assistance System",
      [
        "Data collection",
        "Validation rules",
        "Report drafting",
        "Human sign-off",
      ],
    ],
    HR: [
      "Employee Knowledge Assistant",
      [
        "Policy retrieval",
        "Source citations",
        "Access controls",
        "Escalation to HR",
      ],
    ],
    Leadership: [
      "Decision Support Briefing",
      [
        "Operational data",
        "Source-backed summaries",
        "Exception highlights",
        "Leadership review",
      ],
    ],
    Technology: [
      "Integration Readiness System",
      [
        "API inventory",
        "Data contracts",
        "Tool permissions",
        "Failure monitoring",
      ],
    ],
  };
  let [title, parts] = byDepartment[department] || byDepartment.Operations;
  if (
    problem === "Knowledge scattered across documents" ||
    problem === "Too much information"
  ) {
    title = "Knowledge Intelligence System";
    parts = [
      "Document indexing",
      "Permission-aware retrieval",
      "Answers with sources",
      "Human verification",
    ];
  } else if (problem === "Disconnected tools" || problem === "Data entry") {
    title = "Connected Workflow System";
    parts = [
      "Structured intake",
      "API integrations",
      "Validation and retries",
      "Exception review",
    ];
  } else if (problem === "Manual reporting") {
    title = "Reporting Assistance System";
    parts = [
      "Data collection",
      "Validation rules",
      "Summary generation",
      "Human sign-off",
    ];
  } else if (problem === "Slow research") {
    title = "Research Intelligence System";
    parts = [
      "Source collection",
      "Research agent",
      "Structured findings",
      "Evidence review",
    ];
  }
  const scale =
    size === "201+"
      ? "Start with one team and establish access controls and ownership."
      : size === "51–200"
        ? "Choose a single cross-team handoff and name its owner."
        : "Start with one recurring task and a small set of tools.";
  const next =
    maturity === "Building systems already"
      ? "Review existing evaluations, reliability and integration gaps."
      : maturity === "Running experiments"
        ? "Test one experiment against real acceptance criteria."
        : maturity === "Using AI tools informally"
          ? "Turn a useful individual workflow into a repeatable team process."
          : "Map the manual process and check data readiness before choosing AI.";
  return {
    title,
    parts,
    reason: `For ${department}, this is a possible starting point for “${problem.toLowerCase()}”. Validate data access, exceptions and feasibility before implementation.`,
    next: `${scale} ${next}`,
  };
}
