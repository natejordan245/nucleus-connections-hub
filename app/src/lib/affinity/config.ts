/**
 * Affinity integration config.
 *
 * The integration is wired end-to-end but the transport always resolves to
 * the mock client (see `./index.ts`). The env vars below are read so that a
 * real deployment could swap in a live key by flipping `AFFINITY_LIVE=true`,
 * but the surface area defaults to mock for the hackathon build.
 */

export const AFFINITY_CONFIG = {
  /**
   * When true, `getAffinityClient()` would return the real HTTP client.
   * In this build it's hard-wired to false because we don't have sandbox
   * credentials — the mock client always serves requests.
   */
  live: false,

  apiKey: process.env.AFFINITY_API_KEY ?? null,
  baseUrl: "https://api.affinity.co",

  /** The org-list we push mutual-match startups into. */
  organizationListId: Number(process.env.AFFINITY_ORG_LIST_ID ?? 8421),

  /** The person-list we push matched talent into. */
  personListId: Number(process.env.AFFINITY_PERSON_LIST_ID ?? 8422),

  /**
   * Field ids for the structured columns we set on each list entry. In a real
   * Affinity workspace these are looked up via `GET /fields` once and cached.
   */
  fields: {
    nucleusMatchScore: Number(process.env.AFFINITY_FIELD_MATCH_SCORE ?? 1001),
    nucleusReason: Number(process.env.AFFINITY_FIELD_REASON ?? 1002),
    nucleusStage: Number(process.env.AFFINITY_FIELD_STAGE ?? 1003),
    nucleusSector: Number(process.env.AFFINITY_FIELD_SECTOR ?? 1004),
    /** Pipeline status — dropdown. Default values mirror common deal stages. */
    pipelineStage: Number(process.env.AFFINITY_FIELD_PIPELINE ?? 1005),
  },

  /**
   * Default dropdown option ids for `pipelineStage`. The `intro_queued` option
   * is the one we set when a mutual match is pushed.
   */
  pipelineOptions: {
    intro_queued: { id: 5001, text: "Intro queued" },
    in_review: { id: 5002, text: "In review" },
    intro_made: { id: 5003, text: "Intro made" },
    closed_won: { id: 5004, text: "Closed — won" },
    closed_lost: { id: 5005, text: "Closed — lost" },
  },

  /**
   * Webhook signing secret. Affinity signs every webhook with HMAC-SHA256
   * over the raw body and sends the digest in the `Affinity-Signature` header.
   */
  webhookSecret: process.env.AFFINITY_WEBHOOK_SECRET ?? "demo-affinity-secret-do-not-ship",
} as const;

export type AffinityPipelineStage = keyof typeof AFFINITY_CONFIG.pipelineOptions;
