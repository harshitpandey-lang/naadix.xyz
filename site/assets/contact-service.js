// Replace prepareBrief with an authenticated server-side submission adapter later.
// A successful HTTP response alone is not a delivery receipt: follow the provider contract.
export function prepareBrief(data, context, email) {
  const lines = [
    ["Interest", data.interest],
    ["Name", data.name],
    ["Company", data.company],
    ["Role", data.role],
    ["Website", data.website],
    ["Company size", data.companySize],
    ["Workflow", data.workflow],
    ["Stage", data.stage],
    ["Timeline", data.timeline],
    ["Email", data.email],
    ["Phone", data.phone],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  if (context)
    lines.push(
      `Initial assessment: ${context.title}`,
      `Department: ${context.department}`,
      `Recurring problem: ${context.problem}`,
      `AI maturity: ${context.maturity}`,
    );
  const text = `NaadiX project brief\n\n${lines.join("\n\n")}\n\nConsent: contact about this inquiry.`;
  return {
    text,
    href: `mailto:${email}?subject=${encodeURIComponent("NaadiX project inquiry")}&body=${encodeURIComponent(text)}`,
  };
}
