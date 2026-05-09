import { AFFINITY_CONFIG } from "./config";
import type { AffinityClient } from "./client";
import type {
  AffinityApiCall,
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
 * In-memory Affinity transport. Implements the same contract as the real
 * client — same return shapes, same idempotency semantics — but never leaves
 * the process. Used everywhere; this app is hard-wired to the mock client
 * because we don't have sandbox credentials for the demo.
 *
 * Module-scoped state survives across requests within a Node process and
 * resets on dev-server restart, matching the rest of MockDataStore.
 */

const orgs = new Map<AffinityOrganizationId, AffinityOrganization>();
const persons = new Map<AffinityPersonId, AffinityPerson>();
const listEntries = new Map<AffinityListEntryId, AffinityListEntry>();
const fieldValues: AffinityFieldValue[] = [];

const orgsByDomain = new Map<string, AffinityOrganizationId>();
const personsByEmail = new Map<string, AffinityPersonId>();
const listEntryByPair = new Map<string, AffinityListEntryId>();

let nextOrgId = 100_000;
let nextPersonId = 200_000;
let nextListEntryId = 300_000;

const lists: AffinityList[] = [
  {
    id: AFFINITY_CONFIG.organizationListId,
    type: 1,
    name: "Nucleus — Mutual matches (Orgs)",
    public: false,
    owner_id: 1,
    list_size: 0,
  },
  {
    id: AFFINITY_CONFIG.personListId,
    type: 0,
    name: "Nucleus — Mutual matches (People)",
    public: false,
    owner_id: 1,
    list_size: 0,
  },
];

let callLog: AffinityApiCall[] = [];

function record(method: AffinityApiCall["method"], path: string, status: number, durationMs: number) {
  callLog.push({ method, path, status, durationMs, at: new Date().toISOString() });
}

/**
 * Synthetic latency so the call timeline looks like network calls in the UI.
 * Kept short enough not to slow the demo. Disabled in tests via NODE_ENV.
 */
async function jitter(min = 18, max = 60) {
  if (process.env.NODE_ENV === "test") return;
  const ms = Math.floor(min + Math.random() * (max - min));
  await new Promise((r) => setTimeout(r, ms));
}

export class MockAffinityClient implements AffinityClient {
  async listLists(): Promise<AffinityList[]> {
    const start = Date.now();
    await jitter();
    record("GET", "/lists", 200, Date.now() - start);
    return lists.map((l) => ({ ...l }));
  }

  async upsertOrganization(args: { name: string; domain: string | null }): Promise<AffinityOrganization> {
    const start = Date.now();
    await jitter();
    const key = (args.domain ?? args.name).toLowerCase();
    const existing = orgsByDomain.get(key);
    if (existing) {
      const org = orgs.get(existing)!;
      record("POST", "/organizations", 200, Date.now() - start);
      return { ...org };
    }
    const id = nextOrgId++;
    const org: AffinityOrganization = {
      id,
      name: args.name,
      domain: args.domain,
      domains: args.domain ? [args.domain] : [],
      global: false,
      person_ids: [],
    };
    orgs.set(id, org);
    orgsByDomain.set(key, id);
    record("POST", "/organizations", 201, Date.now() - start);
    return { ...org };
  }

  async upsertPerson(args: {
    firstName: string;
    lastName: string;
    email: string | null;
    organizationIds: AffinityOrganizationId[];
  }): Promise<AffinityPerson> {
    const start = Date.now();
    await jitter();
    const key = (args.email ?? `${args.firstName}.${args.lastName}`).toLowerCase();
    const existing = personsByEmail.get(key);
    if (existing) {
      const person = persons.get(existing)!;
      // Merge org ids — Affinity's real API extends the array on re-upsert.
      const merged = Array.from(new Set([...person.organization_ids, ...args.organizationIds]));
      const updated: AffinityPerson = { ...person, organization_ids: merged };
      persons.set(existing, updated);
      record("POST", "/persons", 200, Date.now() - start);
      return { ...updated };
    }
    const id = nextPersonId++;
    const person: AffinityPerson = {
      id,
      type: 0,
      first_name: args.firstName,
      last_name: args.lastName,
      primary_email: args.email,
      emails: args.email ? [args.email] : [],
      organization_ids: args.organizationIds,
    };
    persons.set(id, person);
    personsByEmail.set(key, id);
    // Backfill the org → person link.
    for (const orgId of args.organizationIds) {
      const org = orgs.get(orgId);
      if (org && !org.person_ids.includes(id)) {
        orgs.set(orgId, { ...org, person_ids: [...org.person_ids, id] });
      }
    }
    record("POST", "/persons", 201, Date.now() - start);
    return { ...person };
  }

  async addToList(args: {
    listId: AffinityListId;
    entityId: AffinityOrganizationId | AffinityPersonId;
  }): Promise<AffinityListEntry> {
    const start = Date.now();
    await jitter();
    const pairKey = `${args.listId}:${args.entityId}`;
    const existing = listEntryByPair.get(pairKey);
    if (existing) {
      const entry = listEntries.get(existing)!;
      record("POST", `/lists/${args.listId}/list-entries`, 200, Date.now() - start);
      return { ...entry };
    }
    const list = lists.find((l) => l.id === args.listId);
    const entry: AffinityListEntry = {
      id: nextListEntryId++,
      list_id: args.listId,
      entity_id: args.entityId,
      entity_type: list?.type ?? 1,
      created_at: new Date().toISOString(),
      creator_id: 1,
    };
    listEntries.set(entry.id, entry);
    listEntryByPair.set(pairKey, entry.id);
    if (list) list.list_size += 1;
    record("POST", `/lists/${args.listId}/list-entries`, 201, Date.now() - start);
    return { ...entry };
  }

  async setFieldValue(args: {
    listEntryId: AffinityListEntryId;
    fieldId: number;
    value:
      | { kind: "text"; value: string }
      | { kind: "number"; value: number }
      | { kind: "dropdown"; optionId: number; optionText: string }
      | { kind: "datetime"; value: string };
  }): Promise<AffinityFieldValue> {
    const start = Date.now();
    await jitter();
    let fv: AffinityFieldValue;
    switch (args.value.kind) {
      case "text":
        fv = {
          field_id: args.fieldId,
          list_entry_id: args.listEntryId,
          value: args.value.value,
          value_type: "text",
        };
        break;
      case "number":
        fv = {
          field_id: args.fieldId,
          list_entry_id: args.listEntryId,
          value: args.value.value,
          value_type: "number",
        };
        break;
      case "dropdown":
        fv = {
          field_id: args.fieldId,
          list_entry_id: args.listEntryId,
          value: { id: args.value.optionId, text: args.value.optionText },
          value_type: "dropdown",
        };
        break;
      case "datetime":
        fv = {
          field_id: args.fieldId,
          list_entry_id: args.listEntryId,
          value: args.value.value,
          value_type: "datetime",
        };
        break;
    }
    fieldValues.push(fv);
    record("PUT", "/field-values", 200, Date.now() - start);
    return fv;
  }

  drainCallLog(): AffinityApiCall[] {
    const drained = callLog;
    callLog = [];
    return drained;
  }
}

export const mockAffinityClient = new MockAffinityClient();
