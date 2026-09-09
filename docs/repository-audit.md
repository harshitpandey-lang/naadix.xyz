# Repository audit — 9 September 2026

Inspected all present file groups and text files, the tracked tree (325 paths), public/founder/product page content, dashboard storage/authentication, PWA scope, deployment config, verification files and old project scripts. The working tree already has deletions under coaching-master; those changes are not part of this rebuild.

| Area                                                        | Class              | Decision                                                                                                                                                                           |
| ----------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| index.html, styles.css, script.js, 404.html                 | A: modernize       | Replace the public experience with generated static pages and modular source. Root files are previous-generation source; deploy dist only.                                         |
| webpages/home.html, mission.html, FAQ.html, contact-us.html | A / D              | Rewrite useful ideas; emit compatibility redirects. Old source retained, not published.                                                                                            |
| webpages/founder intro, skills, contact-me, event-gallery   | A / D              | Use founder identity and engineering interests only. Placeholder certificates, statistics, testimonials, contact links and unlabeled photos are not evidence.                      |
| founder/projects and products agent pages                   | B: Labs            | Content-generation, affiliate and rover ideas become honest concept writeups. JS mainly logs messages or animates progress bars; completion percentages do not establish maturity. |
| founder/projects game, website, technocrew                  | D / B              | Preserve source; no released game/branding claims. The new public website is a working software example.                                                                           |
| webpages/courses.html, products/courses.html, c.html        | D: archive         | Course outlines/template marketing, no complete curriculum established. Excluded from public build.                                                                                |
| webpages/lab, javascript/lab, css/lab                       | C: HQ              | Founder, family, guest tools; preserve source and exclude every path from deployment.                                                                                              |
| tution.html, tution files                                   | C: HQ              | Personal tuition planning and browser storage; excluded.                                                                                                                           |
| images (18 JPEGs)                                           | D / infrastructure | Retain originals; no inferred client/founder identity or project maturity from images. Public site uses original procedural diagrams.                                              |
| site/assets/naadix-logo.png                                 | A: brand infrastructure | Official logo supplied by the founder on 9 September 2026. Preserve the source artwork; use CSS presentation for dark surfaces.                                                 |
| coaching-master                                             | D: legacy          | Tracked third-party education template, locally deleted before this task. Do not restore, delete or publish.                                                                       |
| CNAME, Google HTML, Bing XML, ownership TXT                 | E: infrastructure  | Copy byte-for-byte into public artifact.                                                                                                                                           |
| sitemap.xml, robots.txt                                     | E: infrastructure  | Generate for real public routes.                                                                                                                                                   |
| Lab manifest and service worker                             | C / E              | Preserve source and scope; exclude from public build. Old service worker cleanup is scoped to its own cache names.                                                                 |
| wrangler.jsonc, .gitignore, .setup-naadix.bat               | E                  | Preserve setup script and Cloudflare name/date. Change asset directory to dist. Add reproducible Pages artifact workflow.                                                          |

## Security findings

`javascript/lab/auth.js` contains hard-coded founder/family passwords and trusts sessionStorage roles. This is not authentication. Treat those values as disclosed; replace/rotate if reused elsewhere. Values are deliberately not repeated here. Excluding files from the website does not remove them from public Git history.

HQ scripts handle geolocation, finances, health, journals, goals, calendar, education and private notes in browser storage. No exported user records were identified in the source audit; existing browsers may hold them. Source exclusion is not a migration of browser data. A future private HQ app needs server-enforced identity/authorization, data storage and explicit migration/export consent.

The old PWA caches dashboard pages and its activate handler deletes unrelated origin caches. Preserve it as historical source; do not use it for the company site. The public build supplies a narrowly scoped retirement worker at its old URL so revisiting clients can clear only naadix-lab caches and unregister it.

No provider secret was identified beyond the dashboard credentials by the source pattern review. This is a source review, not a guarantee covering remote services or Git history.

## Architecture decision

Use Node's standard library to render semantic HTML from centralized data and reusable templates. Output directory is an allowlist, not a copy of the repository. Native JS modules enhance already-visible content; no framework runtime or build dependencies. Clean directory routes work on GitHub Pages and Cloudflare. This avoids a framework migration with no material benefit for an editorial consultancy site.

NaadiX = company. NaadiX Labs = public experiments with explicit maturity. NaadiX HQ = internal software, excluded from artifact and planned for a private app. Keep these boundaries in all future content.
