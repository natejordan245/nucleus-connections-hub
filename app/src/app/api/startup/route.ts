import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { StartupDTO } from "@/lib/data";

export async function GET() {
  const store = getDataStore();
  const startups = await store.listStartups();
  return NextResponse.json({ startups });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<StartupDTO>;
  if (!body.id || !body.name || !body.description) {
    return NextResponse.json(
      { error: "id, name, description are required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  const created = await store.putStartup(fillStartup(body));
  return NextResponse.json({ startup: created }, { status: 201 });
}

function fillStartup(p: Partial<StartupDTO>): StartupDTO {
  return {
    id: p.id!,
    name: p.name!,
    oneLiner: p.oneLiner ?? "",
    description: p.description!,
    sector: p.sector ?? "software",
    origin: p.origin ?? "bootstrapped",
    trl: p.trl,
    fundingStage: p.fundingStage ?? "seed",
    fundingStatus: p.fundingStatus ?? "pre-revenue",
    needs: p.needs ?? [],
    networksWanted: p.networksWanted ?? ["operator"],
    location: p.location ?? "Salt Lake City, UT",
    utahOrgIds: p.utahOrgIds ?? [],
    logoUrl: p.logoUrl,
    linkedinUrl: p.linkedinUrl,
    xUrl: p.xUrl,
    websiteUrl: p.websiteUrl,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}
