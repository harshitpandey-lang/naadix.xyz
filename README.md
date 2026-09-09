# NaadiX

NaadiX is a founder-led AI consultancy and intelligent systems company. We design practical AI agents, automations, integrations and custom systems that reduce repetitive work and improve operations. **NaadiX Labs** retains the company's experimental work in AI, robotics, embedded systems and prototypes.

## Architecture

This is a dependency-free static site designed for Cloudflare static-assets deployment (`wrangler.jsonc`). The public homepage is `index.html`; its visual system and responsive layout are in `styles.css`; interactions, the canvas-based Intelligence Core, scanner, and inquiry flow are in `script.js`.

Existing Lab dashboards and older projects remain in their current directories and are not linked from the public homepage. Search-engine verification files, `CNAME`, and deployment configuration are preserved.

## Run locally and deploy

Open `index.html` using a local static server. For Cloudflare development:

```sh
npx wrangler dev
```

Deploy using the existing Cloudflare pipeline, or `npx wrangler deploy` after authenticating. The asset directory is this repository root.

## Edit content and links

- Homepage copy, capabilities, Labs projects, and founder content: `index.html`
- Contact email: search for `harshitpandey3519@gmail.com` in `index.html`
- Colors, typography, responsive layout: `styles.css`
- Scanner recommendations and interactions: `script.js`

LinkedIn and GitHub are intentionally omitted until verified URLs are available.

## Inquiry form and analytics

The inquiry form validates in the browser and prepares a mailto draft. Visitors must open and send that draft in their email app; the site does not claim delivery. Its submit handler is isolated in `script.js`; replace it with a secure server-side endpoint or webhook for direct submission. Never add credentials to browser code.

No tracking is enabled by default. CTA, scanner, and form event hooks can be connected to a privacy-appropriate analytics provider later.
