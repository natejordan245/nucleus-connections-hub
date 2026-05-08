-- ─────────────────────────────────────────────────────────────────────────────
-- LLM verdict cache. After the cosine nearest-neighbor pass, each candidate
-- pair gets a per-pair LLM call that returns:
--   - is_match (bool)
--   - summary, factors[], concerns[] (the explainability payload)
--
-- We cache by (subject_id, candidate_id) with a content-hash key. If either
-- profile is edited, the hash changes and the next read misses the cache.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.match_summaries (
  subject_id    uuid not null references public.profiles(id) on delete cascade,
  candidate_id  uuid not null references public.profiles(id) on delete cascade,
  cache_hash    text not null,
  is_match      boolean not null,
  summary       text not null default '',
  factors       jsonb not null default '[]'::jsonb,
  concerns      jsonb not null default '[]'::jsonb,
  model         text not null default '',
  created_at    timestamptz not null default now(),
  primary key (subject_id, candidate_id)
);

create index if not exists match_summaries_cache_hash_idx
  on public.match_summaries (cache_hash);

alter table public.match_summaries enable row level security;

-- Reads are open to any signed-in user (matches itself are visible).
drop policy if exists "match_summaries_read_all_authenticated"
  on public.match_summaries;
create policy "match_summaries_read_all_authenticated"
  on public.match_summaries for select
  to authenticated
  using (true);

-- Writes only via service-role (backend). No insert/update/delete policy →
-- all anon / authenticated writes are denied; service-role bypasses RLS.
