const testimonialCards = document.querySelectorAll(".testimonial-grid article");

testimonialCards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-4px)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
  });
});
