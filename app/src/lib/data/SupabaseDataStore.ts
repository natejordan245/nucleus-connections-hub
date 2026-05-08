import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffinityPushDTO,
  InterestDTO,
  InterestState,
  MatchDTO,
  MessageDTO,
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
  textForStartupProfile,
  textForStartupWants,
  textForTalentProfile,
  textForTalentWants,
} from "@/lib/embedding/embed";
import { gatePair, type LLMGateVerdict } from "@/lib/match/llm-gate";

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
      categories: d.categories ?? ["operator"],
      lookingForNeeds: d.lookingForNeeds ?? [],
      skills: d.skills ?? [],
      domains: d.domains ?? [],
      availability: d.availability ?? "full-time",
      compensation: d.compensation ?? ["cash"],
      stagePrefs: d.stagePrefs ?? ["seed"],
      riskTolerance: (d.riskTolerance ?? 3) as TalentDTO["riskTolerance"],
      location: row.location ?? d.location ?? "Salt Lake City, UT",
      utahOrgIds: d.utahOrgIds ?? [],
      networks: d.networks ?? ["operator"],
      photoUrl: row.photo_url ?? d.photoUrl,
      linkedinUrl: d.linkedinUrl,
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      resumeExtract: d.resumeExtract,
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
      networksWanted: d.networksWanted ?? ["operator"],
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
      const [talent, startups, resources] = await Promise.all([
        this.listTalent(),
        this.listStartups(),
        this.listResources(),
      ]);
      return { talent, startups, resources };
    }

    // Embed the query and rank candidates by cosine similarity.
    // Falls back to ILIKE only if OpenAI is unreachable / key missing.
    const queryVec = await embed(q);
    if (queryVec) {
      const [{ data: profileRows, error: profileErr }, { data: resourceRows, error: resourceErr }] =
        await Promise.all([
          sb
            .from("profiles")
            .select("*")
            .not("embedding", "is", null),
          sb
            .from("resources")
            .select("*")
            .not("embedding", "is", null),
        ]);
      if (profileErr) throw profileErr;
      if (resourceErr) throw resourceErr;

      // Threshold uses the same normalized [0,1] scale as MatchDTO.score:
      //   score = (rawCosine + 1) / 2
      // 0.65 == raw cosine 0.30 — keeps obvious top hits, drops the long tail.
      const SCORE_THRESHOLD = 0.65;
      const rankedProfiles = ((profileRows ?? []) as ProfileRow[])
        .map((r) => {
          const vec = parseVector(r.embedding);
          if (!vec) return null;
          const sim = cosineSimilarity(queryVec, vec);
          return { row: r, sim, score: (sim + 1) / 2 };
        })
        .filter(
          (x): x is { row: ProfileRow; sim: number; score: number } =>
            x !== null && x.score >= SCORE_THRESHOLD,
        )
        .sort((a, b) => b.score - a.score);

      const rankedResources = ((resourceRows ?? []) as ResourceRow[])
        .map((r) => {
          const vec = parseVector(r.embedding);
          if (!vec) return null;
          const sim = cosineSimilarity(queryVec, vec);
          return { row: r, sim, score: (sim + 1) / 2 };
        })
        .filter(
          (x): x is { row: ResourceRow; sim: number; score: number } =>
            x !== null && x.score >= SCORE_THRESHOLD,
        )
        .sort((a, b) => b.score - a.score);

      return {
        talent: rankedProfiles
          .filter((x) => x.row.kind === "talent")
          .map((x) => this.rowToTalent(x.row)),
        startups: rankedProfiles
          .filter((x) => x.row.kind === "startup")
          .map((x) => this.rowToStartup(x.row)),
        resources: rankedResources.map((x) => this.rowToResource(x.row)),
      };
    }

    // Fallback: token-OR ILIKE when there's no embedding to rank with.
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
    const patterns = (tokens.length ? tokens : [q]).map(
      (t) => `%${t.replace(/[%_]/g, "\\$&")}%`,
    );
    const profileOr = patterns
      .flatMap((p) => [
        `name.ilike.${p}`,
        `headline.ilike.${p}`,
        `bio.ilike.${p}`,
        `embedding_text.ilike.${p}`,
      ])
      .join(",");
    const resourceOr = patterns
      .flatMap((p) => [
        `title.ilike.${p}`,
        `description.ilike.${p}`,
        `summary.ilike.${p}`,
      ])
      .join(",");

    const [{ data: profileRows, error: profileErr }, { data: resourceRows, error: resourceErr }] =
      await Promise.all([
        sb.from("profiles").select("*").or(profileOr).limit(50),
        sb.from("resources").select("*").or(resourceOr).limit(25),
      ]);
    if (profileErr) throw profileErr;
    if (resourceErr) throw resourceErr;

    const rows = (profileRows ?? []) as ProfileRow[];
    return {
      talent: rows.filter((r) => r.kind === "talent").map((r) => this.rowToTalent(r)),
      startups: rows.filter((r) => r.kind === "startup").map((r) => this.rowToStartup(r)),
      resources: ((resourceRows ?? []) as ResourceRow[]).map((r) => this.rowToResource(r)),
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
    const profileText = textForTalentProfile(t);
    const wantsText = textForTalentWants(t);
    const [profileVec, wantsVec] = await Promise.all([
      embed(profileText),
      embed(wantsText),
    ]);
    const payload = {
      ...row,
      embedding_text: profileText,
      embedding: profileVec ? toVectorLiteral(profileVec) : null,
      embedding_wants_text: wantsText,
      embedding_wants: wantsVec ? toVectorLiteral(wantsVec) : null,
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
    const profileText = textForStartupProfile(s);
    const wantsText = textForStartupWants(s);
    const [profileVec, wantsVec] = await Promise.all([
      embed(profileText),
      embed(wantsText),
    ]);
    const payload = {
      ...row,
      embedding_text: profileText,
      embedding: profileVec ? toVectorLiteral(profileVec) : null,
      embedding_wants_text: wantsText,
      embedding_wants: wantsVec ? toVectorLiteral(wantsVec) : null,
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

    // Need both embeddings to do bidirectional matching.
    const viewerProfile = parseVector(viewer.embedding);
    const viewerWants = parseVector(viewer.embedding_wants);
    if (!viewerProfile || !viewerWants) return [];

    const oppositeKind: "talent" | "startup" =
      viewer.kind === "talent" ? "startup" : "talent";

    const { data: candRows, error: candErr } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", oppositeKind)
      .not("embedding", "is", null)
      .not("embedding_wants", "is", null);
    if (candErr || !candRows) return [];

    const COSINE_FLOOR = 0.35; // each side must score ≥ 0.35 raw cosine.
    const TOP_N_BEFORE_LLM = 20; // cap LLM fan-out per call.

    const nearest = (candRows as ProfileRow[])
      .map((cand) => {
        // Hard filters first — drop the obviously incompatible.
        if (!passesHardFilters(viewer, cand)) return null;

        const candProfile = parseVector(cand.embedding);
        const candWants = parseVector(cand.embedding_wants);
        if (!candProfile || !candWants) return null;

        const viewerWantsCand = cosineSimilarity(viewerWants, candProfile);
        const candWantsViewer = cosineSimilarity(candWants, viewerProfile);

        if (viewerWantsCand < COSINE_FLOOR || candWantsViewer < COSINE_FLOOR) {
          return null;
        }

        // Min — not average — so lopsided pairs (strong one direction, weak
        // the other) get penalized. The weaker side governs the score.
        const composite = Math.min(viewerWantsCand, candWantsViewer);
        return { row: cand, viewerWantsCand, candWantsViewer, composite };
      })
      .filter(
        (
          x,
        ): x is {
          row: ProfileRow;
          viewerWantsCand: number;
          candWantsViewer: number;
          composite: number;
        } => x !== null,
      )
      .sort((a, b) => b.composite - a.composite)
      .slice(0, TOP_N_BEFORE_LLM);

    // LLM gate: per-pair verdict + summary, with cache lookup.
    const verdicts = await Promise.all(
      nearest.map(async (n) => {
        const verdict = await gatePair({
          sb,
          subject: {
            id: viewer.id,
            kind: viewer.kind,
            name: viewer.name,
            embeddingText: viewer.embedding_text ?? "",
            wantsText: viewer.embedding_wants_text ?? "",
          },
          candidate: {
            id: n.row.id,
            kind: n.row.kind,
            name: n.row.name,
            embeddingText: n.row.embedding_text ?? "",
            wantsText: n.row.embedding_wants_text ?? "",
          },
        });
        return { ...n, verdict };
      }),
    );

    // Keep cosine order; drop pairs the LLM rejects (or where the call failed).
    const matched = verdicts
      .filter((v) => v.verdict?.isMatch === true)
      .slice(0, 10);

    // Strong-match auto-notify: for any matched pair where the composite cosine
    // score crosses the strong-match threshold AND we haven't already notified
    // both sides about this pair, fire one notification per party + stamp
    // `notified_at` so we don't repeat. Fire-and-forget — failure here must
    // not block the matches response.
    void this.maybeNotifyStrongMatches(sb, viewer, matched);

    return matched.map((m) =>
      this.toMatchDTO(viewer, m.row, m.viewerWantsCand, m.candWantsViewer, m.verdict!),
    );
  }

  private async maybeNotifyStrongMatches(
    sb: SupabaseClient,
    viewer: ProfileRow,
    matched: Array<{
      row: ProfileRow;
      composite: number;
      viewerWantsCand: number;
      candWantsViewer: number;
      verdict: LLMGateVerdict | null;
    }>,
  ): Promise<void> {
    const STRONG_NORMALIZED = 0.75; // composite normalized score ≥ 0.75 is "very strong".
    try {
      for (const m of matched) {
        const normalized = clamp01((m.composite + 1) / 2);
        if (normalized < STRONG_NORMALIZED) continue;

        // Cache stores rows under (subject_id, candidate_id). For a strong
        // pair, notify both — but only if the *pair* (regardless of direction)
        // hasn't been notified yet. Check both directions.
        const { data: rows } = await sb
          .from("match_summaries")
          .select("subject_id, candidate_id, notified_at")
          .or(
            `and(subject_id.eq.${viewer.id},candidate_id.eq.${m.row.id}),and(subject_id.eq.${m.row.id},candidate_id.eq.${viewer.id})`,
          );
        const alreadyNotified = (rows ?? []).some(
          (r) => (r as { notified_at: string | null }).notified_at,
        );
        if (alreadyNotified) continue;

        const a = viewer;
        const b = m.row;
        const linkForA = `/profile/${b.kind}/${b.id}`;
        const linkForB = `/profile/${a.kind}/${a.id}`;

        await Promise.all([
          this.emitNotification({
            recipientId: a.id,
            kind: "mutual_match",
            title: `Strong match: ${b.name}`,
            body: `Cosine alignment is high on both sides. Open their profile to take a look.`,
            href: linkForA,
          }),
          this.emitNotification({
            recipientId: b.id,
            kind: "mutual_match",
            title: `Strong match: ${a.name}`,
            body: `Cosine alignment is high on both sides. Open their profile to take a look.`,
            href: linkForB,
          }),
        ]);

        // Stamp every cache row that touches this pair (both directions).
        await sb
          .from("match_summaries")
          .update({ notified_at: new Date().toISOString() })
          .or(
            `and(subject_id.eq.${a.id},candidate_id.eq.${b.id}),and(subject_id.eq.${b.id},candidate_id.eq.${a.id})`,
          );
      }
    } catch (err) {
      console.warn("[matches] strong-match notify failed:", err);
    }
  }

  private toMatchDTO(
    viewer: ProfileRow,
    cand: ProfileRow,
    viewerWantsCand: number,
    candWantsViewer: number,
    verdict: LLMGateVerdict,
  ): MatchDTO {
    const composite = Math.min(viewerWantsCand, candWantsViewer);
    const score = clamp01((composite + 1) / 2);
    const verdictWeight: Record<LLMGateVerdict["factors"][number]["verdict"], number> = {
      strong: 0.95,
      ok: 0.75,
      weak: 0.45,
      miss: 0.15,
    };
    return {
      id: `live-${viewer.id}-${cand.id}`,
      subjectId: viewer.id,
      candidateId: cand.id,
      candidateKind: cand.kind,
      score,
      reason: verdict.summary,
      concerns: verdict.concerns,
      factors: verdict.factors.map((f) => ({
        label: f.label,
        weight: verdictWeight[f.verdict] ?? 0.5,
        detail: f.detail,
      })),
      proximityBoost: 0,
      sharedOrgIds: [],
    };
  }
  // ── interest handshake ────────────────────────────────────────────────────
  async vote(args: { talentId: string; startupId: string; side: VoteSide; state: "interested" | "pass" }) {
    const sb = await this.getClient();
    const { talentId, startupId, side, state } = args;

    // Read existing row (if any) so we can detect a mutual flip on this update.
    const { data: prior } = await sb
      .from("interests")
      .select("*")
      .eq("talent_id", talentId)
      .eq("startup_id", startupId)
      .maybeSingle();

    const priorTalent = (prior?.talent_state as InterestState | undefined) ?? "pending";
    const priorStartup = (prior?.startup_state as InterestState | undefined) ?? "pending";
    const newTalent = side === "talent" ? state : priorTalent;
    const newStartup = side === "startup" ? state : priorStartup;
    const wasMutual = !!prior?.mutual_at;
    const isMutual = newTalent === "interested" && newStartup === "interested";
    const mutualJustNow = isMutual && !wasMutual;
    const mutualAt = isMutual ? prior?.mutual_at ?? new Date().toISOString() : null;

    const payload = {
      talent_id: talentId,
      startup_id: startupId,
      talent_state: newTalent,
      startup_state: newStartup,
      mutual_at: mutualAt,
    };
    const { data: row, error } = await sb
      .from("interests")
      .upsert(payload, { onConflict: "talent_id,startup_id" })
      .select("*")
      .single();
    if (error) throw error;
    const interest = this.rowToInterest(row as InterestRow);

    return { interest, mutualJustNow };
  }

  async getInterest({ talentId, startupId }: { talentId: string; startupId: string }): Promise<InterestDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("interests")
      .select("*")
      .eq("talent_id", talentId)
      .eq("startup_id", startupId)
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToInterest(data as InterestRow) : null;
  }

  async listInterests(viewerId: string): Promise<InterestDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("interests")
      .select("*")
      .or(`talent_id.eq.${viewerId},startup_id.eq.${viewerId}`)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToInterest(r as InterestRow));
  }

  // ── notifications ─────────────────────────────────────────────────────────
  async listNotifications(recipientId: string): Promise<NotificationDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("notifications")
      .select("*")
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToNotification(r as NotificationRow));
  }

  async emitNotification(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("notifications")
      .insert({
        recipient_id: n.recipientId,
        kind: n.kind,
        title: n.title,
        body: n.body,
        href: n.href,
      })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToNotification(data as NotificationRow);
  }

  async markAllRead(recipientId: string): Promise<void> {
    const sb = await this.getClient();
    await sb
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", recipientId)
      .is("read_at", null);
  }

  // ── affinity push log (admin queue → CRM) ─────────────────────────────────
  async listAffinityPushes(): Promise<AffinityPushDTO[]> {
    // Live mode treats the mutual-match log itself as the push log; we surface
    // every mutual interest as a push entry. (No CRM destination yet.)
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("interests")
      .select("*")
      .not("mutual_at", "is", null)
      .order("mutual_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((r) => {
      const row = r as InterestRow;
      return {
        id: `push-${row.id}`,
        talentId: row.talent_id,
        startupId: row.startup_id,
        pushedAt: row.mutual_at ?? row.updated_at,
        reason: "Mutual interest — both sides confirmed.",
        status: "pushed" as const,
      };
    });
  }

  async recordAffinityPush(p: Omit<AffinityPushDTO, "id" | "pushedAt">): Promise<AffinityPushDTO> {
    // No-op in live mode — listAffinityPushes derives from mutual interests.
    return {
      ...p,
      id: `push-noop-${Date.now()}`,
      pushedAt: new Date().toISOString(),
    };
  }

  // ── messaging ─────────────────────────────────────────────────────────────
  async listMessages({ viewerId, otherId }: { viewerId: string; otherId: string }): Promise<MessageDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("messages")
      .select("*")
      .eq("pair_key", pairKey(viewerId, otherId))
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToMessage(r as MessageRow));
  }

  async sendMessage({ senderId, recipientId, body }: { senderId: string; recipientId: string; body: string }): Promise<MessageDTO> {
    const sb = await this.getClient();
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Message body is required.");

    // Enforce: messages only between mutually-matched parties.
    const { data: interest } = await sb
      .from("interests")
      .select("mutual_at")
      .or(
        `and(talent_id.eq.${senderId},startup_id.eq.${recipientId}),and(talent_id.eq.${recipientId},startup_id.eq.${senderId})`,
      )
      .not("mutual_at", "is", null)
      .maybeSingle();
    if (!interest) {
      throw new Error("Cannot message: pair has not mutually matched.");
    }

    const { data: row, error } = await sb
      .from("messages")
      .insert({
        pair_key: pairKey(senderId, recipientId),
        sender_id: senderId,
        recipient_id: recipientId,
        body: trimmed,
      })
      .select("*")
      .single();
    if (error) throw error;
    const message = this.rowToMessage(row as MessageRow);

    // Notify the recipient.
    await this.emitNotification({
      recipientId,
      kind: "message_received",
      title: "New message",
      body: trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed,
      href: `/messages?with=${senderId}`,
    });

    return message;
  }

  // ── gap-closing resource recommender ──────────────────────────────────────
  // Pulls the cached LLM verdict for the pair, builds a "gap text" out of the
  // weak/miss factors + concerns, embeds it, and cosine-matches against every
  // embedded resource. Falls back to a structural gap text if no LLM verdict
  // is cached.
  async recommendGapResources({
    subjectId,
    candidateId,
    limit = 3,
  }: {
    subjectId: string;
    candidateId: string;
    limit?: number;
  }): Promise<{ gapText: string; resources: ResourceDTO[] }> {
    const sb = await this.getClient();

    // 1. Find an LLM verdict — try (subject, candidate) first, then reverse
    // (the cache is direction-specific but both sides give us the gap signal).
    const { data: verdictRows } = await sb
      .from("match_summaries")
      .select("subject_id, candidate_id, factors, concerns")
      .or(
        `and(subject_id.eq.${subjectId},candidate_id.eq.${candidateId}),and(subject_id.eq.${candidateId},candidate_id.eq.${subjectId})`,
      );
    const verdict = (verdictRows ?? []).find(
      (r) => (r as { subject_id: string }).subject_id === subjectId,
    ) ?? verdictRows?.[0];

    // 2. Build the gap text. The LLM gave us per-factor verdicts (strong / ok /
    // weak / miss) plus short concern strings — the weak/miss factors and the
    // concerns are exactly the gap signal we want to embed.
    const gapText = await this.buildGapText(
      sb,
      subjectId,
      candidateId,
      verdict as
        | {
            factors?: Array<{ label: string; verdict: string; detail: string }>;
            concerns?: string[];
          }
        | undefined,
    );
    if (!gapText) return { gapText: "", resources: [] };

    // 3. Embed + cosine-rank resources.
    const queryVec = await embed(gapText);
    if (!queryVec) return { gapText, resources: [] };

    const { data: resourceRows } = await sb
      .from("resources")
      .select("*")
      .not("embedding", "is", null);

    const ranked = ((resourceRows ?? []) as ResourceRow[])
      .map((r) => {
        const vec = parseVector(r.embedding);
        if (!vec) return null;
        return { row: r, sim: cosineSimilarity(queryVec, vec) };
      })
      .filter((x): x is { row: ResourceRow; sim: number } => x !== null)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, limit);

    return {
      gapText,
      resources: ranked.map((r) => this.rowToResource(r.row)),
    };
  }

  private async buildGapText(
    sb: SupabaseClient,
    subjectId: string,
    candidateId: string,
    verdict?: {
      factors?: Array<{ label: string; verdict: string; detail: string }>;
      concerns?: string[];
    },
  ): Promise<string> {
    // Preferred path: LLM verdict in cache. Take the weak/miss factor details
    // and the concerns — they describe the gap in natural language.
    if (verdict?.factors?.length || verdict?.concerns?.length) {
      const weak = (verdict.factors ?? [])
        .filter((f) => f.verdict === "weak" || f.verdict === "miss")
        .map((f) => `${f.label}: ${f.detail}`);
      const concerns = verdict.concerns ?? [];
      const parts = [...weak, ...concerns].filter(Boolean);
      if (parts.length > 0) {
        return [
          "What would close the gap between this match:",
          ...parts.map((p) => `- ${p}`),
        ].join("\n");
      }
    }

    // Fallback: no LLM cache yet. Pull both rows and synthesize a structural
    // gap text from raw embedding_text fields. Less precise, still useful.
    const { data: rows } = await sb
      .from("profiles")
      .select("id, kind, name, embedding_wants_text, embedding_text")
      .in("id", [subjectId, candidateId]);
    if (!rows || rows.length < 2) return "";
    const subject = rows.find(
      (r) => (r as { id: string }).id === subjectId,
    ) as
      | {
          id: string;
          kind: string;
          name: string;
          embedding_text: string | null;
          embedding_wants_text: string | null;
        }
      | undefined;
    const candidate = rows.find(
      (r) => (r as { id: string }).id === candidateId,
    ) as
      | {
          id: string;
          kind: string;
          name: string;
          embedding_text: string | null;
          embedding_wants_text: string | null;
        }
      | undefined;
    if (!subject || !candidate) return "";

    return [
      `${subject.name} is interested in ${candidate.name} but isn't a perfect match.`,
      `What ${subject.name} is currently looking for: ${subject.embedding_wants_text ?? "(unknown)"}`,
      `What ${candidate.name} is looking for: ${candidate.embedding_wants_text ?? "(unknown)"}`,
      `What ${candidate.name} is: ${candidate.embedding_text ?? "(unknown)"}`,
      "Surface resources that would help close the gap.",
    ].join("\n\n");
  }

  // ── admin lookup ──────────────────────────────────────────────────────────
  // Public so the API layer can fan out admin notifications without reaching
  // into internals. Resolves ADMIN_EMAILS to profile ids.
  async resolveAdminUserIds(): Promise<string[]> {
    const raw = process.env.ADMIN_EMAILS ?? "";
    const emails = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return [];

    const sb = await this.getClient();
    const { data } = await sb
      .from("profiles")
      .select("id, email")
      .in("email", emails);
    return (data ?? []).map((r) => (r as { id: string }).id);
  }

  // ── row → DTO mapping for the new tables ──────────────────────────────────
  private rowToInterest(row: InterestRow): InterestDTO {
    return {
      id: row.id,
      talentId: row.talent_id,
      startupId: row.startup_id,
      talentState: row.talent_state,
      startupState: row.startup_state,
      mutualAt: row.mutual_at,
    };
  }

  private rowToNotification(row: NotificationRow): NotificationDTO {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.created_at,
      readAt: row.read_at,
    };
  }

  private rowToMessage(row: MessageRow): MessageDTO {
    return {
      id: row.id,
      pairKey: row.pair_key,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      body: row.body,
      createdAt: row.created_at,
    };
  }
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
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

// ── hard filters ────────────────────────────────────────────────────────────
// Cheap predicates that drop pairs the embedding can't possibly fix. Run
// before the cosine compute so we don't burn cycles on obvious mismatches.

function passesHardFilters(viewer: ProfileRow, cand: ProfileRow): boolean {
  const talent = viewer.kind === "talent" ? viewer : cand;
  const startup = viewer.kind === "startup" ? viewer : cand;
  const t = (talent.data ?? {}) as {
    stagePrefs?: string[];
    availability?: string;
    networks?: string[];
  };
  const s = (startup.data ?? {}) as {
    fundingStage?: string;
    needs?: string[];
    networksWanted?: string[];
  };

  // Stage overlap — talent's preferred stages must include the startup's stage.
  if (t.stagePrefs?.length && s.fundingStage) {
    if (!t.stagePrefs.includes(s.fundingStage)) return false;
  }

  // Networks overlap — talent's network must intersect the startup's wanted set.
  if (t.networks?.length && s.networksWanted?.length) {
    const overlap = t.networks.some((n) => s.networksWanted!.includes(n));
    if (!overlap) return false;
  }

  // Availability ↔ needs alignment.
  // - Full-time talent only matches startups with FTE-style needs.
  // - Advisory talent only matches startups asking for advisors / mentors.
  if (t.availability === "advisory") {
    const wantsAdvisors = (s.networksWanted ?? []).some((n) =>
      ["mentor", "sme-advisory", "venture"].includes(n),
    );
    if (!wantsAdvisors) return false;
  } else if (t.availability === "full-time" || t.availability === "part-time") {
    const wantsHires = (s.needs ?? []).length > 0;
    if (!wantsHires) return false;
  }

  return true;
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
  embedding_wants_text: string | null;
  embedding_wants: unknown;
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

type InterestRow = {
  id: string;
  talent_id: string;
  startup_id: string;
  talent_state: InterestState;
  startup_state: InterestState;
  mutual_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: string;
  recipient_id: string;
  kind: NotificationDTO["kind"];
  title: string;
  body: string;
  href: string;
  created_at: string;
  read_at: string | null;
};

type MessageRow = {
  id: string;
  pair_key: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};
