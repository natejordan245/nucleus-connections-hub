export type AppMode = "demo" | "real";

export const APP_MODE: AppMode =
  (process.env.NEXT_PUBLIC_APP_MODE as AppMode) === "real" ? "real" : "demo";

export const DEMO_COOKIE = "nch_demo_user";

export type DemoPersona = {
  id: string;
  name: string;
  email: string;
  role: "talent" | "startup";
};

export const DEMO_PERSONAS: DemoPersona[] = [
  { id: "tal-sarah-chen",     name: "Sarah Chen",     email: "sarah@demo.nucleus",     role: "talent"  },
  { id: "tal-marcus-okafor",  name: "Marcus Okafor",  email: "marcus@demo.nucleus",    role: "talent"  },
  { id: "sup-bramble-ai",     name: "Bramble AI",     email: "founders@bramble.demo",  role: "startup" },
];

export function findPersona(id: string | undefined): DemoPersona | null {
  if (!id) return null;
  return DEMO_PERSONAS.find((p) => p.id === id) ?? null;
}
