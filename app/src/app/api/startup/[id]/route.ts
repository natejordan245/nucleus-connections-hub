import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { BusinessDTO } from "@/lib/data";

// Legacy alias for /api/business/[id].

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const business = await store.getBusiness(params.id);
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ business, startup: business });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const existing = await store.getBusiness(params.id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = (await req.json()) as Partial<BusinessDTO>;
  const merged: BusinessDTO = { ...existing, ...patch, id: existing.id };
  const updated = await store.putBusiness(merged);
  return NextResponse.json({ business: updated, startup: updated });
}
