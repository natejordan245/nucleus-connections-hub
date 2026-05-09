import Link from "next/link";
import { LogOut } from "lucide-react";
import { toggleAppMode } from "@/app/actions/toggle-mode";
import { getDataStore } from "@/lib/data";
import { getAppMode } from "@/lib/mode";
import { requireViewer } from "@/lib/viewer";

export default async function SettingsPage() {
  const { viewer, viewerId } = await requireViewer();
  const mode = getAppMode();
  const store = getDataStore();
  const [candidate, business, mentor, investor] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
  ]);
  const profile = candidate ?? business ?? mentor ?? investor;
  const profileHref = candidate
    ? `/profile/candidate/${candidate.id}`
    : business
      ? `/profile/business/${business.id}`
      : mentor
        ? `/profile/mentor/${mentor.id}`
        : investor
          ? `/profile/investor/${investor.id}`
          : "/onboard";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <span className="eyebrow text-orange-500">Settings</span>
      <h1 className="mt-2 text-2xl font-bold text-ink">Your account.</h1>
      <p className="mt-1 text-sm text-warmgray-500">Mode, identity, and the door out.</p>

      <div className="mt-4 space-y-3">
        <Card>
          <Row
            label="Account"
            value={
              viewer.kind === "demo"
                ? `Demo persona · ${viewer.persona.name}`
                : viewer.email ?? "Signed in"
            }
            hint={
              profile
                ? "Your profile is set up."
                : "Profile not completed yet — finish onboarding to start matching."
            }
          />
          <div className="mt-3">
            <Link
              href={profileHref}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              {profile ? "Open profile →" : "Finish onboarding →"}
            </Link>
          </div>
        </Card>

        <Card>
          <Row
            label="App mode"
            value={mode === "live" ? "Live" : "Demo"}
            hint={
              mode === "live"
                ? "Auth and persistence run through Supabase."
                : "Hardcoded sample data — no real persistence."
            }
          />
          <form action={toggleAppMode} className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
            >
              Switch to {mode === "live" ? "Demo" : "Live"} mode
            </button>
          </form>
        </Card>

        <Card>
          <Row label="Sign out" value="End this session" />
          <form action="/auth/signout" method="post" className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Sign out
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-warmgray-200 bg-white p-4">
      {children}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
        {label}
      </span>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-warmgray-500">{hint}</p>}
    </div>
  );
}
