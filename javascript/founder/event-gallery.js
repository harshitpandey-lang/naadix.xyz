const imageSet = Array.from({ length: 21 }, (_, i) => ({
  src: `https://picsum.photos/seed/event-${i + 1}/900/700`,
  title: `Event Photo ${i + 1}`
}));

const cols = [
  document.getElementById("colA"),
  document.getElementById("colB"),
  document.getElementById("colC")
];

imageSet.forEach((item, index) => {
  const card = document.createElement("article");
  card.className = "gallery-item";
  card.innerHTML = `
    <img src="${item.src}" alt="${item.title}">
    <p>${item.title}</p>
  `;
  cols[index % 3].appendChild(card);
});
