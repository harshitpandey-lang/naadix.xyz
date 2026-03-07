const filterButtons = document.querySelectorAll(".filters button");
const cards = document.querySelectorAll(".project-card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    cards.forEach((card) => {
      const show = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("hidden", !show);
    });
  });
});
