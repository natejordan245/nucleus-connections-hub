import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffinityPushDTO,
  InterestDTO,
  MatchDTO,
  NotificationDTO,
  ResourceDTO,
  StartupDTO,
  TalentDTO,
  UtahOrg,
} from "./types";
import type { IDataStore, VoteSide } from "./store";
import {
  cosineSimilarity,
  embed,
  textForResource,
  textForStartup,
  textForTalent,
} from "@/lib/embedding/embed";

/**
 * Live-mode data store. Reads/writes the `profiles` table (see migration
 * 20260508174314_profiles.sql). Identity comes from `auth.users.id`; profile
 * rows are 1:1 with auth users.
 *
 * Match / interest / notification / affinity-push surfaces are not yet wired
 * for live mode — those throw until the corresponding migrations land.
 */
export class SupabaseDataStore implements IDataStore {
  private clientPromise: Promise<SupabaseClient> | null = null;

  private async getClient(): Promise<SupabaseClient> {
    if (this.clientPromise) return this.clientPromise;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Live mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      );
    }
    this.clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, key, { auth: { persistSession: false } }),
    );
    return this.clientPromise;
  }

  // ── profiles → DTO mapping ────────────────────────────────────────────────

  private rowToTalent(row: ProfileRow): TalentDTO {
    const d = (row.data as Partial<TalentDTO>) ?? {};
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      headline: row.headline ?? "",
      bio: row.bio ?? "",
      lookingFor: d.lookingFor ?? "",
      skills: d.skills ?? [],
      domains: d.domains ?? [],
      availability: d.availability ?? "full-time",
      compensation: d.compensation ?? ["cash"],
      stagePrefs: d.stagePrefs ?? ["seed"],
      riskTolerance: (d.riskTolerance ?? 3) as TalentDTO["riskTolerance"],
      location: row.location ?? d.location ?? "Salt Lake City, UT",
      utahOrgIds: d.utahOrgIds ?? [],
      photoUrl: row.photo_url ?? d.photoUrl,
      linkedinUrl: d.linkedinUrl,
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      createdAt: row.created_at,
    };
  }

  private rowToStartup(row: ProfileRow): StartupDTO {
    const d = (row.data as Partial<StartupDTO>) ?? {};
    return {
      id: row.id,
      name: row.name,
      oneLiner: row.headline ?? d.oneLiner ?? "",
      description: row.bio ?? d.description ?? "",
      sector: d.sector ?? "software",
      origin: d.origin ?? "bootstrapped",
      trl: d.trl,
      fundingStage: d.fundingStage ?? "seed",
      fundingStatus: d.fundingStatus ?? "pre-revenue",
      needs: d.needs ?? [],
      location: row.location ?? d.location ?? "Salt Lake City, UT",
      utahOrgIds: d.utahOrgIds ?? [],
      logoUrl: row.photo_url ?? d.logoUrl,
      linkedinUrl: d.linkedinUrl,
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      createdAt: row.created_at,
    };
  }

  private talentToRow(t: TalentDTO): ProfileRowInsert {
    const { id, name, email, headline, bio, location, photoUrl, createdAt: _c, ...rest } = t;
    return {
      id,
      kind: "talent",
      name,
      email,
      headline,
      bio,
      location,
      photo_url: photoUrl ?? null,
      data: rest,
    };
  }

  private rowToResource(row: ResourceRow): ResourceDTO {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      kind: row.kind,
      url: row.url,
      tags: row.tags ?? [],
      summary: row.summary,
      uploadedById: row.uploaded_by_id,
      uploadedByName: row.uploaded_by_name,
      createdAt: row.created_at,
    };
  }

  private startupToRow(s: StartupDTO): ProfileRowInsert {
    const { id, name, oneLiner, description, location, logoUrl, createdAt: _c, ...rest } = s;
    return {
      id,
      kind: "startup",
      name,
      email: null,
      headline: oneLiner,
      bio: description,
      location,
      photo_url: logoUrl ?? null,
      data: rest,
    };
  }

  // ── reads ────────────────────────────────────────────────────────────────

  async listTalent(): Promise<TalentDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "talent")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToTalent(r as ProfileRow));
  }

  async getTalent(id: string): Promise<TalentDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "talent")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToTalent(data as ProfileRow) : null;
  }

  async listStartups(): Promise<StartupDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "startup")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToStartup(r as ProfileRow));
  }

  async getStartup(id: string): Promise<StartupDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "startup")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToStartup(data as ProfileRow) : null;
  }

  async listUtahOrgs(): Promise<UtahOrg[]> {
    // Utah-org graph isn't in Postgres yet — return empty until the migration
    // ships. Pages that consume this gracefully render no proximity pills.
    return [];
  }

  async search(query: string) {
    const sb = await this.getClient();
    const q = query.trim();
    if (!q) {
      const [talent, startups] = await Promise.all([this.listTalent(), this.listStartups()]);
      return { talent, startups, resources: [] as ResourceDTO[] };
    }
    const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .or(`name.ilike.${pattern},headline.ilike.${pattern},bio.ilike.${pattern}`)
      .limit(50);
    if (error) throw error;
    const rows = (data ?? []) as ProfileRow[];
    return {
      talent: rows.filter((r) => r.kind === "talent").map((r) => this.rowToTalent(r)),
      startups: rows.filter((r) => r.kind === "startup").map((r) => this.rowToStartup(r)),
      resources: [] as ResourceDTO[], // resources table not yet wired for live mode
    };
  }

  async listResources(): Promise<ResourceDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToResource(r as ResourceRow));
  }
  async getResource(id: string): Promise<ResourceDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("resources")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToResource(data as ResourceRow) : null;
  }
  async putResource(r: ResourceDTO): Promise<ResourceDTO> {
    const sb = await this.getClient();
    const embText = textForResource(r);
    const vec = await embed(embText);
    const payload: ResourceRowInsert = {
      title: r.title,
      description: r.description,
      kind: r.kind,
      url: r.url,
      tags: r.tags,
      summary: r.summary,
      uploaded_by_id: r.uploadedById,
      uploaded_by_name: r.uploadedByName,
      embedding_text: embText,
      embedding: vec ? toVectorLiteral(vec) : null,
    };
    // Use the DTO id when it's a UUID; otherwise let the DB generate one.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id);
    if (isUuid) (payload as ResourceRowInsert & { id?: string }).id = r.id;

    const { data, error } = await sb
      .from("resources")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToResource(data as ResourceRow);
  }

  // ── writes ───────────────────────────────────────────────────────────────

  async putTalent(t: TalentDTO): Promise<TalentDTO> {
    const sb = await this.getClient();
    const row = this.talentToRow(t);
    const embText = textForTalent(t);
    const vec = await embed(embText);
    const payload = {
      ...row,
      embedding_text: embText,
      embedding: vec ? toVectorLiteral(vec) : null,
    };
    const { data, error } = await sb
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToTalent(data as ProfileRow);
  }

  async putStartup(s: StartupDTO): Promise<StartupDTO> {
    const sb = await this.getClient();
    const row = this.startupToRow(s);
    const embText = textForStartup(s);
    const vec = await embed(embText);
    const payload = {
      ...row,
      embedding_text: embText,
      embedding: vec ? toVectorLiteral(vec) : null,
    };
    const { data, error } = await sb
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToStartup(data as ProfileRow);
  }

  // ── matches / interest / notifications / affinity ────────────────────────
  // Not yet implemented for live mode. Pages calling these will surface the
  // error to the user; demo mode is the working path until the migrations land.

  private notImplemented(op: string): never {
    throw new Error(
      `SupabaseDataStore.${op}: not yet wired for live mode. Run in demo mode (NEXT_PUBLIC_APP_MODE=demo) or add the missing migration.`,
    );
  }

  async matchesFor(viewerId: string): Promise<MatchDTO[]> {
    const sb = await this.getClient();
    const { data: viewerRow, error: viewerErr } = await sb
      .from("profiles")
      .select("*")
      .eq("id", viewerId)
      .maybeSingle();
    if (viewerErr || !viewerRow) return [];
    const viewer = viewerRow as ProfileRow;

    if (!viewer.embedding) return []; // no signal yet

    const oppositeKind: "talent" | "startup" =
      viewer.kind === "talent" ? "startup" : "talent";

    // Pull every candidate of the opposite kind that's already been embedded.
    // The pgvector index will eventually drive this via ORDER BY <=>; for now
    // we cosine in JS so the supabase-js / vector serialization quirks don't
    // block us from a working pipeline.
    const { data: candRows, error: candErr } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", oppositeKind)
      .not("embedding", "is", null);
    if (candErr || !candRows) return [];

    const viewerVec = parseVector(viewer.embedding);
    if (!viewerVec) return [];

    const ranked = candRows
      .map((row) => {
        const r = row as ProfileRow;
        const candVec = parseVector(r.embedding);
        if (!candVec) return null;
        const sim = cosineSimilarity(viewerVec, candVec);
        return { row: r, sim };
      })
      .filter((x): x is { row: ProfileRow; sim: number } => x !== null)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 10);

    return ranked.map((m) => this.toMatchDTO(viewer, m.row, m.sim));
  }

  private toMatchDTO(
    viewer: ProfileRow,
    cand: ProfileRow,
    sim: number,
  ): MatchDTO {
    const score = clamp01((sim + 1) / 2); // map cosine [-1,1] → [0,1]
    const reason = `Top semantic match against ${viewer.name}'s bio and lookingFor. (Live ranker is vector-only today; LLM rerank lands next.)`;
    return {
      id: `live-${viewer.id}-${cand.id}`,
      subjectId: viewer.id,
      candidateId: cand.id,
      candidateKind: cand.kind,
      score,
      reason,
      concerns: [],
      factors: [
        {
          label: "Semantic similarity",
          weight: score,
          detail: `Cosine ${sim.toFixed(3)} against ${cand.name}'s embedding text.`,
        },
      ],
      proximityBoost: 0,
      sharedOrgIds: [],
    };
  }
  async vote(_args: { talentId: string; startupId: string; side: VoteSide; state: "interested" | "pass" }) {
    return this.notImplemented("vote");
  }
  async getInterest(_args: { talentId: string; startupId: string }): Promise<InterestDTO | null> {
    return null;
  }
  async listInterests(_viewerId: string): Promise<InterestDTO[]> {
    return [];
  }
  async listNotifications(_recipientId: string): Promise<NotificationDTO[]> {
    return [];
  }
  async emitNotification(_n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO> {
    return this.notImplemented("emitNotification");
  }
  async markAllRead(_recipientId: string): Promise<void> {
    return;
  }
  async listAffinityPushes(): Promise<AffinityPushDTO[]> {
    return [];
  }
  async recordAffinityPush(_p: Omit<AffinityPushDTO, "id" | "pushedAt">): Promise<AffinityPushDTO> {
    return this.notImplemented("recordAffinityPush");
  }
}

// ── pgvector helpers ────────────────────────────────────────────────────────
// pgvector wants `vector` literals as `'[v1,v2,...]'` strings on the wire.
// supabase-js will pass them through as-is when the column type is `vector`.

function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

function parseVector(input: unknown): number[] | null {
  if (!input) return null;
  if (Array.isArray(input)) {
    return (input as unknown[]).every((n) => typeof n === "number")
      ? (input as number[])
      : null;
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
        return parsed as number[];
      }
    } catch {
      return null;
    }
  }
  return null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

// ── row shapes ──────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  kind: "talent" | "startup";
  name: string;
  email: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  photo_url: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  embedding_text: string | null;
  embedding: unknown;
};

type ProfileRowInsert = {
  id: string;
  kind: "talent" | "startup";
  name: string;
  email: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  photo_url: string | null;
  data: Record<string, unknown>;
};

type ResourceRow = {
  id: string;
  title: string;
  description: string;
  kind: ResourceDTO["kind"];
  url: string;
  tags: string[];
  summary: string;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
  embedding_text: string | null;
  embedding: unknown;
};

type ResourceRowInsert = {
  title: string;
  description: string;
  kind: ResourceDTO["kind"];
  url: string;
  tags: string[];
  summary: string;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  embedding_text: string | null;
  embedding: string | null;
};
