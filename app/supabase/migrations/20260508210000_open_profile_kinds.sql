-- ─────────────────────────────────────────────────────────────────────────────
-- Broaden profiles.kind to leave room for future role types beyond talent +
-- startup. UI today only renders talent / startup; this migration is a
-- forward-compat lever so adding new kinds doesn't require a schema fight.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop whatever kind-related CHECK constraint Postgres auto-named when the
-- profiles table was first created (the inline `check (kind in (…))` form
-- doesn't give us a stable name we can target).
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end$$;

alter table public.profiles
  add constraint profiles_kind_check
  check (kind in (
    'talent',
    'startup',
    'researcher',
    'advisor',
    'investor',
    'service_provider'
  ));
