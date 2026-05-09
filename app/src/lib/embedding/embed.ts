import "server-only";

import type {
  ResourceDTO,
  StartupDTO,
  TalentDTO,
} from "@/lib/data/types";

/**
 * Wrapper around OpenAI's `text-embedding-3-small` (1536-dim) — chosen to
 * match the `vector(1536)` columns in the profiles + resources tables.
 *
 * The embedder is intentionally side-effect-tolerant:
 *   - missing API key → returns null (caller persists row with embedding NULL)
 *   - HTTP error → logs + returns null (we'd rather store the row than fail)
 *   - empty input → returns null
 *
 * In-process content-hash cache keeps us from re-embedding identical strings
 * during onboarding edits / dev hot-reload. Per-process; resets on restart.
 */
const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;
const cache = new Map<string, number[]>();

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function embed(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[embedding] OPENAI_API_KEY not set; skipping embedding.");
    }
    return null;
  }

  const key = await sha256(trimmed);
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EMBED_MODEL, input: trimmed }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[embedding] OpenAI ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { data?: { embedding?: number[] }[] };
    const vec = json.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== EMBED_DIM) {
      console.warn(`[embedding] unexpected response shape; dim=${vec?.length ?? "?"}`);
      return null;
    }
    cache.set(key, vec);
    return vec;
  } catch (err) {
    console.warn(`[embedding] fetch failed:`, err);
    return null;
  }
}

/** Batched form — single API call for many inputs. Same fallback contract. */
export async function embedMany(texts: string[]): Promise<(number[] | null)[]> {
  const trimmed = texts.map((t) => t.trim());
  if (trimmed.every((t) => !t)) return texts.map(() => null);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return texts.map(() => null);

  // Pull anything cached out first.
  const out: (number[] | null)[] = new Array(trimmed.length).fill(null);
  const remaining: { idx: number; text: string; hash: string }[] = [];
  await Promise.all(
    trimmed.map(async (t, idx) => {
      if (!t) return;
      const h = await sha256(t);
      const hit = cache.get(h);
      if (hit) out[idx] = hit;
      else remaining.push({ idx, text: t, hash: h });
    }),
  );
  if (remaining.length === 0) return out;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: remaining.map((r) => r.text),
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[embedding] OpenAI batch ${res.status}: ${errText.slice(0, 200)}`);
      return out;
    }
    const json = (await res.json()) as { data?: { embedding?: number[]; index?: number }[] };
    const data = json.data ?? [];
    for (const row of data) {
      const slot = remaining[row.index ?? -1];
      if (!slot) continue;
      const vec = row.embedding;
      if (Array.isArray(vec) && vec.length === EMBED_DIM) {
        cache.set(slot.hash, vec);
        out[slot.idx] = vec;
      }
    }
  } catch (err) {
    console.warn(`[embedding] batch fetch failed:`, err);
  }
  return out;
}

// ── text composers ─────────────────────────────────────────────────────────
// What we feed the embedder. Two embeddings per profile so bidirectional
// matchmaking can ask "does A want what B is?" and "does B want what A is?"
// independently:
//
//   *Profile* — "who I am". Identity-side signal: headline, bio,
//               sector, what the company does. No lookingFor / needs.
//   *Wants*   — "who I want to match with". Demand-side signal: lookingFor,
//               stage preferences, needs, networksWanted, comp expectations.
//
// Keep these focused on matchable signal — never include email / contact
// handles / display-only fields.

export function textForTalentProfile(t: TalentDTO): string {
  return [
    t.headline,
    t.bio,
    t.lookingFor,
    (t.categories ?? []).length ? `Profile categories: ${(t.categories ?? []).join(", ")}` : "",
    (t.lookingForNeeds ?? []).length ? `Looking for roles: ${(t.lookingForNeeds ?? []).join(", ")}` : "",
    t.domains.length ? `Domains: ${t.domains.join(", ")}` : "",
    t.networks?.length ? `Networks: ${t.networks.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function textForTalentWants(t: TalentDTO): string {
  return [
    t.lookingFor,
    t.domains.length ? `Domains of interest: ${t.domains.join(", ")}` : "",
    t.stagePrefs?.length ? `Stage preferences: ${t.stagePrefs.join(", ")}` : "",
    t.availability ? `Availability: ${t.availability}` : "",
    t.compensation?.length ? `Comp: ${t.compensation.join(", ")}` : "",
    t.riskTolerance
      ? `Risk tolerance: ${t.riskTolerance}/5 — ${riskToleranceDescriptor(t.riskTolerance)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// 1 = wants only proven, late-stage companies; 5 = comfortable joining
// pre-product, pre-revenue startups. Surfaced to the LLM gate so it can flag
// pairs where appetite and stage are mismatched.
function riskToleranceDescriptor(r: 1 | 2 | 3 | 4 | 5): string {
  switch (r) {
    case 1: return "wants only established, post-traction companies";
    case 2: return "prefers companies with revenue and clear product-market fit";
    case 3: return "comfortable with seed-stage companies that have early traction";
    case 4: return "comfortable joining pre-seed companies before traction";
    case 5: return "wants the earliest stage — pre-product, founding-team risk";
  }
}

export function textForStartupProfile(s: StartupDTO): string {
  return [
    s.oneLiner,
    s.description,
    s.sector ? `Sector: ${s.sector}` : "",
    s.fundingStage ? `Stage: ${s.fundingStage}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function textForStartupWants(s: StartupDTO): string {
  return [
    s.needs.length ? `Looking to hire: ${s.needs.join(", ")}` : "",
    s.networksWanted?.length
      ? `Pulling from networks: ${s.networksWanted.join(", ")}`
      : "",
    s.fundingStage ? `Hiring for stage: ${s.fundingStage}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ── back-compat: search uses single profile-side embedding ────────────────
// Existing callers (SupabaseDataStore.search) want one embedding per profile.
// `embedding` column == profile embedding == textFor*Profile.
export function textForTalent(t: TalentDTO): string {
  return textForTalentProfile(t);
}

export function textForStartup(s: StartupDTO): string {
  return textForStartupProfile(s);
}

export function textForResource(r: ResourceDTO): string {
  // Summary is the canonical embedding text — captures *what gap this closes*.
  // Description is a fallback for rows that haven't been re-saved with a summary.
  return r.summary || r.description || r.title;
}

// ── cosine helper ──────────────────────────────────────────────────────────
// Used by the JS-side ranker before we wire the pgvector ORDER BY.

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const EMBEDDING_DIM = EMBED_DIM;
export const EMBEDDING_MODEL = EMBED_MODEL;
