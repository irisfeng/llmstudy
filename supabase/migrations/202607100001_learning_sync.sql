create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  network_mode text not null default 'cn' check (network_mode in ('cn', 'global')),
  last_lesson_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  completed boolean not null default false,
  current_section text,
  note text not null default '' check (char_length(note) <= 20000),
  quiz_result jsonb,
  last_opened_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.profiles enable row level security;
alter table public.lesson_state enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.lesson_state from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.lesson_state to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lesson_state_select_own" on public.lesson_state
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lesson_state_insert_own" on public.lesson_state
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lesson_state_update_own" on public.lesson_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lesson_state_delete_own" on public.lesson_state
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists lesson_state_user_updated_idx
  on public.lesson_state (user_id, updated_at desc);
