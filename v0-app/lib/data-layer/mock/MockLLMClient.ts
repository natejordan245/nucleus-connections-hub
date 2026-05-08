import type { ILLMClient } from "@/contracts/data-layer";
import type {
  TalentDTO,
  StartupDTO,
  RankedMatch,
  Verdict,
  Sector,
  Stage,
  Availability,
  Compensation,
} from "@/contracts/data";
import { embedSync, cosine } from "./MockEmbeddingClient";

/**
 * Deterministic, network-free stand-in for the OpenAI client.
 *  • extract*  — for canonical demo bios returns hand-tuned structured fields;
 *                for unknown bios runs simple keyword heuristics.
 *  • rerank    — uses real signal overlap (skills, sector, stage, comp,
 *                availability, location) to score, then templates a paragraph.
 *
 * The point: mock-mode end-to-end is structurally identical to real-mode
 * end-to-end. Switching DATA_MODE flips behavior without changing call sites.
 */
export class MockLLMClient implements ILLMClient {
  async extractTalent(bio: string): Promise<Partial<TalentDTO>> {
    const canned = CANNED_TALENT_EXTRACTS[normalizeBioKey(bio)];
    if (canned) return canned;
    return heuristicTalent(bio);
  }

  async extractStartup(description: string): Promise<Partial<StartupDTO>> {
    const canned = CANNED_STARTUP_EXTRACTS[normalizeBioKey(description)];
    if (canned) return canned;
    return heuristicStartup(description);
  }

  async rerank(args: {
    subject: TalentDTO | StartupDTO;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]> {
    const { subject, candidates } = args;
    const ranked = candidates.map((c) => scoreAndExplain(subject, c));
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }

  async rerankFromQuery(args: {
    query: string;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]> {
    const { query, candidates } = args;
    const queryVec = embedSync(query);
    const ranked = candidates.map((c) => scoreFromQuery(query, queryVec, c));
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Canned extracts for the canonical demo bios.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeBioKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
}

const CANNED_TALENT_EXTRACTS: Record<string, Partial<TalentDTO>> = {
  // Sarah Chen demo bio prefix
  [normalizeBioKey(
    "Eighteen years scaling enterprise SaaS GTM. VP of Sales at Qualtrics through the IPO"
  )]: {
    name: "Sarah Chen",
    headline: "Fractional GTM advisor — ex-Qualtrics VP Sales",
    skills: [
      "enterprise sales",
      "GTM strategy",
      "pricing",
      "RevOps",
      "channel partnerships",
      "sales hiring",
    ],
    domains: ["ai", "software"],
    availability: "fractional",
    compensation: ["equity"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 4,
    location: "Salt Lake City, UT",
  },
};

const CANNED_STARTUP_EXTRACTS: Record<string, Partial<StartupDTO>> = {
  // Lumen Bio demo description prefix
  [normalizeBioKey(
    "Lumen Bio is a University of Utah spinout commercializing photo-activatable"
  )]: {
    name: "Lumen Bio",
    oneLiner: "Light-activated cancer therapeutics — University of Utah spinout",
    sector: "life-sciences",
    origin: "u-of-u-spinout",
    trl: 4,
    fundingStage: "seed",
    fundingStatus: "grant",
    needs: ["ceo", "regulatory", "biz-dev"],
    location: "Salt Lake City, UT",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Heuristic extraction for unknown bios — good enough to keep the demo flowing.
// ─────────────────────────────────────────────────────────────────────────────

function heuristicTalent(bio: string): Partial<TalentDTO> {
  const lower = bio.toLowerCase();
  const availability: Availability = /full[- ]time|seeking a (ceo|cto|coo|vp|chief)/.test(lower)
    ? "full-time"
    : /fractional|advisor|advisory/.test(lower)
      ? "fractional"
      : /intern/.test(lower)
        ? "internship"
        : /mentor/.test(lower)
          ? "advisory"
          : "fractional";
  const compensation: Compensation[] = [];
  if (/equity/.test(lower)) compensation.push("equity");
  if (/cash|salary|paid/.test(lower)) compensation.push("cash");
  if (/mentor/.test(lower) && compensation.length === 0) compensation.push("mentor");
  if (compensation.length === 0) compensation.push("equity");
  return {
    headline: bio.split(/[.\n]/)[0]?.slice(0, 80),
    skills: extractKeywords(lower, SKILL_KEYWORDS),
    domains: matchSectors(lower),
    availability,
    compensation,
    stagePrefs: matchStages(lower),
    riskTolerance: /pre[- ]seed|founding/.test(lower) ? 5 : 3,
  };
}

function heuristicStartup(desc: string): Partial<StartupDTO> {
  const lower = desc.toLowerCase();
  const sectors = matchSectors(lower);
  return {
    oneLiner: desc.split(/[.\n]/)[0]?.slice(0, 100),
    sector: sectors[0] ?? "software",
    origin: /u of u|university of utah|huntsman/.test(lower)
      ? "u-of-u-spinout"
      : /byu/.test(lower)
        ? "byu-spinout"
        : /usu|utah state/.test(lower)
          ? "usu-spinout"
          : /vc-backed|series [ab]/.test(lower)
            ? "vc-backed"
            : "bootstrapped",
    fundingStage: matchStages(lower)[0] ?? "seed",
    fundingStatus: /grant|sbir|doe/.test(lower)
      ? "grant"
      : /revenue|customers|ARR/.test(lower)
        ? "revenue"
        : "pre-revenue",
    needs: matchNeeds(lower),
  };
}

const SKILL_KEYWORDS = [
  "enterprise sales", "gtm", "pricing", "marketing", "fundraising", "FDA",
  "regulatory", "operations", "supply chain", "engineering", "ML", "PyTorch",
  "platform", "security", "red teaming", "fintech", "payments", "energy",
];

function extractKeywords(text: string, keys: string[]): string[] {
  return keys.filter((k) => text.includes(k.toLowerCase()));
}

function matchSectors(text: string): Sector[] {
  const map: Array<[RegExp, Sector]> = [
    [/life[- ]sci|bio|medtech|pharma|fda|clinical/, "life-sciences"],
    [/\bAI\b|machine learning|llm|ml\b|deep learning/i, "ai"],
    [/defense|aerospace|hypersonic|dod|afwerx/, "defense-aerospace"],
    [/cyber|security|penetration|red team/, "cyber"],
    [/energy|grid|solar|nuclear|battery/, "energy"],
    [/manufactur|robotic|hardware|firmware/, "advanced-manufacturing"],
    [/fintech|payments|kyc|aml/, "fintech"],
    [/saas|software|developer|dev tools/, "software"],
  ];
  const hits: Sector[] = [];
  for (const [r, s] of map) if (r.test(text) && !hits.includes(s)) hits.push(s);
  return hits.length ? hits : ["software"];
}

function matchStages(text: string): Stage[] {
  const out: Stage[] = [];
  if (/pre[- ]seed/.test(text)) out.push("pre-seed");
  if (/\bseed\b/.test(text)) out.push("seed");
  if (/series[- ]a/.test(text)) out.push("series-a");
  if (/series[- ]b/.test(text)) out.push("series-b");
  if (/growth|series[- ]c/.test(text)) out.push("growth");
  return out.length ? out : ["seed", "series-a"];
}

function matchNeeds(text: string): StartupDTO["needs"] {
  const out: StartupDTO["needs"] = [];
  if (/\bceo\b/.test(text)) out.push("ceo");
  if (/\bcto\b/.test(text)) out.push("cto");
  if (/biz[- ]dev|business development/.test(text)) out.push("biz-dev");
  if (/regulatory|fda|itar/.test(text)) out.push("regulatory");
  if (/sales/.test(text)) out.push("sales-lead");
  if (/engineer|developer/.test(text)) out.push("engineering");
  if (/marketing|cmo|brand/.test(text)) out.push("marketing");
  return out.length ? out : ["biz-dev"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Templated rerank — score from real signal overlap, language from templates.
// ─────────────────────────────────────────────────────────────────────────────

function scoreAndExplain(
  subject: TalentDTO | StartupDTO,
  candidate: TalentDTO | StartupDTO
): RankedMatch {
  // Peer-mode (same kind on both sides) takes a different path because the
  // opposing-type scoring (skill→need, stage prefs, etc.) doesn't apply.
  if (isTalent(subject) === isTalent(candidate)) {
    return scorePeers(subject, candidate);
  }
  const subjectIsTalent = isTalent(subject);
  const talent = (subjectIsTalent ? subject : candidate) as TalentDTO;
  const startup = (subjectIsTalent ? candidate : subject) as StartupDTO;

  const sectorOverlap = talent.domains.includes(startup.sector) ? 1 : 0;
  const stageOverlap = talent.stagePrefs.includes(startup.fundingStage) ? 1 : 0;

  const skillToNeedScore = scoreSkillsAgainstNeeds(talent.skills, startup.needs);
  const compFit = scoreCompFit(talent.compensation, startup);
  const availabilityFit = scoreAvailability(talent.availability, startup);

  // Embedding-based semantic similarity baseline.
  const subjEmbed = embedSync(textForEmbedding(subject));
  const candEmbed = embedSync(textForEmbedding(candidate));
  const semantic = (cosine(subjEmbed, candEmbed) + 1) / 2; // map [-1..1] → [0..1]

  // Weighted blend → 0..1 final score (before proximity boost).
  const llmBase =
    0.30 * semantic +
    0.20 * sectorOverlap +
    0.15 * stageOverlap +
    0.20 * skillToNeedScore +
    0.10 * compFit +
    0.05 * availabilityFit;

  const score = clamp(llmBase, 0, 1);
  const verdict: Verdict = score >= 0.7 ? "strong" : score >= 0.5 ? "good" : "partial";

  const factors = {
    skillFit: explainSkills(talent, startup, skillToNeedScore),
    stageFit: explainStage(talent, startup, stageOverlap),
    utahSignal: explainUtah(talent, startup),
    concerns: explainConcerns(talent, startup, {
      sectorOverlap,
      stageOverlap,
      compFit,
      availabilityFit,
    }),
  };

  const reason = paragraphFor(talent, startup, score, factors);

  return {
    candidateId: candidate.id,
    candidate,
    score,
    verdict,
    reason,
    factors,
    proximityBoost: 0, // engine adds this on top
    proximityReasons: [],
  };
}

function isTalent(p: TalentDTO | StartupDTO): p is TalentDTO {
  return (p as TalentDTO).availability !== undefined;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function textForEmbedding(p: TalentDTO | StartupDTO): string {
  if (isTalent(p)) {
    const intent = p.lookingFor ? `Looking for: ${p.lookingFor}. ` : "";
    return `${intent}${p.headline}. ${p.bio}. Skills: ${p.skills.join(", ")}. Domains: ${p.domains.join(
      ", "
    )}. Stage prefs: ${p.stagePrefs.join(", ")}. Availability: ${p.availability}.`;
  }
  return `${p.oneLiner}. ${p.description}. Sector: ${p.sector}. Origin: ${p.origin}. Stage: ${
    p.fundingStage
  }. Needs: ${p.needs.join(", ")}.`;
}

const SKILL_TO_NEED: Record<string, StartupDTO["needs"][number][]> = {
  "enterprise sales": ["sales-lead", "biz-dev"],
  "GTM strategy": ["sales-lead", "biz-dev", "marketing"],
  pricing: ["sales-lead"],
  RevOps: ["sales-lead"],
  marketing: ["marketing"],
  brand: ["marketing"],
  fundraising: ["ceo"],
  "FDA strategy": ["regulatory", "ceo"],
  "medtech commercialization": ["ceo", "biz-dev"],
  "executive leadership": ["ceo"],
  "engineering leadership": ["cto", "engineering"],
  "platform architecture": ["cto", "engineering"],
  ITAR: ["regulatory"],
  "ITAR compliance": ["regulatory"],
  "DoD contracting": ["regulatory", "biz-dev"],
  "SBIR strategy": ["regulatory", "biz-dev"],
  "red teaming": ["engineering"],
  "cloud security": ["engineering"],
  Python: ["engineering"],
  PyTorch: ["engineering"],
  TypeScript: ["engineering"],
  React: ["engineering"],
  LLMs: ["engineering"],
  payments: ["ceo", "biz-dev"],
  fintech: ["ceo", "biz-dev"],
  "business development": ["biz-dev"],
  "pharma partnerships": ["biz-dev"],
  operations: ["ceo"],
  "supply chain": ["ceo"],
  "ISO 13485": ["ceo", "regulatory"],
  "DOE grants": ["regulatory", "biz-dev"],
};

function scoreSkillsAgainstNeeds(skills: string[], needs: StartupDTO["needs"]): number {
  if (skills.length === 0 || needs.length === 0) return 0;
  let hits = 0;
  for (const s of skills) {
    const mapped = SKILL_TO_NEED[s];
    if (mapped && mapped.some((n) => needs.includes(n))) hits++;
  }
  return clamp(hits / Math.max(2, needs.length), 0, 1);
}

function scoreCompFit(comp: Compensation[], s: StartupDTO): number {
  // Generous default: if startup pre-revenue and grant-funded, equity-only is fine.
  // If revenue, expect cash component.
  if (comp.includes("mentor")) return s.fundingStatus === "grant" ? 1 : 0.4;
  if (s.fundingStatus === "revenue" && !comp.includes("cash")) return 0.5;
  return 1;
}

function scoreAvailability(a: Availability, s: StartupDTO): number {
  const fullTimeRoles: StartupDTO["needs"][number][] = ["ceo", "cto"];
  const wantsFullTime = s.needs.some((n) => fullTimeRoles.includes(n));
  if (wantsFullTime && a !== "full-time") return 0.3;
  if (!wantsFullTime && a === "full-time") return 0.7;
  return 1;
}

function explainSkills(t: TalentDTO, s: StartupDTO, score: number): string {
  const matched = t.skills.filter((sk) => {
    const mapped = SKILL_TO_NEED[sk];
    return mapped && mapped.some((n) => s.needs.includes(n));
  });
  if (matched.length === 0) {
    return `Limited overlap between ${t.name}'s stated skills and ${s.name}'s immediate needs (${s.needs.join(", ")}).`;
  }
  return `${matched.slice(0, 3).join(", ")} — direct match for your '${s.needs.join("', '")}' need.${
    score < 0.5 ? " Some gaps remain." : ""
  }`;
}

function explainStage(t: TalentDTO, s: StartupDTO, overlap: number): string {
  if (overlap === 1) {
    return `${s.fundingStage} is in ${t.name.split(" ")[0]}'s stated preference range (${t.stagePrefs.join(", ")}).`;
  }
  return `Stage mismatch: ${t.name.split(" ")[0]} prefers ${t.stagePrefs.join(", ")}, ${s.name} is ${s.fundingStage}.`;
}

function explainUtah(t: TalentDTO, s: StartupDTO): string {
  const shared = sharedUtahOrgIds(t, s);
  const sharedNames = t.utahOrgs.filter((o) => shared.has(o.id)).map((o) => o.name);
  if (sharedNames.length === 0) {
    return "Both Utah-based, but no shared ecosystem affiliation.";
  }
  return `Shared affiliation: ${sharedNames.join(", ")}. Likely warm intro available.`;
}

function explainConcerns(
  t: TalentDTO,
  s: StartupDTO,
  parts: { sectorOverlap: number; stageOverlap: number; compFit: number; availabilityFit: number }
): string {
  const issues: string[] = [];
  if (parts.sectorOverlap === 0) {
    issues.push(
      `${t.name.split(" ")[0]}'s stated domains (${t.domains.join(", ")}) don't include ${s.sector}`
    );
  }
  if (parts.stageOverlap === 0) {
    issues.push(`stage gap (prefers ${t.stagePrefs.join("/")}, this is ${s.fundingStage})`);
  }
  if (parts.compFit < 1) {
    issues.push(
      `compensation alignment: ${t.compensation.join("/")} vs a ${s.fundingStatus}-stage company`
    );
  }
  if (parts.availabilityFit < 1) {
    issues.push(
      `availability mismatch: ${t.availability} vs roles like ${s.needs.join("/")}`
    );
  }
  return issues.length === 0
    ? "No structural concerns surfaced. Worth a 30-min intro call to verify mission fit."
    : `Watch-outs — ${issues.join("; ")}.`;
}

function paragraphFor(
  t: TalentDTO,
  s: StartupDTO,
  score: number,
  f: { skillFit: string; stageFit: string; utahSignal: string; concerns: string }
): string {
  const verdict =
    score >= 0.7
      ? "Strong fit."
      : score >= 0.5
        ? "Good directional fit."
        : "Partial fit worth a quick conversation.";
  return `${verdict} ${f.skillFit} ${f.stageFit} ${f.utahSignal}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Peer-mode scoring (talent ↔ talent or startup ↔ startup).
// Looks at shared Utah orgs, domain overlap, and complementary skills/stages —
// not the opposing-type stage/comp/availability gates.
// ─────────────────────────────────────────────────────────────────────────────

function scorePeers(
  subject: TalentDTO | StartupDTO,
  candidate: TalentDTO | StartupDTO
): RankedMatch {
  const subjEmbed = embedSync(textForEmbedding(subject));
  const candEmbed = embedSync(textForEmbedding(candidate));
  const semantic = (cosine(subjEmbed, candEmbed) + 1) / 2;

  const sharedOrgs = sharedUtahOrgIds(subject, candidate);
  const proximity = Math.min(1, sharedOrgs.size * 0.25);

  const subjectIsTalent = isTalent(subject) && isTalent(candidate);
  const sharedDomain = subjectIsTalent
    ? overlap(
        (subject as TalentDTO).domains as string[],
        (candidate as TalentDTO).domains as string[]
      )
    : 0;
  const sharedSkills = subjectIsTalent
    ? overlap(
        (subject as TalentDTO).skills,
        (candidate as TalentDTO).skills
      )
    : 0;

  const score = clamp(0.55 * semantic + 0.25 * proximity + 0.10 * sharedDomain + 0.10 * sharedSkills, 0, 1);
  const verdict: Verdict = score >= 0.7 ? "strong" : score >= 0.5 ? "good" : "partial";

  const sharedNames = subject.utahOrgs
    .filter((o) => sharedOrgs.has(o.id))
    .map((o) => o.name);

  const factors = {
    skillFit: subjectIsTalent
      ? sharedSkills > 0
        ? `Shared focus areas — both touch ${overlapList(
            (subject as TalentDTO).skills,
            (candidate as TalentDTO).skills
          ).slice(0, 3).join(", ")}.`
        : "Complementary skill stacks — limited literal overlap, but adjacent disciplines."
      : "Adjacent operating profiles.",
    stageFit: subjectIsTalent
      ? `Both work at ${commonStageLine(subject as TalentDTO, candidate as TalentDTO)}.`
      : "Operating-stage alignment.",
    utahSignal:
      sharedNames.length > 0
        ? `Shared affiliation: ${sharedNames.join(", ")}. Likely 1-degree connection.`
        : "Both Utah-based; no shared affiliation surfaced.",
    concerns:
      score < 0.5
        ? "Connection is largely semantic — verify mutual interest before reaching out."
        : "No structural concerns. A 30-min intro is the right next step.",
  };

  const reason = paragraphForPeers(subject, candidate, score, factors);

  return {
    candidateId: candidate.id,
    candidate,
    score,
    verdict,
    reason,
    factors,
    proximityBoost: 0,
    proximityReasons: [],
  };
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const set = new Set(a.map((x) => x.toLowerCase()));
  const hits = b.filter((x) => set.has(x.toLowerCase())).length;
  return Math.min(1, hits / Math.max(2, Math.min(a.length, b.length)));
}
function overlapList(a: string[], b: string[]): string[] {
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => set.has(x.toLowerCase()));
}
function commonStageLine(a: TalentDTO, b: TalentDTO): string {
  const setA = new Set(a.stagePrefs);
  const common = b.stagePrefs.filter((s) => setA.has(s));
  return common.length ? common.join(" / ") : `${a.stagePrefs[0]} / ${b.stagePrefs[0]}`;
}
function paragraphForPeers(
  a: { name: string; headline?: string; oneLiner?: string },
  b: { name: string; headline?: string; oneLiner?: string },
  score: number,
  f: { skillFit: string; stageFit: string; utahSignal: string; concerns: string }
): string {
  const verdict =
    score >= 0.7
      ? `Strong peer fit between ${a.name} and ${b.name}.`
      : score >= 0.5
        ? `Good peer overlap between ${a.name} and ${b.name}.`
        : `Some adjacency between ${a.name} and ${b.name}.`;
  return `${verdict} ${f.skillFit} ${f.utahSignal}`;
}

// Shared Utah-org helper used by both LLM (concerns) and the engine (proximity).
export function sharedUtahOrgIds(
  a: { utahOrgs: { id: string }[] },
  b: { utahOrgs: { id: string }[] }
): Set<string> {
  const set = new Set(a.utahOrgs.map((o) => o.id));
  const out = new Set<string>();
  for (const o of b.utahOrgs) if (set.has(o.id)) out.add(o.id);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query-anchored scoring. Used by `rerankFromQuery` (Search tab).
// Score = pure cosine similarity between query and candidate. Reasons quote
// matched terms back at the user so they can see *why* the system picked it.
// ─────────────────────────────────────────────────────────────────────────────

function scoreFromQuery(
  query: string,
  queryVec: number[],
  candidate: TalentDTO | StartupDTO
): RankedMatch {
  const candText = isTalent(candidate)
    ? `${candidate.headline}. ${candidate.bio}. Skills: ${candidate.skills.join(", ")}.`
    : `${candidate.oneLiner}. ${candidate.description}.`;
  const candVec = embedSync(candText);
  // Cosine of unit-normalized vectors lives in [-1, 1]; map to [0, 1] then
  // squash with a soft curve so good matches stand out from baseline noise.
  const sim = cosine(queryVec, candVec);
  const norm = (sim + 1) / 2;
  const score = clamp(Math.pow(norm, 1.6), 0, 1);

  const verdict: Verdict = score >= 0.7 ? "strong" : score >= 0.5 ? "good" : "partial";
  const matchedTerms = matchedTermsFor(query, candidate);

  const reason = paragraphForQuery(query, candidate, matchedTerms, score);
  const factors = {
    skillFit: matchedTerms.length
      ? `Matched on: ${matchedTerms.slice(0, 4).join(", ")}.`
      : "Semantic match — no exact keyword overlap.",
    stageFit: stageOrAvailabilityLine(candidate),
    utahSignal: utahSummary(candidate),
    concerns: concernsForQuery(query, candidate, matchedTerms),
  };

  return {
    candidateId: candidate.id,
    candidate,
    score,
    verdict,
    reason,
    factors,
    proximityBoost: 0,
    proximityReasons: [],
  };
}

/** Pull terms from `query` that also appear in the candidate's text. */
function matchedTermsFor(query: string, candidate: TalentDTO | StartupDTO): string[] {
  const cText = (isTalent(candidate)
    ? `${candidate.headline} ${candidate.bio} ${candidate.skills.join(" ")} ${candidate.location}`
    : `${candidate.oneLiner} ${candidate.description} ${candidate.sector} ${candidate.origin} ${candidate.location}`
  ).toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    if (cText.includes(t)) {
      out.push(t);
      seen.add(t);
    }
  }
  return out;
}

function paragraphForQuery(
  query: string,
  candidate: TalentDTO | StartupDTO,
  terms: string[],
  score: number
): string {
  const name = candidate.name;
  const verdict =
    score >= 0.7 ? "Strong match." : score >= 0.5 ? "Good fit." : "Partial overlap.";
  const intro = isTalent(candidate)
    ? `${name} is ${candidate.headline.toLowerCase()}.`
    : `${name} — ${candidate.oneLiner.toLowerCase()}.`;
  const matchClause = terms.length
    ? `Matches your search "${query.trim()}" on ${terms.slice(0, 3).join(", ")}.`
    : `Closest semantic neighbor to your search "${query.trim()}".`;
  return `${verdict} ${intro} ${matchClause}`;
}

function stageOrAvailabilityLine(candidate: TalentDTO | StartupDTO): string {
  if (isTalent(candidate)) {
    return `Availability: ${candidate.availability}; stage prefs: ${candidate.stagePrefs.join(", ")}.`;
  }
  return `Stage: ${candidate.fundingStage} (${candidate.fundingStatus}); needs: ${candidate.needs.join(", ")}.`;
}

function utahSummary(candidate: TalentDTO | StartupDTO): string {
  if (candidate.utahOrgs.length === 0) return `Based in ${candidate.location}.`;
  return `${candidate.location}. Affiliations: ${candidate.utahOrgs
    .slice(0, 3)
    .map((o) => o.name)
    .join(", ")}.`;
}

function concernsForQuery(
  query: string,
  candidate: TalentDTO | StartupDTO,
  matched: string[]
): string {
  if (matched.length >= 3) {
    return "Strong term overlap. Verify intent fit on a 15-min intro call.";
  }
  if (matched.length === 0) {
    return `No literal term overlap with "${query.trim()}" — this is a pure embedding-space neighbor. May be off-topic; double-check before reaching out.`;
  }
  return `Only matched on ${matched.length} term${matched.length > 1 ? "s" : ""} of your query. Read the bio carefully.`;
}
