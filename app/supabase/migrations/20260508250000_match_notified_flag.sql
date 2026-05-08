-- Track when both parties have been notified about a strong match for a given
-- pair. Lets us auto-fire "you've got a strong match" notifications without
-- re-spamming on every matchesFor call.
alter table public.match_summaries
  add column if not exists notified_at timestamptz;
