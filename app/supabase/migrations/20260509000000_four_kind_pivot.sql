-- Pivot from binary talent/startup profile kinds to four kinds:
--   candidate (was talent), business (was startup), mentor (new), investor (new).
-- The interest table keeps its talent_id / startup_id columns; semantically
-- those now mean candidate-side / business-side of the binary handshake.

-- The previous CHECK constraint (added by 20260508210000_open_profile_kinds.sql)
-- allows {talent, startup, researcher, advisor, investor, service_provider} —
-- it does NOT allow 'candidate' or 'business'. We must drop it BEFORE renaming
-- existing rows; otherwise the very first UPDATE fails the constraint.
alter table public.profiles drop constraint if exists profiles_kind_check;

-- Migrate existing rows to the new vocabulary.
update public.profiles set kind = 'candidate' where kind = 'talent';
update public.profiles set kind = 'business'  where kind = 'startup';

-- Apply the tightened CHECK constraint.
alter table public.profiles
  add constraint profiles_kind_check
  check (kind in ('candidate', 'business', 'mentor', 'investor'));
