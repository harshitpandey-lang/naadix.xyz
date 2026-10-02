# Website services page

Implemented in the existing static site generator. Build output is `dist/web.html`; Cloudflare's existing automatic HTML handling serves `/web`. The local preview also serves `/web` directly.

## Metadata
- Title: Website Design & Development in India | Naadix
- Description: Naadix builds business websites, ecommerce stores and 3D animated websites for businesses across India and worldwide. Call or WhatsApp us for a quote.
- H1: Website Design & Development for your business.
- Canonical: https://naadix.xyz/web
- Social image: existing generated `/assets/social-card.png` (1200 × 630).
- JSON-LD: Organization with shared stable entity ID, WebPage and Service.

## Verification
- `npm run check`: passed.
- `npm run build`: passed.
- `npm test`: 34 passed, 0 failed after building the artifact.
- `git diff --check`: passed.
- Browser: page and homepage loaded; no reported browser errors.
- No horizontal overflow at 360, 390 and 768 pixels; desktop screenshot reviewed at 1440 pixels.
- Reduced-motion: media query active, browser-panel animation computed as `none`.
- Form: invalid submission blocked, valid brief prepared, budget retained, verified mailto destination, edit action works. No email was sent during verification.
- Animation pause action verified. Offscreen/document visibility pause implemented.
- Canonical and connected JSON-LD checked; sitemap includes `/web`; existing robots rules retained.
- All page section anchors resolve; repository tests verify local routes/assets.

## Remaining launch work
- The page is deployed to the existing Cloudflare Worker. Source updates are synchronized to GitHub main.
- The existing contact system only prepares an email draft. Direct server submission requires an approved endpoint/provider and delivery credentials. The UI never reports a successful submission.
- No client projects or testimonials were supplied; previews are labelled concepts.
- Noida location and worldwide availability come from the supplied brief. Exact pricing, timelines, revisions, ownership, hosting and support need confirmation in each quotation.
- Core Web Vitals, Lighthouse and a full automated accessibility audit have not been measured. Do not present performance targets as achieved. Keyboard semantics, focus styles, form labels, responsive layout and reduced-motion behavior were implemented and checked where described above.
- Existing social image is used; a dedicated website-services share image can be added later.

## Post-launch checklist
- Verify live `/web` status, refresh, canonical, sitemap and robots after deployment.
- Inspect `/web` in Google Search Console, refresh the sitemap and request indexing.
- Maintain an accurate Google Business Profile if eligible.
- Add genuine client reviews and case studies as available.
- Seek relevant, legitimate mentions and links.
- Track actual queries, impressions, clicks and enquiries; refine service content using that evidence.
- Consider substantive ecommerce, business website and redesign service pages as the offer develops.

## India-wide SEO and location personalization
- India-wide title, description, H1 and visible service copy replace Noida-specific positioning.
- Service OfferCatalog and FAQPage JSON-LD match the visible services and FAQ answers. These do not guarantee rich results or rankings.
- `/api/location` reads Cloudflare-provided country/city at the edge. It returns only an approximate Indian city and country; responses are private and not cached. No GPS, external geocoding service, client location headers or stored IP/coordinates are used by this feature.
- Static SEO content, canonical and metadata are consistent for all visitors. The service-area message personalizes in the browser and can be corrected or reset. Session storage remembers only a manually selected city or reset preference.
- Outside India, missing location, blocked requests and errors retain the India/worldwide message.
- Browser tested with a mocked Ayodhya response, Noida correction and India reset; 390px layout has no overflow. Edge location depends on deployment to Cloudflare and IP accuracy.
- Latest build and 33 Node tests pass, including worker method handling, cache isolation, untrusted header handling, HTML safety and static asset fallback.
- Deployment now includes `site/worker.mjs` and the ASSETS binding. Worker-first routing is limited to `/api/location`; other routes retain static delivery.
- Privacy page documents approximate location and the correction mechanism.
