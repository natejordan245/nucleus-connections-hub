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
  role: "talent" | "startup";
};

export const DEMO_PERSONAS: DemoPersona[] = [
  { id: "tal-sarah",   name: "Sarah Chen",     email: "sarah@demo.nucleus",     role: "talent"  },
  { id: "tal-marcus",  name: "Marcus Okafor",  email: "marcus@demo.nucleus",    role: "talent"  },
  { id: "tal-priya",   name: "Priya Patel",    email: "priya@demo.nucleus",     role: "talent"  },
  { id: "sup-bramble", name: "Bramble AI",     email: "founders@bramble.demo",  role: "startup" },
  { id: "sup-lumen",   name: "Lumen Bio",      email: "team@lumen.demo",        role: "startup" },
];

export function findPersona(id: string | undefined): DemoPersona | null {
  if (!id) return null;
  return DEMO_PERSONAS.find((p) => p.id === id) ?? null;
}
