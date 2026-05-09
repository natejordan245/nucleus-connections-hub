# Demo Flow — the 5-slide deck

The hackathon demo runs in **two phases**:

1. **Story slideshow** — ~2 minutes, 5 slides at `/demo/*`. Slides 1–4 are pure UI driven by static fixtures: they import production components but never the data store, never `/api/*`. Slide 5 is the only one that talks to the backend, and only to set the demo cookie before redirecting to `/dashboard`.
2. **Live product** — the real app in demo mode. `MockDataStore` answers in-process, frontend↔backend traffic is real, judges click through the actual flow. Reached via Slide 5's "Open the product" CTA.

The boundary is on purpose: the slideshow can't go dark on stage because it doesn't touch a data layer. The live product proves the pitch is real.

Total runtime: ~5 minutes. Slideshow ~2 min, live demo ~3 min, closing ~30 s reached via the `Finish demo` icon in the header.

## Why real components on slides

Every slide except the bookends renders the same components judges see in the live product. Same `<MatchCard>`, same `<GapCloserView>`, same `<CandidateProfileCard>`, same `<AffinityPushCard>`. Two benefits:

- **Zero visual drift.** The pitch and the proof look identical. There's no "the slide showed something prettier than the actual app" gap.
- **The components carry the explanation.** Score, reason, factor chips, concerns, bridges all live on the cards already. We don't need to reinvent the trust surfaces in slide form.

The slideshow imports from `lib/demo/show-fixtures.ts` — hardcoded `CandidateDTO`, `BusinessDTO`, `MatchDTO`, `ResourceDTO`, `AffinityPushDTO` for the canonical Zac Hales ↔ Plaibook pair (a former Qualtrics VP of Sales advising a BYU-alum vertical-SaaS startup). The exported variable names are still `SARAH` / `LUMEN` / `SARAH_LUMEN_*` for historical reasons — they're internal symbols, not user-facing.

## Rubric coverage

| Criterion | Weight | Slide | Live demo |
|---|---|---|---|
| User Experience | 40% | Slide 2 (profile) | Live 1–3 (dashboard, search, handshake) |
| Match Quality & Intelligence | 30% | Slide 3 (match card) | Live 2 (search ranking) |
| Integration | 20% | Slide 4 (Affinity push) | Live 4 (real Affinity payload viewer) |
| Innovation & Creativity | 10% | Slide 3 (gap-closer drawer) | Live 2 (bridges drawer in dashboard) |

Match Quality + Innovation share Slide 3 because they share a card in the live product — the gap-closer is part of the match surface, not a separate feature.

---

# Phase 1 — Story slideshow

5 routes. Keyboard nav (`→` / `←` / `space` / `esc`) wired in `app/src/components/demo/SlideShellNav.tsx`. Top progress bar in royal-blue. Bottom-center pill shows `←  →` keys. The `<AppShell>` chrome is hidden — slides are full-bleed.

## Slide 1 — `/demo/open` · *setup*

**Beat:** Earn the first three seconds. Frame the problem in eight words.

**On screen:**
- Full-bleed dark slide.
- Word-stagger headline: *"The research is here. The connections aren't."*
- Below: a counter that ramps `0 → 247` with the label *"Utah deep-tech spinouts looking for operators."*
- Bottom-right: `<DelicateArch>` icon in royal-blue + "Connections Hub" wordmark.

**Narration (~15 s):**
> "Utah is producing more deep-tech spinouts per capita than any other state. The research is world-class. But the operators, advisors, and capital that should follow it can't find it — and vice versa. The current Nucleus tool is a Squarespace form and a spreadsheet. We built the matching layer."

**File:** `app/src/app/demo/open/page.tsx`

---

## Slide 2 — `/demo/profile` · *UX*

**Beat:** Show a real candidate profile. Hand-rolled would feel like a mockup; the real component feels like a product.

**On screen:**
- Real `<CandidateProfileCard>` rendering Zac Hales from `show-fixtures.ts`.
- Aside slot holds a small royal-blue panel: *"Generated from 2 paragraphs"* with a one-line note crediting `gpt-5.3-nano`.
- All the other cards — About, Looking for, Categories, Skills, Domains, Compensation fit — render as production.

**Narration (~30 s):**
> "From two text paragraphs — who Zac is, and what he's looking for — the model extracts a complete structured profile. Skills, availability, comp, stage, domains, even his Utah org affiliations. We don't make him fill a 40-field form. The 'Looking for' card is the trust differentiator: every other talent platform buries intent in a search filter. We promote it because every match is explained against this exact text."

**Files:**
- `app/src/app/demo/profile/page.tsx` (slide page, ~30 lines)
- `app/src/components/CandidateProfileCard.tsx` (extracted from `/profile/candidate/[id]/page.tsx`)

---

## Slide 3 — `/demo/match` · *Match Quality + Innovation*

**Beat:** The whole match-quality + bridges story in one card.

**On screen:**
- Real `<MatchCard>` with `match={SARAH_LUMEN_MATCH}` and `candidate={{ kind: "business", business: LUMEN }}` (Zac ↔ Plaibook under the hood).
- Score 78%, full reason paragraph, 5 factor chips (Stage strong / Skills ok / Wants strong / Networks strong / Comp ok), concerns block ("no field-services / vertical-SaaS background"). The card now also surfaces a "BYU spinout" pill in the location row.
- Because the match is partial (< 0.85), the inline `<GapCloserView>` renders below the concerns block — passed via the new `gapCloser` prop on MatchCard so the slide doesn't need to fetch from the data store. Three Utah resources visible: Stoke Mountain vertical-SaaS GTM mentors, Silicon Slopes field-services GTM cohort, vertical-SaaS playbook.

**Narration (~45 s):**
> "Every match carries the same trust surface — score, reason, factor chips, concerns. Calibrated honestly: the model is told to land in the 65–85% range when the fit is real but imperfect, and we surface what's weak instead of inflating the number. The differentiator: when the score is partial, the gap-closer drawer routes Zac to three Utah-specific resources that close the distance. Stoke Mountain mentors, a Silicon Slopes field-services cohort, a founder-written vertical-SaaS playbook. Most platforms hand you a 78% and walk away. We tell you what's missing and hand you the bridge."

**Files:**
- `app/src/app/demo/match/page.tsx` (slide, ~30 lines)
- `app/src/components/MatchCard.tsx` (now accepts optional `gapCloser?: ReactNode` prop)
- `app/src/components/GapCloser.tsx` (split into `GapCloserView` presentational + `GapCloser` async wrapper)

---

## Slide 4 — `/demo/integration` · *Integration*

**Beat:** Show the production Affinity-push UI against a fixture mutual match.

**On screen:**
- Real `<AffinityConnectionPanel>` (sandbox-connected dot, sync counters: 1 / 0 / 0).
- One real `<AffinityPushCard>` for the Zac ↔ Plaibook mutual match: timestamp, sync pill, pipeline-stage pill, full reason paragraph, two-card grid showing the Affinity record (organization #80421, person #152904, list-entry #220887) and the structured field values (Stage / Match score / Reason hash / Source).
- Collapsible API timeline with 4 calls: `POST /v2/organizations` 200, `POST /v2/persons` 200, `POST /v2/lists/.../list-entries` 201, `PUT /v2/list-entries/.../field-values` 200.
- Footer pill: `transport: mock · flip AFFINITY_LIVE=true for api.affinity.co`.

**Narration (~30 s):**
> "Every mutual match becomes an Affinity organization, person, list entry, and note. The note body is the same reason paragraph the user saw — when a Nucleus operator opens the Affinity record they see exactly *why* we matched these two. The pipeline is wired end-to-end. Today the transport is mock because we don't have sandbox credentials yet; one env-var flip points the same code at `api.affinity.co`. Same payloads, same calls."

**Files:**
- `app/src/app/demo/integration/page.tsx` (slide, ~50 lines)
- `app/src/components/AffinityPushCard.tsx` (extracted from `/affinity-push/page.tsx`)

---

## Slide 5 — `/demo/handoff` · *transition*

**Beat:** Stop selling. Start using.

**On screen:**
- Dark bookend (`bg-warmgray-900`).
- Centered headline: *"Now let's use it."*
- Single CTA button in royal-blue: **"Open the product →"**.
- The CTA is a `<form action="/api/demo/start" method="POST">` — POSTing drops the demo cookies (`nch_app_mode=demo`, `nch_demo_user=tal-zac`, `nch_demo_active=1`) and 303s to `/dashboard`. **Only slide that talks to the backend.**

**Narration (~10 s):**
> "Now let's actually use it."

**File:** `app/src/app/demo/handoff/page.tsx`

---

# Phase 2 — Live product

The narrator stops talking *about* the product and starts *using* it. Demo mode means `MockDataStore` answers in-process, but every page does real frontend↔backend communication and renders production components — same code path the live build will use against Supabase.

The header gets a **`Finish demo`** affordance (a small pill-button left of Sign out) that routes to `/demo/closing` when the demo cookie is active. `cmd+.` works as a keyboard shortcut from any page.

## Live 1 — Dashboard (`/dashboard`)

The real dashboard with Zac's matches pre-warmed. Three top matches visible. Highlight the search bar.

> *(15 s)* "I'm Zac, just signed in. Three matches, ranked, with reasons. Search is where every interaction starts."

## Live 2 — Search (`/search?q=...`)

Type or paste *"vertical-SaaS GTM advisor for a seed-stage Utah startup"*. Cards populate; top result is Plaibook at 78% and the reason quotes the search phrase. Toggle People ↔ Businesses. Expand the bridges drawer on the partial match — the real `<GapCloser>` opens with three Utah resources for the field-services GTM gap.

> *(50 s)* Narration covers natural-language search → reasoning → calibrated scoring → bridges. The same talking points as Slide 3, but now it's live.

## Live 3 — Handshake (`/handshake?with=sup-plaibook`)

Click "I'm interested" on Plaibook. Counter-party interest is pre-seeded so it goes mutual. Header bell lights up; click it to see "Mutual match. Time to talk."

> *(25 s)* "Dual opt-in. Contact info isn't shared until both sides flip to interested. The bell tracks per-viewer."

## Live 4 — Affinity payload (`/affinity-push`)

Same UI as Slide 4 — but now the row at the top is the one we just generated. Expand the API timeline. Mention `transport: mock · flip AFFINITY_LIVE=true`.

> *(20 s)* "Every mutual match becomes a real Affinity push. Today against a mock transport; tomorrow against `api.affinity.co`."

## Live 5 — Wrap (`Finish demo` icon → `/demo/closing`)

> *(5 s)* "Let me wrap."

---

# Closing — `/demo/closing`

Reached via the `Finish demo` icon in the header. Two-column layout:

**Lessons learned (left):**
- The "perfect match" theater hurts users — calibrate honestly, make the gap a feature.
- Mock-first architecture is a force multiplier — three of us shipped in parallel from day one.
- Embeddings need *intent*, not just biography — bidirectional `embedding` + `embedding_wants` with MIN-bound scoring.
- Utah-specific isn't a graph; it's a routing layer.

**Roadmap (right), three horizons:**
- *Near term* — live `pgvector` query path, real Affinity API, hardened Squarespace webhook, 50+ Utah resources.
- *Mid term* — talent upskilling recommendations, operator analytics for Nucleus, Squarespace embed widget.
- *Long term* — cross-state expansion, outcome-tracked matching, founder-introducer flywheel.

Footer: GitHub CTA.

---

# What got built

| Path | Purpose |
|---|---|
| `app/src/app/demo/layout.tsx` | Slideshow shell — hides AppShell, mounts SlideShellNav. |
| `app/src/components/demo/SlideShellNav.tsx` | Top progress bar + bottom keyboard pill + `→` / `←` / `space` / `esc` listeners. |
| `app/src/components/demo/DemoExitButton.tsx` | "Finish demo" pill in `<AppShell>`, gated on the demo cookie, `cmd+.` shortcut. |
| `app/src/lib/demo/show-slides.ts` | The 5-slide registry. |
| `app/src/lib/demo/show-fixtures.ts` | Hardcoded DTOs (Zac Hales, Plaibook, match, gap text, resources, push). Internal symbols still named `SARAH` / `LUMEN` for historical reasons. |
| `app/src/app/demo/open/page.tsx` | Slide 1 — bottleneck. |
| `app/src/app/demo/profile/page.tsx` | Slide 2 — uses `<CandidateProfileCard>`. |
| `app/src/app/demo/match/page.tsx` | Slide 3 — uses `<MatchCard>` + `<GapCloserView>`. |
| `app/src/app/demo/integration/page.tsx` | Slide 4 — uses `<AffinityConnectionPanel>` + `<AffinityPushCard>`. |
| `app/src/app/demo/handoff/page.tsx` | Slide 5 — POSTs to `/api/demo/start`. |
| `app/src/app/demo/closing/page.tsx` | Lessons + roadmap. |
| `app/src/components/CandidateProfileCard.tsx` | Extracted from candidate profile page. |
| `app/src/components/AffinityPushCard.tsx` | Extracted from Affinity push page (also exports `<AffinityConnectionPanel>`). |
| `app/src/components/MatchCard.tsx` | Now accepts optional `gapCloser?: ReactNode`. |
| `app/src/components/GapCloser.tsx` | Split into `GapCloserView` (pure) + `GapCloser` (async). |
| `app/src/app/(app)/(needs-profile)/profile/candidate/[id]/page.tsx` | Now thin — delegates to `<CandidateProfileCard>`. |
| `app/src/app/(app)/(needs-profile)/affinity-push/page.tsx` | Now thin — delegates to `<AffinityConnectionPanel>` + `<AffinityPushCard>`. |
| `app/src/app/api/demo/start/route.ts` | Drops cookies and 303s to `/dashboard` (was: `SLIDES[0].path`). |
| `app/src/app/page.tsx` | Landing tile "demo" → `/demo/open`. |

# What got removed

- `app/src/lib/demo/slides.ts` — the legacy 7-step product walkthrough deck.
- `app/src/components/DemoDeckHeader.tsx` — the legacy deck top-bar.
- `app/src/components/demo/Typewriter.tsx` — typing primitive (no longer used now that onboarding/match-engine animations are gone).
- 11 retired slide pages: `cold-open`, `vs-linkedin`, `onboarding`, `profile-reveal`, `dashboard-tour`, `match-engine`, `rerank-cache`, `three-modes`, `squarespace`, `affinity`, `bridges`.

# Pre-demo checklist (the morning of)

- [ ] `npm run typecheck` clean
- [ ] All 5 slide routes return 200; old routes 404
- [ ] Slide 5 → `/dashboard` lands with Zac's matches in <1 s
- [ ] Live 2 search query renders cards instantly (cache hot)
- [ ] Live 3 "I'm interested" fires the bell + queues an Affinity push
- [ ] `Finish demo` icon visible in header on live pages, `cmd+.` jumps to `/demo/closing`
- [ ] Avatars + photos baked in `/public` (no venue-WiFi dependency)
- [ ] Backup video queued (Loom of Live 1–4)

# Why this wins

| Criterion | What earns the points |
|---|---|
| **UX (40%)** | Slide 2's real `<CandidateProfileCard>` proves the structured profile is *the actual product*, not a mockup. Live 1–3 then prove it works under interaction. |
| **Match Quality (30%)** | Slide 3 is the real `<MatchCard>` with score, reason, factor chips, concerns. Live 2 proves the calibrated scoring runs on a real engine. |
| **Integration (20%)** | Slide 4 is the real `<AffinityPushCard>` against a fixture; Live 4 is the same component against the live mock transport. The integration is *demonstrably wired*, not promised. |
| **Innovation (10%)** | The gap-closer drawer on Slide 3 is the real `<GapCloserView>`. Most platforms sell perfect; we route imperfect to Utah. |

The slideshow earns the rubric in 2 minutes by *being the product*, then the live demo proves it works for 3 minutes. Most hackathon entries lose at the gap between the pitch and the product. We don't have one.
