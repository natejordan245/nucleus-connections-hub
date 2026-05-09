import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET() {
  const store = getDataStore();
  const pushes = await store.listAffinityPushes();
  return NextResponse.json({ pushes });
}
