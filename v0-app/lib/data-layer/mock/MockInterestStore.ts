import type { IInterestStore } from "@/contracts/data-layer";
import type { InterestState, InterestSide } from "@/contracts/data";

const blank = (talentId: string, startupId: string): InterestState => ({
  talentId,
  startupId,
  talentState: "pending",
  startupState: "pending",
  mutualAt: null,
});

export class MockInterestStore implements IInterestStore {
  private byKey = new Map<string, InterestState>();

  private key(talentId: string, startupId: string) {
    return `${talentId}::${startupId}`;
  }

  async get({ talentId, startupId }: { talentId: string; startupId: string }) {
    return this.byKey.get(this.key(talentId, startupId)) ?? blank(talentId, startupId);
  }

  async put(state: InterestState) {
    this.byKey.set(this.key(state.talentId, state.startupId), state);
  }

  async vote(args: {
    talentId: string;
    startupId: string;
    from: InterestSide;
    state: "interested" | "pass";
  }): Promise<InterestState> {
    const cur = await this.get({ talentId: args.talentId, startupId: args.startupId });
    const next: InterestState = {
      ...cur,
      [args.from === "talent" ? "talentState" : "startupState"]: args.state,
    };
    if (next.talentState === "interested" && next.startupState === "interested" && !next.mutualAt) {
      next.mutualAt = new Date().toISOString();
    }
    await this.put(next);
    return next;
  }
}

let _instance: MockInterestStore | null = null;
export function getMockInterestStore(): MockInterestStore {
  if (!_instance) _instance = new MockInterestStore();
  return _instance;
}
