/**
 * Static fixtures for the story-slideshow pages. Hardcoded DTOs in shapes
 * the production components already accept. The slideshow imports from this
 * file *instead of* `@/lib/data` — no data-store, no fetch, no API.
 *
 * Keep these in sync with the seed data so judges who toggle into the live
 * product see the same protagonists. Sarah Chen ↔ Lumen Bio is the canonical
 * pair across the deck, the dashboard, and the Affinity push log.
 */

import type {
  AffinityPushDTO,
  BusinessDTO,
  CandidateDTO,
  MatchDTO,
  ResourceDTO,
} from "@/lib/data/types";

export const SARAH: CandidateDTO = {
  id: "tal-sarah",
  name: "Sarah Chen",
  email: "sarah.chen@example.com",
  headline: "Former VP of Sales at Qualtrics · fractional advisor",
  bio:
    "15 years scaling enterprise SaaS in Utah. Built the GTM motion that " +
    "took Qualtrics from $40M to $400M ARR. Now interested in fractional " +
    "advisory work — I want to give back to the next generation of Utah " +
    "founders.",
  lookingFor:
    "Fractional advisory or board roles, Series A or later, Utah AI or " +
    "SaaS startups, ideally founder-led. 5–10 hours per month. Cash + equity.",
  categories: ["fractional", "advisor-paid", "board-member"],
  lookingForNeeds: ["sales", "marketing", "executive"],
  skills: [
    "Enterprise sales",
    "GTM scaling",
    "Fundraising",
    "Board governance",
    "Recruiting",
    "Pricing",
  ],
  domains: ["ai", "software"],
  availability: "fractional",
  compensation: ["cash", "equity"],
  stagePrefs: ["series-a", "series-b"],
  riskTolerance: 4,
  location: "Salt Lake City, UT",
  utahOrgIds: ["org-qualtrics", "org-domo", "org-silicon-slopes"],
  networks: ["operator", "mentor"],
  linkedinUrl: "https://linkedin.com/in/example-sarah",
  websiteUrl: "https://example.com/sarah",
  createdAt: "2026-04-12T15:00:00.000Z",
};

export const LUMEN: BusinessDTO = {
  id: "sup-lumen",
  name: "Lumen Bio",
  oneLiner: "Light-activated cancer therapeutics",
  description:
    "U of U PIVOT Center spinout developing photoactivated small-molecule " +
    "therapies for solid tumors. Just licensed our IP and need a CEO with " +
    "FDA experience to lead us through IND-enabling studies.",
  sector: "life-sciences",
  origin: "u-of-u-spinout",
  trl: 4,
  fundingStage: "seed",
  fundingStatus: "grant",
  needs: ["executive", "advisor-paid", "regulatory"],
  networksWanted: ["operator", "mentor"],
  location: "Salt Lake City, UT",
  utahOrgIds: ["org-pivot", "org-uofu", "org-biohive"],
  linkedinUrl: "https://linkedin.com/company/example-lumen",
  websiteUrl: "https://example.com/lumen",
  createdAt: "2026-03-04T12:00:00.000Z",
};

export const SARAH_LUMEN_MATCH: MatchDTO = {
  id: "match-sarah-lumen",
  subjectId: SARAH.id,
  candidateId: LUMEN.id,
  candidateKind: "business",
  score: 0.78,
  reason:
    "Sarah's enterprise GTM experience at Qualtrics directly addresses " +
    "Lumen Bio's biggest commercial gap. Her fractional availability and " +
    "equity-comfort match Lumen's seed-stage budget. Both are anchored in " +
    "the Utah ecosystem — Silicon Slopes and PIVOT Center share several " +
    "mentors.",
  concerns: [
    "Sarah has no FDA / regulatory background — Lumen is a clinical-stage therapeutic, this gap matters for any CEO conversation.",
  ],
  factors: [
    {
      label: "Stage fit",
      weight: 0.92,
      detail: "Series-A advisory profile vs seed business — close enough for fractional.",
    },
    {
      label: "Skills overlap",
      weight: 0.7,
      detail: "GTM + fundraising overlap directly with Lumen's commercial needs.",
    },
    {
      label: "Wants alignment",
      weight: 0.88,
      detail: "Sarah seeks fractional advisory; Lumen seeks senior commercial mentor.",
    },
    {
      label: "Networks",
      weight: 0.86,
      detail: "Silicon Slopes ↔ PIVOT Center mentor overlap.",
    },
    {
      label: "Comp",
      weight: 0.7,
      detail: "Cash + equity comfort matches seed-stage budget.",
    },
  ],
  proximityBoost: 0.18,
  sharedOrgIds: ["org-silicon-slopes", "org-pivot"],
};

export const SARAH_LUMEN_GAP_TEXT =
  "Sarah's strongest gap is FDA / regulatory experience — Lumen Bio is a clinical-stage therapeutic, and CEO conversations will turn on IND-enabling and 510(k) pathway literacy.";

export const SARAH_LUMEN_RESOURCES: ResourceDTO[] = [
  {
    id: "res-pivot-fda-mentor",
    title: "PIVOT Center FDA mentor program",
    description: "Curated FDA-experienced mentors at U of U's tech transfer office.",
    kind: "mentor",
    url: "https://pivotcenter.utah.edu/programs/fda-mentor",
    tags: ["fda", "regulatory", "u-of-u", "mentor"],
    summary:
      "First call is free for licensed-spinout CEOs. Mentors include former FDA reviewers and veteran Utah biotech founders.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "res-biohive-regulatory",
    title: "BioHive accelerator — Regulatory cohort",
    description: "12-week cohort on FDA pathway navigation for Utah life-sciences startups.",
    kind: "program",
    url: "https://biohive.utah.org/cohorts/regulatory",
    tags: ["fda", "accelerator", "utah", "life-sciences"],
    summary:
      "12-week program focused on IND-enabling milestones, 510(k) vs PMA decisions, and CMC strategy for Utah biotech.",
    uploadedById: null,
    uploadedByName: "BioHive",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "res-fda-pathway-playbook",
    title: "FDA pathway for Utah biotech",
    description: "Founder-written playbook on clearing 510(k) and PMA from Utah.",
    kind: "playbook",
    url: "https://example.com/fda-utah-playbook",
    tags: ["fda", "playbook", "founders"],
    summary:
      "45-page guide built from interviews with 8 Utah biotech founders who have cleared 510(k) and PMA submissions.",
    uploadedById: null,
    uploadedByName: "Utah Biotech Founders",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
];

/**
 * Synthetic Affinity push representing the moment Sarah ↔ Lumen Bio went
 * mutual. Wired with the same shape the live `/affinity-push` page renders.
 */
export const SARAH_LUMEN_PUSH: AffinityPushDTO = {
  id: "push-sarah-lumen",
  talentId: SARAH.id,
  startupId: LUMEN.id,
  pushedAt: "2026-05-08T18:42:11.000Z",
  reason:
    "Mutual interest. Sarah's enterprise GTM experience at Qualtrics " +
    "directly addresses Lumen Bio's biggest commercial gap. Both anchored " +
    "in Utah — Silicon Slopes and PIVOT Center share several mentors.",
  status: "pushed",
  affinityOrganizationId: 80421,
  affinityPersonId: 152904,
  affinityListEntryId: 220887,
  affinityListId: 18271,
  affinityUrl: "https://app.affinity.co/lists/18271/list-entries/220887",
  pipelineStage: "intro_made",
  syncState: "synced",
  syncError: null,
  apiCalls: [
    {
      method: "POST",
      path: "/v2/organizations",
      status: 200,
      durationMs: 184,
      at: "2026-05-08T18:42:11.420Z",
    },
    {
      method: "POST",
      path: "/v2/persons",
      status: 200,
      durationMs: 142,
      at: "2026-05-08T18:42:11.605Z",
    },
    {
      method: "POST",
      path: "/v2/lists/18271/list-entries",
      status: 201,
      durationMs: 168,
      at: "2026-05-08T18:42:11.750Z",
    },
    {
      method: "PUT",
      path: "/v2/list-entries/220887/field-values",
      status: 200,
      durationMs: 124,
      at: "2026-05-08T18:42:11.920Z",
    },
  ],
  fieldValues: [
    { label: "Stage", value: "Intro made" },
    { label: "Match score", value: "78%" },
    { label: "Reason hash", value: "sha256:9c3f…ae" },
    { label: "Source", value: "Connections Hub" },
  ],
};
