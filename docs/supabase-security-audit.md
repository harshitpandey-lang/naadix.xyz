# Supabase security audit

## Active project

The static Founder HQ uses only the publishable browser key for project `bynkxhfzbityeufqllxi`. No service role key, secret key, database password, or server credential is shipped in `dist`.

## HQ tables

The checked migrations define owner-scoped RLS for the HQ tables. Direct records use `user_id = auth.uid()` for SELECT and DELETE, and both `USING` and `WITH CHECK` for UPDATE. INSERT policies use `WITH CHECK user_id = auth.uid()`. Project items and actions inherit ownership through their parent project owner policy.

The static client sends `user_id` only when creating records; RLS remains the security boundary and filters every browser request at the database layer.

## `posts`

The repository does not reference `public.posts` in the public site, static HQ, or current Next.js HQ feature code. No access policy was invented for an unused table. Before removing it from Supabase, confirm no external integration depends on it, then remove it through a reviewed database migration.

## Remaining Supabase dashboard action

Supabase's leaked-password protection setting is a project-level Auth configuration, not something this static repository can safely enable. Enable leaked-password protection in the active project's Auth security settings before treating the advisor warning as resolved.
