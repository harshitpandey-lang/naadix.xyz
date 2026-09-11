import { mkdir, writeFile, cp, rm } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { architectures, company, workflows } from "../site/data.mjs";
import { pages, layout } from "../site/templates.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist");
if (out !== join(root, "dist"))
  throw Error("Refusing an unexpected output directory");
// Only generated output is replaced.
await rm(out, { recursive: true, force: true });
await mkdir(join(out, "assets"), { recursive: true });
const emit = async (path, body) => {
  const target = resolve(out, path);
  if (!target.startsWith(out + "/") && !target.startsWith(out + "\\"))
    throw Error("Invalid output path");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
};
const routes = pages();
for (const [path, title, description, content] of routes) {
  let body = content;
  if (path !== "/" && !body.includes("<h1>"))
    body = body.replace("<h2>", "<h1>").replace("</h2>", "</h1>");
  body = body.replace('id="contact-submit"', 'id="contact-submit" disabled');
  body = body.replace('id="motion-toggle"', 'id="motion-toggle" hidden');
  body = body.replace(
    'class="network-stage" role="img"',
    'class="network-stage" role="group"',
  );
  await emit(
    path === "/" ? "index.html" : path.slice(1) + "index.html",
    layout(path, title, description, body),
  );
}
await cp(join(root, "site/assets"), join(out, "assets"), { recursive: true });
await cp(join(root, "site/hq"), join(out, "assets/hq"), { recursive: true });
const hqPages = [
  ["hq/index.html", "login", "Founder HQ | NaadiX", "Sign in to the private Founder HQ."],
  ["hq/reset-password/index.html", "reset", "Reset password | Founder HQ", "Reset your Founder HQ password."],
  ["hq/dashboard/index.html", "dashboard", "Today | Founder HQ", "Private Founder HQ dashboard."],
  ["hq/inbox/index.html", "inbox", "Inbox | Founder HQ", "Private Founder HQ capture inbox."],
  ["hq/projects/index.html", "projects", "Projects | Founder HQ", "Private Founder HQ projects."],
  ["hq/calendar/index.html", "calendar", "Calendar | Founder HQ", "Private Founder HQ calendar."],
  ["hq/goals/index.html", "goals", "Goals | Founder HQ", "Private Founder HQ goals."],
  ["hq/decisions/index.html", "decisions", "Decisions | Founder HQ", "Private Founder HQ decision log."],
  ["hq/review/index.html", "review", "Weekly Review | Founder HQ", "Private Founder HQ weekly review."],
];
for (const [path, page, title, description] of hqPages) {
  const authPage = page === "login" || page === "reset";
  const body = authPage
    ? `<main class="auth-page"><section class="auth-panel"><a class="hq-brand" href="/"><strong>NAADIX</strong><span>FOUNDER HQ</span></a><p class="eyebrow">HQ / PRIVATE NODE</p><h1>${page === "login" ? "Founder system." : "Reset access."}</h1><p class="muted">${description}</p>${page === "login" ? `<form id="login-form"><label>Founder ID or email<input name="login" autocomplete="username" placeholder="founder" required></label><label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></label><button class="hq-action" type="submit">Enter HQ</button></form><p id="message" class="message" hidden></p><a class="back-link" href="/hq/reset-password/">Forgot password?</a>` : `<form id="reset-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><button class="hq-action" type="submit">Send reset link</button></form><form id="update-form" hidden><label>New password<input name="password" type="password" autocomplete="new-password" required></label><label>Confirm password<input name="confirmation" type="password" autocomplete="new-password" required></label><button class="hq-action" type="submit">Update password</button></form><p id="message" class="message" hidden></p><a class="back-link" href="/hq/">Back to sign in</a>`}</section></main>`
    : `<div id="hq-root"></div>`;
  await emit(path, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><link rel="stylesheet" href="/assets/hq/hq.css"></head><body data-hq-page="${page}">${body}<script type="module" src="/assets/hq/app.js"></script></body></html>`);
}
await emit(
  "assets/config.js",
  `export const company=${JSON.stringify(company)};\nexport const workflows=${JSON.stringify(workflows)};\nexport const architectures=${JSON.stringify(architectures)};\n`,
);
const verification = [
  "CNAME",
  "google1677bfbddc336616.html",
  "BingSiteAuth (1).xml",
  "4afff44e0015449b961a3c19974d3e03.txt",
];
for (const file of verification) await cp(join(root, file), join(out, file));
await emit(
  "404.html",
  layout(
    "/404.html",
    "Signal Lost — NaadiX",
    "The system you are looking for is not connected here.",
    `<section class="section prose"><p class="eyebrow">404 / SIGNAL LOST</p><h1>Signal<br><span>lost.</span></h1><p class="lede">The system you're looking for isn't connected here.</p><div class="hero-actions"><a class="button primary" href="/">Return Home ↗</a><a class="text-link" href="/labs/">Explore NaadiX Labs ↗</a></div></section>`,
  ).replace("</head>", '<meta name="robots" content="noindex"></head>'),
);
await emit(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(([p]) => `<url><loc>${company.domain}${p}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await emit(
  "robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${company.domain}/sitemap.xml\n`,
);
await emit(".nojekyll", "");
const redirects = {
  "/webpages/home.html": "/",
  "/home.html": "/",
  "/webpages/mission.html": "/method/",
  "/mission.html": "/method/",
  "/webpages/FAQ.html": "/faq/",
  "/webpages/contact-us.html": "/contact/",
  "/webpages/contact.html": "/contact/",
  "/contact.html": "/contact/",
  "/webpages/founder/intro.html": "/founder/",
  "/founder.html": "/founder/",
  "/webpages/founder/skills.html": "/founder/",
  "/webpages/founder/contact-me.html": "/contact/",
  "/webpages/founder/event-gallery.html": "/founder/",
  "/webpages/products/home-product.html": "/labs/",
  "/projects.html": "/labs/",
  "/webpages/founder/projects/home-projects.html": "/labs/",
  "/webpages/products/content-gen-agent.html": "/labs/content-agent/",
  "/webpages/products/affiliate-agent.html": "/labs/affiliate-agent/",
  "/webpages/founder/projects/content-gen-agent.html": "/labs/content-agent/",
  "/webpages/founder/projects/contentagent.html": "/labs/content-agent/",
  "/webpages/founder/projects/affiliate-agent.html": "/labs/affiliate-agent/",
  "/webpages/founder/projects/affiliateagent.html": "/labs/affiliate-agent/",
  "/webpages/founder/projects/rover.html": "/labs/",
};
for (const [old, target] of Object.entries(redirects))
  await emit(
    old.slice(1),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page moved — NaadiX</title><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${company.domain}${target}"></head><body><p>This page has moved. <a href="${target}">Continue to NaadiX</a>.</p></body></html>`,
  );
await emit(
  "_redirects",
  Object.entries(redirects)
    .map(([a, b]) => `${a} ${b} 301`)
    .join("\n") + "\n",
);
await emit(
  "_headers",
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://bynkxhfzbityeufqllxi.supabase.co https://cloudflareinsights.com https://*.cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:; object-src 'none'\n`,
);
// Retire only the previous internal PWA. No dashboard content is shipped.
await emit(
  "webpages/lab/sw-lab.js",
  `self.addEventListener('install',()=>self.skipWaiting());\nself.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('naadix-lab-'))await caches.delete(key);}await self.registration.unregister();})()));\n`,
);
// Original geometric social card, PNG encoded with Node standard library.
const width = 1200,
  height = 630,
  raw = Buffer.alloc((width * 4 + 1) * height);
const segment = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
    );
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
};
for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
    const i = y * (width * 4 + 1) + 1 + x * 4,
      d = Math.hypot(x - 900, y - 315),
      glow = Math.max(0, 1 - d / 350),
      grid = x % 60 === 0 || y % 60 === 0;
    let r = 5 + glow * 10,
      g = 7 + glow * 17,
      b = 12 + glow * 40;
    if (grid) {
      r += 8;
      g += 8;
      b += 9;
    }
    if (
      segment(x, y, 110, 425, 110, 205) < 5 ||
      segment(x, y, 110, 205, 330, 425) < 5 ||
      segment(x, y, 330, 425, 330, 205) < 5 ||
      segment(x, y, 110, 315, 330, 315) < 3
    ) {
      r = 164;
      g = 188;
      b = 255;
    }
    for (let n = 0; n < 6; n++) {
      const a = (n * Math.PI) / 3,
        px = 900 + 190 * Math.cos(a),
        py = 315 + 190 * Math.sin(a);
      if (
        segment(x, y, 900, 315, px, py) < 1.2 ||
        Math.hypot(x - px, y - py) < 6
      ) {
        r = 110;
        g = 145;
        b = 212;
      }
    }
    if (d < 10) {
      r = 210;
      g = 223;
      b = 255;
    }
    raw[i] = r;
    raw[i + 1] = g;
    raw[i + 2] = b;
    raw[i + 3] = 255;
  }
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (name, data) => {
  const type = Buffer.from(name),
    body = Buffer.concat([type, data]),
    size = Buffer.alloc(4),
    sum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([size, body, sum]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
await emit(
  "assets/social-card.png",
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]),
);
console.log(
  `Built ${routes.length} public pages, ${Object.keys(redirects).length} compatibility redirects, and verified ownership files into dist.`,
);
