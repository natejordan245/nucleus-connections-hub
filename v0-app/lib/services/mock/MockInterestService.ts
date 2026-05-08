import type { IInterestService } from "@/contracts/services";
import type { InterestState, InterestSide, AffinityPushPayload, MatchFactors } from "@/contracts/data";
import { getMockInterestStore } from "@/lib/data-layer/mock/MockInterestStore";
import { getMockAffinityClient } from "@/lib/data-layer/mock/MockAffinityClient";
import { getMockProfileStore } from "@/lib/data-layer/mock/MockProfileStore";
import { getMockNotificationStore } from "@/lib/data-layer/mock/MockNotificationStore";
import { matchEngine } from "@/lib/data-layer/factory";
import { emitInterestNotifications } from "@/lib/notifications/emit";

export class MockInterestService implements IInterestService {
  private store = getMockInterestStore();
  private affinity = getMockAffinityClient();
  private notifications = getMockNotificationStore();
  private profileStore = getMockProfileStore();
  private engine = matchEngine;

  async expressInterest(args: {
    talentId: string;
    startupId: string;
    from: InterestSide;
    state: "interested" | "pass";
  }): Promise<InterestState> {
    await sleep(220);
    const prior = await this.store.get({ talentId: args.talentId, startupId: args.startupId });
    const next = await this.store.vote(args);

    await emitInterestNotifications({
      notificationStore: this.notifications,
      profileStore: this.profileStore,
      talentId: args.talentId,
      startupId: args.startupId,
      from: args.from,
      voterState: args.state,
      prior,
      next,
    });

    if (next.mutualAt && !prior.mutualAt) {
      const [talent, startup, matches] = await Promise.all([
        this.profileStore.getTalent(args.talentId),
        this.profileStore.getStartup(args.startupId),
        this.engine.findMatches({ for: args.talentId, type: "talent" }),
      ]);
      if (talent && startup) {
        const m = matches.matches.find((x) => x.candidateId === startup.id);
        const factors: MatchFactors = m?.factors ?? {
          skillFit: "",
          stageFit: "",
          utahSignal: "",
          concerns: "",
        };
        const note =
          (m?.reason ?? `${talent.name} ↔ ${startup.name}: mutual interest.`) +
          (m?.proximityReasons?.length
            ? `\n\nUtah signal: ${m.proximityReasons.join("; ")}`
            : "");
        const payload: AffinityPushPayload = {
          talent: { name: talent.name, email: talent.email },
          startup: { name: startup.name },
          listName: "Nucleus Connections — Mutual Match",
          note,
          factors,
          proximityReasons: m?.proximityReasons ?? [],
        };
        await this.affinity.recordPush(payload);
      }
    }
    return next;
  }

  async getInterest(args: { talentId: string; startupId: string }): Promise<InterestState> {
    await sleep(60);
    return this.store.get(args);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
