# Integrations

This document covers everything that crosses a process boundary — outbound API calls, inbound webhooks, and the strategy-pattern wiring that makes any of them swappable for an in-process mock.

## Strategy pattern, two boundaries

The whole architecture is two interfaces with two implementations each:

```
Frontend  ──┐
            ▼ contracts/services.ts (boundary #1)
        Mock | Http
                │ (real mode)
                ▼ app/api/* (Next.js route handlers)
                  │
                  ▼ contracts/data-layer.ts (boundary #2)
                  Mock | Real
                  │
                  └─ Supabase, OpenAI, Affinity
```

Each layer can run against a mock of the layer below it. That gives us **three independent run modes**, each picked by two env vars:

| Mode | `NEXT_PUBLIC_SERVICE_MODE` | `DATA_MODE` | What runs |
|---|---|---|---|
| **Frontend-only** | `mock` | (ignored) | UI + service mocks. **Demo default.** No API server, no DB, no API keys. |
| **API dev** | `real` | `mock` | Frontend → HTTP → routes → mock data layer. Lets the API team iterate without OpenAI/Supabase keys. |
| **Full stack** | `real` | `real` | Everything live. |

The `.env.example` at [`v0-app/.env.example`](../v0-app/.env.example) lists every var.

## Auto-fallback

Every real adapter is wrapped in `withFallback`:

```ts
// v0-app/lib/data-layer/feature-flags.ts
async function withFallback<T>(
  flagName,
  realFn: () => Promise<T>,
  mockFn: () => Promise<T>,
  ctx: { adapter; op }
): Promise<T> {
  if (getFlag(flagName) === "mock") return mockFn();
  try { return await realFn(); }
  catch (err) {
    setFlag(flagName, "mock");        // permanent flip for this process
    console.warn(`[data-layer] ${ctx.adapter}.${ctx.op} failed → flipping to mock.`);
    return mockFn();
  }
}
```

If a real call fails (auth missing, network blip, schema mismatch), the flag flips to `mock` for the rest of the process and downstream calls go to the mock. **The demo never goes dark.** To re-attempt the real adapter, restart the server.

Same pattern on the **service** layer (`http()` helper in [`v0-app/lib/services/real/http.ts`](../v0-app/lib/services/real/http.ts)) — frontend HTTP calls fall back to in-process mocks if the API tier is down.

---

## OpenAI

Two model choices, picked for the cost/quality tradeoff each call deserves.

| Use | Model | Where | Notes |
|---|---|---|---|
| Free-text → structured extraction | `gpt-5.3-nano` | `OpenAILLMClient.extractTalent` / `extractStartup` | Cheap + fast + structured-outputs JSON-schema mode. Used during onboarding and the Squarespace webhook normalization. |
| Match rerank + explain | `gpt-5.5-instant` | `OpenAILLMClient.rerank` / `rerankFromQuery` | Quality where it matters. Generates the `reason` paragraph + factor breakdown that's the trust surface. |
| Embeddings | `text-embedding-3-small` (1536d) | `OpenAIEmbeddingClient` | Native dimension matches the `vector(1536)` columns. |

If the listed model isn't available on the active account, the LLM client's first failed call trips `withFallback` and routes to `MockLLMClient` — see [`blockers/openai-models.md`](../blockers/openai-models.md) for the swap-out path.

### Mock LLM is not a stub

`MockLLMClient` is a real reranker, just deterministic. It scores candidates from genuine signal overlap (sector, stage, skills→needs, comp, availability) plus cosine similarity over the deterministic feature-hashed embeddings. Reasons are templated, but the *ranking* is principled — that's why mock-mode demos pass the smoke tests for "Sarah → Bramble" and "Marcus → Lumen Bio" without lookups.

Query-mode mock rerank (`scoreFromQuery`) extracts query terms, checks which appear literally in each candidate's text, and quotes the matched terms back in the reason. Concerns flag pure semantic neighbors with no literal overlap — that's a real correctness signal even from the mock.

---

## Supabase + pgvector

Real implementation backs the API in `DATA_MODE=real`. Schema lives at [`v0-app/scripts/migrate.sql`](../v0-app/scripts/migrate.sql) — one Postgres database, five tables, the `vector` extension enabled.

| Table | Purpose |
|---|---|
| `talent` | Talent profiles + `embedding vector(1536)` + `profile_jsonb` snapshot |
| `startup` | Startup profiles + `embedding vector(1536)` + `profile_jsonb` |
| `utah_orgs` | The Utah ecosystem graph nodes (TTOs, accelerators, alumni networks) |
| `interest` | Dual opt-in handshake state (`UNIQUE (talent_id, startup_id)`) |
| `match_decisions` | Audit trail — every match shown to a user is logged for replay |

ANN indices:

```sql
CREATE INDEX talent_embedding_idx ON talent USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX startup_embedding_idx ON startup USING ivfflat (embedding vector_cosine_ops);
```

The match pipeline is structurally identical to the mock — gates → vector top-K → LLM rerank → proximity boost — just run against `pgvector` instead of in-memory cosine.

**Status:** Schema + adapters scaffolded. Live SQL pipeline tracked in [`blockers/pgvector-live-sql.md`](../blockers/pgvector-live-sql.md). `PgvectorMatchEngine.findMatches` currently throws on first call → `withFallback` delegates to `MockMatchEngine` until the SQL is wired.

---

## Squarespace (inbound)

Replaces Nucleus's existing Typeform → Affinity leg.

**Flow:**
1. Squarespace form submits → `POST /api/integrations/squarespace/webhook`
2. Handler validates `x-nucleus-secret` header against `SQUARESPACE_WEBHOOK_SECRET` env var
3. Payload is normalized to either talent or startup shape
4. `LLMClient.extract*` runs against the free-text bio/description
5. `EmbeddingClient.embed` produces the 1536-d vector
6. `ProfileStore.put*` persists
7. Response includes a one-time signed `reviewUrl` the submitter clicks to refine the auto-extracted profile

**Why this matters:** No migration needed. The existing Squarespace form keeps working, but instead of dumping rows into Affinity by hand, we get a structured profile + embedding + chance for the user to fix any extraction errors. Removes the "I filled out a form, where's my profile?" gap.

---

## Affinity (outbound)

Affinity has a REST API at `https://api.affinity.co`. We use three endpoints:

| Endpoint | Method | When |
|---|---|---|
| `/persons` | `POST` | On mutual interest, idempotent on email |
| `/list-entries` | `POST` | Add the person to "Nucleus Connections — Mutual Match" |
| `/notes` | `POST` | Attach the LLM's `reason` paragraph + Utah signal as a note |

**Triggered by:** `POST /api/interest` whenever `interestStore.vote` causes `mutualAt` to transition from `null` to a timestamp. The handler:
1. Fetches both profiles + the most-recent match record (so it can include the reason)
2. Calls `affinityClient.recordPush(payload)` — **always**, even in mock mode (this powers the admin slide)
3. If `AFFINITY_LIVE=true`: calls `upsertPerson`, `addToList`, `addNote`

**Status:** Mock-first. Real client implemented but `AFFINITY_LIVE=false` by default — see [`blockers/affinity-live.md`](../blockers/affinity-live.md). Flip the env var when Nucleus grants API access.

---

## Notifications

Custom system, in-process for now. The bell in the header polls per viewer.

### Emission rules ([`v0-app/lib/notifications/emit.ts`](../v0-app/lib/notifications/emit.ts))

A single helper called by both the in-process `MockInterestService` and the `/api/interest` route, so behavior is identical regardless of service mode.

| Trigger | Action |
|---|---|
| Voter chose `interested` AND recipient hadn't already AND it's not just-mutual | `interest_received` to the other side |
| Just-mutual transition (`prior.mutualAt = null`, `next.mutualAt = ts`) | `mutual_match` to **both** sides |
| Voter chose `pass` | (no notification) |

Anonymity is *not* a priority per the brief, so notifications include the other side's name and a deep link into the handshake page.

### Storage + polling

- `MockNotificationStore` — in-memory `Map<recipientId, NotificationDTO[]>`, monotonic `notif-N` ids, server-side singleton.
- `<NotificationBell>` — header component. Polls `/api/notifications?recipientId=<viewer>` every 4s. Shows unread orange dot/count, dropdown lists recent items, "Mark all read" CTA.
- Identity comes from the URL's `?as=` query param. Switching personas in the deck (e.g. `?as=tal-marcus-okafor`) re-derives the bell's recipient.

### Future

Real-mode would replace `MockNotificationStore` with a Postgres `notifications` table + a Supabase Realtime channel for push instead of polling.

---

## Match cache

Cross-cutting concern that wraps the engine. Detailed in [`v0-app/lib/data-layer/CachedMatchEngine.ts`](../v0-app/lib/data-layer/CachedMatchEngine.ts).

**Key:** `subject:<type>:<viewerId>:<target>:k=<k>` for subject mode, `query:<target>:<queryHash>:k=<k>` for query mode.

**Validity check (compare-and-set):**

| Part | Source | Invalidates when |
|---|---|---|
| `viewerHash` | Stable hash over the viewer's match-relevant fields (bio, lookingFor, skills, domains, availability, comp, stagePrefs, location, utahOrgs) | Viewer edits any of those fields |
| `poolRevision` | Monotonic counter on `MockProfileStore`, bumped on every `put*` | Any profile in the pool gets edited (coarse, by design) |

Both fingerprints must match the cached entry, or the entry is treated as a miss and dropped.

**Cosmetic edits don't invalidate.** `viewerHash` deliberately ignores `photoUrl`, socials, `createdAt` — changing your avatar doesn't bust the cache. (Pool revision still bumps on `put`, so the *next* `put` will invalidate; but for in-place edits to ignored fields, the viewer's cache survives.)

**Storage:** `MockMatchCache` — in-process `Map`, LRU-ish with `MAX = 200`, drops oldest on overflow, self-evicts stale on read. Decorator pattern (`CachedMatchEngine`) wraps any `IMatchEngine`, so the same cache works against the pgvector engine when it lights up.

Production: same interface fronts a Redis-backed cache. Fingerprint comparison logic doesn't change.

---

## Identity & auth

There isn't any *yet* in the running demo. Frontend identity is a `?as=<id>` query param read by every page that cares (matches dashboard, handshake, notification bell). The API trusts whatever ID it's given.

For real-mode, **Supabase Auth** is the chosen path. We're already on Supabase for `pgvector` + the profile store, so auth lives in the same project — no second vendor, no second SDK, and the same JWT that authorizes data-layer reads can authorize API routes.

### Why Supabase Auth over Clerk

- **Single platform** — `auth.users` is a first-class table in the same Postgres we already run. RLS policies on `talent` / `startup` can reference `auth.uid()` directly; no token bridging.
- **CLI-native workflow** — the same `supabase` CLI we use for migrations also configures auth providers (`supabase/config.toml` → `[auth]` block). Local dev gets a full auth stack via `supabase start` with no extra setup.
- **Server-side Next.js helpers** — `@supabase/ssr` gives App-Router-compatible cookie-based session handling, which is what the route handlers need to read the viewer's id.

### Supabase CLI workflow

The CLI is the source of truth for both schema and auth config. The intended layout when this lights up:

```
v0-app/
└── supabase/
    ├── config.toml          # project + auth provider config (committed)
    └── migrations/
        ├── 0001_initial_schema.sql   # the existing scripts/migrate.sql, moved
        └── 0002_auth_link.sql        # adds auth_user_id + RLS policies
```

Bring-up sequence (one-time):

```bash
cd v0-app
supabase init                 # writes supabase/config.toml
supabase start                # local Postgres + Auth + Studio in Docker
supabase migration new auth_link
# ...edit the new migration to add `auth_user_id uuid references auth.users(id)`
# to talent + startup, plus RLS policies keyed on auth.uid()...
supabase db reset             # apply all migrations to the local stack
```

To target the hosted Nucleus project instead of local Docker:

```bash
supabase login
supabase link --project-ref <ref>
supabase db push              # apply migrations to the linked remote
```

Auth provider config (email/password + magic link to start; OAuth providers like Google/LinkedIn added later) lives in the `[auth]` section of `config.toml` and is version-controlled.

### Wiring into the app

Three new env vars (added to `.env.example`):

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public — used by the browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — used by the browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Already exists — used by `SupabaseProfileStore` for admin reads |

Code surface (planned, not yet built):

- `lib/supabase/server.ts` — server-component / route-handler client (`createServerClient` from `@supabase/ssr`, cookie store wired to `next/headers`)
- `lib/supabase/browser.ts` — client-component client (`createBrowserClient`)
- `middleware.ts` — refreshes the auth session cookie on every request, redirects unauthenticated users away from gated routes
- `app/login/page.tsx`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts` — auth UI + OAuth callback + signout

The frontend already centralizes its viewer-id read in three places (bell, handshake page, matches page). The retrofit replaces the `?as=` reader with `supabase.auth.getUser()`; the rest of the app sees no change.

See [`docs/challenges.md`](challenges.md) for cost estimate and the punted scope.

## Environment matrix

All env vars live in [`v0-app/.env.example`](../v0-app/.env.example):

| Var | Required when | Used by |
|---|---|---|
| `NEXT_PUBLIC_SERVICE_MODE` | always (default `mock`) | Service-layer factory |
| `DATA_MODE` | always (default `mock`) | Data-layer factory |
| `SUPABASE_URL` | `DATA_MODE=real` | `SupabaseProfileStore` |
| `SUPABASE_SERVICE_ROLE_KEY` | `DATA_MODE=real` | `SupabaseProfileStore` |
| `OPENAI_API_KEY` | `DATA_MODE=real` | `OpenAIEmbeddingClient`, `OpenAILLMClient` |
| `AFFINITY_LIVE` | optional (`false` default) | Toggles real Affinity API calls |
| `AFFINITY_API_KEY` | when `AFFINITY_LIVE=true` | `AffinityClient` |
| `AFFINITY_LIST_NAME` | optional | List name for mutual-match entries |
| `SQUARESPACE_WEBHOOK_SECRET` | when accepting real webhooks | Webhook handler |
