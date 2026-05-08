# Challenges, blockers, and tradeoffs

What's *not* finished, what we deliberately punted, and what'd take the system from prototype to production. Honest map for technical judges and for the team picking this up after the bounty.

## Blockers (live)

Each of these has a writeup at the path. The pattern is the same in all three: real adapter scaffolded, mock fallback active, demo unaffected.

### `blockers/pgvector-live-sql.md` — Postgres SQL pipeline

`PgvectorMatchEngine.findMatches` currently throws on first call → `withFallback` delegates to `MockMatchEngine`. Schema exists ([`v0-app/scripts/migrate.sql`](../v0-app/scripts/migrate.sql)) and the data-layer adapter is wired; what's missing is the live SQL — the `WHERE … gates` filter and the `ORDER BY embedding <=> $vec LIMIT k` ANN query.

**Unblock:** stand up Supabase, enable `pgvector`, run the migration, replace the `throw` with the 3-stage SQL. ~half a day.

### `blockers/affinity-live.md` — Affinity API key

Real `AffinityClient` is implemented. `AFFINITY_LIVE=false` by default because we don't have an API key from Nucleus yet. The admin slide reads from `MockAffinityClient.recentPushes()` so the demo always has something to show.

**Unblock:** receive API key, set `AFFINITY_LIVE=true` + `AFFINITY_API_KEY=…` in `.env.local`, confirm a list named "Nucleus Connections — Mutual Match" exists in the target Affinity workspace.

### `blockers/openai-models.md` — Model availability

We use `gpt-5.3-nano` (extraction) and `gpt-5.5-instant` (rerank). If those aren't available on the active OpenAI account, the LLM client trips `withFallback` on the first 4xx and routes through `MockLLMClient`.

**Unblock:** edit the two model constants at the top of [`v0-app/lib/data-layer/real/OpenAILLMClient.ts`](../v0-app/lib/data-layer/real/OpenAILLMClient.ts).

---

## Hackathon-scope tradeoffs

We deliberately **skipped** these to keep the build inside two days. None of them are technical risk — they're scope.

### No auth

Identity is the URL's `?as=<id>` query param. The API trusts whatever id it's handed. Notifications are filtered by recipient on the read side, but nothing prevents a bad actor from reading anyone else's inbox.

**Why it's fine for the demo:** The bell works, the handshake works, the persona-switch story (`?as=tal-marcus-okafor`) works. The technical-judge conversation about auth is "Supabase Auth swap, single-hook change."

**Cost to fix:** small. We're already on Supabase for `pgvector` + the profile store, so auth lives in the same project. Workflow is CLI-driven (see [`docs/integrations.md`](integrations.md#supabase-cli-workflow)):

1. `supabase init` + add the `[auth]` block to `config.toml` (email/password + magic link to start)
2. `supabase migration new auth_link` — adds `auth_user_id uuid references auth.users(id)` to `talent` / `startup`, plus RLS policies keyed on `auth.uid()`
3. Add `@supabase/ssr` server + browser clients, an App-Router `middleware.ts` that refreshes the session cookie, and `app/login` + `app/auth/callback` routes
4. Replace the `searchParams.get('as')` reads in the bell / matches dashboard / handshake page with `supabase.auth.getUser()` — the viewer-id read is already centralized
5. Gate the API routes with a server-client session check

### No pagination

`/api/matches` returns top-K (default 20). For 30 startups it's fine; for 30,000 it's a problem. Same with notifications and the talent/startup list endpoints.

**Cost to fix:** small. Add `cursor` + `limit` params to the listing routes, switch the bell from a full re-read to a `since=<lastId>` read.

### No search filters in stage 1

Hard gates for opportunities mode are stage / availability / compensation. Real users will want sector/location/compensation-range filters to *pre-filter* before semantic ranking — the difference between "I want any match" and "I want a Salt Lake City sales role at seed stage."

**Cost to fix:** medium. Add a filter object to `IMatchService.getMatches`, plumb through to `findMatches`. UI: filter chips in the toolbar that piggyback on the existing pill component.

### No multi-tenancy

The whole platform implicitly belongs to "Nucleus Utah." Other accelerators couldn't run their own deployment without forking. The `utah_orgs` table is hand-curated, scoring weights are hardcoded.

**Cost to fix:** large. Tenant-scoped tables (`org_id` column everywhere), per-tenant ecosystem graph + scoring config, per-tenant Squarespace + Affinity creds.

### No actual upload pipeline for photos

`<PhotoUpload>` reads selected files as a data URL and stuffs the base64 string into the in-memory profile DTO. That's fine for an in-process demo; in production you'd want object storage.

**Cost to fix:** small. Supabase has Storage built in. Swap the `PhotoUpload` `onChange` to upload to a bucket and store the URL.

### No talent-side conversation surface

Mutual match → Affinity push → Nucleus operator does the human intro. There's no in-app messaging. That's deliberate: Nucleus's operator-mediated flow is the value-add, not a Linkedin-style DM list.

---

## Performance tradeoffs

### Match-cache pool revision is global, not per-record

`MockProfileStore` increments a single counter on every `put*`. That means **any profile edit invalidates every cached match.** For a 40-profile demo this is fine — recompute is microseconds. At 100k profiles, that's wasteful.

**Cost to fix:** medium. Switch to per-record revisions; `CachedMatchEngine` stores the `Map<candidateId, revision>` of every candidate that contributed to the cached result, and only invalidates when one of *those* changes.

### Notifications poll, don't push

The bell polls `/api/notifications` every 4s. Real-time is a per-server-process limitation in the in-memory mock. Production would use **Supabase Realtime** (Postgres `LISTEN`/`NOTIFY` over WebSocket) — same shape, same bell component, no polling.

**Cost to fix:** small in real mode (Supabase has the primitive), nontrivial in mock mode (need a pub/sub layer the bell can subscribe to).

### Embeddings are computed on every request in mock mode

`MockMatchEngine.findMatches` calls `embedSync(textForEmbedding(c))` for every candidate in the pool, every call. The **match cache absorbs this** for repeated calls, but the first call recomputes. For 30 candidates this is microseconds; in real mode embeddings are stored in Postgres and the engine never recomputes them.

**Cost to fix:** small. Cache the per-profile embedding alongside the profile in `MockProfileStore`. We didn't because the deterministic hash makes it free, but a real LLM-embedding cache would be a separate Map keyed by profile-id + content-hash.

### One-shot LLM rerank, no streaming

Real-mode rerank waits for the full JSON response. With ~20 candidates the typical latency is ~1.2s. We render the pipeline timing in the toolbar as a transparency signal. **Streaming the rerank** so cards appear progressively would make the UX feel snappier without changing the model call cost.

**Cost to fix:** small. Move the rerank call into a Server-Sent-Events route, stream JSON-Lines, render cards as they arrive.

---

## Open product questions

Less "implementation" and more "what should the product even do."

### How aggressively should we hide already-decided pairs?

Designed but not yet wired. Current proposal:
- Viewer voted (interested or pass) → hide from default view, surface in a "Decided" tab
- Other side voted `pass` → hide everywhere (can never be mutual)
- Other side voted `interested` (viewer hasn't) → highlight: *"They're interested in you, decide on them"*

Risk: hiding too aggressively makes the platform feel empty. Mitigation: a `Show all` toggle on the toolbar. Plumbing path: `IInterestStore.listForTalent / listForStartup` + `findMatches({ excludeDecided: true })` filter.

### Should the bell deliver `interest_received` for `interested → mutual` flips?

Currently we send `interest_received` *only* for non-mutual votes, and `mutual_match` (to both sides) when the second vote tips it mutual. Skipping the redundant `interest_received` on the just-mutual flip keeps the bell clean. Could be argued the other way — "Bramble expressed interest" is a useful signal even when it's immediately followed by a mutual, because it answers *who* responded. We picked clean for now.

### What does a "passed" candidate look like in the matches dashboard?

Right now: gone. Proposal: a "Passed" subsection in the Decided tab so users can un-pass. Adds friction (people pass on real signal sometimes) but rare.

### How do we keep `lookingFor` honest as people's situations change?

Sarah edits her bio → cache invalidates → new matches reflect new reality. But the *interest log* doesn't reset. So if Sarah passed on Bramble three months ago and her `lookingFor` has since changed to "actually I want full-time roles in fintech," should Bramble re-appear? Probably yes, with a soft cooldown (e.g. don't re-show until either side updates their profile).

**Cost to fix:** medium. Compare interest-decision timestamp vs `last_modified_at` on either profile; un-hide when newer.

### When should we ask people to re-rank verdicts they disagree with?

A judge gives the platform high marks if it admits its own mistakes. Adding "this match is wrong because…" → fed back into the LLM rerank prompt as a few-shot example for that user → personalized ranking over time.

**Cost to fix:** medium. Persist user feedback per-match, prompt the rerank with the user's recent feedback.

---

## Demo-day risks

Specific things to test before going on stage.

### Pravatar dependency

Avatars (talent) come from `i.pravatar.cc/240?img=…` for hand-picked personas, and `…?u=<id>` for the fallback. **If the venue's WiFi blocks pravatar.cc, the avatars break.** Mitigation: download placeholder JPGs at build time and serve them locally. ~30 minutes if it ever bites.

### `gpt-5.3-nano` / `gpt-5.5-instant` model availability

If we run the demo in real mode and the models aren't on the active account, every LLM call falls back to mock — which is fine but the technical-judge conversation about "is this real?" gets muddier. Mitigation: pre-flight test with `OPENAI_API_KEY` set, or just demo in mock mode and show the real wiring in code review.

### Cache silently masking bugs

A bug in the engine that produces wrong results would get **cached**, and a refresh wouldn't fix it. The toolbar shows `cached`/`fresh`, which is the user-facing tell. To force fresh: edit any profile (bumps pool revision), or restart the server (clears the cache).

### Notification poll burning into the dev console

Every 4s a `/api/notifications` request fires. In dev that's chatty in the network tab and the terminal. Not a correctness issue but a presentation polish point — disable polling when the bell hasn't been opened in N seconds, or pause polling on hidden tabs.

---

## Stretch features (not built, ranked by impact)

| Feature | Why it'd matter | Cost |
|---|---|---|
| **Ecosystem map visualization** | Force-directed graph of Utah orgs + people + companies, hovering surfaces shared affiliations. The most demo-friendly stretch. | medium |
| **Talent upskilling recommendations** | "You're 80% fit — here's how to close the gap." Bounty calls this out as an optional high-value feature. | medium |
| **Real auth (Supabase Auth)** | Necessary for production, easy retrofit — same Supabase project as the data layer, CLI-driven config. | small |
| **Decided tab + interest filtering** | Already designed (above), not built. ~30min. | small |
| **Streaming LLM rerank** | UX win — cards appear as they're scored. | small |
| **Mobile responsive polish** | Currently desktop-first. Cards stack OK but the tab nav and search bar need attention < 640px. | small |
| **Real Supabase Realtime for notifications** | Replaces the 4s poll. | small (Supabase) / medium (in-memory mock) |
