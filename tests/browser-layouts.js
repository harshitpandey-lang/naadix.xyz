(async () => {
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;left:-6000px;top:0;height:900px;border:0";
  document.body.append(frame);
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
  const checks = [];
  try {
    for (const width of [320, 768, 1440]) {
      frame.style.width = width + "px";
      for (const route of routes) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(
            () => reject(Error("Route load timed out: " + route)),
            7000,
          );
          frame.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          frame.src = route;
        });
        const doc = frame.contentDocument;
        if (doc.documentElement.scrollWidth > width)
          throw Error(
            `Overflow: ${route} at ${width}px (${doc.documentElement.scrollWidth})`,
          );
        if (doc.querySelectorAll("h1").length !== 1)
          throw Error("Heading structure: " + route);
        checks.push(`${route} @ ${width}`);
      }
    }
  } finally {
    frame.remove();
  }
  return {
    passed: true,
    layoutChecks: checks.length,
    widths: [320, 768, 1440],
  };
})();
