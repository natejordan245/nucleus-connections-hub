// ─────────────────────────────────────────────────────────────────────────────
// Shape definitions — matched to the Nucleus bounty spec. Enums here are the
// source of truth; UI selects reuse them via the labels in `enum-labels.ts`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four profile kinds. Stored as the `kind` column on `profiles`.
 * - `candidate` — job-seeker (was `talent`).
 * - `business`  — company (was `startup`).
 * - `mentor`    — advisor / SME.
 * - `investor`  — VC.
 */
export type ProfileKind = "candidate" | "business" | "mentor" | "investor";

/**
 * The five Nucleus networks (mirror of the role list on nucleusutah.org/contact).
 * A person can belong to more than one — e.g. an advisor / angel sits in both
 * Mentor and Venture.
 */
export type Network =
  | "operator"
  | "mentor"
  | "sme-advisory"
  | "venture"
  | "service-provider";

export type TalentCategory =
  | "executive"
  | "cofounder"
  | "coo"
  | "fractional"
  | "operator"
  | "engineer"
  | "sales"
  | "marketing"
  | "student"
  | "intern"
  | "board-member"
  | "advisor-paid"
  | "mentor-free";

export type Availability = "full-time" | "fractional" | "advisory" | "internship";

export type Compensation = "cash" | "equity" | "mentor";

export type Stage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "growth";

export type Sector =
  | "life-sciences"
  | "ai"
  | "defense-aerospace"
  | "cyber"
  | "energy"
  | "advanced-manufacturing"
  | "fintech"
  | "software";

export type Origin =
  | "u-of-u-spinout"
  | "byu-spinout"
  | "usu-spinout"
  | "bootstrapped"
  | "vc-backed";

export type StartupNeed =
  | "executive"
  | "cofounder"
  | "coo"
  | "fractional"
  | "operator"
  | "engineer"
  | "sales"
  | "marketing"
  | "student"
  | "intern"
  | "board-member"
  | "advisor-paid"
  | "mentor-free"
  // Legacy values kept for backward compatibility with seeded demo rows.
  | "ceo"
  | "cto"
  | "biz-dev"
  | "regulatory"
  | "sales-lead"
  | "engineering"
  | "marketing";

export type FundingStatus = "grant" | "pre-revenue" | "revenue";

export type UtahOrg = {
  id: string;
  name: string;
  type: "tto" | "accelerator" | "university" | "fund" | "alumni";
  universities?: string[];
};

export type CandidateDTO = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  /** Free-text answer to "what are you looking for?" — drives match intent. */
  lookingFor: string;
  /** Structured role categories this person can fill in a company. Optional;
   *  data-store readers populate a default when absent. */
  categories?: TalentCategory[];
  /** Structured intent: role shapes this person wants from businesses.
   *  Optional; data-store readers populate a default when absent. */
  lookingForNeeds?: StartupNeed[];
  domains: Sector[];
  availability: Availability;
  compensation: Compensation[];
  stagePrefs: Stage[];
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  location: string;
  utahOrgIds: string[];
  /** Which Nucleus networks this person sits in. */
  networks: Network[];
  photoUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  /**
   * Optional resume-ingestion metadata used by onboarding autofill.
   * We persist extracted text (not the raw file) for debugging/reprocessing.
   */
  resumeExtract?: ResumeExtractMeta;
  createdAt: string;
};

/** Legacy alias — call sites being migrated incrementally. */
export type TalentDTO = CandidateDTO;

export type ResumeExtractMeta = {
  sourceFilename: string;
  extractedAt: string;
  parser: "pdf" | "docx";
  charCount: number;
  model: string;
  extractedText: string;
  passesUsed?: Array<"text" | "image">;
  warnings?: string[];
  truncatedFlags?: Array<"model_input" | "stored_text" | "pdf_pages" | "docx_images">;
};

/** Bio extraction metadata for Mentor / Business onboarding (text paste). */
export type BioExtractMeta = {
  extractedAt: string;
  parser: "text";
  charCount: number;
  model: string;
  sourceText: string;
  warnings?: string[];
};

export type BusinessDTO = {
  id: string;
  name: string;
  oneLiner: string;
  description: string;
  sector: Sector;
  origin: Origin;
  /** Technology Readiness Level, 1–9. Optional — not every team self-classifies. */
  trl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  fundingStage: Stage;
  fundingStatus: FundingStatus;
  needs: StartupNeed[];
  /** Which Nucleus networks this business wants to pull from. */
  networksWanted: Network[];
  location: string;
  utahOrgIds: string[];
  logoUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  bioExtract?: BioExtractMeta;
  createdAt: string;
};

/** Legacy alias — call sites being migrated incrementally. */
export type StartupDTO = BusinessDTO;

export type MentorDTO = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  /** Sectors this mentor advises in. */
  areasAdvised: Sector[];
  /** Hours per month available, 0–40. */
  hoursPerMonth: number;
  /** Open to taking a board seat? */
  boardSeatOpen: boolean;
  /** How they prefer to be compensated for advisory work. */
  compPreference: Compensation[];
  /** Sectors they're personally interested in beyond what they advise on. */
  sectorsOfInterest: Sector[];
  location: string;
  utahOrgIds: string[];
  /** Which Nucleus networks this mentor sits in. */
  networks: Network[];
  photoUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  bioExtract?: BioExtractMeta;
  createdAt: string;
};

export type InvestorDTO = {
  id: string;
  name: string;
  email: string;
  fundName?: string;
  headline: string;
  bio: string;
  checkSizeMin?: number;
  checkSizeMax?: number;
  sectorsInvested: Sector[];
  stagePrefs: Stage[];
  location: string;
  utahOrgIds: string[];
  networks: Network[];
  photoUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  createdAt: string;
};

export type MatchFactor = {
  label: string;
  weight: number;
  detail: string;
};

export type MatchDTO = {
  id: string;
  subjectId: string;
  candidateId: string;
  candidateKind: ProfileKind;
  score: number;
  reason: string;
  concerns: string[];
  factors: MatchFactor[];
  proximityBoost: number;
  sharedOrgIds: string[];
};

export type InterestState = "pending" | "interested" | "pass";

/**
 * The interest handshake. Field names `talentId` / `startupId` are legacy DB
 * column names — semantically they are the candidate-side and business-side
 * of the binary handshake. Mentor/Investor profiles do not enter this flow.
 */
export type InterestDTO = {
  id: string;
  talentId: string;
  startupId: string;
  talentState: InterestState;
  startupState: InterestState;
  mutualAt: string | null;
};

export type NotificationKind =
  | "interest_received"
  | "mutual_match"
  | "system"
  | "message_received";

export type MessageDTO = {
  id: string;
  pairKey: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
};

export type NotificationDTO = {
  id: string;
  recipientId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};

export type ResourceKind =
  | "guide"
  | "video"
  | "deck"
  | "playbook"
  | "link"
  | "program"
  | "funding"
  | "network"
  | "mentor"
  | "event";

export type ResourceDTO = {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  url: string;
  tags: string[];
  /**
   * Short text suitable for an embedding — captures *what gap this closes*.
   * Used by the gap-closer recommender (and, eventually, vectorized for
   * semantic match against a candidate ↔ business gap description from an LLM).
   */
  summary: string;
  uploadedById: string | null;
  uploadedByName: string;
  createdAt: string;
};

/**
 * Captured details of a single API call made during an Affinity push.
 * Mirrors `AffinityApiCall` in `lib/affinity/types.ts` but redeclared here
 * so the data layer doesn't depend on the integration module's internals.
 */
export type AffinityApiCallLog = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: number;
  durationMs: number;
  at: string;
};

export type AffinityPipelineStage =
  | "intro_queued"
  | "in_review"
  | "intro_made"
  | "closed_won"
  | "closed_lost";

export type AffinitySyncState = "queued" | "syncing" | "synced" | "failed";

export type AffinityPushDTO = {
  id: string;
  talentId: string;
  startupId: string;
  pushedAt: string;
  reason: string;
  /** Internal lifecycle: queued → pushed (sent to Affinity), or skipped. */
  status: "queued" | "pushed" | "skipped";

  // ── Affinity-side identifiers (null when the push hasn't synced yet). ──
  affinityOrganizationId: number | null;
  affinityPersonId: number | null;
  affinityListEntryId: number | null;
  affinityListId: number | null;
  /** Deep link an operator can click to open the record in Affinity. */
  affinityUrl: string | null;
  /** Pipeline-stage dropdown value mirrored from the list entry. */
  pipelineStage: AffinityPipelineStage | null;

  // ── Sync state for retries / UI affordances. ──
  syncState: AffinitySyncState;
  syncError: string | null;

  /** Per-call timeline of the push pipeline, surfaced in the UI. */
  apiCalls: AffinityApiCallLog[];
  /** Structured field values written to the list entry, for display. */
  fieldValues: Array<{ label: string; value: string }>;
};
