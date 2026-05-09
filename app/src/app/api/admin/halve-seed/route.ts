import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// One-shot delete of the procedurally-seeded personas that were cut when the
// extras were halved (see `live-seed-extra.ts`). Removes by id range from
// `auth.users` — `profiles` and every dependent row cascade via FK.
//
// Dropped ranges (12-digit numeric suffix on the deterministic UUID prefix):
//   - Talent  prefix `11111111-1111-4111-8111-` suffixes 200..299  (Tier B)
//   - Talent  prefix `11111111-1111-4111-8111-` suffixes 350..399  (upper Tier C)
//   - Startup prefix `22222222-2222-4222-8222-` suffixes 140..179  (upper extras)
//
// Idempotent — re-running on an already-halved DB is a no-op (deleteUser of a
// missing id is treated as `skipped`). Auth-gated on the service-role key, same
// as `/api/admin/seed-live`.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TALENT_PREFIX = "11111111-1111-4111-8111-";
const STARTUP_PREFIX = "22222222-2222-4222-8222-";

function suffix(n: number): string {
  return String(n).padStart(12, "0");
}

function rangeIds(prefix: string, start: number, endInclusive: number): string[] {
  const ids: string[] = [];
  for (let n = start; n <= endInclusive; n++) ids.push(prefix + suffix(n));
  return ids;
}

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

  const ids = [
    ...rangeIds(TALENT_PREFIX, 200, 299),
    ...rangeIds(TALENT_PREFIX, 350, 399),
    ...rangeIds(STARTUP_PREFIX, 140, 179),
  ];

  type Result = { id: string; status: "deleted" | "missing" | "error"; error?: string };
  const results: Result[] = [];

  for (const id of ids) {
    results.push(await deleteOne(admin, id));
  }

  const counts = {
    requested: ids.length,
    deleted: results.filter((r) => r.status === "deleted").length,
    missing: results.filter((r) => r.status === "missing").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ counts, results });
}

async function deleteOne(admin: SupabaseClient, id: string): Promise<{
  id: string;
  status: "deleted" | "missing" | "error";
  error?: string;
}> {
  // Skip the auth round-trip if the user was already removed in a prior run.
  const { data: existing } = await admin.auth.admin.getUserById(id);
  if (!existing?.user) return { id, status: "missing" };

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { id, status: "error", error: error.message };
  return { id, status: "deleted" };
}
