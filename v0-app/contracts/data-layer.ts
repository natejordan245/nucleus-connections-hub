import type {
  TalentDTO,
  StartupDTO,
  RankedMatch,
  PipelineTimings,
  AffinityPushPayload,
  InterestState,
  InterestSide,
  NotificationDTO,
} from "./data";

export interface IProfileStore {
  getTalent(id: string): Promise<TalentDTO | null>;
  putTalent(t: TalentDTO): Promise<void>;
  listTalent(): Promise<TalentDTO[]>;
  getStartup(id: string): Promise<StartupDTO | null>;
  putStartup(s: StartupDTO): Promise<void>;
  listStartups(): Promise<StartupDTO[]>;
  /**
   * Monotonic counter that bumps on every put*. Used by the match cache as a
   * coarse pool fingerprint — any profile mutation invalidates downstream
   * cached matches.
   */
  getPoolRevision(): number;
}

export interface IEmbeddingClient {
  /** 1536-dim vector */
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ILLMClient {
  extractTalent(bio: string): Promise<Partial<TalentDTO>>;
  extractStartup(description: string): Promise<Partial<StartupDTO>>;
  /** Subject-anchored rerank — explanations reference the subject profile. */
  rerank(args: {
    subject: TalentDTO | StartupDTO;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]>;
  /** Query-anchored rerank — explanations reference the user's search query. */
  rerankFromQuery(args: {
    query: string;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]>;
}

export interface IMatchEngine {
  /** Subject mode. Runs gates → vector retrieval → rerank → proximity boost. */
  findMatches(args: {
    for: string;
    type: "talent" | "startup";
    /** Candidate pool. Defaults to opposite of `type` (talent→startup, startup→talent). */
    target?: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }>;

  /** Query mode. Embeds the query, pulls top-K from `target`, reranks. No gates. */
  findFromQuery(args: {
    query: string;
    target: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }>;
}

/**
 * Cache for computed match results, keyed by a stable string and validated
 * against a content fingerprint. The fingerprint captures (a) the viewer's
 * match-relevant fields and (b) a monotonic pool revision; either changing
 * causes the entry to be treated as stale and recomputed.
 */
export interface IMatchCache {
  get(key: string, fingerprint: CacheFingerprint): Promise<CachedMatch | null>;
  set(key: string, fingerprint: CacheFingerprint, value: CachedMatch): Promise<void>;
  /** Drop everything (e.g. for tests). */
  clear(): Promise<void>;
}

export interface CacheFingerprint {
  /** Stable hash of the viewer's match-relevant fields. Empty in query mode. */
  viewerHash: string;
  /** Monotonic revision counter from the profile store. */
  poolRevision: number;
}

export interface CachedMatch {
  matches: import("./data").RankedMatch[];
  pipelineMs: import("./data").PipelineTimings;
  cachedAt: string;
}

export interface IInterestStore {
  get(args: { talentId: string; startupId: string }): Promise<InterestState>;
  put(state: InterestState): Promise<void>;
  vote(args: {
    talentId: string;
    startupId: string;
    from: InterestSide;
    state: "interested" | "pass";
  }): Promise<InterestState>;
}

export interface INotificationStore {
  add(n: Omit<NotificationDTO, "id" | "createdAt" | "readAt">): Promise<NotificationDTO>;
  list(recipientId: string): Promise<NotificationDTO[]>;
  markRead(args: { recipientId: string; ids?: string[]; all?: boolean }): Promise<void>;
}

export interface IAffinityClient {
  upsertPerson(p: { name: string; email: string }): Promise<{ affinityId: string }>;
  addToList(args: { personId: string; listName: string }): Promise<void>;
  addNote(args: { personId: string; body: string }): Promise<void>;
  /** For the demo "what would have been sent" admin slide. */
  recentPushes(): Promise<AffinityPushPayload[]>;
  recordPush(payload: AffinityPushPayload): Promise<void>;
}
