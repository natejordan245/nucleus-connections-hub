import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffinityPushDTO,
  InterestDTO,
  MatchDTO,
  NotificationDTO,
  StartupDTO,
  TalentDTO,
  UtahOrg,
} from "./types";
import type { IDataStore, VoteSide } from "./store";

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
      return { talent, startups };
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
    };
  }

  // ── writes ───────────────────────────────────────────────────────────────

  async putTalent(t: TalentDTO): Promise<TalentDTO> {
    const sb = await this.getClient();
    const row = this.talentToRow(t);
    const { data, error } = await sb
      .from("profiles")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToTalent(data as ProfileRow);
  }

  async putStartup(s: StartupDTO): Promise<StartupDTO> {
    const sb = await this.getClient();
    const row = this.startupToRow(s);
    const { data, error } = await sb
      .from("profiles")
      .upsert(row, { onConflict: "id" })
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

  async matchesFor(_id: string): Promise<MatchDTO[]> {
    // Match table doesn't exist yet — return empty so live-mode pages render
    // without throwing.
    return [];
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
