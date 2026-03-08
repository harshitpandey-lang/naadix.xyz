const docBox = document.getElementById("guestSharedDocs");

if (docBox) {
  const docs = [
    { name: "Robotics Program Guide", href: "https://naadix.xyz/coaching-master/single" },
    { name: "Community Announcements", href: "https://naadix.xyz/c.html" },
    { name: "Contact Naadix", href: "https://naadix.xyz/webpages/contact.html" }
  ];

  docs.forEach((doc) => {
    const link = document.createElement("a");
    link.className = "chip";
    link.href = doc.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = doc.name;
    docBox.appendChild(link);
  });
}