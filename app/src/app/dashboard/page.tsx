import Link from "next/link";
import { redirect } from "next/navigation";
import { DelicateArch } from "@/components/DelicateArch";
import { ModeBadge } from "@/components/ModeBadge";
import { getViewer } from "@/lib/session";

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (viewer.kind === "anon") redirect("/login");

  const { displayName, identityLabel, kindLabel } = describe(viewer);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-3">
          <DelicateArch className="h-7 w-7 text-orange-500" />
          <span className="font-serif text-lg font-semibold text-ink">
            Nucleus Connections Hub
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ModeBadge />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm font-medium text-warmgray-700 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-8 pb-16 pt-4">
        <span className="eyebrow text-orange-500">Dashboard</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
          Welcome, {displayName}.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          You're signed in. The matching pipeline, handshake flow, and Affinity
          push live next — for now this page is the auth handshake's landing
          spot.
        </p>

        <dl className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card label="Mode" value={kindLabel} />
          <Card label="Identity" value={identityLabel} />
          <Card label="Next" value="Onboarding →" />
        </dl>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-warmgray-100 px-8 py-6 text-[10px] uppercase tracking-track text-warmgray-400">
        <span>© 2026 Nucleus Connections Hub</span>
        <span>Salt Lake City, Utah</span>
      </footer>
    </div>
  );
}

function describe(viewer: Exclude<Awaited<ReturnType<typeof getViewer>>, { kind: "anon" }>) {
  if (viewer.kind === "demo") {
    return {
      displayName: viewer.persona.name,
      identityLabel: viewer.persona.id,
      kindLabel: `Demo · ${viewer.persona.role}`,
    };
  }
  return {
    displayName: viewer.email ?? "there",
    identityLabel: viewer.userId.slice(0, 8) + "…",
    kindLabel: "Supabase Auth",
  };
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-warmgray-100 bg-white p-5 shadow-sm">
      <dt className="eyebrow text-warmgray-400">{label}</dt>
      <dd className="mt-2 font-serif text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}
