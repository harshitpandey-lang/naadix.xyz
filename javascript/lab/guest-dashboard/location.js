const LOCATION_KEY = "naadixLab:founderLocation";
const mapFrame = document.getElementById("guestMap");
const meta = document.getElementById("guestLocationMeta");

const raw = localStorage.getItem(LOCATION_KEY);
if (!raw) {
  meta.textContent = "Location unavailable. Access is read-only for guests.";
} else {
  try {
    const loc = JSON.parse(raw);
    const { latitude, longitude, timestamp } = loc;
    mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    meta.textContent = `Shared at ${new Date(timestamp).toLocaleString()}`;
  } catch {
    meta.textContent = "Invalid location payload.";
  }
}