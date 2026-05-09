import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const talentId = url.searchParams.get("talentId");
  const startupId = url.searchParams.get("startupId");
  const viewerId = url.searchParams.get("as");

  const store = getDataStore();
  if (talentId && startupId) {
    const interest = await store.getInterest({ talentId, startupId });
    return NextResponse.json({ interest });
  }
  if (viewerId) {
    const interests = await store.listInterests(viewerId);
    return NextResponse.json({ interests });
  }
  return NextResponse.json({ error: "provide talentId+startupId or as=" }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    talentId?: string;
    startupId?: string;
    side?: "talent" | "startup";
    state?: "interested" | "pass";
  };
  if (!body.talentId || !body.startupId || !body.side || !body.state) {
    return NextResponse.json(
      { error: "talentId, startupId, side, state required" },
      { status: 400 },
    );
  }

  const store = getDataStore();
  const result = await store.vote({
    talentId: body.talentId,
    startupId: body.startupId,
    side: body.side,
    state: body.state,
  });

  // Side-effects: emit notifications + (on mutual) record an Affinity push.
  const talent = await store.getTalent(body.talentId);
  const startup = await store.getStartup(body.startupId);
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
  } else if (body.state === "interested" && talent && startup) {
    // The other side gets an "interest_received" ping.
    if (body.side === "talent") {
      await store.emitNotification({
        recipientId: startup.id,
        kind: "interest_received",
        title: `${talent.name} is interested`,
        body: `Take a look — they're a fit on stage and skills.`,
        href: `/handshake?with=${talent.id}`,
      });
    } else {
      await store.emitNotification({
        recipientId: talent.id,
        kind: "interest_received",
        title: `${startup.name} is interested`,
        body: `Take a look — they flagged you as a top candidate.`,
        href: `/handshake?with=${startup.id}`,
      });
    }
  }

  return NextResponse.json(result);
}
