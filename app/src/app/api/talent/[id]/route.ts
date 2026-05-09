import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { CandidateDTO } from "@/lib/data";

// Legacy alias for /api/candidate/[id].

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const candidate = await store.getCandidate(params.id);
  if (!candidate) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ candidate, talent: candidate });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const existing = await store.getCandidate(params.id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = (await req.json()) as Partial<CandidateDTO>;
  const merged: CandidateDTO = { ...existing, ...patch, id: existing.id };
  const updated = await store.putCandidate(merged);
  return NextResponse.json({ candidate: updated, talent: updated });
}
