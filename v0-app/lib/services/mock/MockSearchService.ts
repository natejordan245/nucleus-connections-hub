import type { ISearchService } from "@/contracts/services";
import type { MatchResponse } from "@/contracts/data";
import { matchEngine } from "@/lib/data-layer/factory";

export class MockSearchService implements ISearchService {
  async search(args: {
    query: string;
    kind: "talent" | "startup";
    k?: number;
  }): Promise<MatchResponse> {
    await sleep(380);
    return matchEngine.findFromQuery({
      query: args.query,
      target: args.kind,
      k: args.k,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
