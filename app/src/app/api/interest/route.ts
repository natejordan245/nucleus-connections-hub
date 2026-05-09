import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Accept both legacy `talentId`/`startupId` and new `candidateId`/`businessId`.
  const candidateId = url.searchParams.get("candidateId") ?? url.searchParams.get("talentId");
  const businessId = url.searchParams.get("businessId") ?? url.searchParams.get("startupId");
  const viewerId = url.searchParams.get("as");

  const store = getDataStore();
  if (candidateId && businessId) {
    const interest = await store.getInterest({ candidateId, businessId });
    return NextResponse.json({ interest });
  }
  if (viewerId) {
    const interests = await store.listInterests(viewerId);
    return NextResponse.json({ interests });
  }
  return NextResponse.json({ error: "provide candidateId+businessId or as=" }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    candidateId?: string;
    businessId?: string;
    talentId?: string;
    startupId?: string;
    side?: "candidate" | "business" | "talent" | "startup";
    state?: "interested" | "pass";
  };
  const candidateId = body.candidateId ?? body.talentId;
  const businessId = body.businessId ?? body.startupId;
  // Map legacy side values.
  const side: "candidate" | "business" | undefined =
    body.side === "talent"
      ? "candidate"
      : body.side === "startup"
        ? "business"
        : body.side === "candidate" || body.side === "business"
          ? body.side
          : undefined;
  if (!candidateId || !businessId || !side || !body.state) {
    return NextResponse.json(
      { error: "candidateId, businessId, side, state required" },
      { status: 400 },
    );
  }

  const store = getDataStore();
  const result = await store.vote({
    candidateId,
    businessId,
    side,
    state: body.state,
  });

  // Side-effects: emit notifications + (on mutual) record an Affinity push.
  const candidate = await store.getCandidate(candidateId);
  const business = await store.getBusiness(businessId);
  if (result.mutualJustNow && candidate && business) {
    await store.emitNotification({
      recipientId: candidate.id,
      kind: "mutual_match",
      title: `Mutual match: ${business.name}`,
      body: `Both sides flipped to interested. Send a first message →`,
      href: `/messages?with=${business.id}`,
    });
    await store.emitNotification({
      recipientId: business.id,
      kind: "mutual_match",
      title: `Mutual match: ${candidate.name}`,
      body: `Both sides flipped to interested. Send a first message →`,
      href: `/messages?with=${candidate.id}`,
    });
    // Notify the operator(s) so they can broker the intro.
    const adminIds = await store.resolveAdminUserIds();
    for (const adminId of adminIds) {
      await store.emitNotification({
        recipientId: adminId,
        kind: "mutual_match",
        title: `New mutual match: ${candidate.name} ↔ ${business.name}`,
        body: `Both sides opted in. Open the queue to broker the intro.`,
        href: "/admin",
      });
    }
    await store.recordAffinityPush({
      talentId: candidate.id,
      startupId: business.id,
      reason: `Mutual interest between ${candidate.name} and ${business.name}.`,
    });
  } else if (body.state === "interested" && candidate && business) {
    if (side === "candidate") {
      await store.emitNotification({
        recipientId: business.id,
        kind: "interest_received",
        title: `${candidate.name} is interested`,
        body: `Take a look — they're a fit on stage and focus.`,
        href: `/handshake?with=${candidate.id}`,
      });
    } else {
      await store.emitNotification({
        recipientId: candidate.id,
        kind: "interest_received",
        title: `${business.name} is interested`,
        body: `Take a look — they flagged you as a top candidate.`,
        href: `/handshake?with=${business.id}`,
      });
    }
  }

  return NextResponse.json(result);
}
