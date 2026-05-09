import { AFFINITY_CONFIG } from "./config";
import type { AffinityClient } from "./client";
import type {
  AffinityApiCall,
  AffinityFieldValue,
  AffinityList,
  AffinityListEntry,
  AffinityOrganization,
  AffinityPerson,
} from "./types";

/**
 * Real HTTP client against the Affinity REST API.
 *
 * **NOT INSTANTIATED IN THIS BUILD.** We don't have sandbox credentials, so
 * `getAffinityClient()` always returns the mock client. This file exists to
 * make the integration shape explicit — every request the mock simulates has
 * a real-world implementation behind it. Flipping `AFFINITY_CONFIG.live` to
 * true and wiring an api key would activate this path.
 *
 * Auth: HTTP Basic with a blank username and the API key as password.
 * Reference: https://api-docs.affinity.co/#authentication
 */
export class RealAffinityClient implements AffinityClient {
  private callLog: AffinityApiCall[] = [];

  constructor(private apiKey: string) {}

  private async request<T>(method: AffinityApiCall["method"], path: string, body?: unknown): Promise<T> {
    const start = Date.now();
    const auth = Buffer.from(`:${this.apiKey}`).toString("base64");
    const res = await fetch(`${AFFINITY_CONFIG.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    this.callLog.push({
      method,
      path,
      status: res.status,
      durationMs: Date.now() - start,
      at: new Date().toISOString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Affinity ${method} ${path} → ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }

  listLists(): Promise<AffinityList[]> {
    return this.request("GET", "/lists");
  }

  upsertOrganization(args: { name: string; domain: string | null }): Promise<AffinityOrganization> {
    return this.request("POST", "/organizations", { name: args.name, domain: args.domain });
  }

  upsertPerson(args: {
    firstName: string;
    lastName: string;
    email: string | null;
    organizationIds: number[];
  }): Promise<AffinityPerson> {
    return this.request("POST", "/persons", {
      first_name: args.firstName,
      last_name: args.lastName,
      emails: args.email ? [args.email] : [],
      organization_ids: args.organizationIds,
    });
  }

  addToList(args: { listId: number; entityId: number }): Promise<AffinityListEntry> {
    return this.request("POST", `/lists/${args.listId}/list-entries`, { entity_id: args.entityId });
  }

  setFieldValue(args: {
    listEntryId: number;
    fieldId: number;
    value:
      | { kind: "text"; value: string }
      | { kind: "number"; value: number }
      | { kind: "dropdown"; optionId: number; optionText: string }
      | { kind: "datetime"; value: string };
  }): Promise<AffinityFieldValue> {
    const v = args.value;
    const wireValue =
      v.kind === "dropdown" ? { id: v.optionId, text: v.optionText } : v.value;
    return this.request("PUT", "/field-values", {
      field_id: args.fieldId,
      list_entry_id: args.listEntryId,
      value: wireValue,
    });
  }

  drainCallLog(): AffinityApiCall[] {
    const drained = this.callLog;
    this.callLog = [];
    return drained;
  }
}
