(async () => {
  const canvas = document.querySelector("#intelligence-network"),
    button = document.querySelector("#motion-toggle");
  if (!button.disabled || button.textContent !== "Motion reduced")
    throw Error("Reduced-motion control state incorrect");
  const first = canvas.toDataURL();
  await new Promise((r) => setTimeout(r, 150));
  if (canvas.toDataURL() !== first)
    throw Error("Reduced motion still animates");
  document.querySelector(".command-trigger").click();
  document.querySelector("#command-search").focus();
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  document.querySelector("#command-menu").close();
  return {
    passed: true,
    reducedMotion: true,
    canvasStatic: true,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
})();
