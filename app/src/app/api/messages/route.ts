import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

// GET /api/messages?with=<otherUserId>
//   Returns the message thread between the viewer and `with=`.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const otherId = url.searchParams.get("with");
  if (!otherId) {
    return NextResponse.json({ error: "missing_with" }, { status: 400 });
  }
  const { viewerId } = await requireViewer();
  const store = getDataStore();
  const messages = await store.listMessages({ viewerId, otherId });
  return NextResponse.json({ messages });
}

// POST /api/messages   { to: string, body: string }
export async function POST(req: Request) {
  const { viewerId } = await requireViewer();
  const body = (await req.json()) as { to?: string; body?: string };
  if (!body.to || !body.body) {
    return NextResponse.json(
      { error: "to + body required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  try {
    const message = await store.sendMessage({
      senderId: viewerId,
      recipientId: body.to,
      body: body.body,
    });
    return NextResponse.json({ message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
