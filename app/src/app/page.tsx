import Link from "next/link";
import { DelicateArch } from "@/components/DelicateArch";
import { ModeBadge } from "@/components/ModeBadge";
import { getAppMode } from "@/lib/mode";
import { getViewer } from "@/lib/session";

export default async function LandingPage() {
  const viewer = await getViewer();
  const signedIn = viewer.kind !== "anon";
  const ctaHref = signedIn ? "/dashboard" : "/login";
  const mode = getAppMode();
  const ctaLabel = signedIn ? "Open dashboard" : mode === "demo" ? "Try the demo" : "Sign in";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <DelicateArch className="h-7 w-7 text-orange-500" />
          <span className="font-serif text-lg font-semibold text-ink">
            Nucleus Connections Hub
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ModeBadge />
          {signedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-warmgray-700 hover:text-ink"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-warmgray-700 hover:text-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-8 pb-12 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div>
          <span className="eyebrow text-orange-500">
            Official Ecosystem Portal · Innovation Hub
          </span>

          <h1 className="mt-6 font-serif text-[56px] font-semibold leading-[1.04] tracking-[-0.02em] text-ink sm:text-[64px] lg:text-[72px]">
            AI-powered<br />
            matching for the<br />
            Utah innovation<br />
            ecosystem.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-warmgray-600">
            Operators, executives, students, and advisors — paired with Utah's
            deep-tech startups and university spinouts. Every introduction comes
            with a clear reason it was made, drawn from Utah's labs,
            accelerators, and alumni networks.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={ctaHref}
              className="group inline-flex items-center gap-3 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600 hover:shadow-[0_10px_30px_-8px_rgba(255,114,39,0.7)]"
            >
              {ctaLabel}
              <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </Link>

            <Link
              href="/api/demo/start"
              className="text-sm font-medium text-warmgray-600 hover:text-ink"
            >
              {signedIn ? "Take the guided tour →" : "Or take the guided tour →"}
            </Link>
          </div>

          <ul className="mt-12 grid max-w-lg grid-cols-1 gap-3 text-sm text-warmgray-700">
            <Bullet>Find your next hire, advisor, or co-founder.</Bullet>
            <Bullet>See exactly why each match was suggested.</Bullet>
            <Bullet>Built around Utah's research, capital, and talent.</Bullet>
          </ul>
        </div>

        <ArchPanel />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-warmgray-100 px-8 py-6 text-[10px] uppercase tracking-track text-warmgray-400">
        <span>© 2026 Nucleus Connections Hub</span>
        <span>Salt Lake City, Utah</span>
      </footer>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-orange-500" />
      <span>{children}</span>
    </li>
  );
}

function ArchPanel() {
  return (
    <div className="relative hidden h-[420px] items-center justify-center md:flex lg:h-[520px]">
      <DelicateArch className="h-full w-full text-warmgray-200" />
    </div>
  );
}
