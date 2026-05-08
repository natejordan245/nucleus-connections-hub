import type {
  TalentDTO,
  StartupDTO,
  MatchResponse,
  InterestState,
  InterestSide,
  NotificationDTO,
} from "./data";

export interface ExtractTalentArgs {
  bio: string;
  kind: "talent";
}
export interface ExtractStartupArgs {
  description: string;
  kind: "startup";
}

export interface IProfileService {
  getTalent(id: string): Promise<TalentDTO>;
  createTalent(input: Partial<TalentDTO> & { bio: string; name: string; email: string }): Promise<TalentDTO>;
  updateTalent(id: string, patch: Partial<TalentDTO>): Promise<TalentDTO>;

  getStartup(id: string): Promise<StartupDTO>;
  createStartup(input: Partial<StartupDTO> & { description: string; name: string }): Promise<StartupDTO>;
  updateStartup(id: string, patch: Partial<StartupDTO>): Promise<StartupDTO>;

  /** LLM extraction: free-text → suggested structured fields */
  extractFromBio(args: ExtractTalentArgs): Promise<Partial<TalentDTO>>;
  extractFromBio(args: ExtractStartupArgs): Promise<Partial<StartupDTO>>;
}

export interface IMatchService {
  /**
   * Default: returns candidates of the *opposing* type. Pass `target` to
   * override (e.g. talent → talent for peer/network discovery).
   */
  getMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
  }): Promise<MatchResponse>;
}

export interface ISearchService {
  /**
   * Free-text semantic search. Query is embedded, nearest neighbors in the
   * target pool are retrieved, and the LLM reranker writes per-result reasons
   * that quote the user's intent.
   */
  search(args: {
    query: string;
    kind: "talent" | "startup";
    k?: number;
  }): Promise<MatchResponse>;
}

export interface IInterestService {
  expressInterest(args: {
    talentId: string;
    startupId: string;
    from: InterestSide;
    state: "interested" | "pass";
  }): Promise<InterestState>;
  getInterest(args: { talentId: string; startupId: string }): Promise<InterestState>;
}

export interface INotificationService {
  /** All notifications for a recipient, newest first. */
  list(recipientId: string): Promise<NotificationDTO[]>;
  markRead(args: { recipientId: string; ids?: string[]; all?: boolean }): Promise<void>;
}

export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, opts: { status?: number; code?: string } = {}) {
    super(message);
    this.name = "ServiceError";
    this.status = opts.status ?? 500;
    this.code = opts.code ?? "service_error";
  }
}
