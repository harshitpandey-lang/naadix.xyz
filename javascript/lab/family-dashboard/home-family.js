const LOCATION_KEY = "naadixLab:founderLocation";
const CALENDAR_KEY = "naadixLab:founderCalendarEvents";
const FAMILY_KEY = "naadixLab:familyImportantDates";

const statusEl = document.getElementById("familyFounderStatus");
const dateList = document.getElementById("familyDateList");

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const locationRaw = localStorage.getItem(LOCATION_KEY);
if (statusEl) {
  if (!locationRaw) {
    statusEl.textContent = "Founder location has not been shared yet. Ask founder to open dashboard home once.";
  } else {
    try {
      const loc = JSON.parse(locationRaw);
      const stamp = new Date(loc.timestamp).toLocaleString();
      statusEl.textContent = `Last location update at ${stamp} (accuracy ${Math.round(loc.accuracy || 0)}m).`;
    } catch {
      statusEl.textContent = "Location data is unavailable.";
    }
  }
}

if (dateList) {
  const founderEvents = read(CALENDAR_KEY)
    .filter((event) => ["Exam", "Vacation", "Meeting"].includes(event.category))
    .map((event) => ({ date: event.date, event: event.title, type: event.category, source: "Founder Calendar" }));
  const familyDates = read(FAMILY_KEY)
    .map((entry) => ({ ...entry, source: "Family" }));

  const items = [...founderEvents, ...familyDates]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  dateList.innerHTML = "";
  if (!items.length) {
    dateList.innerHTML = '<p class="mini-note">No upcoming dates available.</p>';
  }

  items.forEach((item) => {
    const row = document.createElement("p");
    row.className = "mini-note";
    row.textContent = `${item.date} | ${item.event} (${item.type})`;
    dateList.appendChild(row);
  });
}