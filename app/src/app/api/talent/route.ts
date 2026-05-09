import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { CandidateDTO } from "@/lib/data";

// Legacy alias for /api/candidate. Returns `{ talent }` / `{ candidate }`
// either way so existing callers keep working post-rename.

export async function GET() {
  const store = getDataStore();
  const candidates = await store.listCandidates();
  return NextResponse.json({ candidates, talent: candidates });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<CandidateDTO>;
  if (!body.id || !body.name || !body.email || !body.bio) {
    return NextResponse.json(
      { error: "id, name, email, bio are required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  const created = await store.putCandidate(fillCandidate(body));
  return NextResponse.json({ candidate: created, talent: created }, { status: 201 });
}

function fillCandidate(p: Partial<CandidateDTO>): CandidateDTO {
  return {
    id: p.id!,
    name: p.name!,
    email: p.email!,
    headline: p.headline ?? "",
    bio: p.bio!,
    lookingFor: p.lookingFor ?? "",
    categories: p.categories ?? ["operator"],
    lookingForNeeds: p.lookingForNeeds ?? [],
    domains: p.domains ?? [],
    availability: p.availability ?? "full-time",
    compensation: p.compensation ?? ["cash"],
    stagePrefs: p.stagePrefs ?? ["seed"],
    riskTolerance: p.riskTolerance ?? 3,
    location: p.location ?? "Salt Lake City, UT",
    utahOrgIds: p.utahOrgIds ?? [],
    networks: p.networks ?? ["operator"],
    photoUrl: p.photoUrl,
    linkedinUrl: p.linkedinUrl,
    xUrl: p.xUrl,
    websiteUrl: p.websiteUrl,
    resumeExtract: p.resumeExtract,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}
