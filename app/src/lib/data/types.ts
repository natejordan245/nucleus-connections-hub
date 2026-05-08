// ─────────────────────────────────────────────────────────────────────────────
// Shape definitions — matched to the Nucleus bounty spec. Enums here are the
// source of truth; UI selects reuse them via the labels in `enum-labels.ts`.
// ─────────────────────────────────────────────────────────────────────────────

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

export type TalentDTO = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  /** Free-text answer to "what are you looking for?" — drives match intent. */
  lookingFor: string;
  skills: string[];
  domains: Sector[];
  availability: Availability;
  compensation: Compensation[];
  stagePrefs: Stage[];
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  location: string;
  utahOrgIds: string[];
  photoUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  createdAt: string;
};

export type StartupDTO = {
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
  location: string;
  utahOrgIds: string[];
  logoUrl?: string;
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
  candidateKind: "talent" | "startup";
  score: number;
  reason: string;
  concerns: string[];
  factors: MatchFactor[];
  proximityBoost: number;
  sharedOrgIds: string[];
};

export type InterestState = "pending" | "interested" | "pass";

export type InterestDTO = {
  id: string;
  talentId: string;
  startupId: string;
  talentState: InterestState;
  startupState: InterestState;
  mutualAt: string | null;
};

export type NotificationKind = "interest_received" | "mutual_match" | "system";

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

export type ResourceKind = "guide" | "video" | "deck" | "playbook" | "link";

export type ResourceDTO = {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  url: string;
  tags: string[];
  uploadedById: string | null;
  uploadedByName: string;
  createdAt: string;
};

export type AffinityPushDTO = {
  id: string;
  talentId: string;
  startupId: string;
  pushedAt: string;
  reason: string;
  status: "queued" | "pushed" | "skipped";
};
