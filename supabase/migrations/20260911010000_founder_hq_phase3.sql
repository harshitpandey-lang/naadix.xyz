-- Founder HQ Phase 3: capture, daily focus, dependencies, decisions, and review completion.

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  notes text,
  source text,
  status text not null default 'INBOX' check (status in ('INBOX', 'PROCESSED', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.daily_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  focus_date date not null default current_date,
  entity_type text not null check (entity_type in ('PROJECT', 'GOAL', 'PROJECT_ACTION', 'CUSTOM')),
  entity_id uuid,
  label text not null check (char_length(trim(label)) > 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, focus_date)
);

create table if not exists public.waiting_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  waiting_for text not null check (char_length(trim(waiting_for)) > 0),
  related_project_id uuid references public.projects(id) on delete set null,
  follow_up_at timestamptz,
  status text not null default 'WAITING' check (status in ('WAITING', 'RESOLVED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  decision text not null check (char_length(trim(decision)) > 0),
  reasoning text,
  project_id uuid references public.projects(id) on delete set null,
  decided_at timestamptz not null default now(),
  review_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_reviews add column if not exists top_outcome text;
alter table public.weekly_reviews add column if not exists completed_at timestamptz;

create index if not exists inbox_items_user_status_created_idx on public.inbox_items(user_id, status, created_at desc);
create index if not exists daily_focus_user_date_idx on public.daily_focus(user_id, focus_date);
create index if not exists waiting_items_user_status_follow_up_idx on public.waiting_items(user_id, status, follow_up_at);
create index if not exists waiting_items_project_idx on public.waiting_items(related_project_id);
create index if not exists decisions_user_decided_idx on public.decisions(user_id, decided_at desc);
create index if not exists decisions_project_idx on public.decisions(project_id);

alter table public.inbox_items enable row level security;
alter table public.daily_focus enable row level security;
alter table public.waiting_items enable row level security;
alter table public.decisions enable row level security;

do $$ declare item text; begin foreach item in array array['inbox_items','daily_focus'] loop
  execute format('drop policy if exists "%s owner select" on public.%I', item, item);
  execute format('drop policy if exists "%s owner insert" on public.%I', item, item);
  execute format('drop policy if exists "%s owner update" on public.%I', item, item);
  execute format('drop policy if exists "%s owner delete" on public.%I', item, item);
  execute format('create policy "%s owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', item, item);
end loop; end $$;

drop policy if exists "waiting_items owner select" on public.waiting_items;
drop policy if exists "waiting_items owner insert" on public.waiting_items;
drop policy if exists "waiting_items owner update" on public.waiting_items;
drop policy if exists "waiting_items owner delete" on public.waiting_items;
create policy "waiting_items owner select" on public.waiting_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "waiting_items owner insert" on public.waiting_items for insert to authenticated with check (
  (select auth.uid()) = user_id and (related_project_id is null or exists (select 1 from public.projects p where p.id = related_project_id and p.user_id = (select auth.uid())))
);
create policy "waiting_items owner update" on public.waiting_items for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id and (related_project_id is null or exists (select 1 from public.projects p where p.id = related_project_id and p.user_id = (select auth.uid())))
);
create policy "waiting_items owner delete" on public.waiting_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "decisions owner select" on public.decisions;
drop policy if exists "decisions owner insert" on public.decisions;
drop policy if exists "decisions owner update" on public.decisions;
drop policy if exists "decisions owner delete" on public.decisions;
create policy "decisions owner select" on public.decisions for select to authenticated using ((select auth.uid()) = user_id);
create policy "decisions owner insert" on public.decisions for insert to authenticated with check (
  (select auth.uid()) = user_id and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())))
);
create policy "decisions owner update" on public.decisions for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())))
);
create policy "decisions owner delete" on public.decisions for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists inbox_items_set_updated_at on public.inbox_items;
create trigger inbox_items_set_updated_at before update on public.inbox_items for each row execute function public.set_updated_at();
drop trigger if exists daily_focus_set_updated_at on public.daily_focus;
create trigger daily_focus_set_updated_at before update on public.daily_focus for each row execute function public.set_updated_at();
drop trigger if exists waiting_items_set_updated_at on public.waiting_items;
create trigger waiting_items_set_updated_at before update on public.waiting_items for each row execute function public.set_updated_at();
drop trigger if exists decisions_set_updated_at on public.decisions;
create trigger decisions_set_updated_at before update on public.decisions for each row execute function public.set_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.inbox_items, public.daily_focus, public.waiting_items, public.decisions to authenticated;

