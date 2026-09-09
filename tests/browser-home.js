(async () => {
  const check = (condition, message) => {
    if (!condition) throw Error(message);
  };
  const $ = (s) => document.querySelector(s);
  if (!$("#mobile-menu").hidden) {
    $("#menu-toggle").click();
  }
  check(
    document.documentElement.scrollWidth <= innerWidth,
    "Horizontal overflow",
  );
  $(".capability summary").click();
  check($(".capability").open, "Capability did not expand");
  $('[data-node="5"]').click();
  check(
    $("#node-detail").textContent.includes("person reviews"),
    "Human checkpoint not inspectable",
  );
  $("#workflow-choice").value = "support";
  $("#workflow-choice").dispatchEvent(new Event("change"));
  check(
    $("#system-steps").textContent.includes("Knowledge retrieval"),
    "Simulator did not update",
  );
  $(".command-trigger").click();
  check($("#command-menu").open, "Command menu did not open");
  $("#command-search").value = "Labs";
  $("#command-search").dispatchEvent(new Event("input"));
  check(
    $("#command-menu nav a:not([hidden])").textContent.includes("Labs"),
    "Command search failed",
  );
  $("#command-menu").close();
  $("#department").value = "Sales";
  $("#problem").value = "Slow research";
  $("#size").selectedIndex = 2;
  $("#maturity").value = "Running experiments";
  $("#scanner-form").requestSubmit();
  check(!$("#scanner-result").hidden, "Scanner did not show result");
  check(
    $("#opportunity-title").textContent.includes("Research"),
    "Scanner recommendation incorrect",
  );
  // Preserve normal click handlers while delaying navigation until the next test.
  $(".scanner-cta").addEventListener("click", (e) => e.preventDefault(), {
    once: true,
  });
  $(".scanner-cta").click();
  check(
    JSON.parse(sessionStorage.getItem("naadix-assessment")).department ===
      "Sales",
    "Scanner handoff not saved",
  );
  const routes = [
    "/",
    "/capabilities/",
    "/solutions/",
    "/method/",
    "/labs/",
    "/founder/",
    "/contact/",
    "/faq/",
    "/privacy/",
    "/labs/content-agent/",
    "/labs/affiliate-agent/",
    "/labs/rover/",
  ];
  for (const route of routes) {
    const response = await fetch(route);
    check(response.status === 200, `Route failed: ${route}`);
  }
  for (const route of [
    "/not-a-real-page",
    "/webpages/lab/founder-dashboard/home-founder.html",
    "/javascript/lab/auth.js",
  ])
    check(
      (await fetch(route)).status === 404,
      `Private or missing route served: ${route}`,
    );
  return {
    passed: true,
    width: innerWidth,
    routes: routes.length,
    checks: [
      "overflow",
      "capabilities",
      "human checkpoint",
      "simulator",
      "command search",
      "scanner",
      "context",
      "404",
      "internal exclusion",
    ],
  };
})();
