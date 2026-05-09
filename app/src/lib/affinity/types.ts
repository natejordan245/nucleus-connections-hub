/**
 * Affinity API shapes.
 *
 * These mirror the public Affinity REST API (`https://api.affinity.co/`) so
 * the integration code reads as real wiring even though our transport layer
 * always points at a mock client. The shapes deliberately track Affinity's
 * vocabulary — organizations, persons, lists, list entries, fields, field
 * values — rather than our domain vocabulary.
 *
 * Reference: https://api-docs.affinity.co/
 */

export type AffinityOrganizationId = number;
export type AffinityPersonId = number;
export type AffinityListId = number;
export type AffinityListEntryId = number;
export type AffinityFieldId = number;

export type AffinityOrganization = {
  id: AffinityOrganizationId;
  name: string;
  domain: string | null;
  domains: string[];
  global: boolean;
  /** Affinity returns the people associated with the org as ids. */
  person_ids: AffinityPersonId[];
};

export type AffinityPerson = {
  id: AffinityPersonId;
  type: 0 | 1; // 0 = external, 1 = internal — Nucleus contacts are external
  first_name: string;
  last_name: string;
  primary_email: string | null;
  emails: string[];
  organization_ids: AffinityOrganizationId[];
};

export type AffinityList = {
  id: AffinityListId;
  type: 0 | 1; // 0 = person list, 1 = organization list
  name: string;
  /** Whether the list is private to the user that created it. */
  public: boolean;
  owner_id: number;
  list_size: number;
};

export type AffinityListEntry = {
  id: AffinityListEntryId;
  list_id: AffinityListId;
  /** The id of the entity (org or person) attached to this list entry. */
  entity_id: AffinityOrganizationId | AffinityPersonId;
  entity_type: 0 | 1; // 0 = person, 1 = organization
  created_at: string;
  creator_id: number;
};

/**
 * Affinity supports many field types; for the Nucleus push pipeline we only
 * use a small subset — text, number, dropdown, datetime. The discriminator
 * keeps the value type safe.
 */
export type AffinityFieldValue =
  | { field_id: AffinityFieldId; list_entry_id: AffinityListEntryId; value: string; value_type: "text" }
  | { field_id: AffinityFieldId; list_entry_id: AffinityListEntryId; value: number; value_type: "number" }
  | { field_id: AffinityFieldId; list_entry_id: AffinityListEntryId; value: { id: number; text: string }; value_type: "dropdown" }
  | { field_id: AffinityFieldId; list_entry_id: AffinityListEntryId; value: string; value_type: "datetime" };

/**
 * The shape of a single API call captured during a push. Surfaced in the UI
 * timeline so judges (and future operators) can audit the integration without
 * leaving the app.
 */
export type AffinityApiCall = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: number;
  durationMs: number;
  /** ISO timestamp. */
  at: string;
};

/**
 * Webhook event payloads. Affinity actually sends these for list-entry and
 * field-value mutations when subscribed via `/webhook`. We model only the
 * subset we react to.
 */
export type AffinityWebhookEvent =
  | {
      type: "list_entry.created";
      body: { list_entry: AffinityListEntry };
      sent_at: string;
    }
  | {
      type: "list_entry.updated";
      body: { list_entry: AffinityListEntry };
      sent_at: string;
    }
  | {
      type: "field_value.updated";
      body: { field_value: AffinityFieldValue };
      sent_at: string;
    };
