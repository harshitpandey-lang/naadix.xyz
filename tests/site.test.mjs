import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pages } from "../site/templates.mjs";
import { architectures, company, labs, navigation } from "../site/data.mjs";
import { assess } from "../site/assets/assessment.js";
import { prepareBrief } from "../site/assets/contact-service.js";
const root = resolve("dist");
async function all(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) result.push(...(await all(p)));
    else result.push(p);
  }
  return result;
}
test("all public routes have metadata, one h1, and local links/assets that resolve", async () => {
  for (const [route] of pages()) {
    const path = join(
      root,
      route === "/" ? "index.html" : route.slice(1) + "index.html",
    );
    const html = await readFile(path, "utf8");
    assert.equal((html.match(/<h1>/g) || []).length, 1, route);
    assert.ok(html.includes('rel="canonical"'));
    assert.ok(html.includes("application/ld+json"));
    for (const [, href] of html.matchAll(
      /(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g,
    )) {
      const target = join(
        root,
        href.endsWith("/") ? href.slice(1) + "index.html" : href.slice(1),
      );
      assert.ok((await stat(target)).isFile(), `${route}: ${href}`);
    }
  }
});
test("ownership files remain byte-identical", async () => {
  for (const file of [
    "CNAME",
    "google1677bfbddc336616.html",
    "BingSiteAuth (1).xml",
    "4afff44e0015449b961a3c19974d3e03.txt",
  ])
    assert.deepEqual(await readFile(file), await readFile(join(root, file)));
});
test("public IA, HQ entry, and current Labs positioning are present", async () => {
  const home = await readFile(join(root, "index.html"), "utf8");
    assert.ok(home.includes(`href="${company.hq}/`));
  assert.ok(home.includes(">Founder HQ<span"));
  assert.ok(!home.includes('class="hq-link"'));
  assert.ok(home.includes("INTELLIGENCE ARCHITECT"));
  assert.ok(home.includes('id="xray-flow"'));
  assert.deepEqual(navigation.map(([label]) => label), ["Capabilities", "Solutions", "Method", "Labs", "About"]);
  assert.deepEqual(Object.keys(architectures), ["sales", "operations", "knowledge", "support", "research"]);
  assert.ok(Object.values(architectures).every((item) => item.steps.length === 6));
  assert.deepEqual(labs.map((lab) => lab.status), ["PROTOTYPE", "EXPERIMENT", "CONCEPT"]);
  assert.ok(labs.every((lab) => !/rover|robot|hardware/i.test(`${lab.slug} ${lab.title} ${lab.summary}`)));
  for (const [route] of pages()) {
    const path = join(root, route === "/" ? "index.html" : route.slice(1) + "index.html");
      assert.ok((await readFile(path, "utf8")).includes(`href="${company.hq}/`), route);
  }
});

test("sitemap contains only canonical public routes", async () => {
  const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("/labs/workflow-intelligence/"));
  assert.ok(!sitemap.includes("/labs/rover/"));
  assert.ok(!sitemap.includes("hq.naadix.xyz"));
});
test("internal systems and credentials are absent from deployment artifact", async () => {
  for (const path of await all(root)) {
    const normalized = path.replaceAll("\\", "/");
    assert.ok(
      !/founder-dashboard|family-dashboard|guest-dashboard|tution|coaching-master/.test(
        normalized,
      ),
        normalized,
    );
    if (/\.(html|js|json)$/.test(path)) {
      const text = await readFile(path, "utf8");
      assert.ok(
        !/CREDENTIALS\s*=|naadixLab:authRole|10\+ Years Experience|60\+ Projects/.test(
          text,
        ),
        path,
      );
    }
  }
});
test("scanner responds to department, bottleneck, size and maturity", () => {
  const base = {
    department: "Sales",
    problem: "Repetitive manual work",
    size: "1–10",
    maturity: "No AI currently",
  };
  assert.match(assess(base).title, /Lead/);
  assert.match(assess({ ...base, department: "HR" }).title, /Knowledge/);
  assert.match(
    assess({ ...base, problem: "Disconnected tools" }).title,
    /Connected/,
  );
  assert.notEqual(assess(base).next, assess({ ...base, size: "201+" }).next);
  assert.notEqual(
    assess(base).next,
    assess({ ...base, maturity: "Building systems already" }).next,
  );
});
test("email brief preserves user content and scanner context without sending it", () => {
  const data = {
    name: "A & B",
    company: "Test",
    workflow: "Research and review every new inquiry.",
    email: "a@example.com",
    interest: "AI Agent",
  };
  const result = prepareBrief(
    data,
    {
      title: "Research",
      department: "Sales",
      problem: "Slow research",
      maturity: "Running experiments",
    },
    "test@example.com",
  );
  assert.ok(result.href.startsWith("mailto:test@example.com?"));
  assert.ok(result.text.includes("A & B"));
  assert.ok(decodeURIComponent(result.href).includes(data.workflow));
  assert.ok(result.text.includes("Initial assessment: Research"));
});
