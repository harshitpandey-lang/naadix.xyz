create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  goal_type text not null default 'task' check (goal_type in ('task', 'duration', 'quantity')),
  target_value numeric,
  unit text,
  due_date date not null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start),
  check ((goal_type = 'task' and target_value is null) or (goal_type in ('duration', 'quantity') and target_value is not null and target_value > 0))
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_user_due_date_idx on public.goals(user_id, due_date);
create index if not exists goals_user_scheduled_start_idx on public.goals(user_id, scheduled_start);
alter table public.goals enable row level security;
create policy "Users can view their own goals" on public.goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own goals" on public.goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own goals" on public.goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own goals" on public.goals for delete to authenticated using ((select auth.uid()) = user_id);
create trigger goals_set_updated_at before update on public.goals for each row execute function public.set_updated_at();
