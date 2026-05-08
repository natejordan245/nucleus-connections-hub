-- ─────────────────────────────────────────────────────────────────────────────
-- Interest handshake + notifications + messaging.
-- A "mutual match" is when both sides vote `interested` on the same pair.
-- That flip triggers notification fan-out (talent + startup + admins) and
-- unlocks the message thread for that pair.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── interests ───────────────────────────────────────────────────────────────
create table if not exists public.interests (
  id             uuid primary key default gen_random_uuid(),
  talent_id      uuid not null references public.profiles(id) on delete cascade,
  startup_id     uuid not null references public.profiles(id) on delete cascade,
  talent_state   text not null default 'pending'
                 check (talent_state in ('pending', 'interested', 'pass')),
  startup_state  text not null default 'pending'
                 check (startup_state in ('pending', 'interested', 'pass')),
  mutual_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (talent_id, startup_id)
);

create index if not exists interests_talent_idx  on public.interests (talent_id);
create index if not exists interests_startup_idx on public.interests (startup_id);

drop trigger if exists interests_set_updated_at on public.interests;
create trigger interests_set_updated_at
  before update on public.interests
  for each row execute procedure public.set_updated_at();

alter table public.interests enable row level security;

drop policy if exists "interests_read_involved" on public.interests;
create policy "interests_read_involved"
  on public.interests for select
  to authenticated
  using (auth.uid() in (talent_id, startup_id));

-- Writes are gated through the API (uses the service-role client) so we don't
-- expose a write policy to authenticated. Admin reads bypass RLS via service
-- role.

-- ── notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('interest_received', 'mutual_match', 'system', 'message_received')),
  title         text not null,
  body          text not null default '',
  href          text not null default '',
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_read_self" on public.notifications;
create policy "notifications_read_self"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ── messages ────────────────────────────────────────────────────────────────
-- Pair-based threading. `pair_key` = lower-uuid + ':' + higher-uuid so both
-- (A→B) and (B→A) messages live under a single deterministic key.
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  pair_key     text not null,
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists messages_pair_idx
  on public.messages (pair_key, created_at desc);

alter table public.messages enable row level security;

-- Either party in the pair can read the thread.
drop policy if exists "messages_read_pair_member" on public.messages;
create policy "messages_read_pair_member"
  on public.messages for select
  to authenticated
  using (auth.uid() in (sender_id, recipient_id));

-- Sender can insert their own messages; both parties must already be matched
-- (mutual_at NOT NULL on the interests row). We enforce the matched-only
-- constraint in the API layer rather than RLS to keep the policy simple.
drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_self"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());
