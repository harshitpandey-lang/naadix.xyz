const LOCATION_KEY = "naadixLab:founderLocation";

const mapFrame = document.getElementById("locationMap");
const locationMeta = document.getElementById("locationMeta");
const locationTimestamp = document.getElementById("locationTimestamp");
const refreshBtn = document.getElementById("refreshLocation");
const shareBtn = document.getElementById("shareBtn");

const renderLocation = () => {
  const raw = localStorage.getItem(LOCATION_KEY);
  if (!raw) {
    locationMeta.textContent = "Founder location unavailable.";
    locationTimestamp.textContent = "--";
    return;
  }

  try {
    const loc = JSON.parse(raw);
    const { latitude, longitude, accuracy, timestamp } = loc;
    const ts = new Date(timestamp).toLocaleString();
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    mapFrame.src = mapUrl;
    locationMeta.textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}, Accuracy: ${Math.round(accuracy || 0)}m`;
    locationTimestamp.textContent = ts;
  } catch {
    locationMeta.textContent = "Invalid location data.";
    locationTimestamp.textContent = "--";
  }
};

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    renderLocation();
  });
}

if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const message = `Please share your status. Location checked at ${new Date().toLocaleString()}.`;
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch {
        // Fallback handled below.
      }
    }
    window.location.href = `sms:+910000000000?body=${encodeURIComponent(message)}`;
  });
}

renderLocation();