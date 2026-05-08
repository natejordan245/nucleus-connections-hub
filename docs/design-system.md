# Design system

The visual system is sourced from the [**Utah Design System**](https://designsystem.utah.gov/) (`utahdts/utah-design-system`, `_color-swatches.scss`). We pull a small, opinionated subset and re-key the swatches into the canonical Tailwind 50→900 ramp so utility class names are unambiguous (`bg-orange-500`, not `bg-orange-4`).

## Tokens

### Color

Defined in [`v0-app/tailwind.config.ts`](../v0-app/tailwind.config.ts). All HEX values map back to specific USDS swatch entries.

| Token | Hex | USDS source | Used for |
|---|---|---|---|
| `paper` | `#fbfaf7` | (custom warm off-white) | Page background — the body surface |
| `ink` | `#1f1f1f` | (`neutral-gray-00` neighborhood) | Primary text, high-emphasis labels |
| `warmgray-50` | `#f1f1f1` | `warm-gray-17` | Subtle row tints, inactive chip bg |
| `warmgray-100` | `#e4e4e3` | `warm-gray-16` | Card / divider borders |
| `warmgray-200` | `#d7d7d6` | `warm-gray-15` | Input borders, button outlines |
| `warmgray-300` | `#c9c9c8` | `warm-gray-14` | Disabled affordances |
| `warmgray-400` | `#a2a2a0` | `warm-gray-11` | Tertiary text, eyebrow labels |
| `warmgray-500` | `#7a7a77` | `warm-gray-08` | Secondary text |
| `warmgray-600` | `#52524e` | `warm-gray-05` | Body text on cards |
| `warmgray-700` | `#373734` | `warm-gray-03` | Strong body text |
| `warmgray-800` | `#1d1d1c` | `warm-gray-01` | Near-black surfaces |
| `warmgray-900` | `#101010` | `warm-gray-00` | Display titles |
| `orange-50` | `#fff4ef` | `electric-orange-17` | CTA halo / hover wash |
| `orange-100` | `#ffeae0` | `electric-orange-16` | Pill bg |
| `orange-200` | `#ffd6c1` | `electric-orange-14` | Badge border |
| `orange-300` | `#ffb893` | `electric-orange-11` | Affordance accent |
| `orange-400` | `#ff9055` | `electric-orange-07` | Secondary accent |
| **`orange-500`** | **`#ff7227`** | **`electric-orange-04`** | **Brand orange — primary CTA, brand mark** |
| `orange-600` | `#d26328` | `electric-orange-03` | CTA hover |
| `orange-700` | `#a6552a` | `electric-orange-02` | Active / pressed |
| `orange-800` | `#7a472b` | `electric-orange-01` | Strong text on orange |
| `orange-900` | `#4f392d` | `electric-orange-00` | Display on orange surfaces |
| `sand-50` | `#fff8f2` | `light-orange-17` | Background wash for the orange-tinted cards (Utah signal, "looking for" panel) |
| `sand-100` | `#fff1e6` | `light-orange-16` | Pill background |
| `sand-200` | `#ffe3ce` | `light-orange-14` | Sandstone tint |
| `sand-300` | `#ffd5b6` | `light-orange-13` | — |
| `sand-400` | `#ff9d55` | `light-orange-04` | Warm-orange highlight |

We intentionally use **one accent color** (orange) instead of orange + a secondary. The neutral ramp + brand orange + small green/red usage for verdicts is the entire palette.

#### Verdict colors (one-off, semantic)

| Use | Class | Note |
|---|---|---|
| Strong match | `bg-emerald-50 text-emerald-700 border-emerald-200` | Trust signal — best matches |
| Good match | `bg-sand-50 text-orange-700 border-orange-200` | Brand-aligned middle tier |
| Partial match | `bg-warmgray-50 text-warmgray-700 border-warmgray-200` | Quiet — not a sales pitch |
| Concerns / warning | `bg-sand-50 border-orange-200 text-ink` | Prominent; never hidden |

### Typography

| Family | Source | Used for |
|---|---|---|
| `font-serif` | Source Serif 4 (Google Fonts, `400/500/600/700`) | Display headlines, profile names, opportunity card names |
| `font-sans` | Inter (default) | All body text, controls |
| `font-mono` | JetBrains Mono | Match scores, pipeline timings, IDs |

The Source Serif headline is what makes the landing feel editorial rather than dashboard-y. Display sizes are hand-tuned: landing is `text-[64px] sm:text-[72px]`, profile names are `text-3xl`, card names are `text-xl`.

### Spacing & radius

- **Page width:** `max-w-6xl` (1152px) with `px-6` to `px-8` rails.
- **Card radius:** `rounded-xl` (12px) for primary surfaces, `rounded-lg` (8px) for nested panels, `rounded-full` for CTAs and chips.
- **Card padding:** `p-7` (28px) for primary, `p-5`–`p-6` for secondary.
- **Card border:** `border-warmgray-100` everywhere. Subtle. The shadow is `shadow-[0_1px_0_rgba(16,16,16,0.04)]` — almost imperceptible until hover.

### Eyebrow utility

Custom utility in `globals.css`:

```css
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
```

Use it everywhere a tag/label would feel too loud — section headers inside cards, "looking for" labels, sort-by labels.

## Component primitives

Lives under [`v0-app/components/`](../v0-app/components) and [`v0-app/lib/demo/`](../v0-app/lib/demo). Curated list:

| Component | File | Role |
|---|---|---|
| `<DelicateArch>` | `components/DelicateArch.tsx` | Inline SVG silhouette of Delicate Arch, single-fill, takes `currentColor`. The landing's hero accent. |
| `<TalentAvatar>` / `<StartupLogo>` | `components/Avatar.tsx` | Avatar with deterministic pravatar fallback (talent) or letter-mark on sand background (startup). |
| `<SocialLinks>` | `components/SocialLinks.tsx` | LinkedIn / X / website / email icon-buttons. Hides cleanly when no links present. |
| `<PhotoUpload>` | `components/PhotoUpload.tsx` | File picker → `FileReader.readAsDataURL` → callback. Stores data URL in the in-memory profile DTO. |
| `<ProfileSummary>` | `components/ProfileSummary.tsx` | Talent or startup profile renderer with avatar, socials, "Looking for" panel, skills, Utah affiliations. |
| `<MatchCard>` | `components/MatchCard.tsx` | Compact match row (legacy — replaced by `OpportunityCard` on the dashboard). |
| `<OpportunityCard>` | `components/OpportunityCard.tsx` | Self-contained match card. Header → reason → expandable factors → CTAs. The dashboard's atomic unit. |
| `<UtahSignalPill>` | `components/UtahSignalPill.tsx` | Small pill badging Utah ecosystem proximity boost with reasons in tooltip. |
| `<ExplainabilityPanel>` | `components/ExplainabilityPanel.tsx` | Side-panel "Why was I matched?" view (still used by handshake flow). |
| `<AffinityPayloadView>` | `components/AffinityPayloadView.tsx` | Renders the JSON payload that *would* be sent to Affinity on mutual match. |
| `<DemoHeader>` | `lib/demo/DemoHeader.tsx` | Sticky nav with brand mark, notification bell, slide chevrons + dropdown. |
| `<DemoTextInput>` | `lib/demo/DemoTextInput.tsx` | Text input that double-clicks to type out canonical demo content with blinking cursor. |
| `<NotificationBell>` | `lib/demo/NotificationBell.tsx` | Header bell — polls `?as=` viewer's notifications every 4s, dropdown with mark-read. |
| `<SlideProvider>` | `lib/demo/SlideController.tsx` | Tracks current slide index, exposes `next()`/`prev()`/`goTo()`, listens for arrow keys. |

## Trust UX rules

These are **load-bearing** for the matching surface — judging criteria explicitly call out trust + transparency.

1. **Never show a numeric score without the paragraph reason.** Scores are anchors; the reason is the actual claim.
2. **Always render the `concerns` factor.** Even strong matches expose a watch-out. Hiding weaknesses makes matches look like a sales pitch — judges punish that.
3. **"Why was I matched?" is the primary CTA on every card.** It's not a hidden tooltip. The reason paragraph lives in a labeled block on the card itself.
4. **Pipeline timing is rendered as small text.** `94ms gates → 38ms vector → 1.2s rerank · cached/fresh`. Makes the system legible to a technical judge without dominating the UI.
5. **Cache state is visible.** The toolbar shows `cached` (emerald) or `fresh` (warmgray) so users see whether they're hitting computed-recently or recomputed-now results.
6. **Demo text is double-click-to-type, not auto-fill.** Judges who want to type can; presenters who want it perfect double-click to play.
7. **Empty states are full sentences, not "No data".** "No matches in this filter. Loosen the filter to see more." every time.

## Layout primitives

The full dashboard layout, broken down:

```
<header sticky border-b bg-paper/80 backdrop-blur>
  <Link>Nucleus Utah brand mark</Link>
  <div>
    <NotificationBell/>     ← Suspense-wrapped (uses useSearchParams)
    | divider |
    < ‹ ›  +  slide-title-dropdown >
  </div>
</header>

<main max-w-6xl px-6 py-10>
  <Header section eyebrow + serif title + subtitle>
  <Tabs nav border-b>
    Search · Network · Opportunities
  </Tabs>
  <Toolbar>
    Verdict pills · Sort chips · Pipeline timing · cached/fresh badge
  </Toolbar>
  <Grid gap-4>
    <OpportunityCard/> ...
  </Grid>
</main>
```

## Demo-first principles

The deck must run **without typing**. We never type during a presentation. Every input that has a canonical demo value is wrapped in `<DemoTextInput demoKey="…">`:

- **Double-click** the field → clears it, types the canonical content character-by-character (~25ms/char) with a blinking cursor.
- **Single-click + type** still works for live editing.
- The component reads from [`v0-app/lib/demo/scenarios.ts`](../v0-app/lib/demo/scenarios.ts), keyed by `demoKey`.
- Real `onChange` fires per character so downstream form state, validation, and LLM extraction triggers see a normal text-entry sequence.

Slide navigation is driven by `<SlideController>`:

- `←` / `→` arrow keys (ignored when focused inside an input)
- Header chevrons
- Slide-title dropdown for jumping
- Slide order in [`v0-app/lib/demo/SlideController.tsx`](../v0-app/lib/demo/SlideController.tsx) — see `docs/slides.md` for narration.
