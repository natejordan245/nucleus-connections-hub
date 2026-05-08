import type {
  Availability,
  Compensation,
  FundingStatus,
  Origin,
  Sector,
  Stage,
  StartupNeed,
} from "./types";

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  "full-time":  "Full-time",
  "fractional": "Fractional",
  "advisory":   "Advisory",
  "internship": "Internship",
};

export const COMPENSATION_LABELS: Record<Compensation, string> = {
  "cash":   "Cash",
  "equity": "Equity",
  "mentor": "Mentor (volunteer)",
};

export const STAGE_LABELS: Record<Stage, string> = {
  "pre-seed":  "Pre-seed",
  "seed":      "Seed",
  "series-a":  "Series A",
  "series-b":  "Series B",
  "growth":    "Growth",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  "life-sciences":          "Life sciences",
  "ai":                     "AI",
  "defense-aerospace":      "Defense / Aerospace",
  "cyber":                  "Cyber",
  "energy":                 "Energy",
  "advanced-manufacturing": "Advanced manufacturing",
  "fintech":                "Fintech",
  "software":               "Software",
};

export const ORIGIN_LABELS: Record<Origin, string> = {
  "u-of-u-spinout": "U of U spinout",
  "byu-spinout":    "BYU spinout",
  "usu-spinout":    "USU spinout",
  "bootstrapped":   "Bootstrapped",
  "vc-backed":      "VC-backed",
};

export const NEED_LABELS: Record<StartupNeed, string> = {
  "ceo":          "CEO",
  "cto":          "CTO",
  "biz-dev":      "Biz dev",
  "regulatory":   "Regulatory",
  "sales-lead":   "Sales lead",
  "engineering":  "Engineering",
  "marketing":    "Marketing",
};

export const FUNDING_STATUS_LABELS: Record<FundingStatus, string> = {
  "grant":       "Grant-funded",
  "pre-revenue": "Pre-revenue",
  "revenue":     "Revenue",
};

export const AVAILABILITIES = Object.keys(AVAILABILITY_LABELS) as Availability[];
export const COMPENSATIONS = Object.keys(COMPENSATION_LABELS) as Compensation[];
export const STAGES = Object.keys(STAGE_LABELS) as Stage[];
export const SECTORS = Object.keys(SECTOR_LABELS) as Sector[];
export const ORIGINS = Object.keys(ORIGIN_LABELS) as Origin[];
export const NEEDS = Object.keys(NEED_LABELS) as StartupNeed[];
export const FUNDING_STATUSES = Object.keys(FUNDING_STATUS_LABELS) as FundingStatus[];
