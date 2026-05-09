import { NEED_LABELS } from "@/lib/data/enum-labels";
import type {
  BusinessDTO,
  CandidateDTO,
  ResourceDTO,
  StartupNeed,
} from "@/lib/data/types";

/**
 * Heuristic mapping from a business's stated need → the skills / topic
 * keywords a candidate would need to cover it. Used to compute the gap
 * between an applicant and a "perfect" match. The shape is the same one
 * an embedding-based recommender will replace later.
 */
const NEED_TO_KEYWORDS: Record<StartupNeed, string[]> = {
  "executive":    ["executive", "leadership", "founder", "operating", "scaling", "ceo"],
  "cofounder":    ["cofounder", "founder", "zero-to-one", "0-1", "ownership"],
  "coo":          ["coo", "operations", "process", "operating", "execution"],
  "fractional":   ["fractional", "part-time", "advisor", "interim"],
  "operator":     ["operator", "operating", "execution", "cross-functional"],
  "engineer":     ["engineer", "engineering", "technical", "systems", "architecture", "ml-infra"],
  "sales":        ["sales", "gtm", "enterprise-sales", "sales-leadership", "biz-dev"],
  "marketing":    ["marketing", "branding", "demand-gen", "content", "growth"],
  "student":      ["student", "new-grad", "entry-level", "research-assistant"],
  "intern":       ["intern", "internship", "co-op", "student"],
  "board-member": ["board", "governance", "board-coaching", "strategy"],
  "advisor-paid": ["advisor", "advisory", "fractional", "subject-matter", "sme"],
  "mentor-free":  ["mentor", "mentorship", "volunteer", "coach"],
  "ceo":         ["ceo", "fundraising", "operating", "scaling", "leadership", "operator-experience"],
  "cto":         ["cto", "engineering", "ml-infra", "machine-learning", "systems", "architecture"],
  "biz-dev":     ["business-development", "partnerships", "biz-dev"],
  "regulatory":  ["regulatory", "compliance", "fda", "policy"],
  "sales-lead":  ["sales-leadership", "sales-lead", "enterprise-sales", "gtm-strategy", "pricing", "gtm"],
  "engineering": ["engineering", "machine-learning", "ml-infra", "python", "infra", "systems", "microfluidics", "wet-lab", "bioinformatics"],
};

export type GapAnalysis = {
  /** Needs the candidate's existing skills already cover. */
  covered: StartupNeed[];
  /** Needs the candidate's skills don't yet hit. */
  gaps: StartupNeed[];
  /** Templated description of what's missing. Will be replaced by an LLM. */
  description: string;
};

/**
 * Compares a candidate's skills against a business's needs. Returns which needs
 * are already covered and which are open (the "gap"), plus a short
 * description suitable for showing the user.
 */
export function analyzeGap(candidate: CandidateDTO, business: BusinessDTO): GapAnalysis {
  const skillsLower = candidate.skills.map((s) => s.toLowerCase());
  const domainsLower = candidate.domains.map((s) => s.toLowerCase());
  const haystack = [...skillsLower, ...domainsLower];

  const covered: StartupNeed[] = [];
  const gaps: StartupNeed[] = [];
  for (const need of business.needs) {
    const keywords = NEED_TO_KEYWORDS[need] ?? [need];
    const hit = keywords.some((kw) =>
      haystack.some((s) => s.includes(kw)),
    );
    if (hit) covered.push(need);
    else gaps.push(need);
  }

  const description = describeGap(candidate, business, covered, gaps);
  return { covered, gaps, description };
}

function describeGap(
  candidate: CandidateDTO,
  business: BusinessDTO,
  covered: StartupNeed[],
  gaps: StartupNeed[],
): string {
  if (gaps.length === 0) {
    return `${candidate.name.split(" ")[0]} covers every need ${business.name} listed. The conversation is about fit, not gap-closing.`;
  }

  const coveredLabels = covered.map((n) => NEED_LABELS[n].toLowerCase());
  const gapLabels = gaps.map((n) => NEED_LABELS[n].toLowerCase());
  const lead = candidate.name.split(" ")[0];

  const have =
    coveredLabels.length === 0
      ? `${lead} is early in this domain`
      : `${lead} brings ${humanList(coveredLabels)}`;

  const need =
    gapLabels.length === 1
      ? `${business.name} also wants ${gapLabels[0]}`
      : `${business.name} also wants ${humanList(gapLabels)}`;

  return `${have}. ${need}. The resources below are the shortest path to closing that gap before the first conversation.`;
}

function humanList(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/**
 * Picks resources whose tags overlap with the gap-need keywords. Limited to
 * `limit` so the UI doesn't dump the whole library. When the embedding
 * recommender lands, it'll replace this body — the signature stays.
 */
export function recommendResourcesForGap(
  gaps: StartupNeed[],
  resources: ResourceDTO[],
  limit = 3,
): ResourceDTO[] {
  if (gaps.length === 0 || resources.length === 0) return [];

  const gapKeywords = new Set<string>();
  for (const need of gaps) {
    gapKeywords.add(need);
    for (const kw of NEED_TO_KEYWORDS[need] ?? []) gapKeywords.add(kw);
  }

  const scored = resources
    .map((r) => {
      let score = 0;
      const tagsLower = r.tags.map((t) => t.toLowerCase());
      for (const kw of gapKeywords) {
        if (tagsLower.some((t) => t.includes(kw))) score += 2;
        if (r.summary.toLowerCase().includes(kw)) score += 1;
      }
      return { r, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.r);
}
