# Blocker — `PgvectorMatchEngine` live SQL not yet wired

## What's blocked
`lib/data-layer/real/PgvectorMatchEngine.ts` currently throws on first call,
which trips `withFallback` and hands execution to `MockMatchEngine`. The mock
is a structural twin of the real pipeline (gates → vector → rerank →
proximity), so the demo never goes dark — but real mode does not yet hit
Postgres.

## Why
- The Supabase project / `pgvector` extension is owned by Nate's track and is
  pending creds in `.env`.
- The match-engine SQL (`SELECT … WHERE … ORDER BY embedding <=> $1 LIMIT k`)
  needs the real schema to exist before it can be tuned.

## Unblock plan
1. Stand up Supabase project, enable `pgvector`, run `scripts/migrate.ts`.
2. Replace the `throw` in `PgvectorMatchEngine.findMatches` with the real
   3-stage SQL:
   - **Gates:** `SELECT … FROM startup WHERE funding_stage = ANY($1::text[]) AND …`
   - **Vector:** `ORDER BY embedding <=> $subjectVec::vector LIMIT $k`
   - **Rerank:** call `OpenAILLMClient.rerank` with the top-K rows.
3. Apply proximity boost (already implemented in
   `lib/data-layer/mock/MockMatchEngine.ts`'s `applyProximityBoost`; export and
   reuse in real path).
4. `npm test` smoke-match suite must pass against real DB.

## Mitigation today
- `DATA_MODE=mock` runs the demo end-to-end with no Supabase / OpenAI keys.
- `DATA_MODE=real` auto-falls-back to mock; flag is flipped in-process and the
  warning logs which adapter and op fired the fallback.
