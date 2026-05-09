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
    <main className="mx-auto w-full max-w-3xl px-8 py-10">
      <span className="eyebrow text-orange-500">Settings</span>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        Your account.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Mode, identity, and the door out.
      </p>

      <div className="mt-8 space-y-4">
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
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
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
              className="inline-flex h-9 items-center justify-center rounded-full border border-warmgray-200 bg-white px-4 text-sm font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
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
              className="inline-flex h-9 items-center gap-2 rounded-full border border-warmgray-200 bg-white px-4 text-sm font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden /> Sign out
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <span className="eyebrow text-warmgray-400">{label}</span>
      <p className="mt-1 font-serif text-lg font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-sm text-warmgray-600">{hint}</p>}
    </div>
  );
}
