const localImages = [
  "../../images/home.jpeg",
  "../../images/mission.jpeg",
  "../../images/img1.jpeg",
  "../../images/img2.jpeg",
  "../../images/img3.jpeg",
  "../../images/img4.jpeg",
  "../../images/img5.jpeg",
  "../../images/img6.jpeg"
];

const imageSet = Array.from({ length: 72 }, (_, i) => ({
  src: localImages[i % localImages.length],
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
