const gallery = document.getElementById("guestGallery");
const docs = document.getElementById("guestDocs");

if (gallery) {
  const items = [
    { src: "../../../images/logo.jpeg", alt: "Naadix" },
    { src: "../../../coaching-master/images/coach_1_sm.jpg", alt: "Workshop" },
    { src: "../../../coaching-master/images/coach_2_sm.jpg", alt: "Training" },
    { src: "../../../coaching-master/images/coach_3_sm.jpg", alt: "Events" }
  ];

  items.forEach((item) => {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.alt;
    gallery.appendChild(img);
  });
}

if (docs) {
  const links = [
    { name: "Program Overview", href: "https://naadix.xyz" },
    { name: "Workshop Notes", href: "https://docs.google.com" },
    { name: "Event Slides", href: "https://drive.google.com" }
  ];

  links.forEach((link) => {
    const a = document.createElement("a");
    a.className = "chip";
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = link.name;
    docs.appendChild(a);
  });
}