import type {
  AffinityPushDTO,
  InterestDTO,
  MatchDTO,
  NotificationDTO,
  StartupDTO,
  TalentDTO,
  UtahOrg,
} from "./types";
import {
  baselineInterests,
  baselineMatches,
  baselineNotifications,
  baselinePushes,
  startups,
  talents,
  utahOrgs,
} from "./seed";
import type { IDataStore, VoteSide } from "./store";

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

let nextNotifId = baselineNotifications.length + 1;
let nextInterestId = baselineInterests.length + 1;
let nextPushId = baselinePushes.length + 1;

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

  async search(query: string) {
    const q = lower(query.trim());
    if (!q) return { talent: [...talentMap.values()], startups: [...startupMap.values()] };
    const matchTalent = (t: TalentDTO) =>
      [t.name, t.headline, t.bio, t.lookingFor, t.skills.join(" "), t.domains.join(" ")]
        .map(lower)
        .some((s) => s.includes(q));
    const matchStartup = (s: StartupDTO) =>
      [s.name, s.oneLiner, s.description, s.sector, s.needs.join(" ")]
        .map(lower)
        .some((s) => s.includes(q));
    return {
      talent: [...talentMap.values()].filter(matchTalent),
      startups: [...startupMap.values()].filter(matchStartup),
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
}
