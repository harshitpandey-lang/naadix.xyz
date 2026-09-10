# NaadiX — Intelligence, engineered.

NaadiX is a founder-led AI consultancy and intelligent systems company. This repository contains the public website and the private Founder HQ.

## Current architecture

| Layer | Current system |
| --- | --- |
| Source | GitHub and local development in VS Code |
| Frontend hosting | Cloudflare Worker `naadix` serving the generated `dist/` directory |
| Public site | `https://naadix.xyz/` |
| Private HQ | `https://naadix.xyz/hq/` |
| Authentication and database | Supabase project `bynkxhfzbityeufqllxi` |

Vercel is no longer part of the production architecture. The former `naadix-hq` Vercel project and the obsolete Next.js HQ source have been removed.

The HQ is a static browser client under `site/hq/`. It uses Supabase email/password authentication, a publishable browser key, direct REST requests, and owner-scoped row-level security. No service-role key or database credential belongs in source or `dist/`.

## Repository layout

```text
.
├── docs/                 Architecture, audits, verification, and retained data notes
├── images/               Unique original legacy source images; not deployed
├── scripts/              Static build and local artifact server
├── site/
│   ├── assets/           Shared public assets
│   └── hq/               Static Founder HQ client
├── supabase/migrations/  Preserved HQ schema and RLS history
├── tests/                Node and browser verification
├── package.json
├── wrangler.jsonc
└── README.md
```

Only `dist/` is deployable. The build recreates it from an explicit allowlist; do not deploy the repository root. Generated `dist/`, Wrangler state, Vercel local state, test output, dependencies, and local environment files are ignored by Git.

## Local development

Node.js 20 or newer is required.

```sh
npm run dev
```

This builds and serves `dist/` at `http://127.0.0.1:4174/`. Rebuild after source edits; there is no hot reload.

Run the full local verification sequence with:

```sh
npm run check
npm test
npm run build
git diff --check
```

No dependency installation is currently required. The project uses Node's standard library for generation and tests.

## Production routes

Public routes include `/`, `/capabilities/`, `/solutions/`, `/method/`, `/labs/`, `/founder/`, `/contact/`, `/faq/`, and `/privacy/`.

Private routes are:

- `/hq/`
- `/hq/dashboard/`
- `/hq/projects/`
- `/hq/calendar/`
- `/hq/goals/`

The build also emits compatibility redirects for previous public URLs and a narrowly scoped retirement service worker for old NaadiX Lab caches. It does not ship the retired dashboards or their browser-side credentials.

## Deployment

Verify, build, and deploy to the existing Cloudflare Worker:

```sh
npm run check
npm test
npm run build
npx wrangler deploy
```

The Worker name and static asset directory are defined in `wrangler.jsonc`. Keep the existing `naadix.xyz` Cloudflare domain association. Do not upload the source root, alter DNS as part of a normal deployment, or reintroduce Vercel configuration.

## Supabase

The active project is `bynkxhfzbityeufqllxi`. Its browser-safe configuration is in `site/hq/config.js`; privileged keys must never be added there.

Schema history is preserved under `supabase/migrations/`. These migrations define the HQ tables, grants, triggers, and owner-scoped RLS policies. Review and link the CLI to the active project before applying any future migration.

The unused `public.posts` table has RLS enabled and no policy. Current source does not reference it. Do not invent a policy or delete the table until its origin and any external consumers are understood.

See [the Supabase security audit](docs/supabase-security-audit.md), [the repository audit](docs/repository-audit.md), and [verification notes](docs/verification.md).
