import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subjectId = url.searchParams.get("as");
  if (!subjectId) {
    return NextResponse.json({ error: "missing_as" }, { status: 400 });
  }
  const store = getDataStore();
  const matches = await store.matchesFor(subjectId);
  return NextResponse.json({ matches });
}
