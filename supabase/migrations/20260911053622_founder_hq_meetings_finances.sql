alter table public.project_actions
  add column if not exists completed_at timestamptz;

alter table public.project_items
  add column if not exists completed_at timestamptz;

create or replace function public.set_project_completion_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'project_actions' then
    if new.status = 'DONE' then
      new.completed_at = coalesce(new.completed_at, now());
    elsif new.status is distinct from 'DONE' then
      new.completed_at = null;
    end if;
  elsif tg_table_name = 'project_items' then
    if new.status = 'DONE' or new.section = 'completed_work' then
      new.completed_at = coalesce(new.completed_at, now());
    elsif new.status is distinct from 'DONE' and new.section is distinct from 'completed_work' then
      new.completed_at = null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists project_actions_completion_timestamp on public.project_actions;
create trigger project_actions_completion_timestamp
before insert or update of status on public.project_actions
for each row execute function public.set_project_completion_timestamp();

drop trigger if exists project_items_completion_timestamp on public.project_items;
create trigger project_items_completion_timestamp
before insert or update of status, section on public.project_items
for each row execute function public.set_project_completion_timestamp();

create index if not exists project_actions_completed_at_idx on public.project_actions(completed_at) where completed_at is not null;
create index if not exists project_items_completed_at_idx on public.project_items(completed_at) where completed_at is not null;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  scheduled_at timestamptz not null default now(),
  ended_at timestamptz,
  attendees text[] not null default '{}',
  status text not null default 'PLANNED' check (status in ('PLANNED', 'LIVE', 'COMPLETED')),
  transcript text not null default '',
  notes text not null default '',
  outcome text,
  action_items jsonb not null default '[]'::jsonb check (jsonb_typeof(action_items) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= scheduled_at)
);

create index if not exists meetings_user_scheduled_at_idx on public.meetings(user_id, scheduled_at desc);
alter table public.meetings enable row level security;

create policy "Meetings owner select" on public.meetings for select to authenticated using ((select auth.uid()) = user_id);
create policy "Meetings owner insert" on public.meetings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Meetings owner update" on public.meetings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Meetings owner delete" on public.meetings for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists meetings_set_updated_at on public.meetings;
create trigger meetings_set_updated_at before update on public.meetings for each row execute function public.set_updated_at();

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('INCOME', 'EXPENSE')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  category text not null check (char_length(trim(category)) > 0),
  description text not null check (char_length(trim(description)) > 0),
  occurred_on date not null default current_date,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'CLEARED' check (status in ('PENDING', 'CLEARED')),
  recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_transactions_user_date_idx on public.finance_transactions(user_id, occurred_on desc);
create index if not exists finance_transactions_project_idx on public.finance_transactions(project_id) where project_id is not null;
alter table public.finance_transactions enable row level security;

create policy "Finance transactions owner select" on public.finance_transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Finance transactions owner insert" on public.finance_transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Finance transactions owner update" on public.finance_transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Finance transactions owner delete" on public.finance_transactions for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists finance_transactions_set_updated_at on public.finance_transactions;
create trigger finance_transactions_set_updated_at before update on public.finance_transactions for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.meetings, public.finance_transactions to authenticated;
grant usage on schema public to authenticated;
