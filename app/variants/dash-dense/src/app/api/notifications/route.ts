import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const recipientId = url.searchParams.get("recipientId");
  if (!recipientId) {
    return NextResponse.json({ error: "missing_recipientId" }, { status: 400 });
  }
  const store = getDataStore();
  const notifications = await store.listNotifications(recipientId);
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const recipientId = url.searchParams.get("recipientId");
  if (action !== "mark-read" || !recipientId) {
    return NextResponse.json({ error: "use ?action=mark-read&recipientId=" }, { status: 400 });
  }
  const store = getDataStore();
  await store.markAllRead(recipientId);
  return NextResponse.json({ ok: true });
}
