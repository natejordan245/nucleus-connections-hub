import type { IAffinityClient } from "@/contracts/data-layer";
import type { AffinityPushPayload } from "@/contracts/data";
import { getMockAffinityClient } from "../mock/MockAffinityClient";
import { withFallback } from "../feature-flags";

const AFFINITY_BASE = "https://api.affinity.co";

export class AffinityClient implements IAffinityClient {
  private mock = getMockAffinityClient();
  private get key(): string {
    return process.env.AFFINITY_API_KEY ?? "";
  }
  private headers(): HeadersInit {
    if (!this.key) throw new Error("AFFINITY_API_KEY not set");
    return {
      Authorization: `Basic ${Buffer.from(`:${this.key}`).toString("base64")}`,
      "Content-Type": "application/json",
    };
  }

  async upsertPerson(p: { name: string; email: string }): Promise<{ affinityId: string }> {
    return withFallback(
      "affinity",
      async () => {
        const res = await fetch(`${AFFINITY_BASE}/persons`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ first_name: p.name.split(" ")[0], last_name: p.name.split(" ").slice(1).join(" "), emails: [p.email] }),
        });
        if (!res.ok) throw new Error(`Affinity ${res.status}`);
        const j = (await res.json()) as { id: number };
        return { affinityId: String(j.id) };
      },
      () => this.mock.upsertPerson(p),
      { adapter: "AffinityClient", op: "upsertPerson" }
    );
  }

  async addToList(args: { personId: string; listName: string }): Promise<void> {
    return withFallback(
      "affinity",
      async () => {
        const res = await fetch(`${AFFINITY_BASE}/list-entries`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ entity_id: Number(args.personId), list_name: args.listName }),
        });
        if (!res.ok) throw new Error(`Affinity addToList ${res.status}`);
      },
      () => this.mock.addToList(args),
      { adapter: "AffinityClient", op: "addToList" }
    );
  }

  async addNote(args: { personId: string; body: string }): Promise<void> {
    return withFallback(
      "affinity",
      async () => {
        const res = await fetch(`${AFFINITY_BASE}/notes`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ person_ids: [Number(args.personId)], content: args.body }),
        });
        if (!res.ok) throw new Error(`Affinity addNote ${res.status}`);
      },
      () => this.mock.addNote(args),
      { adapter: "AffinityClient", op: "addNote" }
    );
  }

  async recentPushes(): Promise<AffinityPushPayload[]> {
    // Always read from the local mock log — even in real mode we record locally
    // so the admin slide can show "what was sent today".
    return this.mock.recentPushes();
  }

  async recordPush(payload: AffinityPushPayload): Promise<void> {
    await this.mock.recordPush(payload);
  }
}
