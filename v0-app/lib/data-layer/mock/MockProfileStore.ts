import type { IProfileStore } from "@/contracts/data-layer";
import type { TalentDTO, StartupDTO } from "@/contracts/data";
import talentSeed from "@/data/talent.synthetic.json";
import startupSeed from "@/data/startups.synthetic.json";

/**
 * In-memory profile store. Backed by the synthetic JSON seeds at boot, with a
 * Map for any new profiles created during the session. Resets on reload —
 * exactly the right shape for the demo.
 */
export class MockProfileStore implements IProfileStore {
  private readonly talent = new Map<string, TalentDTO>();
  private readonly startups = new Map<string, StartupDTO>();
  /** Bumps on every put. Acts as the cache's pool-side fingerprint. */
  private revision = 0;

  constructor() {
    for (const t of talentSeed as TalentDTO[]) this.talent.set(t.id, t);
    for (const s of startupSeed as StartupDTO[]) this.startups.set(s.id, s);
  }

  async getTalent(id: string) {
    return this.talent.get(id) ?? null;
  }
  async putTalent(t: TalentDTO) {
    this.talent.set(t.id, t);
    this.revision++;
  }
  async listTalent() {
    return Array.from(this.talent.values());
  }
  async getStartup(id: string) {
    return this.startups.get(id) ?? null;
  }
  async putStartup(s: StartupDTO) {
    this.startups.set(s.id, s);
    this.revision++;
  }
  async listStartups() {
    return Array.from(this.startups.values());
  }
  getPoolRevision() {
    return this.revision;
  }
}

// Singleton — important because mock state persists across API requests in dev.
let _instance: MockProfileStore | null = null;
export function getMockProfileStore(): MockProfileStore {
  if (!_instance) _instance = new MockProfileStore();
  return _instance;
}
