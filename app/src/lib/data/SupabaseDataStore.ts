import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AffinityPushDTO,
  BusinessDTO,
  CandidateDTO,
  InterestDTO,
  InterestState,
  InvestorDTO,
  MatchDTO,
  MentorDTO,
  MessageDTO,
  NotificationDTO,
  ProfileKind,
  ResourceDTO,
  UtahOrg,
} from "./types";
import type { IDataStore, VoteSide } from "./store";
import {
  cosineSimilarity,
  embed,
  embedMany,
  textForResource,
  textForStartupProfile,
  textForStartupWants,
  textForTalentProfile,
  textForTalentWants,
} from "@/lib/embedding/embed";
import { gatePair, gatePairs, type LLMGateVerdict } from "@/lib/match/llm-gate";

/**
 * Live-mode data store. Reads/writes the `profiles` table (see migration
 * 20260508174314_profiles.sql, retitled by 20260509000000_four_kind_pivot.sql).
 * Identity comes from `auth.users.id`; profile rows are 1:1 with auth users.
 *
 * Match / interest / notification / affinity-push surfaces work for the
 * candidate↔business pair only; mentor and investor profiles store and
 * display but do not yet enter the matching flow.
 */

/**
 * Process-scoped cache of Affinity pushes that have run this server lifetime.
 * Keyed by `${talentId}:${startupId}`. Hydrating live-mode pushes from a
 * Supabase table would require a migration; for the hackathon build we keep
 * the cache in memory and fall back to "queued" placeholders for mutual
 * matches that haven't been pushed yet in this process. Resets on restart.
 */
const pushCache = new Map<string, AffinityPushDTO>();

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

  private rowToCandidate(row: ProfileRow): CandidateDTO {
    const d = (row.data as Partial<CandidateDTO>) ?? {};
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      headline: row.headline ?? "",
      bio: row.bio ?? "",
      lookingFor: d.lookingFor ?? "",
      categories: d.categories ?? ["operator"],
      lookingForNeeds: d.lookingForNeeds ?? [],
      domains: d.domains ?? [],
      availability: d.availability ?? "full-time",
      compensation: d.compensation ?? ["cash"],
      stagePrefs: d.stagePrefs ?? ["seed"],
      riskTolerance: (d.riskTolerance ?? 3) as CandidateDTO["riskTolerance"],
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

  private rowToBusiness(row: ProfileRow): BusinessDTO {
    const d = (row.data as Partial<BusinessDTO>) ?? {};
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
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      bioExtract: d.bioExtract,
      createdAt: row.created_at,
    };
  }

  private rowToMentor(row: ProfileRow): MentorDTO {
    const d = (row.data as Partial<MentorDTO>) ?? {};
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      headline: row.headline ?? "",
      bio: row.bio ?? "",
      areasAdvised: d.areasAdvised ?? [],
      hoursPerMonth: typeof d.hoursPerMonth === "number" ? d.hoursPerMonth : 4,
      boardSeatOpen: d.boardSeatOpen ?? false,
      compPreference: d.compPreference ?? ["mentor"],
      sectorsOfInterest: d.sectorsOfInterest ?? [],
      location: row.location ?? d.location ?? "Salt Lake City, UT",
      utahOrgIds: d.utahOrgIds ?? [],
      networks: d.networks ?? ["mentor"],
      photoUrl: row.photo_url ?? d.photoUrl,
      linkedinUrl: d.linkedinUrl,
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      bioExtract: d.bioExtract,
      createdAt: row.created_at,
    };
  }

  private rowToInvestor(row: ProfileRow): InvestorDTO {
    const d = (row.data as Partial<InvestorDTO>) ?? {};
    return {
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      fundName: d.fundName,
      headline: row.headline ?? "",
      bio: row.bio ?? "",
      checkSizeMin: d.checkSizeMin,
      checkSizeMax: d.checkSizeMax,
      sectorsInvested: d.sectorsInvested ?? [],
      stagePrefs: d.stagePrefs ?? ["seed"],
      location: row.location ?? d.location ?? "Salt Lake City, UT",
      utahOrgIds: d.utahOrgIds ?? [],
      networks: d.networks ?? ["venture"],
      photoUrl: row.photo_url ?? d.photoUrl,
      linkedinUrl: d.linkedinUrl,
      xUrl: d.xUrl,
      websiteUrl: d.websiteUrl,
      createdAt: row.created_at,
    };
  }

  private candidateToRow(c: CandidateDTO): ProfileRowInsert {
    const { id, name, email, headline, bio, location, photoUrl, createdAt: _c, ...rest } = c;
    return {
      id,
      kind: "candidate",
      name,
      email,
      headline,
      bio,
      location,
      photo_url: photoUrl ?? null,
      data: rest,
    };
  }

  private businessToRow(b: BusinessDTO): ProfileRowInsert {
    const { id, name, oneLiner, description, location, logoUrl, createdAt: _c, ...rest } = b;
    return {
      id,
      kind: "business",
      name,
      email: null,
      headline: oneLiner,
      bio: description,
      location,
      photo_url: logoUrl ?? null,
      data: rest,
    };
  }

  private mentorToRow(m: MentorDTO): ProfileRowInsert {
    const { id, name, email, headline, bio, location, photoUrl, createdAt: _c, ...rest } = m;
    return {
      id,
      kind: "mentor",
      name,
      email,
      headline,
      bio,
      location,
      photo_url: photoUrl ?? null,
      data: rest,
    };
  }

  private investorToRow(i: InvestorDTO): ProfileRowInsert {
    const { id, name, email, headline, bio, location, photoUrl, createdAt: _c, ...rest } = i;
    return {
      id,
      kind: "investor",
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

  // ── reads ────────────────────────────────────────────────────────────────

  async listCandidates(): Promise<CandidateDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "candidate")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToCandidate(r as ProfileRow));
  }

  async getCandidate(id: string): Promise<CandidateDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "candidate")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToCandidate(data as ProfileRow) : null;
  }

  async listBusinesses(): Promise<BusinessDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "business")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToBusiness(r as ProfileRow));
  }

  async getBusiness(id: string): Promise<BusinessDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "business")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToBusiness(data as ProfileRow) : null;
  }

  async listMentors(): Promise<MentorDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "mentor")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToMentor(r as ProfileRow));
  }

  async getMentor(id: string): Promise<MentorDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "mentor")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToMentor(data as ProfileRow) : null;
  }

  async listInvestors(): Promise<InvestorDTO[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", "investor")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => this.rowToInvestor(r as ProfileRow));
  }

  async getInvestor(id: string): Promise<InvestorDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("kind", "investor")
      .maybeSingle();
    if (error) throw error;
    return data ? this.rowToInvestor(data as ProfileRow) : null;
  }

  async getProfileKind(id: string): Promise<ProfileKind | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("kind")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? ((data as { kind: ProfileKind }).kind) : null;
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
      const [candidates, businesses, mentors, investors, resources] = await Promise.all([
        this.listCandidates(),
        this.listBusinesses(),
        this.listMentors(),
        this.listInvestors(),
        this.listResources(),
      ]);
      return { candidates, businesses, mentors, investors, resources };
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
        candidates: rankedProfiles
          .filter((x) => x.row.kind === "candidate")
          .map((x) => this.rowToCandidate(x.row)),
        businesses: rankedProfiles
          .filter((x) => x.row.kind === "business")
          .map((x) => this.rowToBusiness(x.row)),
        mentors: rankedProfiles
          .filter((x) => x.row.kind === "mentor")
          .map((x) => this.rowToMentor(x.row)),
        investors: rankedProfiles
          .filter((x) => x.row.kind === "investor")
          .map((x) => this.rowToInvestor(x.row)),
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
      candidates: rows.filter((r) => r.kind === "candidate").map((r) => this.rowToCandidate(r)),
      businesses: rows.filter((r) => r.kind === "business").map((r) => this.rowToBusiness(r)),
      mentors: rows.filter((r) => r.kind === "mentor").map((r) => this.rowToMentor(r)),
      investors: rows.filter((r) => r.kind === "investor").map((r) => this.rowToInvestor(r)),
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

  async putCandidate(c: CandidateDTO): Promise<CandidateDTO> {
    const sb = await this.getClient();
    const row = this.candidateToRow(c);
    const profileText = textForTalentProfile(c);
    const wantsText = textForTalentWants(c);
    const [profileVec, wantsVec] = await embedMany([profileText, wantsText]);
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
    return this.rowToCandidate(data as ProfileRow);
  }

  async putBusiness(b: BusinessDTO): Promise<BusinessDTO> {
    const sb = await this.getClient();
    const row = this.businessToRow(b);
    const profileText = textForStartupProfile(b);
    const wantsText = textForStartupWants(b);
    const [profileVec, wantsVec] = await embedMany([profileText, wantsText]);
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
    return this.rowToBusiness(data as ProfileRow);
  }

  async putMentor(m: MentorDTO): Promise<MentorDTO> {
    const sb = await this.getClient();
    const row = this.mentorToRow(m);
    // Mentors aren't yet matched, but we still embed the bio for free-text
    // search to surface them in /search results.
    const profileText = `${m.headline}\n\n${m.bio}\n\nAdvises: ${m.areasAdvised.join(", ")}\nNetworks: ${m.networks.join(", ")}`;
    const profileVec = await embed(profileText);
    const payload = {
      ...row,
      embedding_text: profileText,
      embedding: profileVec ? toVectorLiteral(profileVec) : null,
      embedding_wants_text: null,
      embedding_wants: null,
    };
    const { data, error } = await sb
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToMentor(data as ProfileRow);
  }

  async putInvestor(i: InvestorDTO): Promise<InvestorDTO> {
    const sb = await this.getClient();
    const row = this.investorToRow(i);
    const profileText = `${i.fundName ? `${i.fundName} — ` : ""}${i.headline}\n\n${i.bio}\n\nInvests in: ${i.sectorsInvested.join(", ")}\nStages: ${i.stagePrefs.join(", ")}`;
    const profileVec = await embed(profileText);
    const payload = {
      ...row,
      embedding_text: profileText,
      embedding: profileVec ? toVectorLiteral(profileVec) : null,
      embedding_wants_text: null,
      embedding_wants: null,
    };
    const { data, error } = await sb
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return this.rowToInvestor(data as ProfileRow);
  }

  // ── matches / interest / notifications / affinity ────────────────────────

  // On-demand single-pair match. Reads both profile rows, runs the LLM gate
  // (which caches per-pair in `match_summaries`, so repeat calls are free),
  // and returns a MatchDTO regardless of the gate's `isMatch` verdict — the
  // user explicitly asked for "show me this even if I'm not a great fit, then
  // show me what would close the gap."
  //
  // Hard filters are intentionally skipped here. matchesFor() uses them to
  // prune the top-K rank, but a user who navigated to a profile via search
  // wants the analysis even when the structural fit is poor.
  async computeMatch({
    subjectId,
    candidateId,
  }: {
    subjectId: string;
    candidateId: string;
  }): Promise<MatchDTO | null> {
    if (subjectId === candidateId) return null;
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .in("id", [subjectId, candidateId]);
    if (error || !data || data.length < 2) return null;
    const rows = data as ProfileRow[];
    const viewer = rows.find((r) => r.id === subjectId);
    const cand = rows.find((r) => r.id === candidateId);
    if (!viewer || !cand) return null;

    // Best-effort cosines — the LLM gate doesn't need them, but toMatchDTO
    // uses the composite to compute the displayed score. If either side is
    // missing vectors we still return a verdict-driven MatchDTO with score 0;
    // the gap-closer + factor strip carry the information.
    const viewerProfile = parseVector(viewer.embedding);
    const viewerWants = parseVector(viewer.embedding_wants);
    const candProfile = parseVector(cand.embedding);
    const candWants = parseVector(cand.embedding_wants);
    let viewerWantsCand = 0;
    let candWantsViewer = 0;
    if (viewerWants && candProfile) {
      viewerWantsCand = cosineSimilarity(viewerWants, candProfile);
    }
    if (candWants && viewerProfile) {
      candWantsViewer = cosineSimilarity(candWants, viewerProfile);
    }

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
        id: cand.id,
        kind: cand.kind,
        name: cand.name,
        embeddingText: cand.embedding_text ?? "",
        wantsText: cand.embedding_wants_text ?? "",
      },
    });
    if (!verdict) return null;

    return this.toMatchDTO(viewer, cand, viewerWantsCand, candWantsViewer, verdict);
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

    // Mentor / Investor profiles do not yet enter the matching flow.
    if (viewer.kind !== "candidate" && viewer.kind !== "business") return [];

    // Need both embeddings to do bidirectional matching.
    const viewerProfile = parseVector(viewer.embedding);
    const viewerWants = parseVector(viewer.embedding_wants);
    if (!viewerProfile || !viewerWants) return [];

    const oppositeKind: ProfileKind =
      viewer.kind === "candidate" ? "business" : "candidate";

    const { data: candRows, error: candErr } = await sb
      .from("profiles")
      .select("*")
      .eq("kind", oppositeKind)
      .not("embedding", "is", null)
      .not("embedding_wants", "is", null);
    if (candErr || !candRows) return [];

    const COSINE_FLOOR = 0.2; // each side must score ≥ 0.2 raw cosine. The LLM gate still filters noise.
    const TOP_N_BEFORE_LLM = 25; // cap LLM fan-out per call. Final list slices to 15 after LLM rejection.

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

    // LLM gate: per-pair verdict + summary, with cache lookup. Batched —
    // one Supabase select for all cached rows + one upsert for new rows,
    // not N of each.
    const subjectGate = {
      id: viewer.id,
      kind: viewer.kind,
      name: viewer.name,
      embeddingText: viewer.embedding_text ?? "",
      wantsText: viewer.embedding_wants_text ?? "",
    };
    const gateVerdicts = await gatePairs({
      sb,
      pairs: nearest.map((n) => ({
        subject: subjectGate,
        candidate: {
          id: n.row.id,
          kind: n.row.kind,
          name: n.row.name,
          embeddingText: n.row.embedding_text ?? "",
          wantsText: n.row.embedding_wants_text ?? "",
        },
      })),
    });
    const verdicts = nearest.map((n, i) => ({ ...n, verdict: gateVerdicts[i] }));

    // Keep cosine order; drop pairs the LLM rejects (or where the call failed).
    const matched = verdicts
      .filter((v) => v.verdict?.isMatch === true)
      .slice(0, 15);

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
  // The DB columns `talent_id` / `startup_id` are kept for compat; semantically
  // they hold the candidate-side and business-side ids of the binary handshake.
  async vote(args: { candidateId: string; businessId: string; side: VoteSide; state: "interested" | "pass" }) {
    const sb = await this.getClient();
    const { candidateId, businessId, side, state } = args;

    const { data: prior } = await sb
      .from("interests")
      .select("*")
      .eq("talent_id", candidateId)
      .eq("startup_id", businessId)
      .maybeSingle();

    const priorTalent = (prior?.talent_state as InterestState | undefined) ?? "pending";
    const priorStartup = (prior?.startup_state as InterestState | undefined) ?? "pending";
    const newTalent = side === "candidate" ? state : priorTalent;
    const newStartup = side === "business" ? state : priorStartup;
    const wasMutual = !!prior?.mutual_at;
    const isMutual = newTalent === "interested" && newStartup === "interested";
    const mutualJustNow = isMutual && !wasMutual;
    const mutualAt = isMutual ? prior?.mutual_at ?? new Date().toISOString() : null;

    const payload = {
      talent_id: candidateId,
      startup_id: businessId,
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

  async getInterest({ candidateId, businessId }: { candidateId: string; businessId: string }): Promise<InterestDTO | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("interests")
      .select("*")
      .eq("talent_id", candidateId)
      .eq("startup_id", businessId)
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
  //
  // Live mode derives the row list from mutual `interests`, then enriches
  // each row with the rich Affinity-side payload from `pushCache` if a push
  // has already been recorded this process. On a cold start the rows render
  // with `syncState: "queued"` and no Affinity ids — the UI surfaces a retry
  // button that re-runs the pipeline.
  async listAffinityPushes(): Promise<AffinityPushDTO[]> {
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
      const cacheKey = `${row.talent_id}:${row.startup_id}`;
      const cached = pushCache.get(cacheKey);
      if (cached) return cached;
      return {
        id: `push-${row.id}`,
        talentId: row.talent_id,
        startupId: row.startup_id,
        pushedAt: row.mutual_at ?? row.updated_at,
        reason: "Mutual interest — both sides confirmed.",
        status: "queued" as const,
        affinityOrganizationId: null,
        affinityPersonId: null,
        affinityListEntryId: null,
        affinityListId: null,
        affinityUrl: null,
        pipelineStage: null,
        syncState: "queued" as const,
        syncError: null,
        apiCalls: [],
        fieldValues: [],
      };
    });
  }

  async recordAffinityPush(p: {
    talentId: string;
    startupId: string;
    reason: string;
    matchScore?: number;
  }): Promise<AffinityPushDTO> {
    const [candidate, business] = await Promise.all([
      this.getCandidate(p.talentId),
      this.getBusiness(p.startupId),
    ]);

    const base = {
      id: `push-${p.talentId}-${p.startupId}-${Date.now()}`,
      talentId: p.talentId,
      startupId: p.startupId,
      pushedAt: new Date().toISOString(),
      reason: p.reason,
    };

    if (!candidate || !business) {
      const failed: AffinityPushDTO = {
        ...base,
        status: "queued",
        affinityOrganizationId: null,
        affinityPersonId: null,
        affinityListEntryId: null,
        affinityListId: null,
        affinityUrl: null,
        pipelineStage: null,
        syncState: "failed",
        syncError: "Candidate or business not found.",
        apiCalls: [],
        fieldValues: [],
      };
      pushCache.set(`${p.talentId}:${p.startupId}`, failed);
      return failed;
    }

    const { pushMutualMatch } = await import("@/lib/affinity");
    const result = await pushMutualMatch({
      talent: candidate,
      startup: business,
      matchScore: p.matchScore,
      reason: p.reason,
    });

    let dto: AffinityPushDTO;
    if (result.ok) {
      dto = {
        ...base,
        status: "pushed",
        affinityOrganizationId: result.payload.organizationId,
        affinityPersonId: result.payload.personId,
        affinityListEntryId: result.payload.listEntryId,
        affinityListId: result.payload.listId,
        affinityUrl: result.payload.affinityUrl,
        pipelineStage: result.payload.pipelineStage,
        syncState: "synced",
        syncError: null,
        apiCalls: result.payload.apiCalls,
        fieldValues: result.payload.fieldValues,
      };
    } else {
      dto = {
        ...base,
        status: "queued",
        affinityOrganizationId: null,
        affinityPersonId: null,
        affinityListEntryId: null,
        affinityListId: null,
        affinityUrl: null,
        pipelineStage: null,
        syncState: "failed",
        syncError: result.error,
        apiCalls: result.apiCalls,
        fieldValues: [],
      };
    }
    pushCache.set(`${p.talentId}:${p.startupId}`, dto);
    return dto;
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

    const { data: verdictRows } = await sb
      .from("match_summaries")
      .select("subject_id, candidate_id, factors, concerns")
      .or(
        `and(subject_id.eq.${subjectId},candidate_id.eq.${candidateId}),and(subject_id.eq.${candidateId},candidate_id.eq.${subjectId})`,
      );
    const verdict = (verdictRows ?? []).find(
      (r) => (r as { subject_id: string }).subject_id === subjectId,
    ) ?? verdictRows?.[0];

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
// Currently only applies to candidate↔business pairs.

function passesHardFilters(viewer: ProfileRow, cand: ProfileRow): boolean {
  // Skip hard filters for any pair touching mentor/investor — those kinds
  // don't enter matching yet, but defensively return true if they show up.
  if (viewer.kind === "mentor" || viewer.kind === "investor") return true;
  if (cand.kind === "mentor" || cand.kind === "investor") return true;

  const candidate = viewer.kind === "candidate" ? viewer : cand;
  const business = viewer.kind === "business" ? viewer : cand;
  const c = (candidate.data ?? {}) as {
    stagePrefs?: string[];
    availability?: string;
    networks?: string[];
    riskTolerance?: number;
  };
  const b = (business.data ?? {}) as {
    fundingStage?: string;
    needs?: string[];
    networksWanted?: string[];
  };

  // Stage overlap — candidate's preferred stages must include the business's stage.
  if (c.stagePrefs?.length && b.fundingStage) {
    if (!c.stagePrefs.includes(b.fundingStage)) return false;
  }

  // Risk-tolerance ↔ stage extremes. Conservative: only drop the obvious
  // mismatches and let the LLM gate evaluate the middle. Risk 1 candidates
  // want post-traction companies; risk 5 candidates want the earliest stage.
  if (c.riskTolerance != null && b.fundingStage) {
    if (c.riskTolerance === 1 && (b.fundingStage === "pre-seed" || b.fundingStage === "seed")) {
      return false;
    }
    if (c.riskTolerance === 5 && (b.fundingStage === "series-b" || b.fundingStage === "growth")) {
      return false;
    }
  }

  // Networks overlap — candidate's network must intersect the business's wanted set.
  if (c.networks?.length && b.networksWanted?.length) {
    const overlap = c.networks.some((n) => b.networksWanted!.includes(n));
    if (!overlap) return false;
  }

  // Availability ↔ needs alignment.
  // - Full-time candidate only matches businesses with FTE-style needs.
  // - Advisory candidate only matches businesses asking for advisors / mentors.
  if (c.availability === "advisory") {
    const wantsAdvisors = (b.networksWanted ?? []).some((n) =>
      ["mentor", "sme-advisory", "venture"].includes(n),
    );
    if (!wantsAdvisors) return false;
  } else if (c.availability === "full-time" || c.availability === "part-time") {
    const wantsHires = (b.needs ?? []).length > 0;
    if (!wantsHires) return false;
  }

  return true;
}

// ── row shapes ──────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  kind: ProfileKind;
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
  kind: ProfileKind;
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
