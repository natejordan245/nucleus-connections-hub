-- Pivot from binary talent/startup profile kinds to four kinds:
--   candidate (was talent), business (was startup), mentor (new), investor (new).
-- The interest table keeps its talent_id / startup_id columns; semantically
-- those now mean candidate-side / business-side of the binary handshake.

-- Migrate existing rows.
update public.profiles set kind = 'candidate' where kind = 'talent';
update public.profiles set kind = 'business'  where kind = 'startup';

-- Tighten the CHECK constraint to the four kinds we use. The previous
-- migration (20260508210000_open_profile_kinds.sql) widened it to a permissive
-- set we never shipped UI for.
alter table public.profiles drop constraint if exists profiles_kind_check;
alter table public.profiles
  add constraint profiles_kind_check
  check (kind in ('candidate', 'business', 'mentor', 'investor'));
