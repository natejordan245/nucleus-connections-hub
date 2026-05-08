import type { IProfileStore } from "@/contracts/data-layer";
import type { TalentDTO, StartupDTO } from "@/contracts/data";
import { getMockProfileStore } from "../mock/MockProfileStore";
import { withFallback } from "../feature-flags";

/**
 * Supabase-backed profile store. Falls back to MockProfileStore on any failure
 * (auth missing, network, schema mismatch). Schema lives in /scripts/migrate.ts.
 */
export class SupabaseProfileStore implements IProfileStore {
  private clientCache: unknown = null;

  private async getClient() {
    if (this.clientCache) return this.clientCache;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
    const { createClient } = await import("@supabase/supabase-js");
    this.clientCache = createClient(url, key, {
      auth: { persistSession: false },
    });
    return this.clientCache;
  }

  async getTalent(id: string): Promise<TalentDTO | null> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { data, error } = await sb.from("talent").select("profile_jsonb").eq("id", id).maybeSingle();
        if (error) throw error;
        return (data?.profile_jsonb ?? null) as TalentDTO | null;
      },
      () => getMockProfileStore().getTalent(id),
      { adapter: "SupabaseProfileStore", op: "getTalent" }
    );
  }

  async putTalent(t: TalentDTO): Promise<void> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { error } = await sb.from("talent").upsert({
          id: t.id,
          name: t.name,
          email: t.email,
          headline: t.headline,
          bio: t.bio,
          skills: t.skills,
          domains: t.domains,
          availability: t.availability,
          compensation: t.compensation,
          stage_prefs: t.stagePrefs,
          risk_tolerance: t.riskTolerance,
          location: t.location,
          utah_org_ids: t.utahOrgs.map((o) => o.id),
          profile_jsonb: t,
        });
        if (error) throw error;
      },
      () => getMockProfileStore().putTalent(t),
      { adapter: "SupabaseProfileStore", op: "putTalent" }
    );
  }

  async listTalent(): Promise<TalentDTO[]> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { data, error } = await sb.from("talent").select("profile_jsonb");
        if (error) throw error;
        return (data ?? []).map((r: any) => r.profile_jsonb as TalentDTO);
      },
      () => getMockProfileStore().listTalent(),
      { adapter: "SupabaseProfileStore", op: "listTalent" }
    );
  }

  async getStartup(id: string): Promise<StartupDTO | null> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { data, error } = await sb.from("startup").select("profile_jsonb").eq("id", id).maybeSingle();
        if (error) throw error;
        return (data?.profile_jsonb ?? null) as StartupDTO | null;
      },
      () => getMockProfileStore().getStartup(id),
      { adapter: "SupabaseProfileStore", op: "getStartup" }
    );
  }

  async putStartup(s: StartupDTO): Promise<void> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { error } = await sb.from("startup").upsert({
          id: s.id,
          name: s.name,
          one_liner: s.oneLiner,
          description: s.description,
          sector: s.sector,
          origin: s.origin,
          trl: s.trl ?? null,
          funding_stage: s.fundingStage,
          funding_status: s.fundingStatus,
          needs: s.needs,
          location: s.location,
          utah_org_ids: s.utahOrgs.map((o) => o.id),
          profile_jsonb: s,
        });
        if (error) throw error;
      },
      () => getMockProfileStore().putStartup(s),
      { adapter: "SupabaseProfileStore", op: "putStartup" }
    );
  }

  /**
   * Real Postgres has no in-process counter. We delegate to the local mock
   * store's revision so the cache layer can still distinguish "stale" from
   * "fresh" within a single server process. Production-grade replacement: a
   * `pg_notify` listener that bumps an in-memory counter on every UPDATE.
   */
  getPoolRevision(): number {
    return getMockProfileStore().getPoolRevision();
  }

  async listStartups(): Promise<StartupDTO[]> {
    return withFallback(
      "profileStore",
      async () => {
        const sb = (await this.getClient()) as any;
        const { data, error } = await sb.from("startup").select("profile_jsonb");
        if (error) throw error;
        return (data ?? []).map((r: any) => r.profile_jsonb as StartupDTO);
      },
      () => getMockProfileStore().listStartups(),
      { adapter: "SupabaseProfileStore", op: "listStartups" }
    );
  }
}
