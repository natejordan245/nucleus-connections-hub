import type {
  AffinityPushDTO,
  InterestDTO,
  InterestState,
  MatchDTO,
  NotificationDTO,
  ResourceDTO,
  StartupDTO,
  TalentDTO,
  UtahOrg,
} from "./types";

export type VoteSide = "talent" | "startup";

export interface IDataStore {
  // ── reads ──
  listTalent(): Promise<TalentDTO[]>;
  getTalent(id: string): Promise<TalentDTO | null>;
  listStartups(): Promise<StartupDTO[]>;
  getStartup(id: string): Promise<StartupDTO | null>;
  listUtahOrgs(): Promise<UtahOrg[]>;

  // matches: returns the candidates ranked for a given subject
  matchesFor(subjectId: string): Promise<MatchDTO[]>;

  // search across the three pools (simple substring match for now)
  search(query: string): Promise<{
    talent: TalentDTO[];
    startups: StartupDTO[];
    resources: ResourceDTO[];
  }>;

  // resources — uploaded guides / videos / decks / playbooks
  listResources(): Promise<ResourceDTO[]>;
  getResource(id: string): Promise<ResourceDTO | null>;
  putResource(r: ResourceDTO): Promise<ResourceDTO>;

  // ── writes ──
  putTalent(t: TalentDTO): Promise<TalentDTO>;
  putStartup(s: StartupDTO): Promise<StartupDTO>;

  // interest handshake
  vote(args: {
    talentId: string;
    startupId: string;
    side: VoteSide;
    state: Exclude<InterestState, "pending">;
  }): Promise<{ interest: InterestDTO; mutualJustNow: boolean }>;
  getInterest(args: { talentId: string; startupId: string }): Promise<InterestDTO | null>;
  listInterests(viewerId: string): Promise<InterestDTO[]>;

  // notifications
  listNotifications(recipientId: string): Promise<NotificationDTO[]>;
  emitNotification(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO>;
  markAllRead(recipientId: string): Promise<void>;

  // affinity push log (mutual matches → CRM)
  listAffinityPushes(): Promise<AffinityPushDTO[]>;
  recordAffinityPush(p: Omit<AffinityPushDTO, "id" | "pushedAt">): Promise<AffinityPushDTO>;
}
