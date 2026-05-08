-- Supabase / Postgres schema for Nucleus Connections Hub.
-- Run against a project with the `pgvector` extension enabled.

create extension if not exists vector;

-- ── talent ──────────────────────────────────────────────────────────────────
create table if not exists talent (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null,
  email           text unique not null,
  headline        text,
  bio             text not null,
  skills          text[] default '{}',
  domains         text[] default '{}',
  availability    text,
  compensation    text[] default '{}',
  stage_prefs     text[] default '{}',
  risk_tolerance  int check (risk_tolerance between 1 and 5),
  location        text,
  utah_org_ids    uuid[] default '{}',
  embedding       vector(1536),
  profile_jsonb   jsonb not null
);

create index if not exists talent_embedding_idx
  on talent using ivfflat (embedding vector_cosine_ops);

-- ── startup ─────────────────────────────────────────────────────────────────
create table if not exists startup (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null,
  one_liner       text,
  description     text not null,
  sector          text,
  origin          text,
  trl             int,
  funding_stage   text,
  funding_status  text,
  needs           text[] default '{}',
  location        text,
  utah_org_ids    uuid[] default '{}',
  embedding       vector(1536),
  profile_jsonb   jsonb not null
);

create index if not exists startup_embedding_idx
  on startup using ivfflat (embedding vector_cosine_ops);

-- ── utah_orgs (the ecosystem graph) ─────────────────────────────────────────
create table if not exists utah_orgs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null,
  universities  text[] default '{}'
);

-- ── match_decisions (audit + demo replay) ───────────────────────────────────
create table if not exists match_decisions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  talent_id       uuid references talent(id) on delete cascade,
  startup_id      uuid references startup(id) on delete cascade,
  score           float,
  reason          text,
  factors         jsonb,
  proximity_boost float,
  viewer          text
);

-- ── interest (dual opt-in handshake) ────────────────────────────────────────
create table if not exists interest (
  id              uuid primary key default gen_random_uuid(),
  talent_id       uuid references talent(id) on delete cascade,
  startup_id      uuid references startup(id) on delete cascade,
  talent_state    text not null default 'pending',
  startup_state   text not null default 'pending',
  mutual_at       timestamptz,
  unique (talent_id, startup_id)
);
