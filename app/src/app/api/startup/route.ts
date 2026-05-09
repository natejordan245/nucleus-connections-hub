import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { BusinessDTO } from "@/lib/data";

// Legacy alias for /api/business.

export async function GET() {
  const store = getDataStore();
  const businesses = await store.listBusinesses();
  return NextResponse.json({ businesses, startups: businesses });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<BusinessDTO>;
  if (!body.id || !body.name || !body.description) {
    return NextResponse.json(
      { error: "id, name, description are required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  const created = await store.putBusiness(fillBusiness(body));
  return NextResponse.json({ business: created, startup: created }, { status: 201 });
}

function fillBusiness(p: Partial<BusinessDTO>): BusinessDTO {
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
    xUrl: p.xUrl,
    websiteUrl: p.websiteUrl,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}
