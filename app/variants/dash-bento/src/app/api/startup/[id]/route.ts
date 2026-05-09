import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { StartupDTO } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const startup = await store.getStartup(params.id);
  if (!startup) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ startup });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getDataStore();
  const existing = await store.getStartup(params.id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patch = (await req.json()) as Partial<StartupDTO>;
  const merged: StartupDTO = { ...existing, ...patch, id: existing.id };
  const updated = await store.putStartup(merged);
  return NextResponse.json({ startup: updated });
}
