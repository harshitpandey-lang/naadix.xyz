document.querySelectorAll(".progress span").forEach((bar) => {
  const target = bar.getAttribute("data-width") || "0%";
  requestAnimationFrame(() => {
    bar.style.width = target;
  });
});
