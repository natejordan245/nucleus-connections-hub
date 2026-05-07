# Nucleus Connections Hub — Design Doc

A hackathon-scoped design for an AI-powered talent ↔ startup matching platform tailored to Utah's innovation ecosystem.

**Scope:** what we'll build for the demo. Not a forever architecture. Decisions favor "buildable in 2 days" and "demos well on stage" over scale or generality.

---

## 1. Product surface

Two user types share one platform:

- **Talent** — executives, co-founders, fractional operators, engineers, sales/marketing, students/interns, advisors, mentors, board members.
- **Startups** — Utah-based, especially university spinouts (U of U / BYU / USU TTOs) and Silicon Slopes companies, across Life Sciences / AI / Defense & Aerospace / Cyber / Energy / Advanced Manufacturing / Fintech / Software.

Three core jobs the platform does:

1. **Onboard** a talent or startup with rich, structured + free-text profile data.
2. **Match** — given a profile, surface a ranked list of the other side with an explanation.
3. **Connect** — once both sides express interest, push the relationship into Affinity for the Nucleus team to broker.

Two demo personas anchor every design decision:

- *"I'm a former Qualtrics VP of Sales looking for fractional advisory roles in Utah AI startups."*
- *"I'm a U of U bioengineering PhD spinout that just licensed our IP and need a CEO who's done life-sci commercialization."*

If a design choice doesn't make those two flows better, we cut it.

---

## 2. Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Onboarding  │  │   Matches    │  │  Profile / Edit  │   │
│  │  (talent &   │  │  (ranked +   │  │                  │   │
│  │   startup)   │  │  explained)  │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                            │                                 │
│                     tRPC / Route Handlers                    │
└──────────────────────────────┼──────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌────────────────┐   ┌──────────────────┐   ┌────────────────┐
│  Match service │   │  Profile service │   │ Integrations   │
│                │   │                  │   │                │
│ embed → vector │   │  CRUD + enrich   │   │ Squarespace WH │
│ search → LLM   │   │  (LLM extracts   │   │ Affinity push  │
│ re-rank +      │   │  structured data │   │                │
│ explain        │   │  from free text) │   │                │
└───────┬────────┘   └────────┬─────────┘   └───────┬────────┘
        │                     │                      │
        ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│           Supabase Postgres + pgvector                       │
│   talent / startup / utah_orgs / affiliations / matches      │
└─────────────────────────────────────────────────────────────┘
```

**Stack:**
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Lucide icons
- **API:** Next.js Route Handlers (REST) — tRPC is overkill for a 2-day build
- **DB:** Supabase (Postgres + pgvector + auth-ready if we add it later)
- **AI:** OpenAI across the stack — `text-embedding-3-small` for vectors, `gpt-5` for re-ranking + explanations, `gpt-5-mini` for free-text → structured extraction
- **Hosting:** Vercel (single deploy, env vars, instant preview URLs for the demo)
- **Auth:** none for demo. A `?as=<userId>` query param picks identity. Add Clerk if there's time.

---

## 3. Data model

Single Postgres database, `pgvector` enabled. Five core tables.

### `talent`
```sql
id              uuid pk
created_at      timestamptz
name            text
email           text
headline        text                  -- "ex-Qualtrics VP Sales, fractional"
bio             text                  -- free-form, the user's story
skills          text[]                -- ['enterprise sales', 'GTM', 'pricing']
domains         text[]                -- ['ai', 'fintech']
availability    text                  -- 'full-time' | 'fractional' | 'advisory' | 'internship'
compensation    text[]                -- ['equity', 'cash', 'mentor']
stage_prefs     text[]                -- ['pre-seed', 'seed', 'series-a', 'growth']
risk_tolerance  int                   -- 1-5
location        text                  -- 'SLC' | 'Provo' | 'Park City' | 'Remote-Utah'
utah_orgs       uuid[]                -- FK array → utah_orgs (alma maters, employers)
embedding       vector(1536)
profile_jsonb   jsonb                 -- everything raw, for prompt assembly
```

### `startup`
```sql
id                uuid pk
created_at        timestamptz
name              text
one_liner         text
description       text                  -- pitch / story
sector            text                  -- 'life-sciences' | 'ai' | ...
origin            text                  -- 'u-of-u-spinout' | 'byu-spinout' | 'usu-spinout' | 'bootstrapped' | 'vc-backed'
trl               int                   -- 1-9, optional
funding_stage     text                  -- 'pre-seed' | 'seed' | 'series-a' | ...
funding_status    text                  -- 'grant' | 'pre-revenue' | 'revenue' | ...
needs             text[]                -- ['ceo', 'cto', 'biz-dev', 'regulatory', 'sales-lead']
location          text
utah_orgs         uuid[]                -- TTO of origin, accelerators, lead investors
embedding         vector(1536)
profile_jsonb     jsonb
```

### `utah_orgs`  *(the ecosystem graph)*
```sql
id              uuid pk
name            text                    -- 'University of Utah PIVOT Center', 'Kiln', 'Silicon Slopes', 'Lassonde'
type            text                    -- 'tto' | 'accelerator' | 'university' | 'community' | 'investor'
universities    text[]                  -- linked schools, e.g. ['u-of-u']
```

Why this matters: ecosystem proximity is **the** Utah-specific signal LinkedIn doesn't have. Two profiles that share a Utah org get a graph-distance bonus that bumps them up the ranking.

### `match_decisions`  *(audit trail + demo replay)*
```sql
id              uuid pk
created_at      timestamptz
talent_id       uuid fk
startup_id      uuid fk
score           float
reason          text                    -- the LLM's "why" paragraph
factors         jsonb                   -- structured contributions: vector, gates, ecosystem
viewer          text                    -- 'talent' | 'startup' | 'admin'
```

Every match shown is logged. Powers (a) the explainability UI, (b) demo replay, and (c) "why didn't I match X?" debugging on stage.

### `interest`  *(dual opt-in handshake)*
```sql
id              uuid pk
talent_id       uuid fk
startup_id      uuid fk
talent_state    text                  -- 'pending' | 'interested' | 'pass'
startup_state   text                  -- same
mutual_at       timestamptz nullable  -- set when both flip to 'interested' → triggers Affinity push
```

---

## 4. The matching pipeline

This is the heart of the demo. Three stages, each cheap and explainable.

### Stage 1 — Hard gates (SQL)
Filter the candidate set with non-negotiable structured criteria *before* any AI runs:

- Talent's `availability` must intersect with startup's needs (e.g. startup needs CEO full-time → drop fractional-only talent).
- Talent's `stage_prefs` must include the startup's `funding_stage`.
- Talent's `compensation` must overlap the startup's offer (a mentor-only candidate ≠ a paid CEO role).

Hard gates first means we never have to "explain away" a structurally bad match.

### Stage 2 — Vector retrieval (pgvector)
Top-K (K=20) by cosine similarity over `embedding`.

Embedding input = an LLM-assembled paragraph that bakes in *intent* — not just a concatenation of fields. Example for talent:

> "Sarah Chen is a fractional GTM advisor available 10–15 hrs/week for equity. 18 years scaling enterprise SaaS at Qualtrics and Domo. Looking for AI/data-infra startups at seed to Series A, ideally Utah-based. Mission-aligned with applied AI in education and healthcare. Will not consider full-time roles."

Embed that, not the JSON.

### Stage 3 — LLM re-rank + explain (OpenAI `gpt-5`)
Send top-20 candidates + the requesting profile to `gpt-5` with a structured-output prompt (response_format = json_schema). Returns:

```json
[
  {
    "candidate_id": "...",
    "score": 0.87,
    "verdict": "strong",
    "reason": "Sarah's 18 years scaling enterprise SaaS GTM directly addresses your need for a sales-focused advisor at the Series A inflection point. Her availability (fractional, 10-15 hrs/week) matches your equity-only advisor structure. Both Utah-based, both Qualtrics alumni — likely 1-degree separation through your investor.",
    "factors": {
      "skill_fit": "Enterprise sales, pricing, RevOps — exact match for your 'sales-lead' need.",
      "stage_fit": "Series A is in her stated preference range.",
      "utah_signal": "Shared Qualtrics alumni network. Both SLC-based.",
      "concerns": "Her healthcare interest is partial overlap; your product is dev-tools-focused."
    }
  }
]
```

Score is the LLM's ranking; the **factors** are what we render in the UI. Concerns matter — "trust-building" is in the rubric, and showing the gaps makes the recommendation feel honest.

### Ecosystem proximity boost
On top of the LLM score, add a Utah-specific bump:

```
proximity_boost = 0.05 * (shared_utah_orgs)
                + 0.10 * (same_university)
                + 0.05 * (same_city)
                + 0.10 * (1 if startup is a spinout AND talent has tto/research experience)
```

Capped at +0.25. Surfaced in the UI as a "Utah signal" badge with a tooltip listing what triggered it.

### Why this beats LinkedIn
- LinkedIn ranks on keyword overlap and connection distance. We rank on **role-fit semantics + Utah ecosystem topology + stage compatibility** — three signals LinkedIn cannot compute.
- The "concerns" field is something no job board surfaces. It's the trust differentiator.

---

## 5. API surface

Eight endpoints. All Next.js Route Handlers under `/app/api/`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/talent` | Create talent profile (also accepts a raw bio for LLM extraction) |
| `GET`  | `/api/talent/:id` | Read talent profile |
| `PATCH`| `/api/talent/:id` | Update talent profile (re-embeds on save) |
| `POST` | `/api/startup` | Create startup profile (same LLM extraction path) |
| `GET`  | `/api/startup/:id` | Read startup profile |
| `PATCH`| `/api/startup/:id` | Update startup profile (re-embeds on save) |
| `GET`  | `/api/matches?for=<id>&type=talent\|startup` | Run pipeline, return ranked matches with explanations |
| `POST` | `/api/interest` | Express interest (one side); fires Affinity push on mutual |
| `POST` | `/api/integrations/squarespace/webhook` | Inbound from Squarespace form |

**Match endpoint response shape:**
```ts
type MatchResponse = {
  matches: Array<{
    candidateId: string;
    candidate: TalentDTO | StartupDTO;
    score: number;
    verdict: 'strong' | 'good' | 'partial';
    reason: string;
    factors: {
      skill_fit: string;
      stage_fit: string;
      utah_signal: string;
      concerns: string;
    };
    proximityBoost: number;
    proximityReasons: string[]; // ['Both U of U alumni', 'Both SLC-based']
  }>;
  pipelineMs: { gates: number; vector: number; rerank: number };
};
```

Returning `pipelineMs` is for the demo — we'll show the "94ms gates → 38ms vector → 1.2s re-rank" breakdown on stage to make the system legible.

---

## 6. Frontend

Five routes. Nothing more for v1.

| Route | Purpose |
|---|---|
| `/` | Marketing landing — explains the product, two CTAs ("I'm talent" / "I'm a startup"). |
| `/onboard/talent` | Talent onboarding — hybrid form + free-text bio. |
| `/onboard/startup` | Startup onboarding — same shape, different fields. |
| `/matches` | The killer view. Ranked list of the other side, with explanations. |
| `/profile/:id` | Detail view for a profile. Shown when a match card is clicked. |
| `/admin` | Optional. Lists all profiles + match decisions for debugging on stage. |

### Onboarding UX (the "AI-first" part)
Form has two halves on one page:

1. **Structured fields** — dropdowns / chips for the things we can't leave to interpretation: availability, stage prefs, compensation type, sector, funding stage, needs. Required.
2. **Free-text "tell us about yourself / your startup"** — a big textarea. On submit, an LLM call extracts skills, domains, mission keywords, and notable Utah-org affiliations and *populates the structured side as suggestions the user can accept or edit*. This is the "feels magical, beats a typeform" moment.

### Match view UX (the demo centerpiece)
Each match card shows:

- **Header** — name, headline, big verdict badge (Strong / Good fit / Partial fit), score
- **Why this match** — one-paragraph reason from the LLM
- **Factors grid** — 4 small cards: Skill fit, Stage fit, Utah signal, Concerns. The Concerns card is *intentionally prominent* — it builds trust.
- **Utah signal pill** — "Both U of U alumni · Both SLC · Spinout↔TTO experience"
- **Actions** — *Express interest* / *Pass* / *See full profile*

When both sides flip to Express Interest, an animated state change appears: *"Mutual interest — Nucleus has been notified."* That's the moment the Affinity push fires.

### Trust & explainability — design rules
- Never show a numeric score without a paragraph reason.
- Always render Concerns when present. If we hide weaknesses, the matches feel like a sales pitch.
- "Why was I matched?" is the primary CTA on every card, not a hidden tooltip.

---

## 7. Integration layer

### Squarespace (inbound)
Nucleus's existing form is on Squarespace and feeds Typeform → Affinity. We replace the Typeform leg.

- Squarespace form posts JSON to `POST /api/integrations/squarespace/webhook`.
- Handler validates a shared-secret header, normalizes the payload to talent or startup shape, runs LLM extraction on free-text fields, embeds, writes to DB.
- Response includes a one-time signed URL (`/onboard/talent?token=...`) the user can click to review and refine the profile we extracted. Removes the "I filled out a form, where's my profile?" gap.

### Affinity (outbound)
Affinity has a REST API. We use two endpoints: `POST /persons` and `POST /relationships`.

- On **mutual interest**, `POST /api/interest` triggers a job that:
  1. Upserts both sides as Affinity persons (idempotent on email).
  2. Adds them to the "Nucleus Connections — Mutual Match" Affinity list.
  3. Posts a note containing the LLM's `reason` paragraph and the proximity factors, so Nucleus's team has full context before they reach out.

For the demo we'll likely mock the Affinity HTTP client behind a feature flag — but the abstraction (`AffinityClient` with `upsertPerson`, `addToList`, `addNote`) is built such that flipping `AFFINITY_LIVE=true` calls real endpoints. Showing the mock log on stage with the exact request payloads communicates "this is a real integration, not vapor."

### Why this matters for judging
Integration is 20% of the score and most teams will skip it. Even a polished mock with the request payloads visible beats nothing. A real Affinity push beats everyone.

---

## 8. Data layer — synthetic seeds

Demo data is the difference between "interesting prototype" and "I can imagine using this on Monday." Plan:

### `data/utah_orgs.json` — hand-curated, ~30 entries
Real Utah orgs. Costs nothing, sells the Utah angle hard:

- Universities & TTOs: U of U PIVOT Center, BYU Tech Transfer, USU Innovation Campus
- Accelerators: Kiln, BoomStartup, Lassonde Founders, Summit Sandbox
- Community: Silicon Slopes, Women Tech Council, Beehive Startups
- Notable employer alumni networks: Qualtrics, Pluralsight, Domo, Owlet, Recursion, Lucid

### `data/talent.synthetic.json` — 50 talent profiles
LLM-generated with strict prompting: include realistic Utah affiliations, varying stages, varying availability, deliberately seeded "obvious match" pairs for the demo personas. Each profile gets a written bio, not just structured fields, so embeddings have something rich to chew on.

### `data/startups.synthetic.json` — 30 startup profiles
Mix of: real public Utah spinouts (paraphrased), realistic synthetic ones, with origin spread across U of U, BYU, USU, Silicon Slopes companies, and a few defense/aerospace + life-sci to flex the sector range.

### Seed script
`scripts/seed.ts` — wipes and reloads the DB, runs embedding generation in batches, then runs the matching pipeline once for the demo personas and prints the top 5 to console. This is our smoke test.

### "Hand-tuned" demo trio
For the three required match scenarios (Executive → deep tech, Student → spinout, Operator → scaling company), we hand-author the talent and startup such that the match is genuinely strong — and the system finds them organically. We do *not* hard-code the result. Hand-authoring inputs ≠ hand-authoring outputs.

---

## 9. Project layout

```
nucleus-connections-hub/
├── app/                          # Next.js App Router
│   ├── (marketing)/page.tsx
│   ├── onboard/
│   │   ├── talent/page.tsx
│   │   └── startup/page.tsx
│   ├── matches/page.tsx
│   ├── profile/[id]/page.tsx
│   ├── admin/page.tsx
│   └── api/
│       ├── talent/[[...id]]/route.ts
│       ├── startup/[[...id]]/route.ts
│       ├── matches/route.ts
│       ├── interest/route.ts
│       └── integrations/squarespace/webhook/route.ts
├── lib/
│   ├── db.ts                     # postgres client + helpers
│   ├── embeddings.ts             # OpenAI embeddings
│   ├── llm.ts                    # Claude client
│   ├── match/
│   │   ├── gates.ts              # SQL hard filters
│   │   ├── retrieve.ts           # pgvector search
│   │   ├── rerank.ts             # Claude re-rank prompt
│   │   ├── proximity.ts          # Utah ecosystem boost
│   │   └── pipeline.ts           # orchestrator
│   ├── extract/
│   │   └── from-bio.ts           # free-text → structured fields
│   └── integrations/
│       ├── affinity.ts           # mock + live client
│       └── squarespace.ts        # webhook normalization
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── MatchCard.tsx
│   ├── ProfileForm.tsx
│   ├── UtahSignalPill.tsx
│   └── ExplainabilityPanel.tsx
├── data/
│   ├── utah_orgs.json
│   ├── talent.synthetic.json
│   └── startups.synthetic.json
├── scripts/
│   ├── seed.ts
│   └── smoke-match.ts
├── DESIGN.md
└── README.md
```

---

## 10. Build order

A sequence that keeps the demo runnable end-to-end at every step:

1. **DB + schema migration + seed loader** with hand-curated Utah orgs only. Verify `pgvector` works.
2. **Embeddings + retrieval** — get top-K vector search working from a CLI script before touching the UI.
3. **Re-rank prompt** — iterate the Claude prompt against fixed fixtures until the explanations feel real.
4. **Proximity boost** — add the Utah graph signal, verify it changes rankings sensibly.
5. **Match API + a single ugly page** that lists results with reasons. End-to-end before pretty.
6. **Onboarding flows** — structured + free-text + LLM extraction.
7. **Pretty match UI** — MatchCard, factors grid, Utah signal pill, Express interest action.
8. **Affinity integration** — mock first, then live if API access is real.
9. **Squarespace webhook** — last, since it's a wrapper around already-working onboarding.
10. **Demo polish** — hand-author the three scenarios, rehearse the walkthrough, record a backup video.

Anything not on this list is a stretch goal:
- Talent upskilling recommendations ("you're 80% fit, here's how to close the gap") — high-judging-value bonus per the brief
- Ecosystem map visualization (force-directed graph of Utah orgs)
- Real auth (Clerk)
- "Cold start" handling for empty profiles

---

## 11. Locked decisions

- **Vector DB:** Supabase (Postgres + pgvector + auth-ready).
- **LLM provider:** OpenAI across the stack. `gpt-5-mini` for free-text → structured extraction, `gpt-5` for the re-rank + explanation pass where quality drives the demo.
- **Embeddings:** OpenAI `text-embedding-3-small` (1536d native; truncate via `dimensions` param if storage matters).
- **Affinity:** mock-first via an `AffinityClient` abstraction, with `AFFINITY_LIVE=true` flipping to real API calls if access is granted before day 2.
- **Auth:** none for the demo. Identity is switched via a `?as=<userId>` query param. Clerk added only if everything else ships.
