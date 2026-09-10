# NaadiX — Intelligence, engineered.

NaadiX is an early, founder-led AI consultancy and intelligent systems company. It helps organizations identify, design and build useful AI systems: strategy, agents, workflow automation, custom applications, integrations and knowledge systems.

## Three distinct layers

- **NaadiX:** the public business website and its capability demonstrations.
- **NaadiX Labs:** public AI concepts and experiments in agentic interfaces, research agents, and workflow intelligence, labeled by maturity.
- **NaadiX HQ:** a private Supabase-authenticated Founder Operating System generated into `/hq/` and served by the same Cloudflare Worker.

Read [the full repository audit](docs/repository-audit.md) for classification, source evidence and security findings. In particular, the old browser-side dashboard passwords are disclosed credentials, not real authentication. Do not reuse them. Public build exclusion does not erase Git history or clear personal browser storage.

## Architecture

A small dependency-free Node static generator renders semantic HTML from reusable templates and centralized content. Native browser modules add interaction. No React/Next.js migration was needed to deliver these routes or interactions. Node 20+ is required; Node 22 is used in CI.

Only **dist/** is a deployable website. It is rebuilt from an explicit allowlist. Do not deploy the repository root: it contains archived pages and internal source. Old root index.html/styles.css/script.js/404.html are retained under archive/first-redesign; the new homepage is generated into dist/index.html.

Public routes: /, /capabilities/, /solutions/, /method/, /labs/, /labs/content-agent/, /labs/affiliate-agent/, /labs/workflow-intelligence/, /founder/, /contact/, /faq/, /privacy/. Private routes: /hq/, /hq/dashboard/, /hq/projects/, /hq/calendar/, /hq/goals/. Clean directory URLs work without a SPA fallback. Missing routes return the custom 404. Older public routes get HTML redirects and Cloudflare 301 rules; obsolete courses and internal tools are intentionally not routed into the public experience.

The Intelligence Network is a perspective-projected 3D topology using Canvas2D. It has labeled system nodes, data pulses, scroll connection states, gentle rotation and pointer response. This avoids a WebGL/runtime dependency and large textures. SVG remains if Canvas or module loading fails. Animation pauses offscreen, on hidden tabs, when manually paused and for reduced motion; mobile caps rendering resolution. No WebGL is required.

## Local development

```sh
npm run dev
```

Builds and serves only dist at http://127.0.0.1:4174/. Rebuild after source edits; the preview server serves updated output. There is no automatic hot reload. Set PORT to change the port.

```sh
npm run check
npm run build
npm test
```

No dependency installation is required for these commands. check runs syntax checks; there is no separate lint dependency. Tests check generated routes/assets, metadata, verification file integrity, public artifact isolation, recommendation rules and brief creation.

## Source map / editing

| File                           | Purpose                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| site/data.mjs                  | Company/domain/email/founder/social URLs, navigation, capabilities, solutions, Labs, FAQ, method and simulator workflows |
| site/templates.mjs             | Reusable page sections, layout, inquiry markup and page registry                                                         |
| site/assets/site.css           | Design tokens, typography, layouts, motion and responsive rules                                                          |
| site/assets/naadix-logo.png    | Official supplied NaadiX logo artwork, used for the site mark and browser icons                                           |
| site/assets/app.js             | Navigation, command palette, diagrams, simulator, scanner and restrained cursor                                          |
| site/assets/network.js         | Lazy-loaded Canvas network and motion lifecycle                                                                          |
| site/assets/assessment.js      | Deterministic recommendation rules                                                                                       |
| site/assets/contact.js         | Five-step inquiry, validation, context, copy/download and draft state                                                    |
| site/assets/contact-service.js | Submission integration boundary; currently local email brief preparation                                                 |
| site/assets/analytics.js       | No-op analytics adapter; no tracking provider or IDs installed                                                           |
| scripts/build.mjs              | Public allowlist, redirects, SEO, social PNG and verification copies                                                     |
| scripts/serve.mjs              | Artifact-only local server with real 404 responses                                                                       |
| site/hq/                       | Static Founder HQ browser client, Supabase Auth/REST adapter and responsive private UI                                  |

Company email and the founder's LinkedIn profile are confirmed. GitHub links to this repository rather than claiming a separately verified profile. Founder links are centralized in `site/data.mjs` and appear in the site footer, founder page and command menu.

## Contact behavior and privacy

The five steps cover interest, organization, workflow, stage and contact/consent. Native constraints are checked at each step. Back/edit preserve answers. The scanner stores context only after the visitor chooses to discuss it, in sessionStorage with a one-hour validity window; the form offers removal. Blocked storage falls back to manual entry.

No backend receives inquiries. The final action prepares a mailto link, a preview, clipboard copy and text download. Nothing is declared sent or received. The visitor must send the email using their chosen app. Long drafts may exceed an email client's URL limit; copy and download are provided. No-JavaScript visitors use the direct email link; the submit button is disabled until initialization.

To enable direct submissions, replace the service boundary with a same-origin server endpoint or a configured form provider. Validate and sanitize on the server, enforce allowed origins, add rate limiting and spam checks, limit payload length, and return a documented acceptance response. Credentials belong in server-side environment settings. The current honeypot is only an interface strategy, not server-side spam protection. Add delivery/error tests and update the privacy page before enabling collection. Supabase, Resend, Formspree, Notion, Sheets, HubSpot or webhooks can sit behind that adapter; none is configured by default.

## Deployment

### Cloudflare Workers / Pages

Run npm run build, then use npx wrangler deploy for Workers. wrangler.jsonc retains the original worker name, compatibility date and flags; assets.directory now points to dist with 404-page handling. Set the connected pipeline build command to npm run build. Cloudflare Pages can use the same build command and dist output. Keep the existing domain association. Do not upload the source root.

See [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/) for host configuration. The generated _headers and _redirects support Cloudflare; GitHub Pages does not apply those files as HTTP policy.

### GitHub Pages

.github/workflows/pages.yml builds, checks and uploads only dist, then deploys using the official Pages artifact workflow. In repository Settings → Pages, select GitHub Actions as the publishing source. Preserve the existing naadix.xyz custom domain. Do not use branch-root publishing. The workflow needs Pages enabled and environment permissions.

CNAME, the Google verification HTML, Bing XML and ownership TXT are copied byte-for-byte. sitemap.xml, robots.txt, canonicals, OpenGraph/Twitter metadata, original PNG social art, favicon and Organization/WebSite schema are generated. Every substantive public page has a unique title/description and one H1. Compatibility redirects are not in the sitemap.

## Preserved source and HQ migration

webpages/, javascript/, css/, images/, c.html, tution.html and tution files remain source material. They are never copied wholesale. Existing coaching-master deletions are unrelated and were left untouched. The original Lab manifest/service worker remains in source. A narrowly scoped retirement worker is generated at its old URL to delete only naadix-lab-* caches and unregister; it does not publish dashboards or delete localStorage records. Previously installed offline clients may retain cached content until they reconnect and the worker updates.

Founder HQ uses browser Supabase Auth with a `founder` login alias, local session persistence, password recovery, direct Supabase REST operations and owner-scoped RLS. Only the Supabase publishable key is shipped. See [the Supabase security audit](docs/supabase-security-audit.md).

## Verification and remaining decisions

The automated tests and browser smoke tests cover all public routes, mobile overflow/menu, capability expansion, human checkpoint inspection, simulator changes, scanner handoff, inquiry validation, command search, 404 and internal exclusion. Browser scenarios are in tests/browser-home.js and tests/browser-contact.js for use with agent-browser eval --stdin after opening the preview; they do not send mail.

Remaining external actions: configure a real public inquiry backend if desired; enable leaked-password protection in Supabase Auth; deploy the built `dist` artifact to the existing `naadix` Worker; add case studies only when evidence exists. No commercial results, client claims or invented credentials are published. No Lighthouse score is claimed without a measured run.
