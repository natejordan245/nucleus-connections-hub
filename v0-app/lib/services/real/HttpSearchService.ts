import type { ISearchService } from "@/contracts/services";
import type { MatchResponse } from "@/contracts/data";
import { http } from "./http";
import { MockSearchService } from "../mock/MockSearchService";

export class HttpSearchService implements ISearchService {
  private mock = new MockSearchService();

  search(args: { query: string; kind: "talent" | "startup"; k?: number }) {
    const params = new URLSearchParams({ q: args.query, kind: args.kind });
    if (args.k) params.set("k", String(args.k));
    return http<MatchResponse>(`/api/search?${params.toString()}`, {
      mockFallback: () => this.mock.search(args),
    });
  }
}
