# Nucleus Connections Hub — design language

This file is the source of truth for visual choices in `app/`. When you build a
new page or component, conform to what's here. When you change the language,
update this file in the same commit.

## Modes

The app runs in two modes (`NEXT_PUBLIC_APP_MODE`):

- **demo** — no auth, hardcoded data via `MockDataStore`. Sales calls,
  walkthroughs, judging. Sign-in is essentially optional; any credentials map
  to a demo persona.
- **live** — Supabase Auth + Supabase-backed data. Real users, real
  persistence. Auth via `@supabase/ssr`.

Both modes share the *same* UI. Differences are confined to:
- the "Demo" / "Live" `ModeBadge` in the header
- a tucked "browse as a sample user" link on `/login` (demo only)
- the data-store strategy selected by `getDataStore()` in `lib/data/index.ts`

Pages should never branch on `APP_MODE` for layout. They should render the
same regardless of mode and let the data layer differ.

## Color palette

Nucleus blue + cool slate. Defined in `tailwind.config.ts`. Use Tailwind
utilities — never inline hex except in `globals.css` tokens.

Token names are kept from the prior canyon-warm theme (`orange-*`, `warmgray-*`,
`sand-*`) so existing markup stays valid. Names are functional, not literal —
`orange-500` is royal blue, `warmgray-*` is the cool slate ramp.

| Token       | Use                                                       |
|-------------|-----------------------------------------------------------|
| `paper`     | `#ffffff` — full-page background. Always.                 |
| `ink`       | `#0f172a` — primary text + dark CTAs.                     |
| `orange-500`| `#2563eb` — single brand accent (royal blue). Primary buttons + key CTAs only. |
| `orange-600`| `#1d4ed8` — hover state for primary CTAs.                 |
| `orange-50/100/200` | Soft pill backgrounds, subtle hover washes.       |
| `warmgray-50→900` | Cool slate neutrals. `100` for borders, `400` for muted labels, `600` for body, `700` for body-strong, `ink` for headlines. |
| `sand-*`    | Light sky washes — reserved for ecosystem-graph / Utah-signal moments. |
| `emerald-*` | Live-mode badge dot, mutual-match success states. Sparingly. |
| `red-*`     | Form errors only. Never decorative.                       |

**Rules**
- One primary color (blue) per page. Don't add a second accent.
- Body text is `warmgray-600` or `warmgray-700`. Headlines are `ink`.
- Backgrounds: page is `paper`, surfaces are `bg-white` with `border-warmgray-100`.

## Typography

Loaded once in `globals.css`. Main UI font is **Bricolage Grotesque** from
Google Fonts. Hierarchy comes from weight + size.

- **Bricolage Grotesque** — `font-sans` (body default). Primary UI weight is
  **600** (`font-semibold`).
- **Bricolage Grotesque** — `font-serif` token also resolves to Bricolage
  Grotesque for backward-compat on existing headline classes.
- **JetBrains Mono** — `font-mono`. Reserved for numeric weights, IDs in
  diagnostic surfaces, factor percentages.

**Eyebrow label** — the all-caps tracked label above section titles is the
`.eyebrow` utility:

```
.eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
```

Color the eyebrow `text-orange-500` (royal blue) for primary sections,
`text-warmgray-400` for secondary, `text-emerald-700` for live-mode contexts.

**Hierarchy**
- H1 page title: `font-serif text-4xl font-semibold leading-tight text-ink` (or `text-3xl` on auth/utility pages).
- H2 section: `font-serif text-2xl font-semibold text-ink`.
- Hero (landing only): `font-serif text-[56px]–[72px] font-semibold leading-[1.04] tracking-[-0.02em]`.
- Body: `text-sm font-semibold leading-relaxed text-warmgray-600/700`.
- Eyebrow: `.eyebrow` + a tone color.

## Layout

- **Page width:** `mx-auto w-full max-w-6xl px-8` for app pages,
  `max-w-md` for auth cards, `max-w-5xl` for content-focused pages
  (matches grid, profile).
- **Vertical rhythm:** `py-10` on main content, `py-6` on header, `pb-16` on
  auth pages.
- **Cards:** `rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm`.
  Hover-able cards add `transition hover:border-warmgray-200`.
- **Stat blocks:** `rounded-2xl border border-warmgray-100 bg-white p-5` with
  `eyebrow` label on top and `font-serif text-3xl font-semibold` value.

## Components

### Pills (`components/Pill.tsx`)

The only pill primitive. Tones: `neutral | warmgray | orange | emerald`.
Don't reach for `bg-*` / `border-*` directly — use the Pill.

### Buttons

Two variants. Don't add more without updating this doc.

- **Primary** — blue capsule:
  `inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600`.
- **Dark** (used inside cards for "Open" CTAs):
  `inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-warmgray-800`.
- **Ghost** — text-only link in `text-warmgray-700 hover:text-ink`.

The reusable building blocks live in `components/AuthCard.tsx`
(`PrimaryButton`, `TextInput`, `FieldLabel`).

### Avatar (`components/Avatar.tsx`)

Initials fallback over `orange-100` (soft blue wash), with photo passthrough. Sizes `sm | md | lg`
map to fixed pixel sizes — **don't override** with utility classes.

### Match card (`components/MatchCard.tsx`)

The hero unit on `/matches`. Composed of: avatar, name + score pill,
headline, Utah signal pill, location pill, reason paragraph, optional
concerns list, footer with explainability link + "Open" CTA. **Score
thresholds** for the pill tone: `>=90` orange, `>=75` emerald, else neutral.

### Explainability panel (`components/ExplainabilityPanel.tsx`)

Always rendered alongside a match. Reason → factor bars with
`bg-orange-400` fills → concerns block on warm paper. Don't strip concerns;
they're a trust surface, not noise.

### App header (`components/AppHeader.tsx`)

Logo + serif wordmark on left, primary nav center (md+), `ModeBadge` +
`NotificationBell` + sign-out / sign-in on right. Border-bottom only —
never a shadow.

## Iconography

**Library: `lucide-react`.** No emojis in product UI. No mixing of icon
libraries.

Sizing is fixed: `h-[18px] w-[18px]` for header icons, `h-3.5 w-3.5` (14px)
for inline button glyphs, `h-5 w-5` (20px) only inside larger CTAs.
`strokeWidth={1.75}` for primary surfaces, `strokeWidth={2}` for inline
glyphs that need to read at small sizes.

Decorative arrows in CTAs are kept as text (`→`) for letterforms — those are
a typographic flourish, not iconography.

The Delicate Arch silhouette in `components/DelicateArch.tsx` is the only
custom-drawn glyph and serves as the wordmark icon. Don't substitute it.

## Forms

- Wrapped in a card. Form fields stack vertically; never use multi-column
  inputs unless the field is genuinely paired (e.g. first/last name).
- Use `FieldLabel` (renders `.eyebrow` styling) above each input.
- Use `TextInput` for inputs — has the focus-ring orange glow built in.
- Errors render in a `border-red-200 bg-red-50 text-red-700` pill above the
  submit button.
- Submit is `PrimaryButton` and full-width.

## Motion

Subtle and short. The defaults:

- `transition` on hover targets — that's the Tailwind default of 150ms.
- Hover-lift CTAs use the blue shadow grow:
  `hover:shadow-[0_10px_30px_-8px_rgba(37,99,235,0.7)]`.
- Arrow-shift on hover for "→" CTAs:
  `transition group-hover:translate-x-0.5`.

No spring physics. No layout animations.

## Voice

Short, direct, product-tone. We're not selling a "platform" or an "engine";
we're helping people find each other. Avoid:

- Engineering jargon in user-facing copy ("embeddings", "LLM rerank",
  "pipeline", "cookie", "API"). It belongs in `docs/`, not `/login`.
- Hype words ("revolutionary", "AI-powered" anywhere except the hero).
- Empty hedges ("simply", "easily", "just").

Prefer:

- Concrete nouns ("matches", "introductions", "your network").
- Active sentences. The user is the subject.
- A trailing "→" arrow for CTAs that lead somewhere new.

## Accessibility floor

- Every interactive control has a real role (`button`, `a`) and a text label
  or `aria-label`.
- Decorative SVGs (`DelicateArch`, lucide icons) carry `aria-hidden`.
- Color-only signals are paired with an icon or text — score pills use
  number + tone, not tone alone.
- Tap targets are `h-9` (36px) minimum on icon buttons.

## What goes where

```
src/
  app/                 — Next.js App Router pages + route handlers.
  components/          — Shared UI. Don't import server-only modules from here.
  lib/
    data/              — Strategy pattern: IDataStore + Mock + Supabase.
    supabase/          — Server / browser / middleware Supabase clients.
    mode.ts            — APP_MODE + demo personas.
    session.ts         — getViewer().
    viewer.ts          — requireViewer() / maybeViewer() helpers.
public/                — Static assets (delicate-arch.svg, photos cached locally).
```

When in doubt, look at how `/dashboard` and `/matches` are built — those are
the canonical examples.
