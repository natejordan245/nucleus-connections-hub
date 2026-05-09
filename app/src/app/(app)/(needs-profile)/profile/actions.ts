"use server";

import { revalidatePath } from "next/cache";
import { getDataStore } from "@/lib/data";

export async function requestIntro(formData: FormData) {
  const candidateId = String(formData.get("candidateId") ?? "");
  const businessId = String(formData.get("businessId") ?? "");
  const side = String(formData.get("side") ?? "") as "candidate" | "business";
  const state = String(formData.get("state") ?? "") as "interested" | "pass";

  if (!candidateId || !businessId || !side || !state) {
    throw new Error("missing vote params");
  }

  const store = getDataStore();
  const result = await store.vote({ candidateId, businessId, side, state });

  // Same side-effects as POST /api/interest — keep behavior identical.
  const candidate = await store.getCandidate(candidateId);
  const business = await store.getBusiness(businessId);
  if (result.mutualJustNow && candidate && business) {
    await store.emitNotification({
      recipientId: candidate.id,
      kind: "mutual_match",
      title: `Mutual match: ${business.name}`,
      body: `Both sides flipped to interested. We've sent ${business.name} to your CRM.`,
      href: `/profile/business/${business.id}`,
    });
    await store.emitNotification({
      recipientId: business.id,
      kind: "mutual_match",
      title: `Mutual match: ${candidate.name}`,
      body: `Both sides flipped to interested. ${candidate.name} is now in your shortlist.`,
      href: `/profile/candidate/${candidate.id}`,
    });
    await store.recordAffinityPush({
      talentId: candidate.id,
      startupId: business.id,
      reason: `Mutual interest between ${candidate.name} and ${business.name}.`,
    });
  } else if (state === "interested" && candidate && business) {
    if (side === "candidate") {
      await store.emitNotification({
        recipientId: business.id,
        kind: "interest_received",
        title: `${candidate.name} is interested`,
        body: "Take a look — they're a fit on stage and focus.",
        href: `/profile/candidate/${candidate.id}`,
      });
    } else {
      await store.emitNotification({
        recipientId: candidate.id,
        kind: "interest_received",
        title: `${business.name} is interested`,
        body: "Take a look — they flagged you as a top candidate.",
        href: `/profile/business/${business.id}`,
      });
    }
  }

  revalidatePath(`/profile/candidate/${candidateId}`);
  revalidatePath(`/profile/business/${businessId}`);
}
