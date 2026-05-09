import type {
  Availability,
  Compensation,
  FundingStatus,
  Network,
  Origin,
  ProfileKind,
  ResourceKind,
  Sector,
  Stage,
  StartupNeed,
  TalentCategory,
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
  "executive":    "Executives",
  "cofounder":    "Co-founders",
  "coo":          "COO",
  "fractional":   "Fractional",
  "operator":     "Operators",
  "engineer":     "Engineers",
  "sales":        "Sales",
  "student":      "Students",
  "intern":       "Interns",
  "board-member": "Board members",
  "advisor-paid": "Advisors (equity/$)",
  "mentor-free":  "Mentors (free)",
  "ceo":          "CEO",
  "cto":          "CTO",
  "biz-dev":      "Biz dev",
  "regulatory":   "Regulatory",
  "sales-lead":   "Sales lead",
  "engineering":  "Engineering",
  "marketing":    "Marketing",
};

export const TALENT_CATEGORY_LABELS: Record<TalentCategory, string> = {
  "executive":    "Executives",
  "cofounder":    "Co-founders",
  "coo":          "COO",
  "fractional":   "Fractional",
  "operator":     "Operators",
  "engineer":     "Engineers",
  "sales":        "Sales",
  "marketing":    "Marketing",
  "student":      "Students",
  "intern":       "Interns",
  "board-member": "Board members",
  "advisor-paid": "Advisors (equity/$)",
  "mentor-free":  "Mentors (free)",
};

export const FUNDING_STATUS_LABELS: Record<FundingStatus, string> = {
  "grant":       "Grant-funded",
  "pre-revenue": "Pre-revenue",
  "revenue":     "Revenue",
};

export const NETWORK_LABELS: Record<Network, string> = {
  "operator":         "Operator Network",
  "mentor":           "Mentor Network",
  "sme-advisory":     "SME Advisory",
  "venture":          "Venture Network",
  "service-provider": "Service Provider",
};

export const NETWORK_BLURBS: Record<Network, string> = {
  "operator":         "Full-time, fractional, and intern-track operators.",
  "mentor":           "Volunteer mentors offering time, not equity.",
  "sme-advisory":     "Paid subject-matter expert advisors.",
  "venture":          "Investors, angels, and venture connectors.",
  "service-provider": "Lawyers, designers, accountants, agencies.",
};

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  "guide":    "Guide",
  "video":    "Video",
  "deck":     "Deck",
  "playbook": "Playbook",
  "link":     "Link",
  "program":  "Program",
  "funding":  "Funding",
  "network":  "Network",
  "mentor":   "Mentor",
  "event":    "Event",
};

export const PROFILE_KIND_LABELS: Record<ProfileKind, string> = {
  "candidate": "Candidate",
  "business":  "Business",
  "mentor":    "Mentor",
  "investor":  "VC",
};

export const PROFILE_KINDS = Object.keys(PROFILE_KIND_LABELS) as ProfileKind[];


export const AVAILABILITIES = Object.keys(AVAILABILITY_LABELS) as Availability[];
export const COMPENSATIONS = Object.keys(COMPENSATION_LABELS) as Compensation[];
export const STAGES = Object.keys(STAGE_LABELS) as Stage[];
export const SECTORS = Object.keys(SECTOR_LABELS) as Sector[];
export const ORIGINS = Object.keys(ORIGIN_LABELS) as Origin[];
export const NEEDS = Object.keys(NEED_LABELS) as StartupNeed[];
export const TALENT_CATEGORIES = Object.keys(TALENT_CATEGORY_LABELS) as TalentCategory[];
export const FUNDING_STATUSES = Object.keys(FUNDING_STATUS_LABELS) as FundingStatus[];
export const NETWORKS = Object.keys(NETWORK_LABELS) as Network[];
export const RESOURCE_KINDS = Object.keys(RESOURCE_KIND_LABELS) as ResourceKind[];

export const ROLE_NEEDS: StartupNeed[] = [
  "executive",
  "cofounder",
  "coo",
  "fractional",
  "operator",
  "engineer",
  "sales",
  "marketing",
  "student",
  "intern",
  "board-member",
  "advisor-paid",
  "mentor-free",
];
