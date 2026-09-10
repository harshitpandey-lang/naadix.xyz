# NaadiX Founder HQ

Private Founder Operating System for NaadiX. This Next.js application is a separate deployment from the public static site, with a shared visual language and a public entry point at `https://naadix.xyz`.

## Local development

```sh
npm ci
copy .env.example .env.local
npm run dev
```

Required values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (or the legacy anon key while migrating).

No service-role key is used by HQ. Authentication is Supabase email/password with cookie-based SSR sessions. Every private page verifies the user near its data request, while `proxy.ts` performs an additional optimistic route check. Tables use owner-scoped RLS.

## Database

Apply migrations in order from `supabase/migrations` using a linked Supabase CLI project:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The completion migration does not reset or claim old project data. If legacy project rows should belong to the founder, assign them once in the Supabase SQL editor after replacing `FOUNDER_USER_UUID`:

```sql
update public.projects set user_id = 'FOUNDER_USER_UUID' where user_id is null;
```

Find the UUID in Authentication → Users. Unowned rows remain invisible by design.

## Production deployment

Create a Vercel project with Root Directory `apps/hq` and add both required environment variables to Production, Preview, and Development. Use the default Next.js build settings.

Add `hq.naadix.xyz` in Vercel Project → Settings → Domains. At the DNS provider for `naadix.xyz`, add the exact CNAME target Vercel displays (commonly `cname.vercel-dns.com`; use the value shown in the dashboard). Then add these Supabase Auth URL settings:

- Site URL: `https://hq.naadix.xyz`
- Redirect URL: `https://hq.naadix.xyz/auth/confirm`
- Redirect URL: `https://hq.naadix.xyz/auth/update-password`
- Local redirect URL: `http://localhost:3000/auth/confirm`

The public site’s HQ control already targets `https://hq.naadix.xyz/login`.

## Verification

```sh
npm run lint
npm run build
```

Authenticated end-to-end verification additionally requires the Supabase values, applied migrations, and a founder user account.
