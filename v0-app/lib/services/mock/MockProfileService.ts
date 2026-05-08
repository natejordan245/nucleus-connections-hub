import type { IProfileService, ExtractTalentArgs, ExtractStartupArgs } from "@/contracts/services";
import type { TalentDTO, StartupDTO } from "@/contracts/data";
import { ServiceError } from "@/contracts/services";
import { getMockProfileStore } from "@/lib/data-layer/mock/MockProfileStore";
import { MockLLMClient } from "@/lib/data-layer/mock/MockLLMClient";
import { mergeTalent, mergeStartup } from "@/lib/api/profile-helpers";

/**
 * In-process mock service. Same shape as HttpProfileService — frontend doesn't
 * know which one it's holding.
 */
export class MockProfileService implements IProfileService {
  private store = getMockProfileStore();
  private llm = new MockLLMClient();

  async getTalent(id: string): Promise<TalentDTO> {
    const t = await this.store.getTalent(id);
    if (!t) throw new ServiceError(`talent ${id} not found`, { status: 404, code: "not_found" });
    await sleep(120);
    return t;
  }

  async createTalent(input: Partial<TalentDTO> & { bio: string; name: string; email: string }) {
    await sleep(700);
    const extracted = await this.llm.extractTalent(input.bio);
    const t = mergeTalent(input, extracted);
    await this.store.putTalent(t);
    return t;
  }

  async updateTalent(id: string, patch: Partial<TalentDTO>) {
    const cur = await this.store.getTalent(id);
    if (!cur) throw new ServiceError(`talent ${id} not found`, { status: 404 });
    const next = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt };
    await this.store.putTalent(next);
    await sleep(120);
    return next;
  }

  async getStartup(id: string): Promise<StartupDTO> {
    const s = await this.store.getStartup(id);
    if (!s) throw new ServiceError(`startup ${id} not found`, { status: 404 });
    await sleep(120);
    return s;
  }

  async createStartup(input: Partial<StartupDTO> & { description: string; name: string }) {
    await sleep(700);
    const extracted = await this.llm.extractStartup(input.description);
    const s = mergeStartup(input, extracted);
    await this.store.putStartup(s);
    return s;
  }

  async updateStartup(id: string, patch: Partial<StartupDTO>) {
    const cur = await this.store.getStartup(id);
    if (!cur) throw new ServiceError(`startup ${id} not found`, { status: 404 });
    const next = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt };
    await this.store.putStartup(next);
    await sleep(120);
    return next;
  }

  extractFromBio(args: ExtractTalentArgs): Promise<Partial<TalentDTO>>;
  extractFromBio(args: ExtractStartupArgs): Promise<Partial<StartupDTO>>;
  async extractFromBio(args: ExtractTalentArgs | ExtractStartupArgs): Promise<Partial<TalentDTO> | Partial<StartupDTO>> {
    await sleep(900);
    if (args.kind === "talent") return this.llm.extractTalent(args.bio);
    return this.llm.extractStartup(args.description);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
