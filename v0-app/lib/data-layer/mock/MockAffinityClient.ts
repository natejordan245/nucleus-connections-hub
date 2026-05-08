import type { IAffinityClient } from "@/contracts/data-layer";
import type { AffinityPushPayload } from "@/contracts/data";

/**
 * In-memory Affinity stand-in. Records the would-be requests so the admin
 * "Affinity push" demo slide has something real to render. Idempotent on email.
 */
export class MockAffinityClient implements IAffinityClient {
  private people = new Map<string, string>(); // email → affinityId
  private pushes: AffinityPushPayload[] = [];

  async upsertPerson(p: { name: string; email: string }) {
    const existing = this.people.get(p.email);
    if (existing) return { affinityId: existing };
    const affinityId = `aff_${this.people.size + 1}`;
    this.people.set(p.email, affinityId);
    return { affinityId };
  }

  async addToList(_args: { personId: string; listName: string }) {
    /* recorded via recordPush */
  }
  async addNote(_args: { personId: string; body: string }) {
    /* recorded via recordPush */
  }

  async recentPushes() {
    return [...this.pushes].reverse();
  }

  async recordPush(payload: AffinityPushPayload) {
    this.pushes.push(payload);
  }
}

let _instance: MockAffinityClient | null = null;
export function getMockAffinityClient(): MockAffinityClient {
  if (!_instance) _instance = new MockAffinityClient();
  return _instance;
}
