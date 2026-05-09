import { cookies } from "next/headers";

export type AppMode = "demo" | "live";

export const MODE_COOKIE = "nch_app_mode";
export const DEMO_COOKIE = "nch_demo_user";

/** Default from environment, used when no per-session override cookie is set. */
export const DEFAULT_APP_MODE: AppMode =
  process.env.NEXT_PUBLIC_APP_MODE === "live" ? "live" : "demo";

/**
 * **Server-only.** Resolves the active app mode for the current request.
 * Cookie override (set by the header toggle) takes precedence over the env
 * default. Safe to call from server components, server actions, route
 * handlers, and middleware-equivalent contexts.
 */
export function getAppMode(): AppMode {
  try {
    const v = cookies().get(MODE_COOKIE)?.value;
    if (v === "live" || v === "demo") return v;
  } catch {
    // cookies() throws outside a request scope.
  }
  return DEFAULT_APP_MODE;
}

export type DemoPersona = {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "business" | "mentor" | "investor" | "admin";
};

export const DEMO_PERSONAS: DemoPersona[] = [
  { id: "tal-sarah",    name: "Sarah Chen",        email: "sarah@demo.nucleus",     role: "candidate" },
  { id: "tal-marcus",   name: "Marcus Okafor",     email: "marcus@demo.nucleus",    role: "candidate" },
  { id: "tal-priya",    name: "Priya Patel",       email: "priya@demo.nucleus",     role: "candidate" },
  { id: "sup-bramble",  name: "Bramble AI",        email: "founders@bramble.demo",  role: "business"  },
  { id: "sup-lumen",    name: "Lumen Bio",         email: "team@lumen.demo",        role: "business"  },
  { id: "men-david",    name: "David Holm",        email: "david@demo.nucleus",     role: "mentor"    },
  { id: "inv-rachel",   name: "Rachel Stone",      email: "rachel@summit.demo",     role: "investor"  },
  { id: "adm-operator", name: "Nucleus Operator",  email: "ops@demo.nucleus",       role: "admin"     },
];

export function findPersona(id: string | undefined): DemoPersona | null {
  if (!id) return null;
  return DEMO_PERSONAS.find((p) => p.id === id) ?? null;
}
