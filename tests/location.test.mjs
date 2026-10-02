import test from "node:test";
import assert from "node:assert/strict";
import worker, { approximateLocation } from "../site/worker.mjs";
import { cleanCity } from "../site/assets/web-location.js";
test("location responds with approximate Indian city without shared caching or coordinates", async () => {
  for (const city of ["Noida", "Ayodhya"]) {
    const request = new Request("https://naadix.xyz/api/location");
    request.cf = { country: "IN", city, latitude: 26, longitude: 82 };
    const response = await worker.fetch(request, {});
    assert.deepEqual(await response.json(), { city, country: "IN" });
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
  }
  assert.deepEqual(approximateLocation(), { city: null, country: null });
  assert.deepEqual(approximateLocation({ country: "US", city: "Austin" }), {
    city: null,
    country: "US",
  });
});
test("location endpoint ignores client city headers and rejects writes while preserving static routes", async () => {
  const response = await worker.fetch(
    new Request("https://naadix.xyz/api/location", {
      headers: { "CF-IPCity": "Ayodhya" },
    }),
    {},
  );
  assert.deepEqual(await response.json(), { city: null, country: null });
  assert.equal(
    (
      await worker.fetch(
        new Request("https://naadix.xyz/api/location", { method: "POST" }),
        {},
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await worker.fetch(new Request("https://naadix.xyz/web"), {
        ASSETS: { fetch: () => new Response("static") },
      })
    ).status,
    200,
  );
});
test("city labels accept Indian languages and reject markup or excessive data", () => {
  assert.equal(cleanCity(" Ayodhya "), "Ayodhya");
  assert.equal(cleanCity("New Delhi"), "New Delhi");
  assert.equal(cleanCity("<img src=x onerror=alert(1)>"), "");
  assert.equal(cleanCity("a".repeat(81)), "");
  assert.equal(cleanCity(null), "");
});
