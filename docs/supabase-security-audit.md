# Supabase security audit

## Active project

The static Founder HQ uses only the publishable browser key for project `bynkxhfzbityeufqllxi`. No service-role key, secret key, database password, connection string, or server credential is shipped in `dist/`.

The inactive legacy project is `pzgmgxsszcuikhtomtcu`. The local Supabase CLI exposes a supported `projects delete` command, but no Supabase account access token is available in this environment. No deletion was attempted and the active project was not modified. Permanent removal of the inactive project must be completed from an authenticated Supabase dashboard or CLI session after re-verifying its project reference.

## HQ tables and migrations

The preserved migrations are in `supabase/migrations/`. They define owner-scoped RLS for the HQ tables. Direct records use `user_id = auth.uid()` for SELECT and DELETE, both `USING` and `WITH CHECK` for UPDATE, and `WITH CHECK` for INSERT. Project items and actions inherit access through their parent project's owner.

The static client sends `user_id` only when creating records. RLS remains the authorization boundary and filters every browser request.

## `posts`

The repository does not reference `public.posts` in the public site or static HQ. No policy was invented for this unused table. Before removing it, confirm that no external integration depends on it and understand its origin; then use a reviewed database migration.

## Remaining dashboard action

Leaked-password protection is a Supabase Auth project setting. Enable it in the active project's Auth security settings if the project advisor still reports it. This cleanup did not change Auth, tables, policies, or any active-project data.
