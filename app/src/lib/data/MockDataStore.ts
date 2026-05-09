import type {
  AffinityPushDTO,
  InterestDTO,
  MatchDTO,
  MessageDTO,
  NotificationDTO,
  ResourceDTO,
  StartupDTO,
  TalentDTO,
  UtahOrg,
} from "./types";
import {
  baselineInterests,
  baselineMatches,
  baselineNotifications,
  baselinePushes,
  baselineResources,
  startups,
  talents,
  utahOrgs,
} from "./seed";
import type { IDataStore, VoteSide } from "./store";
import { DEMO_PERSONAS } from "@/lib/mode";

// In-memory stores. These are module-scoped so they survive across requests
// within a single Node process. They reset on dev-server restart, which is the
// expected behavior for the demo.
const talentMap = new Map<string, TalentDTO>(talents.map((t) => [t.id, t]));
const startupMap = new Map<string, StartupDTO>(startups.map((s) => [s.id, s]));
const interestMap = new Map<string, InterestDTO>(
  baselineInterests.map((i) => [interestKey(i.talentId, i.startupId), i]),
);
const notifications: NotificationDTO[] = [...baselineNotifications];
const pushes: AffinityPushDTO[] = [...baselinePushes];
const resourceMap = new Map<string, ResourceDTO>(
  baselineResources.map((r) => [r.id, r]),
);

let nextNotifId = baselineNotifications.length + 1;
let nextInterestId = baselineInterests.length + 1;
let nextPushId = baselinePushes.length + 1;

const messages: MessageDTO[] = [];
let nextMessageId = 1;

function pairKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function interestKey(talentId: string, startupId: string) {
  return `${talentId}::${startupId}`;
}

function lower(s: string) {
  return s.toLowerCase();
}

export class MockDataStore implements IDataStore {
  async listTalent() {
    return [...talentMap.values()];
  }
  async getTalent(id: string) {
    return talentMap.get(id) ?? null;
  }
  async listStartups() {
    return [...startupMap.values()];
  }
  async getStartup(id: string) {
    return startupMap.get(id) ?? null;
  }
  async listUtahOrgs(): Promise<UtahOrg[]> {
    return [...utahOrgs];
  }

  async matchesFor(subjectId: string): Promise<MatchDTO[]> {
    return baselineMatches
      .filter((m) => m.subjectId === subjectId)
      .sort((a, b) => b.score - a.score);
  }

  async computeMatch({
    subjectId,
    candidateId,
  }: {
    subjectId: string;
    candidateId: string;
  }): Promise<MatchDTO | null> {
    if (subjectId === candidateId) return null;

    // Hand-curated baseline takes precedence — keeps the canonical demo
    // narratives intact when judges click into Sarah → Bramble etc.
    const baseline = baselineMatches.find(
      (m) => m.subjectId === subjectId && m.candidateId === candidateId,
    );
    if (baseline) return baseline;

    // Synthesize a match for any other (subject, candidate) pair so search
    // click-throughs always land on a populated analysis page rather than
    // "this profile isn't currently in your matches."
    const subjTalent = talentMap.get(subjectId);
    const subjStartup = startupMap.get(subjectId);
    const candTalent = talentMap.get(candidateId);
    const candStartup = startupMap.get(candidateId);

    if (subjTalent && candStartup) {
      return synthesizeTalentToStartup(subjTalent, candStartup);
    }
    if (subjStartup && candTalent) {
      return synthesizeStartupToTalent(subjStartup, candTalent);
    }
    if (subjTalent && candTalent) {
      return synthesizePeer(subjTalent, candTalent);
    }
    return null;
  }

  async search(query: string) {
    const q = lower(query.trim());
    if (!q) {
      return {
        talent: [...talentMap.values()],
        startups: [...startupMap.values()],
        resources: [...resourceMap.values()],
      };
    }
    const matchTalent = (t: TalentDTO) =>
      [
        t.name,
        t.headline,
        t.bio,
        t.lookingFor,
        t.categories.join(" "),
        t.lookingForNeeds.join(" "),
        t.skills.join(" "),
        t.domains.join(" "),
      ]
        .map(lower)
        .some((s) => s.includes(q));
    const matchStartup = (s: StartupDTO) =>
      [s.name, s.oneLiner, s.description, s.sector, s.needs.join(" "), s.networksWanted.join(" ")]
        .map(lower)
        .some((s) => s.includes(q));
    const matchResource = (r: ResourceDTO) =>
      [r.title, r.description, r.tags.join(" ")]
        .map(lower)
        .some((s) => s.includes(q));
    return {
      talent: [...talentMap.values()].filter(matchTalent),
      startups: [...startupMap.values()].filter(matchStartup),
      resources: [...resourceMap.values()].filter(matchResource),
    };
  }

  async putTalent(t: TalentDTO) {
    talentMap.set(t.id, t);
    return t;
  }
  async putStartup(s: StartupDTO) {
    startupMap.set(s.id, s);
    return s;
  }

  async vote(args: {
    talentId: string;
    startupId: string;
    side: VoteSide;
    state: "interested" | "pass";
  }) {
    const k = interestKey(args.talentId, args.startupId);
    const prior = interestMap.get(k) ?? {
      id: `int-${nextInterestId++}`,
      talentId: args.talentId,
      startupId: args.startupId,
      talentState: "pending" as const,
      startupState: "pending" as const,
      mutualAt: null,
    };
    const next: InterestDTO = {
      ...prior,
      talentState: args.side === "talent" ? args.state : prior.talentState,
      startupState: args.side === "startup" ? args.state : prior.startupState,
    };
    const becameMutual =
      next.mutualAt === null &&
      next.talentState === "interested" &&
      next.startupState === "interested";
    if (becameMutual) {
      next.mutualAt = new Date().toISOString();
    }
    interestMap.set(k, next);
    return { interest: next, mutualJustNow: becameMutual };
  }

  async getInterest(args: { talentId: string; startupId: string }) {
    return interestMap.get(interestKey(args.talentId, args.startupId)) ?? null;
  }

  async listInterests(viewerId: string) {
    return [...interestMap.values()].filter(
      (i) => i.talentId === viewerId || i.startupId === viewerId,
    );
  }

  async listNotifications(recipientId: string) {
    return notifications
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async emitNotification(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">) {
    const created: NotificationDTO = {
      ...n,
      id: `notif-${nextNotifId++}`,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    notifications.push(created);
    return created;
  }

  async markAllRead(recipientId: string) {
    const now = new Date().toISOString();
    for (const n of notifications) {
      if (n.recipientId === recipientId && n.readAt === null) {
        n.readAt = now;
      }
    }
  }

  async listResources() {
    return [...resourceMap.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  async getResource(id: string) {
    return resourceMap.get(id) ?? null;
  }

  async putResource(r: ResourceDTO) {
    resourceMap.set(r.id, r);
    return r;
  }

  async listAffinityPushes() {
    return [...pushes].sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1));
  }

  async recordAffinityPush(p: Omit<AffinityPushDTO, "id" | "pushedAt">) {
    const created: AffinityPushDTO = {
      ...p,
      id: `push-${nextPushId++}`,
      pushedAt: new Date().toISOString(),
    };
    pushes.unshift(created);
    return created;
  }

  async listMessages({ viewerId, otherId }: { viewerId: string; otherId: string }) {
    const key = pairKey(viewerId, otherId);
    return messages
      .filter((m) => m.pairKey === key)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  }

  async sendMessage({ senderId, recipientId, body }: { senderId: string; recipientId: string; body: string }) {
    const created: MessageDTO = {
      id: `msg-${nextMessageId++}`,
      pairKey: pairKey(senderId, recipientId),
      senderId,
      recipientId,
      body,
      createdAt: new Date().toISOString(),
    };
    messages.push(created);
    return created;
  }

  async resolveAdminUserIds() {
    return DEMO_PERSONAS.filter((p) => p.role === "admin").map((p) => p.id);
  }

  // Mock gap-resource recommender. The demo data layer can't run real OpenAI
  // calls server-side every page load (no auth / no key), so this falls back
  // to the keyword-overlap heuristic in lib/match/gap.ts. It still returns
  // reasonable results because baselineResources have hand-tuned tags.
  async recommendGapResources({
    subjectId,
    candidateId,
    limit = 3,
  }: {
    subjectId: string;
    candidateId: string;
    limit?: number;
  }) {
    const talent = talentMap.get(subjectId) ?? talentMap.get(candidateId);
    const startup = startupMap.get(candidateId) ?? startupMap.get(subjectId);
    if (!talent || !startup) {
      return { gapText: "", resources: [] as ResourceDTO[] };
    }
    const { analyzeGap, recommendResourcesForGap } = await import("@/lib/match/gap");
    const analysis = analyzeGap(talent, startup);
    const resources = recommendResourcesForGap(
      analysis.gaps,
      [...resourceMap.values()],
      limit,
    );
    return { gapText: analysis.description, resources };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Match synthesizers — used by computeMatch when there's no baseline entry for
// the (subject, candidate) pair. Cheap heuristics, structurally identical to
// what the live LLM gate produces, so MatchCard / ExplainabilityPanel render
// the same shape regardless of mode.
// ─────────────────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function overlap<T>(a: T[], b: T[]): T[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

function synthesizeTalentToStartup(t: TalentDTO, s: StartupDTO): MatchDTO {
  // Skill / role coverage — reuse the gap engine for consistency with the
  // gap-closer's signal.
  const { analyzeGap } = requireGapModule();
  const analysis = analyzeGap(t, s);
  const totalNeeds = analysis.covered.length + analysis.gaps.length;
  const skillWeight =
    totalNeeds === 0
      ? 0.6
      : clamp01(0.45 + (analysis.covered.length / totalNeeds) * 0.5);

  // Domain overlap — startup sector ∈ talent.domains?
  const domainHit = t.domains.includes(s.sector);
  const domainWeight = domainHit ? 0.9 : 0.45;

  // Stage fit — startup stage ∈ talent.stagePrefs?
  const stageHit = t.stagePrefs.includes(s.fundingStage);
  const stageWeight = stageHit ? 0.95 : 0.4;

  const sharedOrgIds = overlap(t.utahOrgIds, s.utahOrgIds);
  const proximityBoost = sharedOrgIds.length > 0 ? 0.05 : 0;

  // Composite score blends the three factors, lightly boosted for shared
  // Utah affiliations. Stays in [0, 1].
  const composite = clamp01(
    skillWeight * 0.5 + domainWeight * 0.3 + stageWeight * 0.2 + proximityBoost,
  );

  const concerns: string[] = [];
  if (analysis.gaps.length > 0) {
    concerns.push(analysis.description);
  }
  if (!stageHit) {
    concerns.push(
      `${s.name} is at ${s.fundingStage}; that's outside ${t.name.split(" ")[0]}'s stated stage range.`,
    );
  }
  if (!domainHit) {
    concerns.push(
      `${s.name}'s sector (${s.sector}) isn't a domain ${t.name.split(" ")[0]} has named.`,
    );
  }

  const reason = analysis.description;

  return {
    id: `synth-${t.id}-${s.id}`,
    subjectId: t.id,
    candidateId: s.id,
    candidateKind: "startup",
    score: composite,
    reason,
    concerns,
    factors: [
      {
        label: "Role fit",
        weight: skillWeight,
        detail:
          analysis.covered.length > 0
            ? `Covers: ${analysis.covered.join(", ")}.`
            : "No direct role coverage from current skills.",
      },
      {
        label: "Domain overlap",
        weight: domainWeight,
        detail: domainHit
          ? `${s.sector} is in ${t.name.split(" ")[0]}'s stated domains.`
          : `${s.sector} is outside the talent's named domains.`,
      },
      {
        label: "Stage fit",
        weight: stageWeight,
        detail: stageHit
          ? `${s.fundingStage} matches the talent's stage range.`
          : `${s.fundingStage} is outside the talent's stage range.`,
      },
    ],
    proximityBoost,
    sharedOrgIds,
  };
}

function synthesizeStartupToTalent(s: StartupDTO, t: TalentDTO): MatchDTO {
  // Mirror of the talent→startup case — reuses the same factors, switches
  // subject/candidate ids and kind so the consumer always knows who's who.
  const synth = synthesizeTalentToStartup(t, s);
  return {
    ...synth,
    id: `synth-${s.id}-${t.id}`,
    subjectId: s.id,
    candidateId: t.id,
    candidateKind: "talent",
  };
}

function synthesizePeer(a: TalentDTO, b: TalentDTO): MatchDTO {
  // Talent ↔ talent peer match — used for "who else in Utah is doing this?"
  // No skill-fit analysis; lean on domain overlap and shared Utah affiliations.
  const sharedDomains = overlap(a.domains, b.domains);
  const domainWeight = clamp01(
    sharedDomains.length === 0 ? 0.4 : 0.5 + sharedDomains.length * 0.15,
  );
  const sharedOrgIds = overlap(a.utahOrgIds, b.utahOrgIds);
  const proximityBoost = sharedOrgIds.length > 0 ? 0.1 : 0;
  const stageOverlap = overlap(a.stagePrefs, b.stagePrefs);
  const stageWeight = stageOverlap.length > 0 ? 0.8 : 0.4;
  const composite = clamp01(domainWeight * 0.6 + stageWeight * 0.4 + proximityBoost);

  return {
    id: `synth-${a.id}-${b.id}`,
    subjectId: a.id,
    candidateId: b.id,
    candidateKind: "talent",
    score: composite,
    reason:
      sharedDomains.length > 0
        ? `${a.name.split(" ")[0]} and ${b.name.split(" ")[0]} both work in ${sharedDomains.join(", ")}.`
        : `Different domains, but both operating inside the Utah ecosystem.`,
    concerns:
      sharedDomains.length === 0
        ? ["Shared domain context is thin — peer intro is more about network than direct collab."]
        : [],
    factors: [
      {
        label: "Domain overlap",
        weight: domainWeight,
        detail:
          sharedDomains.length > 0
            ? `Shared domains: ${sharedDomains.join(", ")}.`
            : "No domain overlap.",
      },
      {
        label: "Stage range",
        weight: stageWeight,
        detail:
          stageOverlap.length > 0
            ? `Both targeting ${stageOverlap.join(", ")}.`
            : "Different stage preferences.",
      },
    ],
    proximityBoost,
    sharedOrgIds,
  };
}

// Tiny memoized wrapper around the gap module — synthesizers are sync, but the
// gap module is dynamically imported in `recommendGapResources`. Keep the
// dynamic-import contract there; here we use require so synthesizers stay
// synchronous-looking. Falls back to a no-op analyzer if the require fails so
// build steps that statically analyze imports don't break.
let gapMod: typeof import("@/lib/match/gap") | null = null;
function requireGapModule(): typeof import("@/lib/match/gap") {
  if (gapMod) return gapMod;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gapMod = require("@/lib/match/gap") as typeof import("@/lib/match/gap");
  return gapMod;
}
