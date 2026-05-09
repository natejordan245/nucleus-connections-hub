import { NextResponse } from "next/server";
import { UTAH_RESOURCES } from "@/lib/data/utah-resources";
import { SupabaseDataStore } from "@/lib/data/SupabaseDataStore";

// Wipes the placeholder example.com seed resources from the live database
// and upserts the curated Utah-specific list. Embeddings are recomputed by
// SupabaseDataStore.putResource on insert.
//
// Auth: SUPABASE_SERVICE_ROLE_KEY in `Authorization: Bearer …`.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authz = req.headers.get("authorization") ?? "";
  const provided = authz.toLowerCase().startsWith("bearer ")
    ? authz.slice(7).trim()
    : "";
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL not configured" },
      { status: 500 },
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, expected, { auth: { persistSession: false } });
  const store = new SupabaseDataStore();

  // 1. Drop the placeholder rows. The original baseline used example.com URLs
  //    and uploaded_by_id=null; matching on URL is the safest filter and won't
  //    touch resources real users uploaded.
  const { data: deletedRows, error: deleteErr } = await admin
    .from("resources")
    .delete()
    .like("url", "%example.com%")
    .select("id");
  if (deleteErr) {
    return NextResponse.json(
      { error: `delete: ${deleteErr.message}` },
      { status: 500 },
    );
  }
  const deleted = deletedRows?.length ?? 0;

  // 2. Upsert the curated Utah list. putResource handles the embedding write.
  const written: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];
  for (const r of UTAH_RESOURCES) {
    try {
      await store.putResource(r);
      written.push(r.id);
    } catch (err) {
      errors.push({
        id: r.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    counts: {
      deleted,
      attempted: UTAH_RESOURCES.length,
      written: written.length,
      errors: errors.length,
    },
    errors,
  });
}
