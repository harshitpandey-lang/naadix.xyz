-- Phase 2 Founder HQ operating fields and goal milestones.
-- All new records remain owned by the authenticated user.

alter table public.projects
  add column if not exists health text not null default 'ON_TRACK' check (health in ('ON_TRACK', 'AT_RISK', 'BLOCKED')),
  add column if not exists next_action text,
  add column if not exists blocker text;

alter table public.goals
  add column if not exists priority smallint not null default 3 check (priority between 1 and 4),
  add column if not exists current_value numeric,
  add column if not exists next_step text,
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists goals_project_id_idx on public.goals(project_id);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  completed boolean not null default false,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_milestones_goal_id_idx on public.goal_milestones(goal_id, position);

alter table public.goal_milestones enable row level security;

drop policy if exists "Goal milestones owner select" on public.goal_milestones;
drop policy if exists "Goal milestones owner insert" on public.goal_milestones;
drop policy if exists "Goal milestones owner update" on public.goal_milestones;
drop policy if exists "Goal milestones owner delete" on public.goal_milestones;
create policy "Goal milestones owner select" on public.goal_milestones for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy "Goal milestones owner insert" on public.goal_milestones for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy "Goal milestones owner update" on public.goal_milestones for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));
create policy "Goal milestones owner delete" on public.goal_milestones for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())));

create trigger goal_milestones_set_updated_at before update on public.goal_milestones for each row execute function public.set_updated_at();
grant select, insert, update, delete on table public.goal_milestones to authenticated;
