import type { IMatchService } from "@/contracts/services";
import type { MatchResponse } from "@/contracts/data";
import { http } from "./http";
import { MockMatchService } from "../mock/MockMatchService";

export class HttpMatchService implements IMatchService {
  private mock = new MockMatchService();
  getMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
  }) {
    const params: Record<string, string> = { for: args.for, type: args.type };
    if (args.target) params.target = args.target;
    const qs = new URLSearchParams(params).toString();
    return http<MatchResponse>(`/api/matches?${qs}`, {
      mockFallback: () => this.mock.getMatches(args),
    });
  }
}
