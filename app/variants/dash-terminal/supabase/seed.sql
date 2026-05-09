-- ─────────────────────────────────────────────────────────────────────────────
-- Local-dev seed. Loaded automatically by `supabase db reset`.
-- Mirrors lib/data/seed.ts:baselineResources so live-mode `/search` and
-- `/resources` aren't empty against a fresh local Postgres.
--
-- `embedding` columns are left NULL — they get populated the next time the
-- resource is upserted through SupabaseDataStore.putResource (which calls the
-- OpenAI embedder). To backfill from SQL alone, run a one-shot script that
-- reads each row and writes back the embedding.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.resources (title, description, kind, url, tags, summary, uploaded_by_id, uploaded_by_name, created_at)
values
  (
    'U of U TTO Spinout Handbook',
    'How U of U faculty take inventions through licensing, IP, and the spinout incorporation path. Read this before your first conversation with the TTO.',
    'guide',
    'https://example.com/uta-tto-handbook',
    ARRAY['tto','spinout','ip','u-of-u','regulatory'],
    'Closes the gap for operators new to university-spinout mechanics — IP assignment, sponsored research, and the equity-split conversation with the TTO. Especially useful for first-time CEOs joining a U of U or BYU spinout.',
    null, 'Nucleus team',
    '2026-04-22T15:30:00.000Z'
  ),
  (
    'Utah seed-stage cap-table primer',
    'Common term-sheet shapes from Pelion, Park City Angels, and the local family offices. Pre-seed → Series A.',
    'playbook',
    'https://example.com/utah-cap-table',
    ARRAY['fundraising','cap-table','term-sheet','ceo','cfo'],
    'Closes the gap on fundraising mechanics for first-time CEOs and founding GTM leaders — SAFEs vs priced rounds, dilution math through Series A, and the Utah-specific norms set by Pelion and the local angel groups.',
    null, 'David Holm (demo upload)',
    '2026-04-30T09:15:00.000Z'
  ),
  (
    'Product-market fit checklist',
    '10 signals investors at Pelion look for before a Series A. Curated from the founders they''ve backed.',
    'guide',
    'https://example.com/pmf-checklist',
    ARRAY['pmf','fundraising','growth','biz-dev','ceo'],
    'Closes the gap for sales-leaders or operators stepping into a CEO seat — how to read pre-Series-A traction, distinguish PMF from churn-masked growth, and frame the metrics narrative for Utah investors.',
    null, 'Nucleus team',
    '2026-04-15T12:00:00.000Z'
  ),
  (
    'Microfluidics 101 — for diagnostics builders',
    'A primer from a U of U bioengineering grad student covering wet-lab basics through device prototyping.',
    'video',
    'https://example.com/microfluidics-101',
    ARRAY['bioengineering','diagnostics','u-of-u','engineering','regulatory'],
    'Closes the wet-lab fluency gap for ML / dry-lab engineers joining a diagnostics or life-sciences spinout — enough microfluidics literacy to talk shop with the bench scientists on the team.',
    null, 'Priya Patel (demo upload)',
    '2026-05-01T20:00:00.000Z'
  ),
  (
    'Affinity intro-email template',
    'How Nucleus formats double-opt-in introductions when a match goes mutual. Drop-in template, customize the why.',
    'deck',
    'https://example.com/affinity-intro-template',
    ARRAY['intro','affinity','ops','biz-dev'],
    'Closes the gap for biz-dev folks new to operator-mediated intros — what a Nucleus-quality introduction looks like, what to put in the ''why'' line, and how to keep both sides leaning in.',
    null, 'Nucleus team',
    '2026-05-05T14:30:00.000Z'
  ),
  (
    'Enterprise sales discovery in regulated sectors',
    'Discovery-call frameworks for selling into healthcare, security, and other compliance-heavy markets. Walks through MEDDIC adapted for procurement-led buyers.',
    'playbook',
    'https://example.com/enterprise-sales-discovery',
    ARRAY['sales-lead','enterprise-sales','discovery','regulatory','cyber'],
    'Closes the gap for vertical-SaaS sales leaders moving into compliance or security buyers — discovery questions that surface budget, authority, and procurement timelines specific to regulated industries.',
    null, 'David Holm (demo upload)',
    '2026-05-06T11:00:00.000Z'
  ),
  (
    'ML infrastructure for life-sciences teams',
    'How to set up reproducible training + inference pipelines for biotech R&D, including the LIMS-adjacent integrations.',
    'guide',
    'https://example.com/ml-infra-bio',
    ARRAY['ml-infra','engineering','cto','life-sciences'],
    'Closes the gap for ML / dry-lab engineers joining a biotech spinout — reproducible training, GPU choices, and the LIMS / wet-lab data integrations that come up in real bio engineering.',
    null, 'Marcus Okafor (demo upload)',
    '2026-05-04T16:45:00.000Z'
  )
on conflict do nothing;
