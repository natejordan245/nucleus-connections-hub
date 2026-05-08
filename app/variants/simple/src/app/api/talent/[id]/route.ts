import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { TalentDTO } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const talent = await store.getTalent(params.id);
  if (!talent) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ talent });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const existing = await store.getTalent(params.id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = (await req.json()) as Partial<TalentDTO>;
  const merged: TalentDTO = { ...existing, ...patch, id: existing.id };
  const updated = await store.putTalent(merged);
  return NextResponse.json({ talent: updated });
}
