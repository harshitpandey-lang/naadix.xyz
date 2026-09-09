# Verification — 9 September 2026

- Production build: 12 substantive public pages, 23 compatibility redirects, custom 404 and static assets.
- Syntax checks: passed for build and browser entry modules.
- Automated tests: 5 passed; generated routes/local assets, metadata/H1, ownership-byte integrity, internal artifact exclusion, assessment rules and mailto brief generation.
- Browser: Edge through agent-browser. Homepage and contact walkthroughs passed. No JavaScript runtime errors in the normal walkthrough.
- Layouts: all 12 routes at 320, 768 and 1440 pixels; 36 checks passed with no horizontal overflow.
- Interactions: mobile menu, capability expansion, human checkpoint, simulator selection, command search, four scanner inputs, scanner handoff, all five inquiry stages, required/URL/email checks, consent, draft generation and editing.
- Reduced motion: control correctly disabled; consecutive Canvas frames identical.
- Module-failure fallback: all JS asset requests blocked; server-rendered heading and SVG fallback present with visible computed styles.
- Isolation: old dashboard and auth URLs return 404 from artifact server; no credentials or internal dashboard source in dist.
- Verification files: CNAME, Google, Bing and ownership TXT byte-identical to source.

Preview: http://127.0.0.1:4174/ while npm run dev is running. Browser scenario sources are retained under tests/. They use example information and never send an email.

No claim of a measured Lighthouse score, full assistive-technology certification, server-side inquiry delivery or live production deployment is made. Production host behavior should be checked after the artifact is deployed. Previously installed Lab service workers require a reconnect/update to retire; source exclusion does not remove old Git history or browser records.
