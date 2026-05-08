"use server";

import { revalidatePath } from "next/cache";
import { getDataStore } from "@/lib/data";

export async function vote(formData: FormData) {
  const talentId = String(formData.get("talentId") ?? "");
  const startupId = String(formData.get("startupId") ?? "");
  const side = String(formData.get("side") ?? "") as "talent" | "startup";
  const state = String(formData.get("state") ?? "") as "interested" | "pass";

  if (!talentId || !startupId || !side || !state) {
    throw new Error("missing vote params");
  }

  const store = getDataStore();
  const result = await store.vote({ talentId, startupId, side, state });

  // Same side-effects as POST /api/interest — keep behavior identical.
  const talent = await store.getTalent(talentId);
  const startup = await store.getStartup(startupId);
  if (result.mutualJustNow && talent && startup) {
    await store.emitNotification({
      recipientId: talent.id,
      kind: "mutual_match",
      title: `Mutual match: ${startup.name}`,
      body: `Both sides flipped to interested. We've sent ${startup.name} to your CRM.`,
      href: `/handshake?with=${startup.id}`,
    });
    await store.emitNotification({
      recipientId: startup.id,
      kind: "mutual_match",
      title: `Mutual match: ${talent.name}`,
      body: `Both sides flipped to interested. ${talent.name} is now in your shortlist.`,
      href: `/handshake?with=${talent.id}`,
    });
    await store.recordAffinityPush({
      talentId: talent.id,
      startupId: startup.id,
      reason: `Mutual interest between ${talent.name} and ${startup.name}.`,
      status: "pushed",
    });
  } else if (state === "interested" && talent && startup) {
    if (side === "talent") {
      await store.emitNotification({
        recipientId: startup.id,
        kind: "interest_received",
        title: `${talent.name} is interested`,
        body: "Take a look — they're a fit on stage and skills.",
        href: `/handshake?with=${talent.id}`,
      });
    } else {
      await store.emitNotification({
        recipientId: talent.id,
        kind: "interest_received",
        title: `${startup.name} is interested`,
        body: "Take a look — they flagged you as a top candidate.",
        href: `/handshake?with=${startup.id}`,
      });
    }
  }

  revalidatePath("/handshake");
}
