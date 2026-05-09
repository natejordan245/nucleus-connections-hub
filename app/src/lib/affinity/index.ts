/**
 * Public entrypoint for the Affinity integration.
 *
 * `getAffinityClient()` is the only way other code reaches the transport.
 * It always returns the in-memory mock client — this build doesn't have
 * Affinity sandbox credentials, so the integration is wired end-to-end but
 * never leaves the process. Flipping `AFFINITY_CONFIG.live = true` and
 * supplying an api key would activate the real HTTP path.
 *
 * `pushMutualMatch()` is the orchestration helper called from
 * `recordAffinityPush` in both data stores. It runs the full
 * org-upsert → person-upsert → list-add → field-value pipeline and returns
 * a structured payload the data layer persists alongside our internal
 * `AffinityPushDTO`.
 */

import type { StartupDTO, TalentDTO } from "@/lib/data/types";
import { AFFINITY_CONFIG, type AffinityPipelineStage } from "./config";
import type { AffinityClient } from "./client";
import { mockAffinityClient } from "./mock-client";
import { describeMatch, startupToOrganizationInput, talentToPersonInput } from "./mappers";
import type { AffinityApiCall } from "./types";

export type { AffinityClient } from "./client";
export type {
  AffinityApiCall,
  AffinityListEntryId,
  AffinityOrganizationId,
  AffinityPersonId,
  AffinityWebhookEvent,
} from "./types";
export { AFFINITY_CONFIG } from "./config";
export { verifyAffinitySignature, signAffinityBody } from "./signature";

/**
 * Always returns the mock client. The branch on `AFFINITY_CONFIG.live` exists
 * so the wiring is visible — swapping in `RealAffinityClient` is a one-line
 * change once a sandbox key lands.
 */
export function getAffinityClient(): AffinityClient {
  if (AFFINITY_CONFIG.live && AFFINITY_CONFIG.apiKey) {
    // Intentionally still returning mock here — the live path is documented in
    // `./real-client.ts` but not enabled for the hackathon build. Flip this
    // when real credentials are available.
    return mockAffinityClient;
  }
  return mockAffinityClient;
}

export type AffinityPushPayload = {
  organizationId: number;
  personId: number;
  /** The org-list entry id; this is the row a sales rep clicks into in Affinity. */
  listEntryId: number;
  listId: number;
  affinityUrl: string;
  pipelineStage: AffinityPipelineStage;
  apiCalls: AffinityApiCall[];
  /** A short list of (label, value) pairs surfaced in the UI. */
  fieldValues: Array<{ label: string; value: string }>;
};

export type PushMutualMatchResult =
  | { ok: true; payload: AffinityPushPayload }
  | { ok: false; error: string; apiCalls: AffinityApiCall[] };

/**
 * Run the mutual-match push pipeline against the configured Affinity client.
 *
 * Steps:
 *   1. Upsert the startup as an Organization.
 *   2. Upsert the talent as a Person, linked to the org.
 *   3. Add the org to the "mutual matches (orgs)" list.
 *   4. Add the person to the "mutual matches (people)" list.
 *   5. Set Nucleus-managed field values on the org list entry: match score,
 *      reason, stage, sector, pipeline stage.
 *
 * Errors at any step are caught and returned in the failure branch alongside
 * whatever calls did make it. The data store records the failure state so
 * the UI can render a "Retry" affordance.
 */
export async function pushMutualMatch(args: {
  talent: TalentDTO;
  startup: StartupDTO;
  matchScore?: number;
  reason?: string;
}): Promise<PushMutualMatchResult> {
  const client = getAffinityClient();
  // Drain any stale calls from a previous push so this run's timeline is clean.
  client.drainCallLog();

  try {
    const org = await client.upsertOrganization(startupToOrganizationInput(args.startup));
    const person = await client.upsertPerson(talentToPersonInput(args.talent, [org.id]));

    const orgEntry = await client.addToList({
      listId: AFFINITY_CONFIG.organizationListId,
      entityId: org.id,
    });
    await client.addToList({
      listId: AFFINITY_CONFIG.personListId,
      entityId: person.id,
    });

    const reason = describeMatch({ ...args });
    const score = args.matchScore != null ? Math.round(args.matchScore * 100) : 100;

    await client.setFieldValue({
      listEntryId: orgEntry.id,
      fieldId: AFFINITY_CONFIG.fields.nucleusMatchScore,
      value: { kind: "number", value: score },
    });
    await client.setFieldValue({
      listEntryId: orgEntry.id,
      fieldId: AFFINITY_CONFIG.fields.nucleusReason,
      value: { kind: "text", value: reason },
    });
    await client.setFieldValue({
      listEntryId: orgEntry.id,
      fieldId: AFFINITY_CONFIG.fields.nucleusStage,
      value: { kind: "text", value: args.startup.fundingStage },
    });
    await client.setFieldValue({
      listEntryId: orgEntry.id,
      fieldId: AFFINITY_CONFIG.fields.nucleusSector,
      value: { kind: "text", value: args.startup.sector },
    });
    const pipeline = AFFINITY_CONFIG.pipelineOptions.intro_queued;
    await client.setFieldValue({
      listEntryId: orgEntry.id,
      fieldId: AFFINITY_CONFIG.fields.pipelineStage,
      value: { kind: "dropdown", optionId: pipeline.id, optionText: pipeline.text },
    });

    const apiCalls = client.drainCallLog();

    return {
      ok: true,
      payload: {
        organizationId: org.id,
        personId: person.id,
        listEntryId: orgEntry.id,
        listId: AFFINITY_CONFIG.organizationListId,
        affinityUrl: `https://app.affinity.co/lists/${AFFINITY_CONFIG.organizationListId}/list_entries/${orgEntry.id}`,
        pipelineStage: "intro_queued",
        apiCalls,
        fieldValues: [
          { label: "Match score", value: `${score}%` },
          { label: "Reason", value: reason },
          { label: "Pipeline", value: pipeline.text },
        ],
      },
    };
  } catch (err) {
    const apiCalls = client.drainCallLog();
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      apiCalls,
    };
  }
}
