# Repository audit — 10 September 2026

The Cloudflare migration and final cleanup were reviewed against the tracked tree, generated artifact, build inputs, static Founder HQ, legacy Next.js HQ, database migrations, documentation, assets, deployment configuration, and credential patterns.

## Current source boundaries

| Area | Decision |
| --- | --- |
| `site/` | Active public website and static Founder HQ source. |
| `scripts/` | Active static build and artifact-only local server. |
| `tests/` | Active automated and browser verification. |
| `supabase/migrations/` | Retained schema, grants, triggers, and owner-scoped RLS history moved from the retired HQ app. |
| `docs/` | Current architecture/security notes and inert historical project data. |
| `images/` | Retained because these are unique original source images, not generated duplicates. They are outside the deployment allowlist. |
| ownership verification files | Retained and copied byte-for-byte into `dist/`. |
| `apps/hq/` | Removed after its unique migrations and corrected project facts were preserved. |
| `archive/`, `css/`, `javascript/`, `webpages/`, tuition files | Removed as obsolete pre-migration source that is not used by the build. |
| GitHub Pages workflow | Removed because production hosting is the Cloudflare Worker. |
| Vercel configuration and project | Local configuration was absent; the old remote `naadix-hq` project was removed. |

## Security findings

The retired browser dashboard contained hard-coded passwords and client-side role checks. That source has been removed from the current tracked tree. Treat any values exposed in earlier Git history as disclosed and do not reuse them.

The deployable artifact is created from an explicit allowlist. It includes the public website, the static HQ browser client, ownership files, compatibility redirects, security headers, and the scoped retirement worker. It excludes repository documentation, migrations, original images, local environment files, provider state, and test artifacts.

The static HQ ships only a Supabase publishable key. Authentication and authorization rely on Supabase Auth plus owner-scoped RLS; no service-role key, database URL, database password, or Vercel token is required by browser code.

## Preserved legacy information

The retired Next.js HQ contained seven useful database migrations. They were moved without content changes to `supabase/migrations/`.

Its corrected project seed facts were converted from an executable script that could clear records into inert JSON at `docs/hq-project-seed-data.json`. The associated provenance is documented in `docs/hq-data-integrity.md`. The active Supabase database remains authoritative.

## Architecture decision

Node's standard library renders semantic static HTML from centralized data and reusable templates. Native JavaScript supplies browser interactions. Cloudflare Worker static assets serve `dist/`, including the private HQ routes. Supabase provides HQ authentication and data storage. Vercel and Next.js are not part of the current architecture.
