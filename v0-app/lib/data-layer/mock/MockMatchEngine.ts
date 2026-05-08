import type { IMatchEngine, IProfileStore, IEmbeddingClient, ILLMClient } from "@/contracts/data-layer";
import type { TalentDTO, StartupDTO, RankedMatch, PipelineTimings } from "@/contracts/data";
import { cosine, embedSync } from "./MockEmbeddingClient";
import { sharedUtahOrgIds } from "./MockLLMClient";

const PROXIMITY_CAP = 0.25;
const PROXIMITY_WEIGHTS = {
  sharedUtahOrg: 0.05,
  sameUniversity: 0.10,
  sameCity: 0.05,
  spinoutAffinity: 0.10,
} as const;

/**
 * Mock match engine. Same shape as PgvectorMatchEngine but in-process.
 *
 * Stages:
 *   1) hard gates (SQL in real, in-memory filter here)
 *   2) vector retrieval (top-K cosine over MockEmbeddingClient vectors)
 *   3) LLM rerank (templated)
 *   4) Utah proximity boost
 */
export class MockMatchEngine implements IMatchEngine {
  constructor(
    private store: IProfileStore,
    private embedder: IEmbeddingClient,
    private llm: ILLMClient
  ) {}

  async findMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    const k = args.k ?? 20;
    const target = args.target ?? (args.type === "talent" ? "startup" : "talent");
    const isPeerMode = target === args.type;
    const pipelineMs: PipelineTimings = { gates: 0, vector: 0, rerank: 0 };

    // ── Subject ──────────────────────────────────────────────────────────────
    const subject =
      args.type === "talent"
        ? await this.store.getTalent(args.for)
        : await this.store.getStartup(args.for);
    if (!subject) {
      throw new Error(`Subject not found: ${args.type} id=${args.for}`);
    }

    // ── Stage 1: gates ──────────────────────────────────────────────────────
    // Subject-mode (talent ↔ startup) runs the structural gates. Peer-mode
    // (talent ↔ talent) skips them — two operators don't have stage/comp gates
    // — and just excludes the viewer from the candidate pool.
    const t0 = now();
    const candidatePool = await this.loadPool(target);
    const gated = isPeerMode
      ? candidatePool.filter((c) => c.id !== subject.id)
      : candidatePool.filter((c) => passesGates(subject, c, args.type));
    pipelineMs.gates = elapsed(t0);

    // ── Stage 2: vector top-K (cosine over assembled-paragraph embeddings) ──
    const t1 = now();
    const subjectVec = embedSync(textForEmbedding(subject));
    const scored = gated.map((c) => ({
      candidate: c,
      sim: cosine(subjectVec, embedSync(textForEmbedding(c))),
    }));
    scored.sort((a, b) => b.sim - a.sim);
    const topK = scored.slice(0, k).map((s) => s.candidate);
    pipelineMs.vector = elapsed(t1);

    // ── Stage 3: LLM rerank ──────────────────────────────────────────────────
    const t2 = now();
    const reranked = await this.llm.rerank({ subject, candidates: topK });
    pipelineMs.rerank = elapsed(t2);

    // ── Stage 4: Utah proximity boost ────────────────────────────────────────
    // Proximity boost only applies in talent↔startup mode (peer-mode gets
    // proximity baked into the rerank reasons themselves).
    const boosted = isPeerMode
      ? reranked
      : reranked.map((m) => applyProximityBoost(subject, m, args.type));
    boosted.sort((a, b) => b.score - a.score);

    return { matches: boosted, pipelineMs };
  }

  async findFromQuery(args: {
    query: string;
    target: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    const k = args.k ?? 20;
    const pipelineMs: PipelineTimings = { gates: 0, vector: 0, rerank: 0 };

    if (!args.query.trim()) return { matches: [], pipelineMs };

    // No gates in query mode — the query is intent, not a constraint.
    const pool = await this.loadPool(args.target);

    // Stage 2: embed the query, find nearest neighbors.
    const t1 = now();
    const queryVec = embedSync(args.query);
    const scored = pool.map((c) => ({
      candidate: c,
      sim: cosine(queryVec, embedSync(textForEmbedding(c))),
    }));
    scored.sort((a, b) => b.sim - a.sim);
    const topK = scored.slice(0, k).map((s) => s.candidate);
    pipelineMs.vector = elapsed(t1);

    // Stage 3: query-anchored rerank.
    const t2 = now();
    const reranked = await this.llm.rerankFromQuery({
      query: args.query,
      candidates: topK,
    });
    pipelineMs.rerank = elapsed(t2);

    return { matches: reranked, pipelineMs };
  }

  private async loadPool(
    type: "talent" | "startup"
  ): Promise<Array<TalentDTO | StartupDTO>> {
    return type === "talent" ? this.store.listTalent() : this.store.listStartups();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gates: hard structural filters that run before any AI cost.
// ─────────────────────────────────────────────────────────────────────────────

export function passesGates(
  subject: TalentDTO | StartupDTO,
  candidate: TalentDTO | StartupDTO,
  subjectType: "talent" | "startup"
): boolean {
  const talent = (subjectType === "talent" ? subject : candidate) as TalentDTO;
  const startup = (subjectType === "talent" ? candidate : subject) as StartupDTO;

  // Stage match: talent must have the startup's stage in their preferences.
  if (!talent.stagePrefs.includes(startup.fundingStage)) return false;

  // Compensation match: at least one mode in common.
  //   - mentor-only candidates only fit grant-stage / pre-revenue
  //   - revenue-stage startups can pay cash
  const compOk =
    (talent.compensation.includes("mentor") &&
      (startup.fundingStatus === "grant" || startup.fundingStatus === "pre-revenue")) ||
    talent.compensation.includes("equity") ||
    talent.compensation.includes("cash");
  if (!compOk) return false;

  // Availability vs needs (loose): if startup needs a CEO/CTO, talent must be
  // full-time or fractional. Internships only fit "engineering" / "marketing".
  const wantsExec = startup.needs.some((n) => n === "ceo" || n === "cto");
  if (wantsExec && (talent.availability === "internship" || talent.availability === "advisory")) {
    return false;
  }
  if (talent.availability === "internship") {
    const internOk = startup.needs.some((n) => n === "engineering" || n === "marketing");
    if (!internOk) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proximity boost: Utah-specific signal LinkedIn can't compute.
// ─────────────────────────────────────────────────────────────────────────────

export function applyProximityBoost(
  subject: TalentDTO | StartupDTO,
  match: RankedMatch,
  subjectType: "talent" | "startup"
): RankedMatch {
  const talent = (subjectType === "talent" ? subject : match.candidate) as TalentDTO;
  const startup = (subjectType === "talent" ? match.candidate : subject) as StartupDTO;

  const reasons: string[] = [];
  let boost = 0;

  const sharedOrgs = sharedUtahOrgIds(talent, startup);
  if (sharedOrgs.size > 0) {
    boost += PROXIMITY_WEIGHTS.sharedUtahOrg * sharedOrgs.size;
    const names = talent.utahOrgs
      .filter((o) => sharedOrgs.has(o.id))
      .map((o) => o.name);
    reasons.push(`Shared Utah org${sharedOrgs.size > 1 ? "s" : ""}: ${names.join(", ")}`);
  }

  if (sharedUniversity(talent, startup)) {
    boost += PROXIMITY_WEIGHTS.sameUniversity;
    reasons.push("Same university lineage");
  }

  if (sameCity(talent.location, startup.location)) {
    boost += PROXIMITY_WEIGHTS.sameCity;
    reasons.push(`Both based in ${cityOf(talent.location)}`);
  }

  if (
    isSpinout(startup) &&
    talent.utahOrgs.some((o) => o.type === "tto" || o.type === "university")
  ) {
    boost += PROXIMITY_WEIGHTS.spinoutAffinity;
    reasons.push("Talent has TTO/university affiliation that maps to a spinout startup");
  }

  const cappedBoost = Math.min(boost, PROXIMITY_CAP);
  const finalScore = Math.min(1, match.score + cappedBoost);

  const verdict =
    finalScore >= 0.7 ? "strong" : finalScore >= 0.5 ? "good" : "partial";

  return {
    ...match,
    score: finalScore,
    proximityBoost: cappedBoost,
    proximityReasons: reasons,
    verdict,
  };
}

function sharedUniversity(talent: TalentDTO, startup: StartupDTO): boolean {
  const talentUnis = new Set<string>();
  for (const o of talent.utahOrgs) for (const u of o.universities ?? []) talentUnis.add(u);
  for (const o of startup.utahOrgs) {
    for (const u of o.universities ?? []) if (talentUnis.has(u)) return true;
  }
  return false;
}

function sameCity(a: string, b: string): boolean {
  return cityOf(a).toLowerCase() === cityOf(b).toLowerCase();
}
function cityOf(loc: string): string {
  return loc.split(",")[0]?.trim() ?? loc;
}

function isSpinout(s: StartupDTO): boolean {
  return s.origin === "u-of-u-spinout" || s.origin === "byu-spinout" || s.origin === "usu-spinout";
}

function textForEmbedding(p: TalentDTO | StartupDTO): string {
  if ("availability" in p) {
    // `lookingFor` carries explicit intent and gets prepended so it dominates
    // the embedding when present — matching by intent, not just by biography.
    const intent = p.lookingFor ? `Looking for: ${p.lookingFor}. ` : "";
    return `${intent}${p.headline}. ${p.bio}. Skills: ${p.skills.join(", ")}. Domains: ${p.domains.join(
      ", "
    )}. Stage prefs: ${p.stagePrefs.join(", ")}. Availability: ${p.availability}.`;
  }
  return `${p.oneLiner}. ${p.description}. Sector: ${p.sector}. Origin: ${p.origin}. Stage: ${
    p.fundingStage
  }. Needs: ${p.needs.join(", ")}.`;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function elapsed(start: number): number {
  return Math.round(now() - start);
}
