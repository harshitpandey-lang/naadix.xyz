import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("website service HTML is indexable with connected service entities and canonical sitemap", async () => {
  const html = await readFile("dist/web.html", "utf8");
  assert.ok(
    html.includes(
      "<h1>Website Design &amp; Development <em>for your business.</em></h1>",
    ),
  );
  assert.ok(html.includes('rel="canonical" href="https://naadix.xyz/web"'));
  assert.ok(!html.includes("noindex"));
  const schema = JSON.parse(
    html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
  );
  const org = schema.find((x) => x["@type"] === "Organization");
  const service = schema.find((x) => x["@type"] === "Service");
  assert.equal(service.provider["@id"], org["@id"]);
  assert.equal(
    schema.find((x) => x["@type"] === "WebPage").about["@id"],
    service["@id"],
  );
  assert.ok(
    (await readFile("dist/sitemap.xml", "utf8")).includes(
      "<loc>https://naadix.xyz/web</loc>",
    ),
  );
  assert.ok(html.includes("Nothing has been sent."));
  assert.ok(!schema.some((x) => x.aggregateRating));
});
