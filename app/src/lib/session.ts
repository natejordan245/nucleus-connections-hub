import { cookies } from "next/headers";
import { APP_MODE, DEMO_COOKIE, findPersona, type DemoPersona } from "@/lib/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type Viewer =
  | { kind: "demo";  persona: DemoPersona }
  | { kind: "real";  userId: string; email: string | null }
  | { kind: "anon" };

export async function getViewer(): Promise<Viewer> {
  if (APP_MODE === "demo") {
    const id = cookies().get(DEMO_COOKIE)?.value;
    const persona = findPersona(id);
    if (persona) return { kind: "demo", persona };
    return { kind: "anon" };
  }

  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return { kind: "anon" };
    return { kind: "real", userId: data.user.id, email: data.user.email ?? null };
  } catch {
    return { kind: "anon" };
  }
}
