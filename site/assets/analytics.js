// Install an opt-in adapter here. Never include inquiry text or personal fields.
let adapter = null;
export function setAnalyticsAdapter(fn) {
  adapter = typeof fn === "function" ? fn : null;
}
export function track(event, properties = {}) {
  try {
    adapter?.(event, properties);
  } catch {
    /* Analytics must never break the interface. */
  }
}
