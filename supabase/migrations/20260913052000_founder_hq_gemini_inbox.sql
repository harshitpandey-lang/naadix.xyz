-- Founder HQ: Gemini-assisted inbox intelligence. All rows remain owner-scoped.

alter table public.inbox_items
  add column if not exists ai_priority text check (ai_priority is null or ai_priority in ('critical','high','normal','low')),
  add column if not exists ai_category text,
  add column if not exists ai_summary text,
  add column if not exists ai_reason text,
  add column if not exists ai_suggested_action text,
  add column if not exists ai_action_required boolean,
  add column if not exists ai_processed_at timestamptz,
  add column if not exists ai_model text;

create table if not exists public.inbox_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brief_date date not null default current_date,
  content jsonb not null default '{}'::jsonb,
  item_count integer not null default 0,
  model text,
  created_at timestamptz not null default now(),
  unique (user_id, brief_date)
);

create index if not exists inbox_items_ai_priority_idx on public.inbox_items(user_id, ai_priority, created_at desc);
create index if not exists inbox_briefs_user_date_idx on public.inbox_briefs(user_id, brief_date desc);

alter table public.inbox_briefs enable row level security;

drop policy if exists "inbox_briefs owner select" on public.inbox_briefs;
drop policy if exists "inbox_briefs owner insert" on public.inbox_briefs;
drop policy if exists "inbox_briefs owner update" on public.inbox_briefs;
drop policy if exists "inbox_briefs owner delete" on public.inbox_briefs;
create policy "inbox_briefs owner select" on public.inbox_briefs for select to authenticated using ((select auth.uid()) = user_id);
create policy "inbox_briefs owner insert" on public.inbox_briefs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "inbox_briefs owner update" on public.inbox_briefs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "inbox_briefs owner delete" on public.inbox_briefs for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.inbox_briefs to authenticated;
