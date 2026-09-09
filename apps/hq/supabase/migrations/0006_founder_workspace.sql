-- Private Founder HQ extensions. Every record belongs to its authenticated owner.
create table if not exists public.development_areas (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0), description text, current_focus text,
  priority smallint not null default 3 check (priority between 1 and 5), status text not null default 'active' check (status in ('active','paused','complete')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  development_area_id uuid references public.development_areas(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0), current_level smallint not null default 1 check (current_level between 1 and 5),
  target_level smallint not null default 3 check (target_level between 1 and 5), status text not null default 'building' check (status in ('building','active','learning','paused')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null, title text not null check (char_length(trim(title)) > 0),
  item_type text not null default 'article' check (item_type in ('course','book','paper','article','tutorial','experiment','topic')),
  status text not null default 'queue' check (status in ('queue','active','complete')), source_url text, notes text,
  progress smallint not null default 0 check (progress between 0 and 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0), body text not null default '', note_type text not null default 'general' check (note_type in ('idea','meeting','research','strategy','learning','general')),
  pinned boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_of date not null, went_well text, moved_forward text, slowed_down text, learned text, stop_doing text, priorities_next_week text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, week_of)
);

do $$ declare item text; begin foreach item in array array['development_areas','skills','learning_items','notes','weekly_reviews'] loop
  execute format('alter table public.%I enable row level security', item);
  execute format('create policy "%s owner" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', item, item);
  execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', item || '_set_updated_at', item);
end loop; end $$;
