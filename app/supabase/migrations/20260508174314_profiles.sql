-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles table — single source of truth for talent + startup identities.
-- One row per auth.users entry (1:1 via primary key).
-- Kind-specific shape lives in the `data` JSONB column.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('talent', 'startup')),
  name        text not null,
  email       text,
  headline    text,
  bio         text,
  location    text,
  photo_url   text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_kind_idx on public.profiles (kind);
create index if not exists profiles_email_idx on public.profiles (email);

-- bumps updated_at on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Discovery is the platform's whole point; profiles are visible to any signed-in
-- user. Tighten this if/when we add visibility controls.
drop policy if exists "profiles_read_all_authenticated" on public.profiles;
create policy "profiles_read_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_self" on public.profiles;
create policy "profiles_delete_self"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);
