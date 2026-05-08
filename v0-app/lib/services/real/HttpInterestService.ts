import type { IInterestService } from "@/contracts/services";
import type { InterestState, InterestSide } from "@/contracts/data";
import { http } from "./http";
import { MockInterestService } from "../mock/MockInterestService";

export class HttpInterestService implements IInterestService {
  private mock = new MockInterestService();

  expressInterest(args: {
    talentId: string;
    startupId: string;
    from: InterestSide;
    state: "interested" | "pass";
  }) {
    return http<InterestState>(`/api/interest`, {
      method: "POST",
      body: JSON.stringify(args),
      mockFallback: () => this.mock.expressInterest(args),
    });
  }

  getInterest(args: { talentId: string; startupId: string }) {
    const qs = new URLSearchParams(args).toString();
    return http<InterestState>(`/api/interest?${qs}`, {
      mockFallback: () => this.mock.getInterest(args),
    });
  }
}
