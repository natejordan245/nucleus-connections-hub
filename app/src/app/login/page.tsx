import Link from "next/link";
import { redirect } from "next/navigation";
import { DelicateArch } from "@/components/DelicateArch";
import { ModeBadge } from "@/components/ModeBadge";
import { APP_MODE, DEMO_PERSONAS } from "@/lib/mode";
import { getViewer } from "@/lib/session";
import { signInAsDemoPersona } from "./actions";
import { RealSignInForm } from "./RealSignInForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { mode?: string; error?: string };
}) {
  const viewer = await getViewer();
  if (viewer.kind !== "anon") redirect("/dashboard");

  // Demo lane is always available when APP_MODE=demo. In real mode, it's
  // opt-in via ?mode=demo so judges can poke around without an account.
  const demoLaneVisible = APP_MODE === "demo" || searchParams?.mode === "demo";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-3">
          <DelicateArch className="h-7 w-7 text-orange-500" />
          <span className="font-serif text-lg font-semibold text-ink">
            Nucleus Connections Hub
          </span>
        </Link>
        <ModeBadge />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-8 pb-16 pt-4">
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
          {demoLaneVisible && <DemoLane error={searchParams?.error} />}
          {APP_MODE === "real" && <RealLane />}
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-warmgray-100 px-8 py-6 text-[10px] uppercase tracking-track text-warmgray-400">
        <span>© 2026 Nucleus Connections Hub</span>
        <span>Salt Lake City, Utah</span>
      </footer>
    </div>
  );
}

function DemoLane({ error }: { error?: string }) {
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-8 shadow-sm">
      <span className="eyebrow text-orange-500">Demo lane</span>
      <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Pick a persona<br />and walk through the product.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-warmgray-600">
        No account, no email, no Supabase calls. We set a short-lived cookie so
        the dashboard knows who you are. Sign out clears it.
      </p>

      {error === "unknown_persona" && (
        <p className="mt-4 text-sm text-red-600">
          That persona id wasn't recognized — pick from the list below.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {DEMO_PERSONAS.map((p) => (
          <li key={p.id}>
            <form action={signInAsDemoPersona}>
              <input type="hidden" name="personaId" value={p.id} />
              <button
                type="submit"
                className="group flex w-full items-center justify-between rounded-xl border border-warmgray-100 bg-paper px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">{p.name}</span>
                  <span className="eyebrow mt-0.5 block text-warmgray-400">
                    {p.role}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="text-warmgray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500"
                >
                  →
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RealLane() {
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-8 shadow-sm">
      <span className="eyebrow text-emerald-700">Live</span>
      <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Sign in to your<br />Nucleus account.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-warmgray-600">
        Email + password, or send yourself a magic link. Auth runs through
        Supabase — the same project that hosts the matching pipeline.
      </p>
      <div className="mt-6">
        <RealSignInForm />
      </div>
    </section>
  );
}
