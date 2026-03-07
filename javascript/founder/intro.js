document.querySelectorAll(".right-icons a").forEach((item) => {
  item.addEventListener("mouseenter", () => {
    item.style.transform = "scale(1.08)";
  });
  item.addEventListener("mouseleave", () => {
    item.style.transform = "scale(1)";
  });
});
