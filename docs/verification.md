# Verification — 10 September 2026

## Local checks

The required checks passed both before and after final cleanup:

- `npm run check`
- `npm test`: 10 tests passed, 0 failed
- `npm run build`: 12 public pages, 23 compatibility redirects, and ownership files generated
- `git diff --check`: passed; Git reported only expected LF-to-CRLF checkout warnings

The tests cover static HQ routes and assets, browser Supabase auth boundaries, the absence of privileged browser credentials and Vercel dependencies, public route metadata and local links, ownership-file integrity, the public information architecture, sitemap contents, artifact isolation, scanner behavior, and email-brief preservation.

## Artifact and security

The final `dist/` hash manifest matched the pre-cleanup build byte-for-byte across all 68 generated files. Cleanup changed repository organization and documentation only; production assets did not change, so the Cloudflare Worker was not redeployed.

Credential-pattern scans covered current repository files and `dist/` for service-role markers, Supabase secret-key prefixes, service-role variable names, database URLs, PostgreSQL password phrases, and Vercel tokens. No privileged credential was found. The only repository pattern-name match is the automated denylist assertion in `tests/hq.test.mjs`; `dist/` had no matches. A Supabase publishable key remains intentionally present in browser output.

## Live site

All required production URLs returned HTTP 200 after cleanup:

- `https://naadix.xyz/`
- `https://naadix.xyz/founder/`
- `https://naadix.xyz/hq/`
- `https://naadix.xyz/hq/dashboard/`
- `https://naadix.xyz/hq/projects/`
- `https://naadix.xyz/hq/calendar/`
- `https://naadix.xyz/hq/goals/`

Production authentication had already been verified before cleanup. The static HQ client and generated artifact were unchanged, and no Supabase Auth, database, RLS, Cloudflare DNS, or domain-registration setting was modified.

## External cleanup

The Vercel project inspected as `naadix/naadix-hq` with project ID `prj_bLLmbSf5RAhXiSiNUCQyz3bl9UYd`. It was permanently removed, and a scoped project listing then returned no projects under `naadix`.

The inactive Supabase project `pzgmgxsszcuikhtomtcu` was not modified because the local CLI had no authenticated access token. The active project `bynkxhfzbityeufqllxi` was not modified.
