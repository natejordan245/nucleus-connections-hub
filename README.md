# Nucleus Connections Hub

AI-powered talent ↔ startup matching for the Utah innovation ecosystem.

Hackathon entry for the Nucleus Utah bounty: a platform that matches operators, executives, students, and advisors to Utah deep-tech startups and university spinouts — with explainable matches, Utah-specific ecosystem signal, semantic search, peer networking, and drop-in integration with Squarespace + Affinity.

## Repo layout

```
nucleus-connections-hub/
├── README.md                ← you are here
├── DESIGN.md                ← canonical design doc (architecture, contracts, pipeline)
├── rew-prompt.md            ← original Nucleus bounty brief
├── docs/                    ← deeper documentation
│   ├── design-system.md       — Utah palette, typography, components, trust UX rules
│   ├── slides.md              — slide-by-slide presentation script
│   ├── api.md                 — endpoint reference w/ example payloads
│   ├── integrations.md        — Squarespace, Affinity, OpenAI, Supabase wiring
│   └── challenges.md          — known blockers, scope tradeoffs, open questions
├── blockers/                ← per-blocker writeups (referenced from challenges.md)
└── v0-app/                  ← the Next.js app
    ├── app/                   — slides + API routes
    ├── components/            — UI primitives
    ├── contracts/             — shared TS types (the boundary)
    ├── data/                  — synthetic Utah orgs + 15 talent + 10 startups
    ├── lib/
    │   ├── demo/                — slide controller, typing animation, notification bell
    │   ├── services/            — frontend-facing strategy layer (mock + http)
    │   ├── data-layer/          — Supabase / OpenAI / Affinity adapters + mocks + cache
    │   └── notifications/       — interest-vote → notification emission rules
    └── scripts/             — schema + seed/smoke helpers
```

## Quick start

```bash
cd v0-app
npm install
npm run dev          # http://localhost:3000
npm test             # vitest — 32 tests
npm run typecheck    # tsc --noEmit
npm run build        # next build
```

The demo runs **frontend-only mode** by default (no API server, no DB, no API keys). Walk through the 8-slide deck with the `→` / `←` arrow keys.

## What's distinctive

- **Layered architecture** — two strategy-pattern boundaries (frontend↔API, API↔data layer), each backed by mock-first adapters with auto-fallback. Demo never goes dark, real backend exists for technical-judging questions.
- **Three-mode matching** — subject-mode (talent → startup), peer-mode (talent ↔ talent), query-mode (free-text → either pool). Same engine, different stage-1 gates.
- **Explainable** — every match carries a paragraph reason and a required `concerns` field. No match is sold as perfect.
- **Utah ecosystem proximity boost** — shared TTOs, university lineage, alumni networks bump scores. Capped at +0.25.
- **Match cache** with content-hash invalidation — viewer fingerprint + monotonic pool revision. Cosmetic edits (photo, socials) don't invalidate; bio / lookingFor / skills / domains / utahOrgs do.
- **Notification bell** in the header — interest votes fire notifications to the other side, mutual matches notify both. Identity follows `?as=` so the demo can switch personas.
- **Demo-first UI** — `<DemoTextInput>` wrapper plays the canonical demo content character-by-character on double-click. Real `onChange` fires per character so downstream extraction stays consistent.

## What to read first

| If you want to… | Read |
|---|---|
| Understand the architecture and contracts | `DESIGN.md` |
| Run the live demo or judge the UX | `docs/slides.md` then open the dev server |
| See the design system in detail | `docs/design-system.md` |
| Wire a new client (CLI, mobile, integration) | `docs/api.md` |
| Understand integration boundaries (Squarespace, Affinity, OpenAI) | `docs/integrations.md` |
| Know what's *not* finished and why | `docs/challenges.md` and `blockers/` |

## Status

Hackathon prototype. Mock pipeline is structurally identical to the real pipeline — switching `DATA_MODE` flips behavior without changing call sites. Real Supabase + pgvector wiring is documented in `blockers/pgvector-live-sql.md`; live Affinity API access in `blockers/affinity-live.md`.
