import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";
import type { ResourceDTO } from "@/lib/data/types";

export async function GET() {
  const store = getDataStore();
  const resources = await store.listResources();
  return NextResponse.json({ resources });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ResourceDTO>;
  if (!body.id || !body.title || !body.url) {
    return NextResponse.json(
      { error: "id, title, url are required" },
      { status: 400 },
    );
  }
  const store = getDataStore();
  const created = await store.putResource({
    id: body.id,
    title: body.title,
    description: body.description ?? "",
    kind: body.kind ?? "link",
    url: body.url,
    tags: body.tags ?? [],
    uploadedById: body.uploadedById ?? null,
    uploadedByName: body.uploadedByName ?? "Anonymous",
    createdAt: body.createdAt ?? new Date().toISOString(),
  });
  return NextResponse.json({ resource: created }, { status: 201 });
}
