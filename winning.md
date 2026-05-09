# Winning

What's standing between this build and the $5K. Honest punch-list, ranked by judging-criteria leverage, plus the reframe that replaces the Utah-org-graph idea with a community-resources gap-closer.

Judging weights (from the brief):

| Criterion | Weight |
|---|---|
| User Experience | 40% |
| Match Quality & Intelligence | 30% |
| Integration | 20% |
| Innovation & Creativity | 10% |

## The reframe — Utah context = Utah's community resources

We were going to lean on a Utah-org graph (TTOs, alumni networks, proximity boost). Killing that. Right now in live mode it's empty anyway — `listUtahOrgs()` returns `[]`, `proximityBoost: 0`, `sharedOrgIds: []`. The pill renders nothing. It's an abstract differentiator that the demo can't actually show.

**New angle:** Utah's value isn't a graph — it's a deep set of programs, funds, mentors, networks, and events. We don't pretend to find perfect matches. We tell users exactly what's missing from a partial match and route them to the **Utah-specific community resources** that close the distance. The community does the matchmaking. The AI is a routing layer.

This is stronger because:

1. **It's honest.** No 99%-fit theater. Score sits at 78%, the platform admits it, and turns it into a next step.
2. **The code already supports it.** `recommendGapResources` is built — pulls weak/miss factors from the cached LLM verdict, embeds the gap text, cosine-ranks resources. The pipeline works. Surface area is the gap.
3. **It satisfies "Utah Context Integration" with concrete assets** instead of an abstract graph.
4. **It turns a weakness into a feature.** Most matches will be 65–85%. That's where every other platform fails users; that's where we differentiate.

### The 90-second demo arc

1. Zac's matches load. Top hit: 78%, not 99%.
2. Card itself reads: *"Strong on enterprise GTM. Weaker on field-services / vertical-SaaS."* Inline: *"3 Utah resources can close this gap →"*
3. Click expands: Stoke Mountain vertical-SaaS GTM mentors, Silicon Slopes field-services cohort, vertical-SaaS playbook.
4. Voice-over: *"Every other platform sells you a perfect match. We tell you what's missing and hand you the bridge."*

That's the screenshot judges remember. That's the rubric answer.

### What dies with this reframe

- `UtahSignalPill` on `MatchCard` → replaced with a "Bridges available" pill that opens the gap-closer drawer.
- `proximityBoost` and `sharedOrgIds` on `MatchDTO` → dead in live mode anyway. Remove from the contract or leave dormant.
- The `utah_orgs` migration can stay (profiles still tag affiliations), but it stops pretending to drive scoring.

### What ships with this reframe

A real **Utah resources catalog** — 12–20 seed entries that embed well. Categories beyond "guide / playbook":

| `kind` | Example seed entries |
|---|---|
| `program` | BoomStartup, Lassonde Founder Track, BioHive accelerator, Wayne Brown Institute |
| `funding` | USTAR grants, Kickstart Seed Fund mentor program, Utah Innovation Fund |
| `network` | Silicon Slopes Slack + events, Utah Defense Alliance, BioHive monthly socials, Women Tech Council |
| `mentor` | Curated PIVOT / BYU TTO mentor list (named operators willing to take an intro) |
| `playbook` | "FDA pathway for Utah biotech," "Hiring your first GTM lead" |
| `event` | Silicon Slopes Summit, BioHive Summit, Utah Defense + Aerospace Summit |

Each row's `summary` is what cosine-matches against the gap text — write summaries that embed well ("90-day accelerator for pre-seed life-sciences spinouts in Utah; partners with PIVOT Center").

Requires extending `ResourceKind` from `guide | video | deck | playbook | link` to include `program | funding | network | mentor | event`.

---

## Gaps that block winning, ranked

### Tier 1 — must-fix, directly cost us the win

**1. Gap-closer is buried.** Currently renders only on `/profile/startup/[id]` for partial-match talent. Move it to `MatchCard` for any score below ~0.85, expanded inline or as a drawer. Gap-closer is our differentiator; it cannot live one click deep.

**2. The richest match signal isn't rendered.** `MatchDTO.factors[]` carries 5 per-dimension verdicts (Stage / Skills / Wants / Networks / Comp) with `strong | ok | weak | miss` from the LLM gate. `MatchCard` shows none of them. Add a 5-chip strip on every card. This is the "Why was I matched?" answer the bounty asks for and it's currently hidden.

**3. Concerns rendered as `text-xs text-warmgray-500`.** Our own design doc calls concerns a trust surface, not noise. Right now they look like noise. Promote to a sand-tinted block with an icon.

**4. Utah resources catalog doesn't exist yet.** The reframe is hollow without 12–20 seeded Utah-tied resources. This is content work, not engineering. Highest unlock.

**5. Affinity / Squarespace integration is the thinnest leg (20% of score).**
   - `recordAffinityPush` is a no-op in live mode; `listAffinityPushes` derives from mutual interests.
   - No Squarespace webhook handler in `app/`.
   - Minimum acceptable: a recorded screencast of `AFFINITY_LIVE=true` against a sandbox, plus the `/api/integrations/squarespace/webhook` route ported from `v0-app`. Without this we'll get marked to ~10/20 on Integration.

### Tier 2 — close the margin

**6. No "vs LinkedIn" comparison.** The brief's #1 question: *does it feel meaningfully better than LinkedIn or job boards?* Even a single side-by-side screenshot pair answers this. We have nothing today.

**7. Cold-cache OpenAI fan-out risk.** First load for a viewer fires up to 20 parallel `gpt-5.4-nano` calls before the dashboard renders. Pre-warm the `match_summaries` cache for the demo personas via a script before going on stage, or stream cards as verdicts arrive.

**8. Score thresholds miscalibrated for the seed distribution.** `ScorePill` colors emerald only ≥ 75 and orange only ≥ 90. Most matches will land 65–80%, so the dashboard reads as a sea of neutral pills. Recalibrate against actual seed scores or shift the score curve.

**9. No deployed URL.** Judges click. "Run `npm install`" doesn't fly.

**10. No backup video.** If the laptop dies on stage, we have nothing. 2-minute Loom of the golden path.

**11. Risk tolerance captured but unused.** The field is in `TalentDTO` (1–5), brief explicitly asks for it, but `passesHardFilters` doesn't reference it and the LLM gate prompt doesn't include it. Either use it or delete it.

**12. `passesHardFilters` references `availability === "part-time"`** but the `Availability` type doesn't include `part-time`. Dead branch — silent bug.

### Tier 3 — polish

**13. Pravatar venue-WiFi risk.** Bake demo avatars into `/public` before demo day.

**14. No mobile pass.** Judges scroll on phones during pitches. Even a `sm:` breakpoint sweep on the dashboard helps.

**15. Empty `/resources` page if no seeds.** Today it shows "No resources yet. Uploads land here." For the demo the page must already feel populated. Goes away once Tier 1 #4 ships.

**16. Notification poll cadence in dev.** Bell pings `/api/notifications` on a tight interval — chatty in dev console during demo.

---

## Implementation order (48-hour version)

1. Seed 12–20 real Utah resources with embedding-friendly summaries (#4 above)
2. Inline gap-closer on `MatchCard` for partial matches (#1)
3. Render `factors[]` strip on `MatchCard` (#2) and promote concerns visually (#3)
4. Reframe `/resources` → `/community` with a "for you" personalized strip
5. Drop `UtahSignalPill` in favor of a "Bridges available" affordance
6. Add a "what's missing" one-sentence field to the LLM gate JSON output
7. Pre-warm the match cache for demo personas + record vs-LinkedIn comparison slide
8. Affinity sandbox screencast + Squarespace webhook port
9. Deploy to Vercel + record 2-minute backup video
10. Mobile pass + Pravatar offline fix

## What we keep that's already strong

For confidence's sake — the core engine is genuinely good and shouldn't be touched:

- Bidirectional embeddings (`embedding` for "who I am" + `embedding_wants` for "who I'm looking for"), composite = MIN of both directions to penalize lopsided pairs.
- Per-pair LLM gate with content-hash caching in `match_summaries`. Pay OpenAI once per pair.
- Hard pre-filters before cosine (stage / networks / availability).
- Strong-match auto-notify with `notified_at` idempotency.
- Mutual-match-gated messaging. DMs literally cannot insert without `mutual_at`.
- `recommendGapResources` is the engine for the whole reframe — it works.
- Demo + Live mode strategy via `IDataStore` so judges can use either path.

The bones are right. We're not rebuilding — we're surfacing what's already there and shipping the content (resources catalog) that makes the narrative land.
