const localImages = [
  "../../images/home/home.jpeg",
  "../../images/home/mission.jpeg",
  "../../images/home/img1.jpeg",
  "../../images/home/img2.jpeg",
  "../../images/home/img3.jpeg",
  "../../images/home/img4.jpeg",
  "../../images/home/img5.jpeg",
  "../../images/home/img6.jpeg"
];

const imageSet = Array.from({ length: 21 }, (_, i) => ({
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
