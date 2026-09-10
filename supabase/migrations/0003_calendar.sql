create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  location text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (all_day or end_at > start_at),
  check (category is null or category in ('College', 'Study', 'Project', 'Personal', 'Other'))
);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_user_start_at_idx on public.calendar_events(user_id, start_at);
alter table public.calendar_events enable row level security;
create policy "Users can view their own calendar events" on public.calendar_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own calendar events" on public.calendar_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own calendar events" on public.calendar_events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own calendar events" on public.calendar_events for delete to authenticated using ((select auth.uid()) = user_id);
create trigger calendar_events_set_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();
