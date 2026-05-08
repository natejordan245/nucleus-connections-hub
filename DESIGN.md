# Nucleus Connections Hub — Design Doc

AI-powered talent ↔ startup matching for the Utah innovation ecosystem.

**Scope:** what we'll build for the hackathon demo. Not a forever architecture. Decisions favor "buildable in 2 days by 3 people working in parallel" and "demos well on stage" over scale or generality.

---

## 1. Product surface & demo personas

Two user types share one platform:

- **Talent** — executives, co-founders, fractional operators, engineers, sales/marketing, students/interns, advisors, mentors, board members.
- **Startups** — Utah-based, especially university spinouts (U of U / BYU / USU TTOs) and Silicon Slopes companies, across Life Sciences / AI / Defense & Aerospace / Cyber / Energy / Advanced Manufacturing / Fintech / Software.

The platform does three jobs: **onboard** profiles, **match** with explanations, **connect** by pushing mutual interest into Affinity.

Two demo personas anchor every design decision:

- *"I'm a former Qualtrics VP of Sales looking for fractional advisory roles in Utah AI startups."*
- *"I'm a U of U bioengineering PhD spinout that just licensed our IP and need a CEO who's done life-sci commercialization."*

If a design choice doesn't make those flows better, we cut it.

---

## 2. Team & ownership

Three of us, working in parallel from day 1. The architecture below is built so each of us can ship in isolation against shared contracts.

| Person | Domain | Owns |
|---|---|---|
| **Zac** | Frontend | `app/`, `components/`, `lib/demo/` (slideshow + typing animation), `lib/services/mock/` and demo fixtures |
| **Tobias** | API + frontend glue | `app/api/` route handlers, `lib/services/real/` (HTTP clients), `contracts/` shepherd |
| **Nate** | Data + integrations | `lib/data-layer/` (Supabase, OpenAI, Affinity, Squarespace), `data/` (synthetic seeds), `scripts/` (migrations & seeding) |

`contracts/` is shared. Any change there is a 3-person review.

---

## 3. Layered architecture

The whole point of the layering is that any layer can run against a mock of the layer below it. Two boundaries, two mocks.

```
┌─ Frontend (Zac) ───────────────────────────────────────────┐
│   Slideshow pages, demo header, double-click-to-type       │
│   Imports IMatchService, IProfileService from @/contracts  │
│   — interfaces, never implementations                       │
└─────────────────────────┬──────────────────────────────────┘
                          │
                Service contract  ← Boundary #1
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
┌─ Mock Service (Zac) ──┐         ┌─ HTTP Service (Tobias) ──┐
│ in-memory, demo       │         │ fetch() against /api/*    │
│ fixtures, no network  │         │ in app/api/               │
└───────────────────────┘         └────────────┬──────────────┘
                                               │
                                  Data-layer contract  ← Boundary #2
                                               │
                                  ┌────────────┴────────────┐
                                  ▼                         ▼
                        ┌─ Mock data layer ─┐   ┌─ Real data layer (Nate) ─┐
                        │ in-process,        │   │ Supabase + OpenAI +       │
                        │ canned responses   │   │ Affinity + Squarespace    │
                        └────────────────────┘   └───────────────────────────┘
```

### Three independent run modes
Each developer picks a mode by setting two env vars. No coordination needed.

| Mode | `NEXT_PUBLIC_SERVICE_MODE` | `DATA_MODE` | Who uses it | What runs |
|---|---|---|---|---|
| **Frontend-only** | `mock` | (ignored) | Zac, demo machine | UI + service mocks. No API server, no DB, no API keys. The whole demo runs from this mode. |
| **API dev (no integrations)** | `real` | `mock` | Tobias | Frontend → HTTP → API routes → mock data layer. Tobias can iterate on API shape, validation, error mapping with no OpenAI/Supabase keys. |
| **Full stack** | `real` | `real` | Nate, integration testing | Everything live. |

The demo on stage runs **frontend-only mode**. We don't need a working backend to win — we need a polished, fast, deterministic walkthrough. The real backend exists for the technical-judging conversation afterward.

---

## 4. Contracts — the shared boundary

Two files, both in `contracts/`. These are the only things all three of us must agree on. Everything else is implementation we own independently.

### `contracts/data.ts` — entity shapes

```ts
export type Availability = 'full-time' | 'fractional' | 'advisory' | 'internship';
export type Compensation = 'cash' | 'equity' | 'mentor';
export type Stage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';
export type Sector =
  | 'life-sciences' | 'ai' | 'defense-aerospace' | 'cyber'
  | 'energy' | 'advanced-manufacturing' | 'fintech' | 'software';
export type Origin =
  | 'u-of-u-spinout' | 'byu-spinout' | 'usu-spinout'
  | 'bootstrapped' | 'vc-backed';

export interface UtahOrgRef { id: string; name: string; type: 'tto'|'accelerator'|'university'|'community'|'investor' }

export interface TalentDTO {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  skills: string[];
  domains: Sector[];
  availability: Availability;
  compensation: Compensation[];
  stagePrefs: Stage[];
  riskTolerance: 1|2|3|4|5;
  location: string;
  utahOrgs: UtahOrgRef[];
  createdAt: string;
}

export interface StartupDTO {
  id: string;
  name: string;
  oneLiner: string;
  description: string;
  sector: Sector;
  origin: Origin;
  trl?: number;
  fundingStage: Stage;
  fundingStatus: 'grant'|'pre-revenue'|'revenue';
  needs: Array<'ceo'|'cto'|'biz-dev'|'regulatory'|'sales-lead'|'engineering'|'marketing'>;
  location: string;
  utahOrgs: UtahOrgRef[];
  createdAt: string;
}

export interface MatchFactors {
  skillFit: string;
  stageFit: string;
  utahSignal: string;
  concerns: string;
}

export interface RankedMatch<T = TalentDTO | StartupDTO> {
  candidateId: string;
  candidate: T;
  score: number;                 // 0..1
  verdict: 'strong' | 'good' | 'partial';
  reason: string;                // one paragraph, LLM-generated
  factors: MatchFactors;
  proximityBoost: number;
  proximityReasons: string[];
}

export interface MatchResponse {
  matches: RankedMatch[];
  pipelineMs: { gates: number; vector: number; rerank: number };
}

export interface InterestState {
  talentId: string;
  startupId: string;
  talentState: 'pending'|'interested'|'pass';
  startupState: 'pending'|'interested'|'pass';
  mutualAt: string | null;
}
```

### `contracts/services.ts` — frontend ↔ API boundary

```ts
import type { TalentDTO, StartupDTO, MatchResponse, InterestState } from './data';

export interface IProfileService {
  getTalent(id: string): Promise<TalentDTO>;
  createTalent(input: Partial<TalentDTO> & { bio: string }): Promise<TalentDTO>;
  updateTalent(id: string, patch: Partial<TalentDTO>): Promise<TalentDTO>;

  getStartup(id: string): Promise<StartupDTO>;
  createStartup(input: Partial<StartupDTO> & { description: string }): Promise<StartupDTO>;
  updateStartup(id: string, patch: Partial<StartupDTO>): Promise<StartupDTO>;

  /** LLM extraction: free-text → suggested structured fields */
  extractFromBio(args: { bio: string; kind: 'talent' }): Promise<Partial<TalentDTO>>;
  extractFromBio(args: { description: string; kind: 'startup' }): Promise<Partial<StartupDTO>>;
}

export interface IMatchService {
  /**
   * Default: returns candidates of the *opposing* type (talent → startup,
   * startup → talent). Pass `target` to override (e.g. talent → talent for
   * the Network tab — peer discovery within the same role pool).
   */
  getMatches(args: {
    for: string;
    type: 'talent' | 'startup';
    target?: 'talent' | 'startup';
  }): Promise<MatchResponse>;
}

export interface ISearchService {
  /**
   * Free-text semantic search. The query is embedded, the nearest neighbors
   * in `kind`'s pool are pulled, and the LLM reranker writes per-result
   * "why this matches your search" reasons. No subject profile required —
   * the query string itself stands in.
   */
  search(args: {
    query: string;
    kind: 'talent' | 'startup';
    k?: number;
  }): Promise<MatchResponse>;
}

export interface IInterestService {
  expressInterest(args: { talentId: string; startupId: string; from: 'talent'|'startup'; state: 'interested'|'pass' }): Promise<InterestState>;
}
```

### `contracts/data-layer.ts` — API ↔ data layer boundary (internal to Tobias + Nate)

```ts
import type { TalentDTO, StartupDTO, RankedMatch } from './data';

export interface IProfileStore {
  getTalent(id: string): Promise<TalentDTO | null>;
  putTalent(t: TalentDTO): Promise<void>;
  listTalent(): Promise<TalentDTO[]>;
  getStartup(id: string): Promise<StartupDTO | null>;
  putStartup(s: StartupDTO): Promise<void>;
  listStartups(): Promise<StartupDTO[]>;
}

export interface IEmbeddingClient {
  embed(text: string): Promise<number[]>;            // 1536-dim
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ILLMClient {
  extractTalent(bio: string): Promise<Partial<TalentDTO>>;
  extractStartup(description: string): Promise<Partial<StartupDTO>>;
  /** Subject-anchored rerank — explanations reference the subject. */
  rerank(args: { subject: TalentDTO|StartupDTO; candidates: Array<TalentDTO|StartupDTO> }): Promise<RankedMatch[]>;
  /** Query-anchored rerank — explanations reference the search query. */
  rerankFromQuery(args: { query: string; candidates: Array<TalentDTO|StartupDTO> }): Promise<RankedMatch[]>;
}

export interface IMatchEngine {
  /** Subject mode. Runs gates → vector retrieval → rerank → proximity boost. */
  findMatches(args: {
    for: string;
    type: 'talent'|'startup';
    target?: 'talent'|'startup';
    k?: number;
  }): Promise<RankedMatch[]>;

  /** Query mode. Embeds the query, pulls top-K from `target`, reranks. No gates. */
  findFromQuery(args: {
    query: string;
    target: 'talent'|'startup';
    k?: number;
  }): Promise<RankedMatch[]>;
}

export interface IAffinityClient {
  upsertPerson(p: { name: string; email: string }): Promise<{ affinityId: string }>;
  addToList(args: { personId: string; listName: string }): Promise<void>;
  addNote(args: { personId: string; body: string }): Promise<void>;
}
```

Everyone codes against the interfaces. Implementations are picked at the factory layer.

---

## 5. Frontend layer (Zac)

### Demo-first principle
We never type during the demo. Every text input that has a canonical demo value is wrapped in `<DemoTextInput>`:

- **Double-click** the field → clears existing value, types out the canonical demo content character-by-character (~25ms/char) with a blinking cursor. Real React `onChange` fires at every step so downstream form state stays consistent.
- **Single-click + type** still works for live editing if a judge wants to try.
- The component reads its demo content from `lib/demo/scenarios.ts`, keyed by a `demoKey` prop.

```tsx
<DemoTextInput
  demoKey="talent-bio-sarah-chen"
  value={form.bio}
  onChange={(v) => setForm({ ...form, bio: v })}
  placeholder="Tell us about yourself..."
  rows={8}
/>
```

### Slideshow shell
The whole app is a sequential walkthrough. Layout owns a `SlideController` that tracks which slide is active and exposes `next()` / `prev()`.

- Header has `‹` and `›` chevrons, plus a slide-title dropdown for jumping. Arrow keys (`←` / `→`) work too.
- Each route is a slide in `app/(slides)/<n>-<name>/page.tsx`.
- Slide order *is* the demo:

| # | Route | Demo beat |
|---|---|---|
| 0 | `/landing` | Landing — pitch, "Start the demo →" |
| 1 | `/onboard/talent` | Sarah Chen onboards. Double-click bio → types out story → other fields auto-populate from `extractFromBio()`. Photo upload + LinkedIn / X. |
| 2 | `/profile/talent/sarah-chen` | "Here's the profile we built." Avatar, socials, Utah affiliations. |
| 3 | `/onboard/startup` | The bio-spinout onboards. Same flow. |
| 4 | `/profile/startup/lumen-bio` | "Here's the spinout profile." |
| 5 | `/matches?as=sarah-chen` | **Three-tab dashboard** (Search / Network / Opportunities) — see §5.1. |
| 6 | `/handshake` | Both sides express interest. Animated mutual-match state. |
| 7 | `/affinity-push` | The Affinity request payload, formatted, with the LLM reason as the note body. |

### 5.1 Dashboard (slide 5) — three tabs

The matches page is *the* trust surface. We split it into three tabs that each answer a different question, sharing one chrome and one card primitive (`<OpportunityCard>`).

| Tab | Question it answers | Engine call | Pool searched |
|---|---|---|---|
| **Search** | "Find me someone who…" | `searchService.search({ query, kind })` | `kind` (talent or startup), driven by free-text |
| **Network** | "Who in Utah should I meet?" | `matchService.getMatches({ for, type:'talent', target:'talent' })` | Other talent (peer discovery) |
| **Opportunities** | "Which company should I join / advise?" *(default tab)* | `matchService.getMatches({ for, type:'talent' })` | Startups |

Tabs are URL-driven via `?tab=search|network|opportunities` so any tab is linkable from the slide deck. Default tab when missing is `opportunities` — the demo's anchor moment.

**Search tab** — full-width search bar at the top with a `kind` toggle (People / Companies). The query goes through the same pipeline as a profile-anchored match, except the "subject" is the embedded query string rather than an existing profile. The reranker writes "why this matches your search" reasons that quote the user's intent. Empty state shows a few prompt suggestions ("life-sciences CEO with FDA experience", "BYU spinout in computer vision").

**Network tab** — peer-mode matching. The same engine runs against the talent pool minus the viewer themselves. Hard gates relax (no stage / availability / compensation gates between two people). The reranker explains complementarity — overlapping Utah orgs, complementary skill stacks, mission alignment. Used for advisor-meets-advisor, founder-meets-founder, mentor-meets-student.

**Opportunities tab** — current talent ↔ startup behavior. No change to engine semantics.

All three tabs render results as `<OpportunityCard>`s — same card, same trust UX (verdict pill, score, "Why this match", expandable factor grid with Concerns, "I'm interested →" / "Pass" CTAs).

### Trust UX rules
- Never show a numeric score without the paragraph reason.
- Always render the **Concerns** factor when present. Hiding weaknesses makes matches look like a sales pitch.
- "Why was I matched?" is the primary CTA on every card, not a hidden tooltip.
- Pipeline timing (`94ms gates → 38ms vector → 1.2s rerank`) is rendered as a small footer on the matches page. Makes the system legible.

### Frontend file layout
```
app/
├── layout.tsx                    # mounts <DemoHeader/> with chevrons + keyboard nav
├── (slides)/
│   ├── page.tsx                  # slide 0: landing
│   ├── onboard/talent/page.tsx   # slide 1
│   ├── profile/talent/[id]/page.tsx
│   ├── onboard/startup/page.tsx
│   ├── profile/startup/[id]/page.tsx
│   ├── matches/page.tsx          # slide 5
│   ├── matches/handshake/page.tsx
│   └── admin/affinity-push/page.tsx
lib/
├── demo/
│   ├── SlideController.tsx       # context + provider + keyboard listener
│   ├── DemoHeader.tsx            # chevrons + dropdown
│   ├── DemoTextInput.tsx         # double-click → typing animation
│   ├── useTypingAnimation.ts
│   └── scenarios.ts              # canonical demo text keyed by demoKey
└── services/
    ├── factory.ts                # picks mock vs real based on env
    ├── mock/                     # MockProfileService, MockMatchService, MockInterestService
    └── real/                     # HttpProfileService, HttpMatchService, HttpInterestService
components/
├── ui/                           # shadcn primitives
├── MatchCard.tsx
├── ProfileForm.tsx
├── UtahSignalPill.tsx
├── ExplainabilityPanel.tsx
└── AffinityPayloadView.tsx
```

---

## 6. Service layer — the strategy pattern boundary

Frontend never imports anything from `lib/services/mock/` or `lib/services/real/` directly. It imports the factory.

```ts
// lib/services/factory.ts
import type { IProfileService, IMatchService, IInterestService } from '@/contracts/services';

const mode = process.env.NEXT_PUBLIC_SERVICE_MODE ?? 'mock';

export const profileService: IProfileService =
  mode === 'real'
    ? new (await import('./real/HttpProfileService')).HttpProfileService()
    : new (await import('./mock/MockProfileService')).MockProfileService();

// ...same for matchService, interestService
```

### Mock service implementation (Zac, with help from Tobias)
- Backed by **in-memory fixtures** loaded from `lib/services/mock/fixtures/`.
- `getMatches()` returns pre-canned `MatchResponse` objects keyed by demo persona.
- `extractFromBio()` returns deterministic structured output for the canonical bios so the typing animation always lands on the same fields. (No LLM call.)
- `expressInterest()` mutates an in-memory `Map` so the handshake slide can show the state transition.
- Latency is faked with `await sleep(700)` to make the UI feel real.

### HTTP service implementation (Tobias)
- Each method is a thin `fetch()` wrapper to the matching `app/api/*` route.
- Errors normalize to a `ServiceError` shape so frontend error handling is mode-agnostic.
- Reuses `contracts/data.ts` types — no DTO duplication.

### Why this matters
Zac builds the entire demo without anyone else online. Tobias builds the API without Nate's integrations being real. Nate builds integrations without blocking on Tobias's API shape.

---

## 7. API layer (Tobias)

Next.js Route Handlers under `app/api/`. Stateless. They translate HTTP ↔ data layer.

| Method | Path | Calls into data layer |
|---|---|---|
| `POST`  | `/api/talent` | `LLMClient.extractTalent` → `EmbeddingClient.embed` → `ProfileStore.putTalent` |
| `GET`   | `/api/talent/:id` | `ProfileStore.getTalent` |
| `PATCH` | `/api/talent/:id` | `ProfileStore.putTalent` (re-embeds if bio changed) |
| `POST`  | `/api/startup` | mirror of talent |
| `GET`   | `/api/startup/:id` | mirror |
| `PATCH` | `/api/startup/:id` | mirror |
| `POST`  | `/api/extract` | `LLMClient.extractTalent` or `extractStartup` (used during onboarding suggest) |
| `GET`   | `/api/matches` | `MatchEngine.findMatches` — accepts `for`, `type`, optional `target` (peer mode when `type=target=talent`) |
| `GET`   | `/api/search` | `MatchEngine.findFromQuery` — query-mode semantic search. Params: `q`, `kind` (talent\|startup), optional `k` |
| `POST`  | `/api/interest` | mutate interest record; on mutual, fire `AffinityClient.*` |
| `POST`  | `/api/integrations/squarespace/webhook` | normalize → same path as `POST /api/talent` or `/api/startup` |

Routes get their data-layer dependencies from a single `lib/data-layer/factory.ts`:

```ts
const dataMode = process.env.DATA_MODE ?? 'mock';
export const profileStore = dataMode === 'real' ? new SupabaseProfileStore() : new MockProfileStore();
export const llmClient   = dataMode === 'real' ? new OpenAILLMClient()      : new MockLLMClient();
// ...
```

The factory is **the only file** that imports both `mock/*` and `real/*`.

---

## 8. Data layer (Nate)

Two parallel implementations of every data-layer interface, picked by `DATA_MODE`.

### Real implementations
- `SupabaseProfileStore` — Postgres CRUD via `@supabase/supabase-js`.
- `OpenAIEmbeddingClient` — wraps `text-embedding-3-small`. 1536d.
- `OpenAILLMClient` — wraps `gpt-5.3-nano` for extraction (cheap, fast, structured outputs) and `gpt-5.5-instant` for re-rank/explain (quality where it matters).
- `PgvectorMatchEngine` — orchestrates gates → pgvector top-K → LLM rerank → proximity boost.
- `AffinityClient` — `upsertPerson`, `addToList`, `addNote` against the Affinity REST API. Behind `AFFINITY_LIVE` flag.

### Mock implementations
- `MockProfileStore` — backed by `data/talent.synthetic.json` + `data/startups.synthetic.json` loaded into a `Map`.
- `MockEmbeddingClient` — returns a deterministic 1536-d vector hashed from the input text. Cheap, repeatable, lets `MockMatchEngine` do real cosine similarity without OpenAI.
- `MockLLMClient` — returns canned `Partial<TalentDTO>` and `Partial<StartupDTO>` for known bios; for unknown bios, returns a sensible default. `rerank()` builds a plausible reason paragraph from a template using the candidates' actual fields.
- `MockMatchEngine` — runs the same gates → vector → rerank pipeline, just against the mock primitives. So mock-mode end-to-end ≈ real-mode end-to-end, structurally.
- `MockAffinityClient` — appends to an in-memory log. The admin slide reads from this log to render the "request that would be sent to Affinity" view.

The key invariant: **mocks satisfy the same interfaces and run the same code paths** as the real impls. Switching `DATA_MODE` flips behavior without changing call sites.

### Data-layer file layout
```
lib/data-layer/
├── factory.ts                    # the only file that imports both mock/* and real/*
├── mock/
│   ├── MockProfileStore.ts
│   ├── MockEmbeddingClient.ts    # deterministic hash → vector
│   ├── MockLLMClient.ts          # canned + templated outputs
│   ├── MockMatchEngine.ts
│   └── MockAffinityClient.ts
└── real/
    ├── SupabaseProfileStore.ts
    ├── OpenAIEmbeddingClient.ts
    ├── OpenAILLMClient.ts
    ├── PgvectorMatchEngine.ts
    └── AffinityClient.ts
```

---

## 9. Data model (Supabase / Postgres)

Five tables. `pgvector` extension enabled.

### `talent`
```sql
id              uuid pk default gen_random_uuid()
created_at      timestamptz default now()
name            text not null
email           text unique not null
headline        text
bio             text not null
skills          text[]                 -- ['enterprise sales', 'GTM', 'pricing']
domains         text[]                 -- sectors (Sector enum)
availability    text                   -- Availability enum
compensation    text[]
stage_prefs     text[]
risk_tolerance  int check (risk_tolerance between 1 and 5)
location        text
utah_org_ids    uuid[]
embedding       vector(1536)
profile_jsonb   jsonb                  -- full DTO snapshot for prompt assembly
```

### `startup`
```sql
id                uuid pk default gen_random_uuid()
created_at        timestamptz default now()
name              text not null
one_liner         text
description       text not null
sector            text
origin            text
trl               int
funding_stage     text
funding_status    text
needs             text[]
location          text
utah_org_ids      uuid[]
embedding         vector(1536)
profile_jsonb     jsonb
```

### `utah_orgs` *(the ecosystem graph)*
```sql
id            uuid pk default gen_random_uuid()
name          text not null
type          text                    -- 'tto'|'accelerator'|'university'|'community'|'investor'
universities  text[]                  -- linked schools, e.g. ['u-of-u']
```

This is **the** Utah-specific signal LinkedIn doesn't have. Two profiles that share a Utah org get a graph-distance bonus that bumps them up the ranking.

### `match_decisions` *(audit trail + demo replay)*
```sql
id              uuid pk default gen_random_uuid()
created_at      timestamptz default now()
talent_id       uuid references talent(id)
startup_id      uuid references startup(id)
score           float
reason          text                    -- LLM's "why" paragraph
factors         jsonb                   -- {skillFit, stageFit, utahSignal, concerns}
proximity_boost float
viewer          text                    -- 'talent' | 'startup' | 'admin'
```

Every match shown is logged. Powers (a) the explainability UI, (b) demo replay, (c) "why didn't I match X?" debugging on stage.

### `interest` *(dual opt-in handshake)*
```sql
id              uuid pk default gen_random_uuid()
talent_id       uuid references talent(id)
startup_id      uuid references startup(id)
talent_state    text                  -- 'pending' | 'interested' | 'pass'
startup_state   text
mutual_at       timestamptz           -- set when both flip to 'interested' → triggers Affinity push
unique (talent_id, startup_id)
```

Indexes:
```sql
create index talent_embedding_idx on talent using ivfflat (embedding vector_cosine_ops);
create index startup_embedding_idx on startup using ivfflat (embedding vector_cosine_ops);
```

---

## 10. Matching pipeline

Three stages plus a Utah proximity boost. Lives in `PgvectorMatchEngine` (real) and `MockMatchEngine` (mock); both run the same logic against their primitives.

### Stage 1 — Hard gates (SQL)
Filter the candidate set with non-negotiable structured criteria *before* any AI runs:

- Talent's `availability` must intersect with startup's needs (e.g. startup needs full-time CEO → drop fractional-only talent).
- Talent's `stage_prefs` must include the startup's `funding_stage`.
- Talent's `compensation` must overlap the startup's offer (mentor-only candidate ≠ paid CEO role).

Hard gates first means we never have to "explain away" a structurally bad match.

### Stage 2 — Vector retrieval (pgvector)
Top-K=20 by cosine similarity over `embedding`.

Embedding input = an LLM-assembled paragraph that bakes in *intent* — not just a JSON dump. Example for talent:

> "Sarah Chen is a fractional GTM advisor available 10–15 hrs/week for equity. 18 years scaling enterprise SaaS at Qualtrics and Domo. Looking for AI/data-infra startups at seed to Series A, ideally Utah-based. Mission-aligned with applied AI in education and healthcare. Will not consider full-time roles."

Embed that, not the JSON.

### Stage 3 — LLM re-rank + explain (`gpt-5.5-instant`)
Send top-20 candidates + the requesting profile with a structured-output prompt (response_format = json_schema). Returns:

```json
[
  {
    "candidateId": "...",
    "score": 0.87,
    "verdict": "strong",
    "reason": "Sarah's 18 years scaling enterprise SaaS GTM directly addresses your need for a sales-focused advisor at the Series A inflection point. Her availability (fractional, 10-15 hrs/week) matches your equity-only advisor structure. Both Utah-based, both Qualtrics alumni — likely 1-degree separation through your investor.",
    "factors": {
      "skillFit": "Enterprise sales, pricing, RevOps — exact match for your 'sales-lead' need.",
      "stageFit": "Series A is in her stated preference range.",
      "utahSignal": "Shared Qualtrics alumni network. Both SLC-based.",
      "concerns": "Her healthcare interest is partial overlap; your product is dev-tools-focused."
    }
  }
]
```

`gpt-5.3-nano` handles the cheaper free-text → structured extraction during onboarding.

### Stage 4 — Utah proximity boost
On top of the LLM score, add a Utah-specific bump:

```
proximity_boost = 0.05 * shared_utah_orgs
                + 0.10 * same_university
                + 0.05 * same_city
                + 0.10 * (spinout_startup AND tto_or_research_talent ? 1 : 0)
                  capped at +0.25
```

### Pipeline variants

The same engine runs three different modes, sharing stages 2–4. Only stage 1 changes.

| Mode | Stage 1 (gates) | Stage 2 (vector) | Stage 3 (rerank) | Stage 4 (proximity) |
|---|---|---|---|---|
| **Subject — opportunities** *(talent → startup)* | Stage / availability / compensation gates | Subject embedding → top-K | `rerank({ subject, candidates })` | Talent ↔ Startup proximity |
| **Subject — network** *(talent → talent)* | None — peer matching has no stage gate; we exclude `id == subject.id` | Subject embedding → top-K | `rerank({ subject, candidates })` writes peer-style language ("complementary skills", "shared advisor lineage") | Talent ↔ Talent proximity (shared orgs / same university / same city) |
| **Query — search** *(free text → talent or startup)* | None — the query is intent, not constraints | Embed the query string → top-K from `target` pool | `rerankFromQuery({ query, candidates })` writes "matches your search because…" reasons | Skipped — no subject side to compute proximity from |

The query-mode rerank is the same prompt skeleton as subject-mode rerank with the subject slot replaced by the raw query string. The reranker is told to quote phrases from the query in its `reason` paragraph so the user can see *why* the system thinks each result fits what they typed.

Surfaced as a **Utah signal** badge with a tooltip listing what triggered it.

### Why this beats LinkedIn
LinkedIn ranks on keyword overlap and connection distance. We rank on **role-fit semantics + Utah ecosystem topology + stage compatibility** — three signals LinkedIn cannot compute. The **Concerns** field is something no job board surfaces. That's the trust differentiator.

---

## 11. Integrations (Nate)

### Squarespace (inbound)
Replaces Nucleus's existing Typeform leg.

- Squarespace form posts JSON to `POST /api/integrations/squarespace/webhook`.
- Handler validates a shared-secret header, normalizes payload to talent or startup shape, runs LLM extraction on free-text, embeds, writes via `ProfileStore`.
- Response includes a one-time signed URL (`/onboard/talent?token=...`) the user can click to review and refine the auto-extracted profile. Removes the "I filled out a form, where's my profile?" gap.

### Affinity (outbound)
Affinity has a REST API. We use two endpoints: `POST /persons` and `POST /relationships`.

On **mutual interest** (both sides flip to `interested`), the API route fires:
1. `AffinityClient.upsertPerson` for both sides (idempotent on email).
2. `AffinityClient.addToList` to "Nucleus Connections — Mutual Match".
3. `AffinityClient.addNote` containing the LLM's `reason` paragraph + proximity factors.

Behind `AFFINITY_LIVE` — false by default. Mock client logs to memory; admin slide renders the would-be request payloads. Real client only flips on after Nucleus grants API access.

---

## 12. Synthetic data plan (Nate)

Demo data is the difference between "interesting prototype" and "I can imagine using this on Monday."

### `data/utah_orgs.json` — hand-curated, ~30 entries
Real Utah orgs. Costs nothing, sells the Utah angle hard:

- **TTOs & universities:** U of U PIVOT Center, BYU Tech Transfer, USU Innovation Campus
- **Accelerators:** Kiln, BoomStartup, Lassonde Founders, Summit Sandbox
- **Community:** Silicon Slopes, Women Tech Council, Beehive Startups
- **Notable employer alumni networks:** Qualtrics, Pluralsight, Domo, Owlet, Recursion, Lucid

### `data/talent.synthetic.json` — 50 talent profiles
LLM-generated with strict prompting: realistic Utah affiliations, varying stages and availability, deliberately seeded "obvious match" pairs for the demo personas. Each profile gets a written bio so embeddings have something rich to chew on.

### `data/startups.synthetic.json` — 30 startup profiles
Mix of: paraphrased real Utah spinouts, realistic synthetic ones, with origin spread across U of U / BYU / USU / Silicon Slopes, and a few defense/aerospace + life-sci to flex the sector range.

### `data/demo-personas.ts` — hand-authored, 3 scenarios
The three required match scenarios — Executive → deep tech, Student → spinout, Operator → scaling — exist as rich, deliberately-matchable inputs. The system finds them organically; we do **not** hard-code outputs. Hand-authoring inputs ≠ hand-authoring outputs.

These same fixtures back `MockProfileStore`, so frontend-only mode shows the same personas as full-stack mode.

### `scripts/seed.ts` (Nate)
Wipes and reloads the DB, runs embedding generation in batches, prints top-5 matches for each demo persona to console as a smoke test.

---

## 13. Project layout — concrete tree with owners

```
nucleus-connections-hub/
├── DESIGN.md                                # this file
├── README.md
├── .env.example
│
├── contracts/                               # ★ shared, 3-person review
│   ├── data.ts
│   ├── services.ts
│   └── data-layer.ts
│
├── app/                                     # Zac (frontend) + Tobias (api routes)
│   ├── layout.tsx                           # Zac
│   ├── (slides)/                            # Zac
│   │   ├── page.tsx                         # 0 landing
│   │   ├── onboard/talent/page.tsx          # 1
│   │   ├── profile/talent/[id]/page.tsx     # 2
│   │   ├── onboard/startup/page.tsx         # 3
│   │   ├── profile/startup/[id]/page.tsx    # 4
│   │   ├── matches/page.tsx                 # 5
│   │   ├── matches/handshake/page.tsx       # 6
│   │   └── admin/affinity-push/page.tsx     # 7
│   └── api/                                 # Tobias
│       ├── talent/route.ts
│       ├── talent/[id]/route.ts
│       ├── startup/route.ts
│       ├── startup/[id]/route.ts
│       ├── extract/route.ts
│       ├── matches/route.ts
│       ├── interest/route.ts
│       └── integrations/squarespace/webhook/route.ts
│
├── components/                              # Zac
│   ├── ui/
│   ├── MatchCard.tsx
│   ├── ProfileForm.tsx
│   ├── UtahSignalPill.tsx
│   ├── ExplainabilityPanel.tsx
│   └── AffinityPayloadView.tsx
│
├── lib/
│   ├── demo/                                # Zac
│   │   ├── SlideController.tsx
│   │   ├── DemoHeader.tsx
│   │   ├── DemoTextInput.tsx
│   │   ├── useTypingAnimation.ts
│   │   └── scenarios.ts
│   │
│   ├── services/                            # Zac (mock) + Tobias (real)
│   │   ├── factory.ts
│   │   ├── mock/
│   │   │   ├── MockProfileService.ts
│   │   │   ├── MockMatchService.ts
│   │   │   ├── MockInterestService.ts
│   │   │   └── fixtures/
│   │   │       ├── demo-talent.ts
│   │   │       ├── demo-startups.ts
│   │   │       └── demo-matches.ts
│   │   └── real/
│   │       ├── HttpProfileService.ts
│   │       ├── HttpMatchService.ts
│   │       └── HttpInterestService.ts
│   │
│   └── data-layer/                          # Nate
│       ├── factory.ts
│       ├── mock/
│       │   ├── MockProfileStore.ts
│       │   ├── MockEmbeddingClient.ts
│       │   ├── MockLLMClient.ts
│       │   ├── MockMatchEngine.ts
│       │   └── MockAffinityClient.ts
│       └── real/
│           ├── SupabaseProfileStore.ts
│           ├── OpenAIEmbeddingClient.ts
│           ├── OpenAILLMClient.ts
│           ├── PgvectorMatchEngine.ts
│           └── AffinityClient.ts
│
├── data/                                    # Nate
│   ├── utah_orgs.json
│   ├── talent.synthetic.json
│   ├── startups.synthetic.json
│   └── demo-personas.ts                     # also imported by lib/services/mock/fixtures
│
└── scripts/                                 # Nate
    ├── migrate.ts
    ├── seed.ts
    └── smoke-match.ts
```

---

## 14. Build order — three parallel tracks

Day 1 morning: all three of us land `contracts/` together. After that we fork.

### Zac (frontend track)
1. Next.js + Tailwind + shadcn scaffold; layout shell with `DemoHeader`.
2. `SlideController` + keyboard nav + slide route stubs (1–7).
3. `DemoTextInput` + typing animation + `scenarios.ts` content.
4. `MockProfileService` / `MockMatchService` / `MockInterestService` with demo fixtures.
5. Onboarding form, `MatchCard`, factors grid, Utah signal pill, mutual-interest animation, Affinity payload view.
6. Demo polish — timing, transitions, recorded backup video.

### Tobias (API track)
1. After contracts: scaffold all `app/api/*` routes returning 501.
2. `HttpProfileService` / `HttpMatchService` / `HttpInterestService` against the route stubs.
3. Wire routes to `lib/data-layer/factory.ts` (still mock).
4. Validation, error normalization, response shapes finalized against contracts.
5. Squarespace webhook normalization layer.
6. Hook up real data layer once Nate's primitives ship (just flip env).

### Nate (data + integrations track)
1. After contracts: `MockProfileStore` / `MockEmbeddingClient` / `MockLLMClient` / `MockMatchEngine` / `MockAffinityClient` so Tobias is unblocked.
2. `data/utah_orgs.json` hand-curated; synthetic talent + startup JSON via LLM-assisted generation.
3. Supabase project + schema migration + `pgvector` enabled.
4. `OpenAIEmbeddingClient` (`text-embedding-3-small`, 1536d).
5. `OpenAILLMClient` (`gpt-5.3-nano` extract, `gpt-5.5-instant` rerank).
6. `SupabaseProfileStore` + `PgvectorMatchEngine` + proximity boost.
7. `seed.ts` end-to-end + smoke-test top-5 for demo personas.
8. `AffinityClient` (mock-first; live if access granted day 2).

### Stretch (whoever finishes first)
- Talent upskilling recommendations ("you're 80% fit — here's how to close the gap").
- Ecosystem map visualization (force-directed graph of Utah orgs).
- Real auth (Supabase Auth, CLI-driven — same Supabase project as the data layer).

---

## 15. Locked decisions

- **Vector DB:** Supabase (Postgres + pgvector). Same project also hosts `auth.users` so production auth doesn't need a second vendor.
- **LLM provider:** OpenAI across the stack. `gpt-5.3-nano` for free-text → structured extraction, `gpt-5.5-instant` for the re-rank + explanation pass.
- **Embeddings:** OpenAI `text-embedding-3-small` (1536d native).
- **Service-layer mode:** controlled by `NEXT_PUBLIC_SERVICE_MODE` (`mock` | `real`).
- **Data-layer mode:** controlled by `DATA_MODE` (`mock` | `real`).
- **Affinity:** mock-first via `AffinityClient` interface; `AFFINITY_LIVE=true` flips to real API if access is granted before day 2.
- **Auth:** none for the demo. Identity is switched via a `?as=<userId>` query param. Production path is **Supabase Auth** (CLI-driven; `auth.users` lives in the same Postgres as the data layer, RLS policies key on `auth.uid()`). See [`docs/integrations.md`](docs/integrations.md#identity--auth).
- **Demo input UX:** double-click any `DemoTextInput` to type out the canonical demo content with animation. Live typing still works for judges who want to try.
- **Demo navigation:** sequential slides controlled by header chevrons + arrow keys.
