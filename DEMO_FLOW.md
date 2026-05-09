# Demo Flow — the dream slideshow

The hackathon demo runs in **two phases**:

1. **Story slideshow** — ~3 minutes of cinematic, animated pages that pitch the problem, the product, and the differentiators. Pure frontend — *no API calls, no data fetching, no backend communication of any kind*. Every slide is a static `'use client'` page with hardcoded copy and `framer-motion` animations.
2. **Live product** — transitions out of the slideshow into the real app via `/api/demo/start`, then walks through the actual working flow with a pre-warmed persona. This is the only place real frontend ↔ backend traffic happens (against the `MockDataStore` in demo mode).

The hard line between phases is on purpose. The slideshow tells judges *what we built and why it wins* without any chance of a network blip or stale state biting us on stage. The live product proves *it actually works*. The handoff between them is the most important moment of the demo.

Total runtime: ~6 minutes. Slideshow ~3 min, live demo ~3 min, closing ~30 s.

## What this replaces

The slideshow described here **supersedes** the existing demo deck at [`app/src/lib/demo/slides.ts`](app/src/lib/demo/slides.ts) — the 7-step keyboard walkthrough that currently routes judges through real product pages (`/dashboard` → `/search` → `/profile/startup/sup-bramble` → `/handshake` → `/affinity-push` → `/api/demo/exit`). That deck and its `<DemoDeckHeader>` get retired:

- Delete `app/src/lib/demo/slides.ts` (or repurpose for Phase 2's keyboard nav).
- Delete `app/src/components/DemoDeckHeader.tsx` and replace with a thinner deck header for the new slideshow at `/demo/*`.
- Keep `lib/demo/cookie.ts`, `/api/demo/start`, and `/api/demo/exit` — those are still how Phase 2 enters and exits demo mode.

The new slideshow lives at `/demo/*` (one route per slide). Phase 2 routes (`/dashboard`, `/search`, `/profile/...`, `/handshake`, `/affinity-push`) are unchanged but get the new "Finish demo" header icon when `APP_MODE=demo`.

---

## Rubric coverage map

The 11 slides are weighted to mirror the bounty's judging criteria. Nothing is decorative.

| Criterion | Weight | Slides | Live demo coverage |
|---|---|---|---|
| User Experience | 40% | 4 slides (2, 3, 4, 5) | All of Live 2–4 |
| Match Quality & Intelligence | 30% | 3 slides (6, 7, 8) | Live 3 (search + dashboard ranking) |
| Integration | 20% | 2 slides (9, 10) | Live 5 (Affinity payload viewer) |
| Innovation & Creativity | 10% | 1 slide (11) | Live 3 (Bridges drawer on partial matches) |

Slides 1 (cold open) and 12 (handoff) are setup/transition; they don't carry rubric weight directly but earn the time judges spend on the rubric slides.

---

# Phase 1 — Story slideshow (frontend-only)

12 routes total. Each is a self-contained page that imports nothing from `lib/data/*`, `lib/supabase/*`, or any API. Hardcoded data, hardcoded copy, animations only. Use `→` / `←` to advance. Auto-advance disabled — presenter controls timing.

## Visual language

Per [`app/CLAUDE.md`](app/CLAUDE.md):

- **Background:** `bg-paper` (white, `#ffffff`).
- **Text:** `text-ink` (`#0f172a`) for headlines, `text-warmgray-700` for body.
- **Brand accent:** `bg-orange-500` token = **royal blue `#2563eb`**. Single accent per slide. Hover `bg-orange-600`.
- **Typography:** Bricolage Grotesque 600 throughout (`font-sans` and `font-serif` both resolve to it). JetBrains Mono (`font-mono`) for stats, percentages, IDs.
- **Eyebrow:** `.eyebrow` class (`text-[11px] font-semibold uppercase tracking-[0.18em]`) tinted `text-orange-500` (royal blue) for primary slides, `text-warmgray-400` for setup slides.
- **Hero hierarchy** (landing-style): `font-serif text-[56px]–[72px] font-semibold leading-[1.04] tracking-[-0.02em]`.
- **Surface chrome:** `rounded-lg border border-warmgray-200 bg-white`. No shadows except hover-lift CTAs.
- **Iconography:** `lucide-react` only, `strokeWidth={1.75}`. Brand mark is `<DelicateArch>` from `app/src/components/DelicateArch.tsx` rendering `/icon.webp`.
- **Voice:** product-tone, no engineering jargon in copy. "Embeddings" / "LLM" stay in technical callouts, not narration on the slide itself.

Two slides (Slide 1, Slide 12) flip dark — `bg-warmgray-900 text-paper` — for emotional bookending. Used sparingly.

## Slideshow shell

Build a single client-component layout at `app/src/app/demo/layout.tsx` that:

- Renders a thin top progress bar (royal-blue `bg-orange-500`) showing `current / total`.
- Listens for `→` / `←` / `space` and pushes to the next/prev slide.
- Renders a tiny `← exit` link in the corner that hits `/` (landing).
- Hides the global `<AppShell>` chrome — slides are full-bleed.

Slide registry at `app/src/lib/demo/show-slides.ts` (separate from the existing `slides.ts` we're retiring):

```ts
export const SHOW_SLIDES = [
  "/demo/cold-open",
  "/demo/vs-linkedin",
  "/demo/onboarding",
  "/demo/profile-reveal",
  "/demo/dashboard-tour",
  "/demo/match-engine",
  "/demo/rerank-cache",
  "/demo/three-modes",
  "/demo/squarespace",
  "/demo/affinity",
  "/demo/bridges",
  "/demo/handoff",
] as const;
```

---

## Slide 1 — Cold open: "Utah is making the future."

**Route:** `/demo/cold-open` · **Setup**

**Beat:** Earn the first three seconds. Pitch the *place*, not the product yet.

**On screen:**
- Full-bleed dark slide (`bg-warmgray-900 text-paper`).
- Centered headline, animated word-by-word fade-in: *"Utah is making the future."*
- Counter strip below ramps from 0 to its target value over ~1.5 s:
  - `247 deep-tech spinouts`
  - `$2.1B raised in 2025`
  - `3 universities, 1 ecosystem`
- Bottom-right corner: `<DelicateArch>` in royal-blue (`text-orange-500`), drawn in via SVG path animation.

**Narration (~15 s):**
> "Utah is producing more deep-tech spinouts per capita than any other state. U of U, BYU, Utah State — biotech, defense, AI, energy. The research is world-class."

**Build notes:** Numbers are static — synthetic but plausible. Word stagger via `framer-motion` `staggerChildren`. Counter is `requestAnimationFrame` ramp. **Zero data fetching.**

---

## Slide 2 — vs LinkedIn — *UX 1/4*

**Route:** `/demo/vs-linkedin` · **UX**

**Beat:** The bounty asks *"does it feel meaningfully better than LinkedIn or job boards?"* Answer it head-on.

**On screen:**
- Split screen, 50/50.
- **Left half (greyscale, dim):** Static SVG mock of a LinkedIn search result. Blue cards in a list, headline *"VP of Sales · Utah · Remote · 5,400 results."* Pull-quote callout: *"Why was I shown this match? No reason given."*
- **Right half (full color):** A static, hardcoded match card replicating the real `<MatchCard>` visual (do **not** import the production component — that pulls types from `lib/data`). Sarah → Bramble AI. Score 78% in mono. Reason paragraph quoted in full. Five factor chips. Royal-blue Concerns block.
- Top center headline: *"Same person. Different platform."*
- Bottom: comparison strip (real `<table>` with mono header, per `app/CLAUDE.md`):

| | LinkedIn | Connections Hub |
|---|---|---|
| Tells you *why* | ✗ | ✓ |
| Surfaces concerns | ✗ | ✓ |
| Knows about Utah | ✗ | ✓ |
| Routes to mentors when imperfect | ✗ | ✓ |

**Narration (~25 s):**
> "Every existing platform sells you a list of names with a relevance score and a 'connect' button. We tell you *why* this person matches, *what's weak* about the match, and we route you to a Utah mentor or program that can close the gap. That's the difference."

**Build notes:** Static JSX — no `<MatchCard>` import, no `lib/data` types. Hand-rolled markup styled to look identical to production.

---

## Slide 3 — Onboarding: four lanes, one form — *UX 2/4*

**Route:** `/demo/onboarding` · **UX**

**Beat:** Show the user experience of signing up. Four kinds, structured-extraction magic, including the new auto-fill-from-URL beat.

**On screen, sequenced:**

1. **(0.0 s)** A 2×2 grid of four kind cards animates in: **Candidate** (Briefcase), **Business** (Building2), **Mentor** (Compass), **Investor** (Coins). Royal-blue hover state on each.
2. **(1.5 s)** A cursor moves across the grid and "clicks" Business. The grid fades, replaced by the Business onboarding form.
3. **(2.5 s)** The cursor lands in the **website URL** field. A Utah company URL types out: `lumenbio.utah.edu`. A small mono badge appears: `Fetching public information…`
4. **(4.5 s)** The form populates field-by-field with stagger:
   - `name`: Lumen Bio
   - `oneLiner`: Light-activated cancer therapeutics
   - `description`: 3-paragraph bio
   - `sector`: Life Sciences
   - `origin`: U of U Spinout
   - `stage`: Seed
   - `needs`: CEO, FDA mentor
   - `utahOrgs`: PIVOT Center, University of Utah
5. **(7.0 s)** A second cursor — different color — appears and clicks the **Candidate** lane in a smaller corner overlay. The Candidate form streams in below with Sarah's bio + looking-for typed character-by-character via the same animation primitive (mimicking `<DemoFiller>`).
6. **(10.0 s)** Both forms sit side by side. Tiny mono badge underneath each: `gpt-5.3-nano · 1.4s · structured-output`.

**Narration (~30 s):**
> "Four lanes — Candidate, Business, Mentor, VC. Same engine, kind-aware fields. For a business, paste your URL and we extract the structured profile from your public site. For a candidate, you type two paragraphs — who you are, what you're looking for — and the model extracts skills, availability, comp, stage, even Utah org affiliations. We don't make anyone fill a 40-field form."

**Build notes:** Pure animation — no actual fetch, no actual extraction. The "URL fetch" badge is staged. Use the same character-by-character typing primitive as `<DemoFiller>` but **inline it** so this slide has zero dependency on `lib/data` or any backend route. **Zero data fetching.**

---

## Slide 4 — The structured profile (the trust artifact) — *UX 3/4*

**Route:** `/demo/profile-reveal` · **UX**

**Beat:** "From three text inputs we now have a complete, trust-worthy structured profile."

**On screen:**
- Centered profile card, hand-rolled to mirror the real `/profile/candidate/[id]` page visual.
- 72px Avatar with initials (royal-blue wash via the `orange-100` token), Sarah's name in `font-serif text-3xl font-bold`, headline, social-link icon row (lucide `Linkedin`, `Twitter`, `Mail`).
- **Royal-blue-tinted "What I'm looking for" panel** (`bg-orange-50 border border-orange-200 rounded-lg p-5`) with the looking-for paragraph. This is the trust differentiator — every other talent platform buries intent in a search filter.
- Skill pills (`<Pill tone="orange">`), Utah affiliation pills (`<Pill tone="warmgray">`).
- Below, three callouts pulse in sequence with captions:
  - *"Looking-for is a first-class field, not a filter."*
  - *"Utah affiliations the system can read — Qualtrics Alumni, Silicon Slopes."*
  - *"Same shape for Business, Mentor, and Investor profiles. Different fields, same trust surface."*

**Narration (~25 s):**
> "From two text paragraphs we now have a fully structured profile. The blue panel — *what Sarah is looking for* — is the most important field on the page. Most platforms bury intent in a search filter. We promote it because every match is explained against this exact text."

**Build notes:** Hand-rolled JSX. No `Avatar` import from production (would pull supabase types). No real photo URL — use `/icon.webp` or a baked-in PNG in `/public/demo/`.

---

## Slide 5 — Dashboard tour (the rubric slide) — *UX 4/4*

**Route:** `/demo/dashboard-tour` · **UX**

**Beat:** Show the dashboard *as a still frame*, with annotations. The interactive version is in Phase 2.

**On screen:**
- Static screenshot-style render of the real `/dashboard` (hand-rolled, not imported). Eyebrow + "Sarah's matches" headline + search bar + three stacked match cards.
- Animated highlights cycle through the page's trust surfaces. Each highlight pops a caption beside it:
  1. **Score pill** → *"Calibrated to be honest. Most matches are 65–85%."*
  2. **Reason paragraph** → *"Quotes your actual query. No black-box ranking."*
  3. **Five factor chips** (Stage / Skills / Wants / Networks / Comp) → *"Per-dimension verdicts."*
  4. **Concerns block** in royal-blue → *"Surfaced, not hidden."*
  5. **Bridges drawer trigger** on the partial-match card → *"3 Utah resources can close this gap →"*
- Bottom band: a quiet diagnostics strip (mono, `text-warmgray-500`): `pipeline.timing.ms = 142 · cache.hit = true · matches.shown = 12`.

**Narration (~25 s):**
> "Every card on the dashboard carries the score, the reason, the per-dimension chips, and a concerns block. Concerns are first-class — we flag weak matches instead of selling them as perfect. And on partial matches, an inline drawer routes you to Utah resources that close the gap. We'll see it live in a minute."

**Build notes:** Hand-rolled annotated still. Highlights via `framer-motion` rect with animated `opacity` + `boxShadow`. Caption boxes spring in with a 200 ms delay each.

---

## Slide 6 — The match engine — *Match Quality 1/3*

**Route:** `/demo/match-engine` · **Match Quality**

**Beat:** The single most important slide. Show the AI matching in motion.

**On screen, sequenced. The centerpiece animation.**

1. **(0.0 s)** Two profile cards slide in from opposite sides.
   - **Left:** Sarah Chen (Candidate).
   - **Right:** Lumen Bio (Business).
2. **(1.5 s)** From each card, two arrows fan toward the center:
   - From Sarah: **`embedding`** ("who I am", neutral) and **`embedding_wants`** ("who I'm looking for", royal-blue).
   - From Lumen: **`embedding`** (royal-blue) and **`embedding_wants`** (neutral).
3. **(3.0 s)** Arrows converge into a stylized 2D vector space — four dots collapse together as cosine similarity is computed. Below, a formula prints out in mono:

   `score = MIN(cos(her→them), cos(them→her)) = 0.78`

4. **(4.5 s)** A "hard filter" gate flashes: `availability ✓ · stage ✓ · comp ✓`. Then a "vector top-K" stage: `top-20 candidates`.
5. **(5.5 s)** "LLM rerank" stage. Three-dot pulse in royal-blue. Mono caption: `gpt-5.5-instant · rerank + explain`.
6. **(7.5 s)** A match card materializes between Sarah and Lumen Bio:
   - Score: **78%**
   - Verdict: **Good match**
   - Reason paragraph types in:
     > *"Sarah's enterprise GTM experience at Qualtrics directly addresses Lumen Bio's biggest commercial gap. Her fractional availability and equity-comfort match Lumen's seed-stage budget. Both are anchored in the Utah ecosystem — Silicon Slopes and PIVOT Center share several mentors."*
   - Five factor chips: `Stage strong · Skills ok · Wants strong · Networks strong · Comp ok`.
   - **Concerns** block (royal-blue tint): *"Sarah has no FDA / regulatory background. Lumen Bio is a clinical-stage therapeutic — this gap matters for any CEO conversation."*
7. **(10.5 s)** A `✓ Match` stamp lands with a soft scale-bounce.

**Narration (~40 s):**
> "Here's the engine. Both sides have *two* embeddings — who they are, and who they're looking for. Match score is the *minimum* of both directions, which penalizes lopsided pairs where one side is excited and the other isn't. We pre-filter on hard gates — availability, stage, compensation — pull the top-20 nearest neighbors with pgvector, then rerank with a more capable model that writes the reason paragraph and rates each dimension. Look at the Concerns block: Sarah doesn't have FDA experience. We tell you that *up front* instead of letting you find out on a call."

**Build notes:** Most expensive slide to build. Worth it. If `framer-motion` gets fiddly, bake it as a 12-second MP4 in `/public/demo/match-engine.mp4` and play with controls hidden. **No imports from `lib/match` or any production code.**

---

## Slide 7 — Rerank, cache, and the cost story — *Match Quality 2/3*

**Route:** `/demo/rerank-cache` · **Match Quality**

**Beat:** The engine animation showed *what* happens. This slide shows *why it's cheap and fast*.

**On screen:**
- Two-column diagram.
- **Left column — The pipeline:**
  ```
  query
    ↓ embed (1×)
    ↓ ANN top-20 (vector index)
    ↓ hard-filter gate
    ↓ LLM rerank + explain (1× per pair, cached)
    ↓ MIN-bound bidirectional score
    ↓ ranked list
  ```
  Each step animates in with a small mono cost annotation:
  - `embed: $0.00002 / query`
  - `ANN: 0 LLM tokens`
  - `rerank: $0.0008 / pair, cached on content hash`
- **Right column — The cache:**
  - Animated cache key forming on screen: `subject:candidate:tal-sarah-chen:business:k=20`
  - Below it, two fingerprint values: `viewerHash: 8f3a…` and `poolRevision: 142`.
  - Caption: *"Cosmetic edits — photo, socials — don't bust the cache. Bio, looking-for, skills do. Pay OpenAI once per pair, not once per page load."*

**Narration (~25 s):**
> "Embed once, fan out cheaply with the vector index, and only pay the more expensive rerank model on the top 20. Then cache the rerank with a content-hash fingerprint — viewer's bio plus the pool revision — so we pay OpenAI once per pair, not once per page load. Cosmetic edits like a new avatar don't invalidate; meaningful edits to bio or looking-for do. This is what makes the per-user cost defensible at scale."

**Build notes:** Pure typography + simple `framer-motion` arrow draws. **No imports.**

---

## Slide 8 — One engine, three modes — *Match Quality 3/3*

**Route:** `/demo/three-modes` · **Match Quality**

**Beat:** Show the engine generalizes — same pipeline, three different gates.

**On screen:**
- Three vertical lanes side by side.
- **Subject mode (Candidate → Business):** small icon row of a person → arrow → company. Caption: *"Hard filters: availability, stage, comp."*
- **Peer mode (Candidate ↔ Candidate):** two people. Caption: *"Relaxed gates. Semantic + Utah proximity drives ranking."*
- **Query mode (free-text → either pool):** a search box. Caption: *"Embed the query. Pull nearest neighbors. Rerank with phrases from your search quoted back."*
- Below all three, a single shared row labelled **Same engine:** with the pipeline stages from Slide 7 spanning all three lanes.
- Animated arrows show that all three modes converge to the same `embed → ANN → rerank → MIN-bound` flow with only the stage-1 hard filters differing.

**Narration (~20 s):**
> "Three modes, one engine. Subject mode is the original: candidate-to-business, with hard filters for availability and stage. Peer mode is for meeting people — same engine, gates relaxed, semantic plus Utah proximity drives it. Query mode is natural-language search across either pool. Different gates, same pipeline."

**Build notes:** Three-column flex layout. Static after initial stagger-in. **No imports.**

---

## Slide 9 — Squarespace inbound — *Integration 1/2*

**Route:** `/demo/squarespace` · **Integration**

**Beat:** Show how the existing Nucleus stack feeds into the new platform.

**On screen, animated wire diagram:**

- Three columns left-to-right.
  - **Left:** Squarespace logo + screenshot-style mockup of the existing Nucleus form with fields *"Your name / Your email / Tell us about yourself / What are you looking for?"*. Caption: *"What Nucleus already has."*
  - **Middle:** Connections Hub wordmark with `<DelicateArch>`.
  - **Right:** A dashboard tile showing a freshly-created Candidate profile.
- Animated arrow flows left → middle: a JSON payload object `{ name, email, bio, lookingFor }` floats across, and when it lands the same auto-extraction animation from Slide 3 plays — fields populate.
- Then arrow flows middle → right: the structured profile materializes as a dashboard row.
- Bottom caption strip:
  - **Webhook:** `POST /api/integrations/squarespace/webhook` — header-secret-validated.
  - **Pipeline:** webhook → `extractCandidate` → `embed` → `profileStore.put` → email user a sign-in link.
  - **Zero migration:** the existing Squarespace form keeps working. Nucleus stops doing manual matchmaking; the platform takes over.

**Narration (~25 s):**
> "The Squarespace form Nucleus already runs keeps working — but instead of dumping rows into a spreadsheet, it posts to our webhook, which runs the extraction pipeline, embeds the result, stores the profile, and emails the submitter a sign-in link. Drop-in. No migration. The Nucleus team stops doing manual matchmaking."

**Build notes:** All static + animated SVG arrows. Logos as static images in `/public/demo/`. **No imports.**

---

## Slide 10 — Affinity outbound — *Integration 2/2*

**Route:** `/demo/affinity` · **Integration**

**Beat:** Close the loop. Mutual matches push into Nucleus's existing CRM.

**On screen:**
- Mirror the Slide 9 layout but with arrows pointing outward.
- **Left:** a "Mutual interest" event card showing Sarah ↔ Bramble AI with timestamps.
- **Middle:** Connections Hub wordmark.
- **Right:** Affinity logo + a screenshot-style mock of an Affinity record showing a `Person`, a `List entry` ("Nucleus Connections Mutual Match"), and a `Note` whose body is the LLM's reason paragraph.
- Animated arrow flows left → middle → right: a payload object `{ organization, person, listEntry, note: { body: <reason> } }` floats across.
- Bottom strip walks through the API calls in order:
  ```
  affinityClient.upsertOrganization(business)   ✓
  affinityClient.upsertPerson(candidate)        ✓
  affinityClient.addToList(personId, listId)    ✓
  affinityClient.setFieldValues({ stage, score, reasonHash })  ✓
  ```
  Each line ticks green with a 200 ms delay.
- Footer caption: *"Currently mock transport (no sandbox creds). One env-var flip — `AFFINITY_LIVE=true` — points the same code at `api.affinity.co`."*

**Narration (~25 s):**
> "Every mutual match becomes an Affinity organization, person, list entry, and note. The note body is the same reason paragraph the user saw — so when a Nucleus operator opens the Affinity record, they see exactly why we matched these two. The integration is wired end-to-end. Today it runs against a mock transport because we don't have sandbox credentials yet; one env-var flip points it at the real Affinity API. Same code, same payload."

**Build notes:** This is a *promise that we kept* — the production code at `app/src/lib/affinity/` is wired e2e (mock transport in `mock-client.ts`, real client scaffolded in `real-client.ts`). The slide is a frontend illustration, **but** Phase 2 (Live 5) will show the actual production payload viewer.

---

## Slide 11 — Bridges over gaps — *Innovation 1/1*

**Route:** `/demo/bridges` · **Innovation**

**Beat:** The differentiator from `winning.md`. Turn the "most matches aren't perfect" reality into the killer feature.

**On screen, sequenced:**

1. The Sarah → Lumen Bio match card from Slide 6 reappears, centered.
2. The **Concerns** block (FDA gap) pulses softly.
3. A new royal-blue pill appears below the card: **"3 Utah resources can close this gap →"**
4. The pill expands into a drawer with three resource cards:
   - **PIVOT Center FDA mentor program** *(mentor)* — *"Curated FDA-experienced mentors at U of U's tech transfer office; first call is free for licensed-spinout CEOs."*
   - **BioHive accelerator — Regulatory cohort** *(program)* — *"12-week cohort focused on FDA pathway navigation for Utah life-sciences startups."*
   - **"FDA pathway for Utah biotech" playbook** *(playbook)* — *"45-page guide built from interviews with 8 Utah biotech founders who've cleared 510(k) and PMA."*
5. Each card has a small `📍 Utah` chip. A connecting line draws from the Concerns block down to the resources, visually completing the bridge metaphor.

**Narration (~30 s):**
> "Here's the differentiator. Most platforms hand you a 78% match and walk away. We tell you what's missing — Sarah doesn't have FDA experience — and we route you to three Utah-specific resources that can close the gap. PIVOT Center mentor program. BioHive accelerator. A playbook by Utah founders who've cleared the FDA. *Every other platform sells you a perfect match. We tell you what's missing and hand you the bridge.* That's the answer to 'how is this Utah-specific?' — Utah's value isn't a graph database; it's the network of people, programs, and capital that already exists here. We're the routing layer for that network."

**Build notes:** Hand-rolled — do not import the production `<GapCloser>` (it pulls types from `lib/data`). **No imports.** Live 3 will show the real `<GapCloser>` in action; this slide is the pitch.

---

## Slide 12 — The handoff: "Now let's actually use it." — *Transition*

**Route:** `/demo/handoff` · **Transition**

**Beat:** Stop selling. Start using.

**On screen:**
- Dark slide (`bg-warmgray-900 text-paper`) — bookends Slide 1.
- Centered headline: *"Slides are easy. Software is real."*
- Below: *"Let's open the product as Sarah and run her search live."*
- Single CTA button in royal-blue (`bg-orange-500`): **"Open the product →"** that hits **`/api/demo/start?as=tal-sarah-chen`** (the real route — this is the only slide that talks to the backend, and only to set the demo cookie).
- Tiny footer: `Live demo · running on the actual production build · everything from here is real`.

**Narration (~10 s):**
> "Slides are easy. Software is real. Let's open the product as Sarah and run her search live."

**Build notes:** The CTA is a real `<form action="/api/demo/start" method="POST">` (or anchor with `?as=`) that sets the demo cookie via `lib/demo/cookie.ts` and 302s to `/dashboard`. Pre-warm Sarah's match cache before stage time so the dashboard renders instantly.

---

# Phase 2 — Live product

The narrator stops talking *about* the product and starts *using* it. Everything from here is the real app — real components, real engine, real frontend↔backend communication. In demo mode this hits `MockDataStore`; in live mode it hits Supabase. Same UI, same routes.

## Live header — `⎋ Finish demo` icon

Throughout Phase 2, the app header gets one extra affordance: a small **`⎋ Finish demo`** icon in the top-right, just left of the notification bell. Single-icon button (lucide `LogOut` or `DoorOpen`), `text-warmgray-500` until hover, `text-orange-500` (royal-blue) on hover, tooltip *"Wrap up & show closing slide"*.

Clicking it routes to **`/demo/closing`** — the post-demo slide that covers lessons learned and future direction (Slide 13). Two purposes:
1. **Emergency hatch** — *"we're running out of time, let me jump to the close."*
2. **Graceful ending** — *"…and that's the live product. Let's wrap."* — without fumbling at the URL bar on stage.

**Visibility rule:** render only when `getAppMode() === 'demo'`. Production users on `live` mode never see it.

**Build notes:** Add to the existing `<AppHeader>` component (where `<NotificationBell>` already lives — see `app/CLAUDE.md`). Single `<Link href="/demo/closing">` with an inline lucide icon. Keyboard shortcut: `cmd+.` listener mounted in `<AppShell>`. ~15 minutes.

---

## Live 1 — Dashboard (`/dashboard`)

**Beat:** Sarah just signed in. Show her the matches dashboard immediately.

**Demo path:**
1. The page renders Sarah's three top matches (cached, instant).
2. Highlight the search bar at the top of the page — *"this is where every interaction starts."*
3. Click into the search bar.

**Narration (~15 s):**
> "I'm Sarah. I just signed in. Three matches, ranked, with reasons. But the most-used surface here is search — let me show you."

---

## Live 2 — Search (`/search?q=life-sciences+CEO+with+FDA+experience`)

**Beat:** The 40% UX criterion lives here.

**Demo path:**
1. Type or paste the query: **"life-sciences CEO with FDA experience"**.
2. Cards populate. Top result: Lumen Bio at 78%. The reason paragraph quotes the search phrase literally.
3. Toggle the kind filter: People → Businesses. Same query, different pool.
4. Point at the mono pipeline timing in the diagnostics block — *"this is real instrumentation."*
5. Click the **Bridges** drawer on the partial-match card. The real `<GapCloser>` opens with three Utah resources for the FDA gap.
6. Switch to **Mentors** — show that the same search engine works across all four kinds.

**Narration (~50 s):**
> *(Typing)* "Natural-language search. The query is embedded, nearest-neighbors are pulled, the LLM rewrites a reason that quotes my actual search."
> *(Pointing at Concerns)* "Concerns are first-class. The system flags weak matches instead of selling them as perfect."
> *(Expanding bridges)* "And here's the differentiator — when there's a gap, we route to Utah resources. PIVOT Center, BioHive, a founder-written playbook."
> *(Switching kinds)* "Same engine across all four kinds. Candidate, Business, Mentor, Investor."

**Build notes:** Real production page. Pre-warm the cache for this exact query.

---

## Live 3 — Match detail + handshake (`/profile/business/sup-bramble` → `/handshake?with=sup-bramble`)

**Beat:** Trust gate. Dual opt-in.

**Demo path:**
1. From the dashboard or search, open Bramble AI's profile. Show the full profile with structured fields.
2. Click "I'm interested →" on the match card. Handshake page loads.
3. The other side (Bramble) is already at "interested" (pre-seeded). Sarah's flip causes mutual.
4. Center card animates: "Waiting for both sides" → "🤝 Mutual interest at <timestamp>".
5. Header bell lights up `1`. Click it: *"Mutual match with Bramble AI. Time to talk."*
6. Click "View Affinity payload →".

**Narration (~25 s):**
> "Dual opt-in. We don't share contact info until both sides flip to interested — that's the trust gate. The notification bell tracks per-viewer. And right now, we just queued an Affinity push."

---

## Live 4 — Affinity payload (`/affinity-push`)

**Beat:** Close the integration loop with concrete evidence.

**Demo path:**
1. The Sarah ↔ Bramble payload from Live 3 sits at the top — fresh.
2. Expand the payload card. Show the JSON request body: organization upsert, person upsert, list entry, note with the LLM reason as the body, `setFieldValues` with stage/score/reason hash.
3. Mention the line at the top: `transport: mock` — *"and one env-var flip points this at `api.affinity.co`."*

**Narration (~20 s):**
> "Every mutual match becomes an Affinity organization, person, list entry, and note. The note body is the reason Sarah saw. Today the transport is mock — we don't have sandbox credentials yet — but the pipeline is wired end-to-end. One env-var flip activates the real API path."

**Build notes:** This is the production `/affinity-push` page. Add a recorded screencast (Loom, MP4 in `/public/demo/affinity-live.mp4`) on the page footer for any technical-judging conversation about the live path.

---

## Live 5 — (optional) The four-kind tour

If time permits, switch personas mid-demo via the demo persona dropdown to show the same product from different angles:

- **Marcus Okafor** (Candidate, life-sciences operator) → his top match is Lumen Bio.
- **A Business viewer** (Bramble AI as the org) → his top candidate matches.
- **A Mentor viewer** → matches biased toward founders requesting advisory.
- **An Investor viewer** → matches biased toward funding-stage fit.

Skip if running tight. Save for Q&A.

---

## Live 6 — Wrap via `⎋ Finish demo`

Click the **`⎋ Finish demo`** icon in the header. Routes to `/demo/closing`.

**Narration (~5 s):**
> "Let me wrap."

---

# Slide 13 — Closing: lessons learned & what's next

**Route:** `/demo/closing`

**Beat:** Land the plane. Show humility (what was hard, what we'd do differently) and ambition (where this goes). Reached via the **`⎋ Finish demo`** icon in the live header.

**On screen:** Editorial slide on `bg-paper`. Two-column layout. Left half is a quiet, scannable bullet list; right half is a forward-looking roadmap.

### Left column — Lessons learned

Three bullets — judges hate filler.

- **The "perfect match" theater hurts users.** First instinct was to inflate scores so every match looked great. We pulled back, calibrated 65–85% as the honest middle, and built the gap-closer as the answer. Score honesty isn't a UX problem; it's the differentiator.
- **Mock-first architecture is a force multiplier.** Two strategy boundaries (frontend↔API, API↔data layer), both backed by Mock + Supabase implementations. Three of us shipped in parallel from day one; the demo never goes dark; the live path can be wired piece by piece. We'd do this again on every project.
- **Embeddings need *intent*, not just biography.** A single "who I am" embedding produces lopsided matches. Splitting into `embedding` + `embedding_wants` and taking the MIN of both directions was the single biggest quality gain — it penalizes pairs where one side is excited and the other isn't.
- **Utah-specific isn't a graph; it's a routing layer.** We started building a Utah-org graph database. Killed it. The actual Utah differentiator is the *people, programs, and capital that already exist here*. We pivoted to a routing layer for that network.

### Right column — Future direction

Roadmap with three horizontal bands.

**Near term — next 30 days:**
- Live `pgvector` query path (currently mock-first; SQL is scoped in `blockers/pgvector-live-sql.md`)
- Real Affinity API with Nucleus credentials, replacing the sandbox screencast
- Squarespace inbound webhook hardened + a dedicated review URL for submitters to correct extraction
- Resources catalog grown to 50+ curated Utah-tied entries

**Mid term — next 6 months:**
- **Talent upskilling recommendations** — the bounty's optional high-value feature. *"You're 80% fit — here are 3 courses, 2 mentors, and 1 program that close the gap."* `recommendGapResources` already does the routing; surface it on the candidate dashboard.
- **Operator analytics for Nucleus** — dashboard for the Nucleus team showing match throughput, mutual conversion, common gap categories, hot sectors. Drives Nucleus's own decisions about where to invest mentor time.
- **Squarespace embed widget** — drop-in `<script>` Nucleus pastes onto their site that surfaces matches inline, no full-page redirect.

**Long term — the bigger bet:**
- **Cross-state expansion** — replicate the Utah pattern for Boise, Boulder, Phoenix, Austin. Same engine, regional resources catalog. Architecture is ready; the work is catalog curation.
- **Outcome-tracked matching** — log mutual matches, follow up at 30/90/180 days, feed real outcomes back into the rerank prompt. The platform learns from what actually worked, not just what users clicked.
- **Founder-introducer flywheel** — when a Utah founder makes 3+ successful intros via the platform, they become a recognized "ecosystem connector" with a public profile. Nucleus gains a public-facing map of who actually moves the ecosystem.

### Footer — thanks

Quiet single-line footer with team names and a GitHub link, then a single CTA: **"Open on GitHub →"**.

**Narration (~45 s):**
> "Three things we learned. The 'perfect match' theater hurts users — we calibrated honestly and made the gap a feature, not a flaw. Mock-first architecture let three of us ship in parallel from day one and meant our demo can't go dark. And Utah's value isn't a graph — it's a routing layer for the people and programs already here.
>
> Where this goes: short term, we wire the live pgvector pipeline and the real Affinity API. Medium term, upskilling recommendations and a Squarespace embed widget so the product lives inside the Nucleus site. Long term, we expand to other innovation regions and track outcomes so the matching learns from what actually worked.
>
> Thank you. Happy to dive into the architecture, the engine, or anything you saw."

**Build notes:** New page at `app/src/app/demo/closing/page.tsx`. Pure UI, no fetch. **No imports from `lib/data`.**

---

# Build punch-list

Ranked by impact-per-hour. Slideshow pages first (12 of them), then live-product changes.

| # | What | Where | Effort | Notes |
|---|---|---|---|---|
| 1 | Slideshow shell + keyboard nav | `app/src/app/demo/layout.tsx` | M | Listen for `→` `←` `space`. Top progress bar. Hide `<AppShell>`. |
| 2 | `SHOW_SLIDES` registry | `app/src/lib/demo/show-slides.ts` | XS | Array of paths. New file, parallel to retired `slides.ts`. |
| 3 | **Slide 6 — match-engine animation** | `app/src/app/demo/match-engine/page.tsx` | L | The centerpiece. Acceptable to bake as MP4 if framer-motion gets fiddly. |
| 4 | **Slide 3 — onboarding (4 lanes + URL auto-fill)** | `app/src/app/demo/onboarding/page.tsx` | L | Two synchronized form animations. Inline typing primitive — don't import `<DemoFiller>`. |
| 5 | Slide 11 — bridges drawer | `app/src/app/demo/bridges/page.tsx` | M | Hand-rolled `<GapCloser>` look-alike. |
| 6 | Slide 9 — Squarespace wire diagram | `app/src/app/demo/squarespace/page.tsx` | M | SVG arrows + floating JSON. |
| 7 | Slide 10 — Affinity wire diagram | `app/src/app/demo/affinity/page.tsx` | M | Mirror of Slide 9. |
| 8 | Slide 5 — dashboard tour annotated still | `app/src/app/demo/dashboard-tour/page.tsx` | M | Hand-rolled dashboard mock + cycling highlights. |
| 9 | Slide 4 — profile reveal | `app/src/app/demo/profile-reveal/page.tsx` | S | Hand-rolled profile card. |
| 10 | Slide 2 — vs LinkedIn | `app/src/app/demo/vs-linkedin/page.tsx` | S | Static SVG mock + comparison table. |
| 11 | Slide 7 — rerank/cache diagram | `app/src/app/demo/rerank-cache/page.tsx` | S | Typography + arrow draws. |
| 12 | Slide 8 — three modes | `app/src/app/demo/three-modes/page.tsx` | S | Three-column flex layout. |
| 13 | Slide 1 — cold open | `app/src/app/demo/cold-open/page.tsx` | S | Word-stagger + counter ramp + DelicateArch path animation. |
| 14 | Slide 12 — handoff | `app/src/app/demo/handoff/page.tsx` | XS | Dark bookend + form POST to `/api/demo/start?as=tal-sarah-chen`. |
| 15 | **Slide 13 — closing** | `app/src/app/demo/closing/page.tsx` | S | Two-column lessons + roadmap. |
| 16 | `⎋ Finish demo` icon in `<AppHeader>` | existing component | XS | Gated on `getAppMode() === 'demo'`. `cmd+.` shortcut in `<AppShell>`. |
| 17 | Retire old demo deck | delete `lib/demo/slides.ts`, `<DemoDeckHeader>` | XS | Confirm no orphan imports remain. |
| 18 | Pre-warm match cache for demo personas | `app/scripts/prewarm-cache.ts` | S | Sarah, Marcus, plus a Business viewer. |
| 19 | Backup video of Live 1–4 | Loom | S | Fallback if anything misbehaves on stage. |
| 20 | Vercel deploy + judge URL | infra | S | Demo mode by default; live behind a sign-in wall. |

Effort: XS = <1 h, S = 1–3 h, M = 3–6 h, L = 6 h+.

**Slideshow rule:** every page under `app/src/app/demo/*` (except `handoff` and `closing`) must have **zero** imports from `@/lib/data`, `@/lib/supabase`, or any `app/api/*` route. They're pure UI. Enforce with a quick lint or just code review.

---

# Pre-demo checklist (the morning of)

- [ ] Pre-warm match cache for the demo personas
- [ ] Verify `/demo/cold-open` through `/demo/handoff` advance cleanly with `→`
- [ ] Verify Slide 12's "Open the product →" hits `/api/demo/start?as=tal-sarah-chen` and lands on `/dashboard` with Sarah's matches rendered in <1 s
- [ ] Verify Live 2 search query renders cards instantly (cache hot)
- [ ] Verify Live 3 "I'm interested" flow fires the bell + queues an Affinity push
- [ ] Confirm avatars/photos are baked into `/public/demo/` (no venue-WiFi dependency for `pravatar.cc`)
- [ ] Have backup video queued in a tab as fallback
- [ ] Have a second laptop ready
- [ ] Affinity sandbox screencast embedded in `/affinity-push` footer (or just a static screenshot if no screencast)
- [ ] Verify `⎋ Finish demo` header icon is visible in demo mode and routes to `/demo/closing`
- [ ] Verify `cmd+.` keyboard shortcut from any live page jumps to closing slide
- [ ] Old `<DemoDeckHeader>` removed from production routes — no orphan UI on `/dashboard`

---

# Why this wins

| Criterion | What earns the points |
|---|---|
| **UX (40%)** | Slides 2–5 (vs LinkedIn, four-lane onboarding with URL auto-fill, structured profile, annotated dashboard) make the UX *visible*; Live 1–3 (real dashboard, real search, real handshake with bell) prove it works. The polish-to-substance ratio is the highest in the deck. |
| **Match Quality (30%)** | Slide 6 (the engine animation — bidirectional embeddings, MIN-bound, hard filters, vector top-K, LLM rerank). Slide 7 (the cost story — content-hash cache, `viewerHash` + `poolRevision` invalidation). Slide 8 (three modes from one engine). Live 2 proves the calibrated scoring is real. |
| **Integration (20%)** | Slide 9 (Squarespace inbound — webhook + extraction). Slide 10 (Affinity outbound — production code path with mock transport, real client scaffolded). Live 4 shows the actual production payload viewer. The integration is *demonstrably wired*, not promised. |
| **Innovation (10%)** | Slide 11 (the Utah-resources reframe — turn weak matches into routed bridges, the differentiator nobody else will bring). Backed by the real `<GapCloser>` in Live 2. |

The combined effect: judges see a polished pitch with real animations, then watch the product *actually do the thing the pitch promised*. That gap — between slideware and software — is where most hackathon entries lose. We close it on purpose.
