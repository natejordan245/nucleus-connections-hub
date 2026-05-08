-- ─────────────────────────────────────────────────────────────────────────────
-- Dual embedding for matchmaking. Splits a profile's signal into two vectors:
--   embedding         — "who I am"  (headline + bio + skills + domains + ...)
--   embedding_wants   — "who I want" (lookingFor + stagePrefs + needs + ...)
--
-- Bidirectional matching ranks pairs by:
--   cos(A.wants, B.embedding) ≥ 0.5   AND   cos(B.wants, A.embedding) ≥ 0.5
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists embedding_wants_text text,
  add column if not exists embedding_wants vector(1536);

-- Mirror the ivfflat index on the wants vector for future ORDER BY <=> usage.
create index if not exists profiles_embedding_wants_idx
  on public.profiles
  using ivfflat (embedding_wants vector_cosine_ops)
  with (lists = 100);
