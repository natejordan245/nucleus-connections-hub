# Demo slides — presentation script

Eight slides, ~6 minutes. Slide order = the demo. Navigate with `→` / `←` arrows or the header chevrons. Slide registry lives at [`v0-app/lib/demo/SlideController.tsx`](../v0-app/lib/demo/SlideController.tsx).

The demo runs **frontend-only** by default (`NEXT_PUBLIC_SERVICE_MODE=mock`) — no API server, no DB, no API keys. State is in-memory and resets on reload. Pravatar avatars require internet for the headshots; everything else works offline.

Identity follows the URL query param `?as=`. Most slides default to Sarah Chen (`tal-sarah-chen`). The notification bell and matches dashboard re-derive identity from the URL on every render, so switching `?as=` mid-deck just works.

---

## Slide 0 — Landing (`/landing`)

**Beat:** Pitch. Set the frame.

**What's on screen:** Editorial hero with serif headline ("AI-powered matching for the Utah innovation ecosystem."), Delicate Arch silhouette, "Start the demo →" CTA in brand orange, footer with "© 2026 Nucleus Connections Hub · Salt Lake City, Utah".

**Narration (~30s):**
> "Utah is producing high-potential deep-tech startups out of U of U, BYU, and USU — but the people who could operate, advise, or run them can't find them, and vice versa. Nucleus already curates this ecosystem manually through Squarespace forms and Affinity. We built a platform that does the matching automatically, with explainable AI, and ships into the existing Nucleus stack."

**What to point at:** The "Official Ecosystem Portal · Innovation Hub" eyebrow — signals this is a *Nucleus* tool, not a generic job board. The Delicate Arch is the visual cue that the system understands the regional context.

**Click:** "Start the demo →" or `→` key.

---

## Slide 1 — Onboard talent (`/onboard/talent`)

**Beat:** Personal profile capture. Sarah Chen's story.

**What's on screen:** Profile-creation form. Photo upload control on top (with placeholder avatar + "Change" overlay on hover), Name / Email pre-filled, LinkedIn / X URL inputs, two textareas: **Bio** (who she is) and **What you're mainly looking for** (her intent). Right side panel: "Auto-extracted fields" — populates as the LLM parses her input.

**Demo path:**
1. **Double-click** the Bio textarea → types out Sarah's bio character-by-character.
2. **Double-click** the Looking For textarea → types out her intent.
3. After ~80 characters of combined text, the right panel populates with extracted skills, availability, compensation, stage prefs, location.
4. Click "Build my profile →" → routes to slide 2.

**Narration:**
> "Sarah is an ex-Qualtrics VP of Sales looking for fractional advisory work in Utah AI. Notice how we capture two distinct things — *who she is* and *what she's looking for*. The 'looking for' field is what dominates the embedding, so matches reflect intent, not just biography. The right panel is real-time LLM extraction of structured fields from her free text."

**Technical callout:** "The extraction call runs through `IProfileService.extractFromBio`. In mock mode it's deterministic templated output; in real mode it's `gpt-5.3-nano` with a JSON-schema response format. Same call site either way."

---

## Slide 2 — Talent profile (`/profile/talent/tal-sarah-chen`)

**Beat:** "Here's the structured profile we built."

**What's on screen:** Profile card with 72px avatar, serif name, headline, social-link icon row (LinkedIn, X, email), bio paragraph, **prominent "What Sarah is looking for" sand-tinted panel**, skill pills (orange), Utah affiliation pills (Qualtrics Alumni, Domo Alumni, Silicon Slopes).

**Narration:**
> "From three text inputs we now have a fully structured profile. The orange 'Looking for' card is the trust differentiator — every other talent platform buries intent in a search filter. We surface it because matches are explained against this exact text."

**What to point at:** Utah affiliations. "Qualtrics Alumni" and "Domo Alumni" aren't generic skill tags — they're nodes in our Utah ecosystem graph that LinkedIn can't see. Two profiles sharing a Utah-org get a proximity boost.

**Click:** "See Sarah's matches →" or `→`.

---

## Slide 3 — Onboard startup (`/onboard/startup`) *(skippable)*

**Beat:** Mirror flow for the startup side. Skippable.

**What's on screen:** A prominent **orange "Optional step" banner** at the top with a "Skip — go to opportunities →" CTA. Below it, the same form pattern as slide 1 but for a company: company name, description textarea, auto-extracted fields panel.

**Demo path (option A — full):** Double-click Description → types out Lumen Bio's pitch. Click "Build company profile →" → slide 4.

**Demo path (option B — skip):** Click the orange Skip CTA in the banner → jumps to the matches dashboard (slide 5).

**Narration:**
> "Same flow for companies — Lumen Bio is a U of U cancer-therapeutics spinout that just licensed IP from PIVOT Center. We let users skip this step entirely if they're talent-only, because the platform should serve people who are just looking for opportunities."

**Technical callout:** "The webhook at `/api/integrations/squarespace/webhook` accepts the same payload shape — it normalizes Squarespace form submissions into either a talent or startup record. So Nucleus's existing intake form continues to work with no migration."

---

## Slide 4 — Startup profile (`/profile/startup/sup-lumen-bio`)

**Beat:** "Here's the spinout profile."

**What's on screen:** Same profile component as slide 2, but rendering a startup. Letter-mark logo (`LB` on sand background), name (Lumen Bio), one-liner, description, sector / origin / funding-stage / funding-status / needs tags, Utah affiliations (PIVOT Center, U of U). Social links row with website + LinkedIn.

**Narration:**
> "U of U PIVOT Center spinout, seed-funded, looking for a CEO with FDA experience. Note the affiliations — PIVOT Center and University of Utah are graph nodes. Any talent with a U-of-U affiliation gets a graph-distance bonus when matched here."

**Click:** "See talent matches for Sarah →" or `→`.

---

## Slide 5 — Dashboard (`/matches?as=tal-sarah-chen`)

**Beat:** The trust surface. The judging-criteria slide.

**What's on screen:** Three-tab dashboard. **Search is the default tab.**

### Search tab

Search bar with kind toggle (People / Companies), suggestion chips. **No filters visible until results land.** After a search:
- Result count + quoted query
- Verdict-filter pills (All / Strong / Good / Partial with counts)
- Sort by Score / Verdict / Utah signal
- Pipeline timing in monospace + `cached` / `fresh` badge
- Stack of `<OpportunityCard>` results

**Demo path:**
1. Click a suggestion chip — say *"life-sciences CEO with FDA experience"*. Companies toggle stays default.
2. Cards populate with reasons that **quote the query**: "Strong match. Lumen Bio — light-activated cancer therapeutics — University of Utah spinout. Matches your search 'life-sciences CEO with FDA experience' on life-sciences, CEO, FDA."
3. Toggle People / Companies — same query, different pool.
4. Mention the "fresh" → "cached" badge on the second click of the same query.

**Narration:**
> "Search is what every matchmaker actually wants — natural-language query, semantic neighbors, reranked. The query gets embedded, nearest neighbors in the target pool are pulled, and the LLM rewrites a per-result reason that quotes phrases from your search. Concerns surface when there's no literal term overlap — pure semantic neighbors get flagged so users don't get burned by them."

### Network tab

Peer matching. Talent ↔ talent. No stage/comp gates. Each card is another operator, advisor, or student in the Utah ecosystem.

**Narration:**
> "The Network tab is for meeting people, not finding jobs. Same engine, different stage-1 — we relax the talent-vs-startup gates entirely and let semantic + Utah proximity drive ranking. So Sarah might surface Marcus Okafor, a fellow life-sciences operator, or Kevin Larsen, another GTM-stage sales lead — both with shared Silicon Slopes affiliation."

### Opportunities tab

Talent → startup. The original matching mode. **Bramble AI is Sarah's #1.**

**What to point at on every card:**
- Avatar/logo, serif name, verdict pill, Utah Signal pill (with reasons in tooltip)
- Match score in monospace on the right
- "Why this match" reason in its own labeled block
- "+ Show match factors" expandable grid → 4 factors including **Concerns** in orange
- Social links row at the bottom
- "Pass" + "I'm interested →" CTAs

**Narration on Opportunities:**
> "Each card has the score, but also a paragraph reason and a Concerns field. Notice the third match — Sarah's healthcare interest is partial overlap; the system flags that as a concern instead of selling it as perfect fit. That's the trust differentiator. LinkedIn never tells you why a match is bad."

**Click:** "I'm interested →" on Bramble AI → slide 6.

---

## Slide 6 — Handshake (`/handshake?as=tal-sarah-chen&with=sup-bramble-ai`)

**Beat:** Mutual interest is the gating event for connection.

**What's on screen:** Two side-by-side cards (Talent / Startup), each with a "Mark interested" button. Center: a state card that says "Both sides need to flip to 'interested' before we share contact info." When both flip, it animates to "🤝 Mutual interest at <timestamp>" with a "View Affinity payload →" button.

**Demo path:**
1. Click "Mark interested" on the **Talent** card. Sarah's side turns green. The header bell **does not** light up for Sarah (because she's the one who voted) — but Bramble's notification fires server-side.
2. Click "Mark interested" on the **Startup** card. Mutual fires.
3. Header bell lights up with `1` (Sarah just received a `mutual_match` notification from Bramble).
4. Click the bell — dropdown shows "Mutual match with Bramble AI. Time to talk."

**Narration:**
> "The handshake is dual opt-in. We never share contact info until both sides flip to interested. The notification bell tracks who you are via the URL's `?as=` param — same poll endpoint, different recipient. Anonymity isn't a priority here, so notifications include the other side's name."

**Technical callout:** "Notification emission rules live in [`lib/notifications/emit.ts`](../v0-app/lib/notifications/emit.ts). Both the in-process service and the API route call the same helper, so behavior is identical across modes. On mutual, we also fire the Affinity push."

**Click:** "View Affinity payload →" → slide 7.

---

## Slide 7 — Affinity push (`/affinity-push`)

**Beat:** Drop-in integration into Nucleus's existing CRM.

**What's on screen:** A list of "Mutual match queued for Affinity" cards. Each card shows the talent ↔ startup pairing, the destination list, person record (name + email), and the **note body** which contains the LLM's reason paragraph + Utah signal.

**Narration:**
> "Every mutual match becomes an Affinity person + list-entry + note. The note body is the same paragraph the user saw — so when a Nucleus operator opens the Affinity record they see exactly *why* the system matched these two. In mock mode we render the request payload that *would* be sent. With `AFFINITY_LIVE=true` and a Nucleus API key in `.env.local`, the same code POSTs to `https://api.affinity.co`. Zero migration, drop-in compatible."

**Technical callout:** "We also recorded the push locally in mock mode regardless — so the admin slide always has something to render even when the real API is offline. The Strategy pattern + `withFallback` means switching modes is a one-line env change."

---

## Wrap (~30s)

> "What we built: AI-powered matching with explainable reasons, Utah-specific ecosystem graph, free-text semantic search, peer networking, dual opt-in handshakes, and drop-in Squarespace + Affinity integration. The whole thing runs on a layered architecture with mock-first adapters so the demo never goes dark and the real pipeline can be wired piece by piece. Backend question? Happy to dive into the engine, the cache layer, or the strategy pattern."

## Handy keyboard shortcuts

| Key | Action |
|---|---|
| `→` | Next slide |
| `←` | Previous slide |
| Click slide title in header | Open dropdown to jump anywhere |
| Double-click any `<DemoTextInput>` | Play canonical demo text |

## Tab + URL deep-links

| URL | Lands on |
|---|---|
| `/matches?as=tal-sarah-chen&tab=search` | Search tab (default) |
| `/matches?as=tal-sarah-chen&tab=network` | Peer matches |
| `/matches?as=tal-sarah-chen&tab=opportunities` | Talent → startup |
| `/matches?as=tal-marcus-okafor` | Marcus's view (life-sciences CEO → top match is Lumen Bio) |
| `/matches?as=tal-priya-patel` | BYU intern's view (top match is CropVision) |

Switching `?as=` mid-presentation reloads the dashboard with the new identity and the bell tracks accordingly.
