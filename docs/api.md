# API reference

All routes are Next.js Route Handlers under [`v0-app/app/api/`](../v0-app/app/api). Stateless. They translate HTTP into the data layer via [`v0-app/lib/data-layer/factory.ts`](../v0-app/lib/data-layer/factory.ts), which picks `mock` or `real` adapters based on `DATA_MODE`.

In **frontend-only mode** (`NEXT_PUBLIC_SERVICE_MODE=mock`), the API isn't used at all — services run in-process. In **API-dev** and **full-stack** modes, the frontend's `Http*Service`s call these routes; on any failure they fall back to their in-process mock counterpart so the UI never goes blank.

| Mode | `NEXT_PUBLIC_SERVICE_MODE` | `DATA_MODE` | What runs |
|---|---|---|---|
| Frontend-only | `mock` | (ignored) | In-process service mocks. **Demo default.** |
| API dev | `real` | `mock` | Frontend → HTTP → API routes → mock data layer |
| Full stack | `real` | `real` | API routes → Supabase + OpenAI + Affinity |

## Error envelope

All endpoints serialize errors as:

```json
{ "error": { "code": "bad_request", "message": "human-readable" } }
```

Helpers live in [`v0-app/lib/api/respond.ts`](../v0-app/lib/api/respond.ts) — `ok`, `badRequest`, `notFound`, `serverError`. Status codes follow HTTP semantics (400/404/500 mostly).

---

## Profiles

### `POST /api/talent` — create talent

Body: `Partial<TalentDTO> & { bio: string; name: string; email: string }`. The bio is fed through `LLMClient.extractTalent` to fill in fields the user didn't provide; `lookingFor` is treated as a separate intent string.

```bash
curl -X POST localhost:3000/api/talent \
  -H 'content-type: application/json' \
  -d '{
    "name": "Sarah Chen",
    "email": "sarah.chen@example.com",
    "bio": "Eighteen years scaling enterprise SaaS GTM. VP of Sales at Qualtrics through the IPO, then VP of Revenue at Domo.",
    "lookingFor": "A fractional GTM advisor seat at a Utah AI or data-infra startup at seed to Series A. 10–15 hrs/week, equity-only.",
    "linkedinUrl": "https://www.linkedin.com/in/sarahchen-utah"
  }'
```

→ `201` with the full `TalentDTO`.

### `GET /api/talent` / `GET /api/talent/:id`

Returns the list (mock-mode only — useful for debugging seeds) or a single record. `404` if not found.

### `PATCH /api/talent/:id`

Partial merge. Bumps the profile-store revision counter, which **invalidates downstream match cache entries** that reference any talent (see `docs/integrations.md`).

### `POST /api/startup` / `GET /api/startup` / `GET /api/startup/:id` / `PATCH /api/startup/:id`

Mirror of the talent routes. `description` is the free-text input fed through `LLMClient.extractStartup`.

### `POST /api/extract` — onboarding helper

Body: `{ kind: 'talent', bio: string }` or `{ kind: 'startup', description: string }`.
Returns `Partial<TalentDTO>` or `Partial<StartupDTO>`. The onboarding form polls this on debounced text input so the right-side "Auto-extracted fields" panel updates as the user types.

```bash
curl -X POST localhost:3000/api/extract \
  -H 'content-type: application/json' \
  -d '{"kind": "talent", "bio": "Senior at BYU studying CS, looking for an AI internship"}'
```

---

## Matching

### `GET /api/matches` — subject-mode matching

Query params:

| Name | Required | Values | Default |
|---|---|---|---|
| `for` | yes | profile id (e.g. `tal-sarah-chen`) | — |
| `type` | yes | `talent` \| `startup` | — |
| `target` | no | `talent` \| `startup` | opposite of `type` |
| `k` | no | 1–50 | 20 |

Default behavior pairs talent with startups (and vice versa). `target=talent` with `type=talent` enables **peer mode** (Network tab) — matches Sarah with other operators, applying no stage/comp gates and excluding herself.

```bash
# Opportunities tab
curl 'localhost:3000/api/matches?for=tal-sarah-chen&type=talent'

# Network tab — peer matches
curl 'localhost:3000/api/matches?for=tal-sarah-chen&type=talent&target=talent'
```

→ `MatchResponse`:

```json
{
  "matches": [
    {
      "candidateId": "sup-bramble-ai",
      "candidate": { "id": "sup-bramble-ai", "name": "Bramble AI", "...": "..." },
      "score": 0.91,
      "verdict": "strong",
      "reason": "Strong fit. Bramble AI needs a fractional GTM advisor with deep enterprise SaaS experience…",
      "factors": {
        "skillFit": "Enterprise sales, GTM strategy, pricing — direct match for your 'sales-lead' need.",
        "stageFit": "series-a is in Sarah's stated preference range (seed, series-a).",
        "utahSignal": "Shared affiliation: Qualtrics Alumni, Silicon Slopes. Likely warm intro available.",
        "concerns": "No structural concerns surfaced. Worth a 30-min intro call to verify mission fit."
      },
      "proximityBoost": 0.10,
      "proximityReasons": ["Shared Utah org: Qualtrics Alumni", "Both based in Salt Lake City"]
    },
    "..."
  ],
  "pipelineMs": {
    "gates": 1,
    "vector": 4,
    "rerank": 2,
    "cacheHit": false
  }
}
```

### `GET /api/search` — query-mode semantic search

Query params:

| Name | Required | Values | Default |
|---|---|---|---|
| `q` | yes | non-empty string | — |
| `kind` | yes | `talent` \| `startup` | — |
| `k` | no | 1–50 | 20 |

Embeds the query, pulls the nearest neighbors in the target pool, and runs **query-anchored rerank** — reasons quote phrases from the query.

```bash
curl 'localhost:3000/api/search?q=fractional+GTM+advisor+for+enterprise+SaaS&kind=talent'
```

Same `MatchResponse` shape. `pipelineMs.gates` is `0` (no gates in query mode).

---

## Interest + handshakes

### `GET /api/interest?talentId=…&startupId=…`

Returns the current `InterestState` for the pair. `pending` on both sides if no votes yet.

### `POST /api/interest` — vote

```bash
curl -X POST localhost:3000/api/interest \
  -H 'content-type: application/json' \
  -d '{
    "talentId": "tal-sarah-chen",
    "startupId": "sup-bramble-ai",
    "from": "talent",
    "state": "interested"
  }'
```

Returns the updated `InterestState`. Side effects, in order:

1. Vote is persisted (`interestStore.vote`).
2. **Notifications fire** (`emitInterestNotifications`):
   - Voter chose `interested` and recipient hadn't already → `interest_received` to the other side.
   - Mutual just transitioned (both `interested`) → `mutual_match` to **both** sides.
   - `pass` votes never emit (we don't gossip about rejections).
3. If just-mutual: `affinityClient.recordPush` always; `upsertPerson` + `addToList` + `addNote` only if `AFFINITY_LIVE=true`.

---

## Notifications

### `GET /api/notifications?recipientId=…`

Returns `NotificationDTO[]` newest-first. The header bell polls this every 4s, keying on the URL's `?as=` viewer.

### `POST /api/notifications/mark-read`

Body: `{ recipientId: string; ids?: string[]; all?: boolean }`. Returns `{}`. Idempotent.

```bash
curl -X POST localhost:3000/api/notifications/mark-read \
  -H 'content-type: application/json' \
  -d '{"recipientId": "tal-sarah-chen", "all": true}'
```

---

## Integrations

### `POST /api/integrations/squarespace/webhook` — inbound

Replaces Nucleus's existing Typeform leg. Validates a shared-secret header (`x-nucleus-secret` matches `SQUARESPACE_WEBHOOK_SECRET`), normalizes the payload, runs LLM extraction, persists.

```bash
curl -X POST localhost:3000/api/integrations/squarespace/webhook \
  -H 'content-type: application/json' \
  -H 'x-nucleus-secret: <env>' \
  -d '{
    "kind": "talent",
    "name": "Walk-in User",
    "email": "user@example.com",
    "bio": "Free-text from the Squarespace form…"
  }'
```

→ `201 { "id": "tal-...", "reviewUrl": "/onboard/talent?token=..." }`

The user is sent to the `reviewUrl` (a one-time signed link) so they can refine the auto-extracted profile. Removes the "I filled out a form, where's my profile?" gap.

### `GET /api/affinity-pushes` — outbound feed

Read-only. Returns the queue of (real or would-be) Affinity push payloads recorded after each mutual match. Powers the admin slide.

---

## Type contracts

All shapes live under [`v0-app/contracts/`](../v0-app/contracts) — a single source of truth shared between frontend, services, API, and data layer.

| File | Exports |
|---|---|
| `data.ts` | `TalentDTO`, `StartupDTO`, `RankedMatch`, `MatchResponse`, `PipelineTimings`, `InterestState`, `NotificationDTO`, `AffinityPushPayload`, … |
| `services.ts` | `IProfileService`, `IMatchService`, `ISearchService`, `IInterestService`, `INotificationService`, `ServiceError` |
| `data-layer.ts` | `IProfileStore`, `IEmbeddingClient`, `ILLMClient`, `IMatchEngine`, `IMatchCache`, `IInterestStore`, `INotificationStore`, `IAffinityClient` |

Any change to a contract is a 3-person review per `DESIGN.md`. Don't import from anywhere else — that's the boundary.

## Rate limiting / auth

**There is none in the prototype.** Identity is switched via the `?as=` query param. Webhook auth is a single shared secret. Real auth (Clerk) is a stretch goal — see [`docs/challenges.md`](challenges.md).
