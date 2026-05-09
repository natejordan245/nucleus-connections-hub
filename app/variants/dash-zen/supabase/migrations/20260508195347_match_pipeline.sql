-- ─────────────────────────────────────────────────────────────────────────────
-- Match pipeline plumbing — pgvector on profiles, resources table.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists vector;

-- ── profiles: embedding columns ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists embedding_text text,
  add column if not exists embedding vector(1536);

-- ivfflat index for approximate nearest-neighbour cosine search.
-- `lists = 100` is the standard starting point for ≤ 1M rows; tune later.
create index if not exists profiles_embedding_idx
  on public.profiles
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── resources table ─────────────────────────────────────────────────────────
create table if not exists public.resources (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null default '',
  kind             text not null check (kind in ('guide', 'video', 'deck', 'playbook', 'link')),
  url              text not null,
  tags             text[] not null default '{}',
  -- short, embeddable text describing the gap this resource closes
  summary          text not null default '',
  uploaded_by_id   uuid references auth.users(id) on delete set null,
  uploaded_by_name text not null default 'Anonymous',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  embedding_text   text,
  embedding        vector(1536)
);

create index if not exists resources_kind_idx on public.resources (kind);

create index if not exists resources_embedding_idx
  on public.resources
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute procedure public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.resources enable row level security;

drop policy if exists "resources_read_all_authenticated" on public.resources;
create policy "resources_read_all_authenticated"
  on public.resources for select
  to authenticated
  using (true);

drop policy if exists "resources_insert_authenticated" on public.resources;
create policy "resources_insert_authenticated"
  on public.resources for insert
  to authenticated
  with check (true);

drop policy if exists "resources_update_self" on public.resources;
create policy "resources_update_self"
  on public.resources for update
  to authenticated
  using (uploaded_by_id = auth.uid())
  with check (uploaded_by_id = auth.uid());

drop policy if exists "resources_delete_self" on public.resources;
create policy "resources_delete_self"
  on public.resources for delete
  to authenticated
  using (uploaded_by_id = auth.uid());
