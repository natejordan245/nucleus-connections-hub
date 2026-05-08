import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

// GET /api/match-gap?subject=<uuid>&candidate=<uuid>&limit=3
//   Returns a description of the gap between the two profiles + the top
//   resource recommendations whose embeddings nearest-neighbor that gap.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const subjectId = url.searchParams.get("subject");
  const candidateId = url.searchParams.get("candidate");
  if (!subjectId || !candidateId) {
    return NextResponse.json(
      { error: "subject + candidate query params required" },
      { status: 400 },
    );
  }
  const limit = Math.max(1, Math.min(10, Number(url.searchParams.get("limit") ?? 3)));
  const store = getDataStore();
  const result = await store.recommendGapResources({
    subjectId,
    candidateId,
    limit,
  });
  return NextResponse.json(result);
}
