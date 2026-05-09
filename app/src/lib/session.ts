import { cookies } from "next/headers";
import { DEMO_COOKIE, findPersona, getAppMode, type DemoPersona } from "@/lib/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type Viewer =
  | { kind: "demo"; persona: DemoPersona }
  | { kind: "live"; userId: string; email: string | null; name: string | null }
  | { kind: "anon" };

export async function getViewer(): Promise<Viewer> {
  if (getAppMode() === "demo") {
    const id = cookies().get(DEMO_COOKIE)?.value;
    const persona = findPersona(id);
    if (persona) return { kind: "demo", persona };
    return { kind: "anon" };
  }

  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return { kind: "anon" };
    const meta = (data.user.user_metadata ?? null) as Record<string, unknown> | null;
    const name = typeof meta?.name === "string" ? (meta.name as string) : null;
    return {
      kind: "live",
      userId: data.user.id,
      email: data.user.email ?? null,
      name,
    };
  } catch {
    return { kind: "anon" };
  }
}
