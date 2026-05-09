import type {
  AffinityApiCall,
  AffinityFieldId,
  AffinityFieldValue,
  AffinityList,
  AffinityListEntry,
  AffinityListEntryId,
  AffinityListId,
  AffinityOrganization,
  AffinityOrganizationId,
  AffinityPerson,
  AffinityPersonId,
} from "./types";

/**
 * The contract every Affinity transport must implement. The real HTTP client
 * and the mock client are interchangeable behind this interface. Methods
 * mirror the subset of the Affinity REST API the push pipeline uses.
 *
 * Every method records an `AffinityApiCall` that callers can collect via
 * `drainCallLog()` to surface in the UI timeline.
 */
export interface AffinityClient {
  /** GET /lists — used for connection-health checks. */
  listLists(): Promise<AffinityList[]>;

  /** POST /organizations — idempotent on `domain`. */
  upsertOrganization(args: {
    name: string;
    domain: string | null;
  }): Promise<AffinityOrganization>;

  /** POST /persons — idempotent on `primary_email`. */
  upsertPerson(args: {
    firstName: string;
    lastName: string;
    email: string | null;
    organizationIds: AffinityOrganizationId[];
  }): Promise<AffinityPerson>;

  /**
   * POST /list-entries — adds an entity to a list. Affinity returns 200 even
   * if the entity is already in the list, with the existing entry id.
   */
  addToList(args: {
    listId: AffinityListId;
    entityId: AffinityOrganizationId | AffinityPersonId;
  }): Promise<AffinityListEntry>;

  /** PUT /field-values — sets a single column on a list entry. */
  setFieldValue(args: {
    listEntryId: AffinityListEntryId;
    fieldId: AffinityFieldId;
    value:
      | { kind: "text"; value: string }
      | { kind: "number"; value: number }
      | { kind: "dropdown"; optionId: number; optionText: string }
      | { kind: "datetime"; value: string };
  }): Promise<AffinityFieldValue>;

  /**
   * Drains and returns every API call captured since the last drain. UI
   * surfaces use this to render the per-push timeline.
   */
  drainCallLog(): AffinityApiCall[];
}
