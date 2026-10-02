export function cleanCity(value) {
  if (typeof value !== "string") return "";
  const city = value.trim().replace(/\s+/g, " ");
  return city.length <= 80 && /^[\p{L}\p{M}][\p{L}\p{M}\s.'’()-]*$/u.test(city)
    ? city
    : "";
}
export async function setupLocation() {
  const label = document.querySelector("#web-area");
  const form = document.querySelector("#web-area-form");
  if (!label || !form) return;
  document.querySelector("#web-area-controls").hidden = false;
  const storageKey = "naadix-service-city";
  let userChanged = false;
  const show = (city) => {
    label.textContent = city
      ? `Serving businesses in ${city}.`
      : "Serving businesses across India and worldwide.";
    form.elements.city.value = city;
  };
  const save = (city) => {
    try {
      sessionStorage.setItem(storageKey, city);
    } catch {}
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = cleanCity(form.elements.city.value);
    document.querySelector("#web-area-error").textContent = city
      ? ""
      : "Please enter a valid city name.";
    if (!city) return;
    userChanged = true;
    save(city);
    show(city);
  });
  document.querySelector("#web-area-reset").addEventListener("click", () => {
    userChanged = true;
    save("");
    show("");
    document.querySelector("#web-area-error").textContent = "";
  });
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored !== null) {
      show(cleanCity(stored));
      return;
    }
  } catch {}
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch("/api/location", {
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) return;
    const data = await response.json();
    if (!userChanged && data.country === "IN") show(cleanCity(data.city));
  } catch {
    /* Keep the complete India-wide message when location is unavailable. */
  } finally {
    clearTimeout(timeout);
  }
}
