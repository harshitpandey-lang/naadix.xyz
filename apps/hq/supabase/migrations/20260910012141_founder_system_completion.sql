-- Complete the private founder system without resetting or claiming legacy data.
-- Existing project rows remain unowned (and therefore invisible) until the owner
-- explicitly assigns them. New rows default to the authenticated user.

alter table public.projects add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.projects alter column user_id set default auth.uid();
alter table public.projects add column if not exists priority smallint not null default 3 check (priority between 1 and 5);
alter table public.projects add column if not exists deadline date;
alter table public.projects add column if not exists related_goal_ids uuid[] not null default '{}';
alter table public.projects add column if not exists links jsonb not null default '[]'::jsonb;
alter table public.projects drop constraint if exists projects_category_check;
alter table public.projects alter column category set default 'Company';

alter table public.notes add column if not exists tags text[] not null default '{}';
alter table public.notes add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.notes add column if not exists goal_id uuid references public.goals(id) on delete set null;

alter table public.learning_items add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.skills add column if not exists priority smallint not null default 3 check (priority between 1 and 5);
alter table public.skills add column if not exists notes text;
alter table public.skills add column if not exists last_reviewed date;

create table if not exists public.development_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  development_area_id uuid references public.development_areas(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.development_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  reflected_on date not null default current_date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.company_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  item_type text not null check (item_type in ('priority','pipeline','project','content','lab','decision')),
  status text not null default 'active' check (status in ('active','planned','waiting','complete','archived')),
  notes text,
  due_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);
create index if not exists learning_items_user_status_idx on public.learning_items(user_id, status);
create index if not exists company_items_user_type_idx on public.company_items(user_id, item_type);

-- Replace the legacy service-role-only project policies with owner-scoped RLS.
drop policy if exists "Projects denied" on public.projects;
drop policy if exists "Projects insert denied" on public.projects;
drop policy if exists "Projects update denied" on public.projects;
drop policy if exists "Projects delete denied" on public.projects;
create policy "Projects owner select" on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "Projects owner insert" on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Projects owner update" on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Projects owner delete" on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Project items denied" on public.project_items;
drop policy if exists "Project items insert denied" on public.project_items;
drop policy if exists "Project items update denied" on public.project_items;
drop policy if exists "Project items delete denied" on public.project_items;
create policy "Project items owner select" on public.project_items for select to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project items owner insert" on public.project_items for insert to authenticated with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project items owner update" on public.project_items for update to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project items owner delete" on public.project_items for delete to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

drop policy if exists "Project actions denied" on public.project_actions;
drop policy if exists "Project actions insert denied" on public.project_actions;
drop policy if exists "Project actions update denied" on public.project_actions;
drop policy if exists "Project actions delete denied" on public.project_actions;
create policy "Project actions owner select" on public.project_actions for select to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project actions owner insert" on public.project_actions for insert to authenticated with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project actions owner update" on public.project_actions for update to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Project actions owner delete" on public.project_actions for delete to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

do $$ declare item text; begin foreach item in array array['development_milestones','development_reflections','company_items'] loop
  execute format('alter table public.%I enable row level security', item);
  execute format('create policy "%s owner select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', item, item);
  execute format('create policy "%s owner delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', item, item);
  execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', item || '_set_updated_at', item);
end loop; end $$;

-- Explicit Data API grants are required on projects created with auto-exposure disabled.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles, public.goals, public.calendar_events,
  public.projects, public.project_items, public.project_actions, public.development_areas,
  public.skills, public.learning_items, public.notes, public.weekly_reviews,
  public.development_milestones, public.development_reflections, public.company_items to authenticated;
