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
  ResourceDTO,
  UtahOrg,
} from "./types";

/**
 * Which side of the candidate↔business interest handshake a vote is for.
 * Mentor and Investor profiles do not enter this flow.
 */
export type VoteSide = "candidate" | "business";

export interface IDataStore {
  // ── reads ──
  listCandidates(): Promise<CandidateDTO[]>;
  getCandidate(id: string): Promise<CandidateDTO | null>;
  listBusinesses(): Promise<BusinessDTO[]>;
  getBusiness(id: string): Promise<BusinessDTO | null>;
  listMentors(): Promise<MentorDTO[]>;
  getMentor(id: string): Promise<MentorDTO | null>;
  listInvestors(): Promise<InvestorDTO[]>;
  getInvestor(id: string): Promise<InvestorDTO | null>;
  listUtahOrgs(): Promise<UtahOrg[]>;

  // matches: returns the candidates ranked for a given subject. For
  // mentor/investor subjects this returns [] until directional matching ships.
  matchesFor(subjectId: string): Promise<MatchDTO[]>;

  // On-demand match for an arbitrary (subject, candidate) pair — used when a
  // user clicks through from search to a profile that isn't necessarily in
  // their top-K. Runs the same hard-filter → cosine → LLM-gate pipeline as
  // `matchesFor` but for a single pair. Returns null if either profile is
  // missing or both directions fall under the cosine floor (genuinely
  // incompatible — not worth surfacing a fake score).
  computeMatch(args: {
    subjectId: string;
    candidateId: string;
  }): Promise<MatchDTO | null>;

  // search across the four pools (simple substring match for now)
  search(query: string): Promise<{
    candidates: CandidateDTO[];
    businesses: BusinessDTO[];
    mentors: MentorDTO[];
    investors: InvestorDTO[];
    resources: ResourceDTO[];
  }>;

  // resources — uploaded guides / videos / decks / playbooks
  listResources(): Promise<ResourceDTO[]>;
  getResource(id: string): Promise<ResourceDTO | null>;
  putResource(r: ResourceDTO): Promise<ResourceDTO>;

  // ── writes ──
  putCandidate(c: CandidateDTO): Promise<CandidateDTO>;
  putBusiness(b: BusinessDTO): Promise<BusinessDTO>;
  putMentor(m: MentorDTO): Promise<MentorDTO>;
  putInvestor(i: InvestorDTO): Promise<InvestorDTO>;

  // interest handshake — candidate ↔ business only
  vote(args: {
    candidateId: string;
    businessId: string;
    side: VoteSide;
    state: Exclude<InterestState, "pending">;
  }): Promise<{ interest: InterestDTO; mutualJustNow: boolean }>;
  getInterest(args: { candidateId: string; businessId: string }): Promise<InterestDTO | null>;
  listInterests(viewerId: string): Promise<InterestDTO[]>;

  // notifications
  listNotifications(recipientId: string): Promise<NotificationDTO[]>;
  emitNotification(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO>;
  markAllRead(recipientId: string): Promise<void>;

  // affinity push log (mutual matches → CRM)
  listAffinityPushes(): Promise<AffinityPushDTO[]>;
  recordAffinityPush(p: Omit<AffinityPushDTO, "id" | "pushedAt">): Promise<AffinityPushDTO>;

  // direct messaging — only enabled between mutually-matched parties
  listMessages(args: { viewerId: string; otherId: string }): Promise<MessageDTO[]>;
  sendMessage(args: { senderId: string; recipientId: string; body: string }): Promise<MessageDTO>;

  // admin notification fan-out: resolves the admin user ids the platform
  // should ping when a mutual match happens.
  resolveAdminUserIds(): Promise<string[]>;

  // gap-closing resources: for a (subject, candidate) pair, build a
  // description of why they're not a perfect match and surface the top
  // resources whose summary embeddings nearest-neighbor that gap.
  recommendGapResources(args: {
    subjectId: string;
    candidateId: string;
    limit?: number;
  }): Promise<{ gapText: string; resources: ResourceDTO[] }>;
}
