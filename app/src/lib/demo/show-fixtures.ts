/**
 * Static fixtures for the story-slideshow pages. Hardcoded DTOs in shapes
 * the production components already accept. The slideshow imports from this
 * file *instead of* `@/lib/data` — no data-store, no fetch, no API.
 *
 * Keep these in sync with the seed data so judges who toggle into the live
 * product see the same protagonists. Zac Hales ↔ Plaibook is the canonical
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
  id: "tal-zac",
  name: "Zac Hales",
  email: "zac.hales@example.com",
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
  domains: ["ai", "software"],
  availability: "fractional",
  compensation: ["cash", "equity"],
  stagePrefs: ["series-a", "series-b"],
  riskTolerance: 4,
  location: "Salt Lake City, UT",
  utahOrgIds: ["org-qualtrics", "org-domo", "org-silicon-slopes"],
  networks: ["operator", "mentor"],
  linkedinUrl: "https://linkedin.com/in/zac-hales",
  websiteUrl: "https://example.com/zac",
  createdAt: "2026-04-12T15:00:00.000Z",
};

export const LUMEN: BusinessDTO = {
  id: "sup-plaibook",
  name: "Plaibook",
  oneLiner: "AI sales analytics & revenue recovery for pest control",
  description:
    "Plaibook scores every sales call in real time, flags where deals fall " +
    "out, and automatically recovers lost revenue with text-based " +
    "follow-ups. Live with pest control operators today; expanding into " +
    "adjacent home-services verticals. Raising a seed round.",
  sector: "software",
  origin: "vc-backed",
  trl: 7,
  fundingStage: "seed",
  fundingStatus: "revenue",
  needs: ["executive", "advisor-paid", "sales"],
  networksWanted: ["operator", "mentor"],
  location: "Salt Lake City, UT",
  utahOrgIds: ["org-silicon-slopes", "org-stoke-mtn"],
  logoUrl: "/plaibook-icon.svg",
  linkedinUrl: "https://linkedin.com/company/plaibook",
  websiteUrl: "https://plaibook.tech",
  createdAt: "2026-03-04T12:00:00.000Z",
};

export const SARAH_LUMEN_MATCH: MatchDTO = {
  id: "match-zac-plaibook",
  subjectId: SARAH.id,
  candidateId: LUMEN.id,
  candidateKind: "business",
  score: 0.78,
  reason:
    "Zac's enterprise GTM experience at Qualtrics directly addresses " +
    "Plaibook's biggest commercial gap as it scales from pest control into " +
    "adjacent verticals. His fractional availability and equity-comfort " +
    "match Plaibook's seed-stage budget. Both are anchored in the Utah " +
    "ecosystem — Silicon Slopes overlap on several operator mentors.",
  concerns: [
    "Zac has no field-services / vertical-SaaS background — Plaibook sells into pest-control owner-operators, and the buyer motion looks nothing like Qualtrics enterprise.",
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
      detail: "GTM + sales coaching overlap directly with Plaibook's commercial needs.",
    },
    {
      label: "Wants alignment",
      weight: 0.88,
      detail: "Zac seeks fractional advisory; Plaibook needs a senior commercial mentor.",
    },
    {
      label: "Networks",
      weight: 0.86,
      detail: "Silicon Slopes operator overlap.",
    },
    {
      label: "Comp",
      weight: 0.7,
      detail: "Cash + equity comfort matches seed-stage budget.",
    },
  ],
  proximityBoost: 0.18,
  sharedOrgIds: ["org-silicon-slopes", "org-stoke-mtn"],
};

export const SARAH_LUMEN_GAP_TEXT =
  "Zac's strongest gap is field-services / vertical-SaaS go-to-market — Plaibook sells into pest-control owner-operators, and the buyer motion looks nothing like Qualtrics enterprise.";

export const SARAH_LUMEN_RESOURCES: ResourceDTO[] = [
  {
    id: "res-stoke-vertical-saas-mentor",
    title: "Stoke Mountain — Vertical SaaS GTM mentors",
    description: "Curated operator mentors who have scaled vertical-SaaS revenue in Utah.",
    kind: "mentor",
    url: "https://stokemtn.com/mentors/vertical-saas",
    tags: ["vertical-saas", "gtm", "utah", "mentor"],
    summary:
      "First call is free for Stoke-aligned founders. Mentors include former operators from ServiceTitan, Workiva, and Podium.",
    uploadedById: null,
    uploadedByName: "Nucleus team",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "res-silicon-slopes-field-services",
    title: "Silicon Slopes — Field-services GTM cohort",
    description: "8-week cohort on selling into home-services owner-operators.",
    kind: "program",
    url: "https://siliconslopes.com/cohorts/field-services",
    tags: ["field-services", "gtm", "utah", "vertical-saas"],
    summary:
      "8-week program focused on outbound to franchise owners, channel partnerships, and pricing for sub-$5M operators.",
    uploadedById: null,
    uploadedByName: "Silicon Slopes",
    createdAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "res-vertical-saas-playbook",
    title: "Vertical SaaS playbook — Utah edition",
    description: "Founder-written playbook on going from horizontal SaaS to vertical owner-operator buyers.",
    kind: "playbook",
    url: "https://example.com/utah-vertical-saas-playbook",
    tags: ["vertical-saas", "playbook", "founders"],
    summary:
      "38-page guide built from interviews with 9 Utah vertical-SaaS founders who scaled past $10M ARR in field-services categories.",
    uploadedById: null,
    uploadedByName: "Utah SaaS Founders",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
];

/**
 * Synthetic Affinity push representing the moment Zac ↔ Plaibook went
 * mutual. Wired with the same shape the live `/affinity-push` page renders.
 */
export const SARAH_LUMEN_PUSH: AffinityPushDTO = {
  id: "push-zac-plaibook",
  talentId: SARAH.id,
  startupId: LUMEN.id,
  pushedAt: "2026-05-08T18:42:11.000Z",
  reason:
    "Mutual interest. Zac's enterprise GTM experience at Qualtrics " +
    "directly addresses Plaibook's biggest commercial gap. Both anchored " +
    "in Utah — Silicon Slopes operators overlap.",
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
      durationMs: 41,
      at: "2026-05-08T18:42:11.420Z",
    },
    {
      method: "POST",
      path: "/v2/persons",
      status: 200,
      durationMs: 38,
      at: "2026-05-08T18:42:11.461Z",
    },
    {
      method: "POST",
      path: "/v2/lists/18271/list-entries",
      status: 201,
      durationMs: 52,
      at: "2026-05-08T18:42:11.499Z",
    },
    {
      method: "PUT",
      path: "/v2/list-entries/220887/field-values",
      status: 200,
      durationMs: 33,
      at: "2026-05-08T18:42:11.551Z",
    },
  ],
  fieldValues: [
    { label: "Stage", value: "Intro made" },
    { label: "Match score", value: "78%" },
    { label: "Reason hash", value: "sha256:9c3f…ae" },
    { label: "Source", value: "Connections Hub" },
  ],
};
