import type { IMatchService } from "@/contracts/services";
import type { MatchResponse } from "@/contracts/data";
import { matchEngine } from "@/lib/data-layer/factory";

export class MockMatchService implements IMatchService {
  async getMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
  }): Promise<MatchResponse> {
    await sleep(450);
    return matchEngine.findMatches(args);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
