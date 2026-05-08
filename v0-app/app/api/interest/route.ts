import { NextRequest } from "next/server";
import {
  interestStore,
  profileStore,
  affinityClient,
  matchEngine,
  notificationStore,
} from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";
import type { AffinityPushPayload, MatchFactors } from "@/contracts/data";
import { emitInterestNotifications } from "@/lib/notifications/emit";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const talentId = url.searchParams.get("talentId");
  const startupId = url.searchParams.get("startupId");
  if (!talentId || !startupId) return badRequest("talentId & startupId required");
  try {
    return ok(await interestStore.get({ talentId, startupId }));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      talentId: string;
      startupId: string;
      from: "talent" | "startup";
      state: "interested" | "pass";
    };
    const prior = await interestStore.get({ talentId: body.talentId, startupId: body.startupId });
    const next = await interestStore.vote(body);

    await emitInterestNotifications({
      notificationStore,
      profileStore,
      talentId: body.talentId,
      startupId: body.startupId,
      from: body.from,
      voterState: body.state,
      prior,
      next,
    });

    if (next.mutualAt && !prior.mutualAt) {
      const [talent, startup, matches] = await Promise.all([
        profileStore.getTalent(body.talentId),
        profileStore.getStartup(body.startupId),
        matchEngine.findMatches({ for: body.talentId, type: "talent" }),
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
          (m?.proximityReasons?.length ? `\n\nUtah signal: ${m.proximityReasons.join("; ")}` : "");
        const payload: AffinityPushPayload = {
          talent: { name: talent.name, email: talent.email },
          startup: { name: startup.name },
          listName: process.env.AFFINITY_LIST_NAME ?? "Nucleus Connections — Mutual Match",
          note,
          factors,
          proximityReasons: m?.proximityReasons ?? [],
        };
        await affinityClient.recordPush(payload);
        const { affinityId } = await affinityClient.upsertPerson({
          name: talent.name,
          email: talent.email,
        });
        await affinityClient.addToList({ personId: affinityId, listName: payload.listName });
        await affinityClient.addNote({ personId: affinityId, body: payload.note });
      }
    }
    return ok(next);
  } catch (err) {
    return serverError(err);
  }
}
