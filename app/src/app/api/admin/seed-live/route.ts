import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_SEED_PASSWORD, LIVE_STARTUPS, LIVE_TALENT } from "@/lib/data/live-seed";
import { EXTRA_LIVE_STARTUPS, EXTRA_LIVE_TALENT } from "@/lib/data/live-seed-extra";
import { baselineResources } from "@/lib/data/seed";
import { SupabaseDataStore } from "@/lib/data/SupabaseDataStore";
import type { ResourceDTO } from "@/lib/data/types";

// One-shot seed for live mode. Creates auth users + writes profile rows
// (with embeddings) for the personas in `live-seed.ts`. Idempotent — re-running
// skips users that already exist and re-upserts the profile (refreshing the
// embedding if the persona text changed).
//
// Gate: requires the SUPABASE_SERVICE_ROLE_KEY in the `Authorization: Bearer …`
// header. We treat possession of the service-role key as authorization.

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

  type Result = {
    id: string;
    name: string;
    kind: "candidate" | "business";
    authStatus: "created" | "existing" | "error";
    profileStatus: "written" | "error";
    error?: string;
  };
  const results: Result[] = [];

  for (const t of [...LIVE_TALENT, ...EXTRA_LIVE_TALENT]) {
    const r = await ensureUserAndProfile({
      admin,
      id: t.id,
      email: t.email,
      name: t.name,
      kind: "candidate",
      write: () => store.putCandidate(t),
    });
    results.push(r);
  }
  for (const s of [...LIVE_STARTUPS, ...EXTRA_LIVE_STARTUPS]) {
    const email = `team+${s.id.replace(/-/g, "").slice(-12)}@nucleus.demo`;
    const r = await ensureUserAndProfile({
      admin,
      id: s.id,
      email,
      name: s.name,
      kind: "business",
      write: () => store.putBusiness(s),
    });
    results.push(r);
  }

  // Insert (or refresh) the baseline resource set, then ensure embeddings.
  // On a fresh cloud DB the resources table is empty — `db push` doesn't
  // apply seed.sql — so we seed from `baselineResources` and let putResource
  // handle the embedding write.
  const resourcesSeeded = await seedBaselineResources(store);
  const resourcesBackfilled = await backfillResourceEmbeddings(admin, store);

  const counts = {
    total: results.length,
    authCreated: results.filter((r) => r.authStatus === "created").length,
    authExisting: results.filter((r) => r.authStatus === "existing").length,
    profilesWritten: results.filter((r) => r.profileStatus === "written").length,
    errors: results.filter(
      (r) => r.authStatus === "error" || r.profileStatus === "error",
    ).length,
    resourcesSeeded,
    resourcesBackfilled,
  };

  return NextResponse.json({ counts, results });
}

async function backfillResourceEmbeddings(
  admin: SupabaseClient,
  store: SupabaseDataStore,
): Promise<number> {
  const { data, error } = await admin
    .from("resources")
    .select("*")
    .is("embedding", null);
  if (error || !data) return 0;

  let n = 0;
  for (const row of data as Array<{
    id: string;
    title: string;
    description: string;
    kind: string;
    url: string;
    tags: string[] | null;
    summary: string | null;
    uploaded_by_id: string | null;
    uploaded_by_name: string;
    created_at: string;
  }>) {
    try {
      await store.putResource({
        id: row.id,
        title: row.title,
        description: row.description,
        kind: row.kind as ResourceDTO["kind"],
        url: row.url,
        tags: row.tags ?? [],
        summary: row.summary ?? "",
        uploadedById: row.uploaded_by_id,
        uploadedByName: row.uploaded_by_name,
        createdAt: row.created_at,
      });
      n++;
    } catch {
      // skip on error; surface via logs only.
    }
  }
  return n;
}

async function ensureUserAndProfile(args: {
  admin: SupabaseClient;
  id: string;
  email: string;
  name: string;
  kind: "candidate" | "business";
  write: () => Promise<unknown>;
}): Promise<{
  id: string;
  name: string;
  kind: "candidate" | "business";
  authStatus: "created" | "existing" | "error";
  profileStatus: "written" | "error";
  error?: string;
}> {
  const { admin, id, email, name, kind, write } = args;

  let authStatus: "created" | "existing" | "error" = "created";

  // Look up by id first — if the auth.users row exists, we're done with auth.
  // Avoids the false-positive "already exists" classification that happens when
  // createUser fails for unrelated reasons (e.g. email collision under a
  // different id).
  const { data: existing } = await admin.auth.admin.getUserById(id);
  if (existing?.user) {
    authStatus = "existing";
  } else {
    const { error: createErr } = await admin.auth.admin.createUser({
      id,
      email,
      password: LIVE_SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { name, seeded: true },
    });
    if (createErr) {
      return {
        id,
        name,
        kind,
        authStatus: "error",
        profileStatus: "error",
        error: `auth: ${createErr.message ?? "unknown"}`,
      };
    }
  }

  try {
    await write();
    return { id, name, kind, authStatus, profileStatus: "written" };
  } catch (err) {
    const msg = stringifyErr(err);
    return {
      id,
      name,
      kind,
      authStatus,
      profileStatus: "error",
      error: `profile: ${msg}`,
    };
  }
}

async function seedBaselineResources(store: SupabaseDataStore): Promise<number> {
  // Skip any resource whose title is already present so re-runs don't dupe.
  const existing = await store.listResources();
  const seenTitles = new Set(existing.map((r) => r.title.trim().toLowerCase()));
  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  let n = 0;
  for (const r of baselineResources) {
    if (seenTitles.has(r.title.trim().toLowerCase())) continue;
    // Strip the demo-mode `tal-…` uploader id — it's not in auth.users on cloud
    // and would FK-fail. Keep the display name.
    const safe = {
      ...r,
      uploadedById: r.uploadedById && isUuid(r.uploadedById) ? r.uploadedById : null,
    };
    try {
      await store.putResource(safe);
      n++;
    } catch {
      // best-effort.
    }
  }
  return n;
}

function stringifyErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint, e.code].filter(Boolean);
    if (parts.length) return parts.join(" | ");
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
