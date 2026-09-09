(() => {
  const title = document.querySelector("h1");
  const style = getComputedStyle(title);
  const svg = document.querySelector(".network-fallback");
  if (!title.textContent.includes("AI-native"))
    throw Error("No server-rendered heading");
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  )
    throw Error("Content is hidden without JS");
  if (getComputedStyle(svg).display === "none")
    throw Error("SVG fallback missing");
  return {
    passed: true,
    title: title.textContent,
    color: style.color,
    top: title.getBoundingClientRect().top,
    svgVisible: true,
  };
})();
