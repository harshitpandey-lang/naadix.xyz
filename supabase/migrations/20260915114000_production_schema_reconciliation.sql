-- Idempotent reconciliation for the live Founder HQ project.
-- Keeps existing data while ensuring every shipped HQ workspace has a table,
-- owner-scoped RLS, and the indexes used by the browser Data API queries.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.projects add column if not exists priority smallint not null default 3 check (priority between 1 and 5);
alter table public.projects add column if not exists health text not null default 'ON_TRACK' check (health in ('ON_TRACK','AT_RISK','BLOCKED'));
alter table public.projects add column if not exists next_action text;
alter table public.projects add column if not exists blocker text;
alter table public.projects add column if not exists deadline date;
alter table public.project_items add column if not exists type text not null default 'todo';
alter table public.project_items add column if not exists position integer not null default 0;
alter table public.project_items add column if not exists completed_at timestamptz;
alter table public.project_actions add column if not exists position integer not null default 0;
alter table public.project_actions add column if not exists completed_at timestamptz;
alter table public.goals add column if not exists priority smallint not null default 3 check (priority between 1 and 4);
alter table public.goals add column if not exists current_value numeric;
alter table public.goals add column if not exists next_step text;
alter table public.goals add column if not exists project_id uuid references public.projects(id) on delete set null;

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  completed boolean not null default false,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.development_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  current_focus text,
  priority smallint not null default 3 check (priority between 1 and 5),
  status text not null default 'active' check (status in ('active','paused','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  development_area_id uuid references public.development_areas(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  current_level smallint not null default 1 check (current_level between 1 and 5),
  target_level smallint not null default 3 check (target_level between 1 and 5),
  status text not null default 'building' check (status in ('building','active','learning','paused')),
  priority smallint not null default 3 check (priority between 1 and 5),
  notes text,
  last_reviewed date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  item_type text not null default 'article' check (item_type in ('course','book','paper','article','tutorial','experiment','topic')),
  status text not null default 'queue' check (status in ('queue','active','complete')),
  source_url text,
  notes text,
  progress smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  body text not null default '',
  note_type text not null default 'general' check (note_type in ('idea','meeting','research','strategy','learning','general')),
  pinned boolean not null default false,
  tags text[] not null default '{}',
  project_id uuid references public.projects(id) on delete set null,
  goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_of date not null,
  went_well text,
  moved_forward text,
  slowed_down text,
  learned text,
  stop_doing text,
  priorities_next_week text,
  top_outcome text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, week_of)
);

create table if not exists public.development_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  development_area_id uuid references public.development_areas(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.development_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  reflected_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  item_type text not null check (item_type in ('priority','pipeline','project','content','lab','decision')),
  status text not null default 'active' check (status in ('active','planned','waiting','complete','archived')),
  notes text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inbox_items add column if not exists notes text;
alter table public.inbox_items add column if not exists ai_priority text;
alter table public.inbox_items add column if not exists ai_category text;
alter table public.inbox_items add column if not exists ai_summary text;
alter table public.inbox_items add column if not exists ai_reason text;
alter table public.inbox_items add column if not exists ai_suggested_action text;
alter table public.inbox_items add column if not exists ai_action_required boolean not null default false;
alter table public.inbox_items add column if not exists ai_processed_at timestamptz;
alter table public.inbox_items add column if not exists ai_model text;

create table if not exists public.inbox_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brief_date date not null default current_date,
  content jsonb not null default '{}'::jsonb,
  item_count integer not null default 0,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, brief_date)
);

create table if not exists public.daily_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  focus_date date not null default current_date,
  entity_type text not null,
  entity_id uuid,
  label text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, focus_date)
);

create table if not exists public.waiting_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  waiting_for text not null,
  related_project_id uuid references public.projects(id) on delete set null,
  follow_up_at timestamptz,
  status text not null default 'WAITING' check (status in ('WAITING','RESOLVED','DROPPED')),
  notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  decision text not null,
  reasoning text,
  project_id uuid references public.projects(id) on delete set null,
  decided_at timestamptz not null default now(),
  review_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings add column if not exists scheduled_at timestamptz;
alter table public.meetings add column if not exists starts_at timestamptz;
update public.meetings set starts_at = scheduled_at where starts_at is null and scheduled_at is not null;
update public.meetings set scheduled_at = starts_at where scheduled_at is null and starts_at is not null;
alter table public.meetings alter column starts_at set not null;
alter table public.meetings alter column scheduled_at set default now();
alter table public.meetings alter column scheduled_at set not null;
alter table public.meetings add column if not exists ended_at timestamptz;
alter table public.meetings add column if not exists ends_at timestamptz;
update public.meetings set ends_at = ended_at where ends_at is null and ended_at is not null;
update public.meetings set ended_at = ends_at where ended_at is null and ends_at is not null;
alter table public.meetings add column if not exists transcript text not null default '';
alter table public.meetings add column if not exists outcome text;

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('income','expense')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  category text not null,
  description text not null,
  occurred_on date not null default current_date,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'cleared' check (status in ('planned','cleared','pending')),
  recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_items_project_order_idx on public.project_items(project_id, position);
create index if not exists project_items_user_id_idx on public.project_items(user_id);
create index if not exists project_items_completed_at_idx on public.project_items(completed_at) where completed_at is not null;
create index if not exists project_actions_project_position_idx on public.project_actions(project_id, position);
create index if not exists project_actions_user_id_idx on public.project_actions(user_id);
create index if not exists project_actions_completed_at_idx on public.project_actions(completed_at) where completed_at is not null;
create index if not exists goals_project_id_idx on public.goals(project_id);
create index if not exists goal_milestones_goal_id_idx on public.goal_milestones(goal_id, position);
create index if not exists goal_milestones_user_id_idx on public.goal_milestones(user_id);
create index if not exists development_areas_user_id_idx on public.development_areas(user_id);
create index if not exists skills_user_id_idx on public.skills(user_id);
create index if not exists skills_development_area_id_idx on public.skills(development_area_id);
create index if not exists learning_items_user_status_idx on public.learning_items(user_id, status);
create index if not exists learning_items_skill_id_idx on public.learning_items(skill_id);
create index if not exists learning_items_project_id_idx on public.learning_items(project_id);
create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);
create index if not exists notes_project_id_idx on public.notes(project_id);
create index if not exists notes_goal_id_idx on public.notes(goal_id);
create index if not exists company_items_user_type_idx on public.company_items(user_id, item_type);
create index if not exists development_milestones_user_id_idx on public.development_milestones(user_id);
create index if not exists development_milestones_area_id_idx on public.development_milestones(development_area_id);
create index if not exists development_reflections_user_id_idx on public.development_reflections(user_id);
create index if not exists inbox_items_ai_priority_idx on public.inbox_items(user_id, ai_priority, created_at desc);
create index if not exists inbox_briefs_user_date_idx on public.inbox_briefs(user_id, brief_date desc);
create index if not exists daily_focus_user_date_idx on public.daily_focus(user_id, focus_date);
create index if not exists waiting_items_user_status_follow_up_idx on public.waiting_items(user_id, status, follow_up_at);
create index if not exists waiting_items_project_idx on public.waiting_items(related_project_id);
create index if not exists decisions_user_decided_idx on public.decisions(user_id, decided_at desc);
create index if not exists decisions_project_idx on public.decisions(project_id);
create index if not exists meetings_user_scheduled_at_idx on public.meetings(user_id, scheduled_at desc);
create index if not exists finance_transactions_user_date_idx on public.finance_transactions(user_id, occurred_on desc);
create index if not exists finance_transactions_project_idx on public.finance_transactions(project_id) where project_id is not null;

do $$
declare item text;
begin
  foreach item in array array[
    'goal_milestones','development_areas','skills','learning_items','notes','weekly_reviews',
    'development_milestones','development_reflections','company_items','inbox_briefs',
    'daily_focus','waiting_items','decisions','finance_transactions'
  ] loop
    execute format('alter table public.%I enable row level security', item);
    execute format('drop policy if exists "%s owner select" on public.%I', item, item);
    execute format('drop policy if exists "%s owner insert" on public.%I', item, item);
    execute format('drop policy if exists "%s owner update" on public.%I', item, item);
    execute format('drop policy if exists "%s owner delete" on public.%I', item, item);
    execute format('create policy "%s owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', item, item);
    execute format('create policy "%s owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', item, item);
    execute format('create policy "%s owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', item, item);
    execute format('create policy "%s owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', item, item);
    execute format('drop trigger if exists %I on public.%I', item || '_set_updated_at', item);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', item || '_set_updated_at', item);
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles, public.goals, public.calendar_events,
  public.projects, public.project_items, public.project_actions, public.goal_milestones,
  public.development_areas, public.skills, public.learning_items, public.notes, public.weekly_reviews,
  public.development_milestones, public.development_reflections, public.company_items,
  public.inbox_items, public.inbox_briefs, public.daily_focus, public.waiting_items, public.decisions,
  public.meetings, public.finance_transactions to authenticated;
