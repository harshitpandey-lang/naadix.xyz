-- CEO Projects Portal Schema

-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  category text not null check (category in ('Robotics & Embedded Systems', 'AI & Automation', 'Web & EdTech', 'Sustainability / AgriTech')),
  status text check (status in ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
  progress int check (progress >= 0 and progress <= 100),
  overview text,
  current_status text,
  key_learnings text,
  challenges text,
  technical_documentation text,
  skills text[],
  technologies text[],
  contributors text,
  notes text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_slug_idx on public.projects(slug);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_category_idx on public.projects(category);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);

-- Create project_items table (for flexible multi-item sections)
create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section text not null check (section in ('completed_work', 'current_work', 'learnings', 'challenges', 'timeline', 'links', 'media')),
  title text not null,
  description text,
  date timestamptz,
  status text,
  url text,
  image_url text,
  alt_text text,
  caption text,
  position int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_items_project_id_idx on public.project_items(project_id);
create index if not exists project_items_section_idx on public.project_items(section);
create index if not exists project_items_position_idx on public.project_items(position);

-- Create project_actions table (for next actions)
create table if not exists public.project_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task text not null,
  owner text,
  due_date timestamptz,
  status text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'DONE')),
  position int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_actions_project_id_idx on public.project_actions(project_id);
create index if not exists project_actions_status_idx on public.project_actions(status);
create index if not exists project_actions_position_idx on public.project_actions(position);

-- Enable RLS (authorization enforced server-side via CEO session verification)
alter table public.projects enable row level security;
alter table public.project_items enable row level security;
alter table public.project_actions enable row level security;

-- Revoke all direct access - project data must NOT be publicly accessible.
-- All reads/writes go through protected server-side API routes that verify the CEO session.
revoke all on public.projects from anon;
revoke all on public.projects from authenticated;
revoke all on public.project_items from anon;
revoke all on public.project_items from authenticated;
revoke all on public.project_actions from anon;
revoke all on public.project_actions from authenticated;

-- Deny-by-default policies (no direct table access from client)
drop policy if exists "Projects are readable" on public.projects;
drop policy if exists "Projects are insertable" on public.projects;
drop policy if exists "Projects are updatable" on public.projects;
drop policy if exists "Projects are deletable" on public.projects;

drop policy if exists "Project items are readable" on public.project_items;
drop policy if exists "Project items are insertable" on public.project_items;
drop policy if exists "Project items are updatable" on public.project_items;
drop policy if exists "Project items are deletable" on public.project_items;

drop policy if exists "Project actions are readable" on public.project_actions;
drop policy if exists "Project actions are insertable" on public.project_actions;
drop policy if exists "Project actions are updatable" on public.project_actions;
drop policy if exists "Project actions are deletable" on public.project_actions;

-- Default deny policies (will fail for everyone; only service role bypasses)
create policy "Projects denied" on public.projects for select to anon, authenticated using (false);
create policy "Projects insert denied" on public.projects for insert to anon, authenticated with check (false);
create policy "Projects update denied" on public.projects for update to anon, authenticated using (false) with check (false);
create policy "Projects delete denied" on public.projects for delete to anon, authenticated using (false);

create policy "Project items denied" on public.project_items for select to anon, authenticated using (false);
create policy "Project items insert denied" on public.project_items for insert to anon, authenticated with check (false);
create policy "Project items update denied" on public.project_items for update to anon, authenticated using (false) with check (false);
create policy "Project items delete denied" on public.project_items for delete to anon, authenticated using (false);

create policy "Project actions denied" on public.project_actions for select to anon, authenticated using (false);
create policy "Project actions insert denied" on public.project_actions for insert to anon, authenticated with check (false);
create policy "Project actions update denied" on public.project_actions for update to anon, authenticated using (false) with check (false);
create policy "Project actions delete denied" on public.project_actions for delete to anon, authenticated using (false);

-- Create trigger for updated_at
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists project_items_set_updated_at on public.project_items;
create trigger project_items_set_updated_at before update on public.project_items for each row execute function public.set_updated_at();

drop trigger if exists project_actions_set_updated_at on public.project_actions;
create trigger project_actions_set_updated_at before update on public.project_actions for each row execute function public.set_updated_at();
