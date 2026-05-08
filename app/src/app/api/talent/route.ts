import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { TalentDTO } from "@/lib/data";

export async function GET() {
  const store = getDataStore();
  const talent = await store.listTalent();
  return NextResponse.json({ talent });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<TalentDTO>;
  if (!body.id || !body.name || !body.email || !body.bio) {
    return NextResponse.json(
      { error: "id, name, email, bio are required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  const created = await store.putTalent(fillTalent(body));
  return NextResponse.json({ talent: created }, { status: 201 });
}

function fillTalent(p: Partial<TalentDTO>): TalentDTO {
  return {
    id: p.id!,
    name: p.name!,
    email: p.email!,
    headline: p.headline ?? "",
    bio: p.bio!,
    lookingFor: p.lookingFor ?? "",
    categories: p.categories ?? ["operator"],
    lookingForNeeds: p.lookingForNeeds ?? [],
    skills: p.skills ?? [],
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
