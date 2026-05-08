import Link from "next/link";
import { MatchCard } from "@/components/MatchCard";
import { getDataStore } from "@/lib/data";
import type { MatchDTO, StartupDTO, TalentDTO } from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";

export default async function MatchesPage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  const [matches, allTalent, allStartups, utahOrgs] = await Promise.all([
    store.matchesFor(viewerId),
    store.listTalent(),
    store.listStartups(),
    store.listUtahOrgs(),
  ]);

  return (
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <span className="eyebrow text-orange-500">Matches</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
          Ranked for you.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          {matches.length === 0
            ? "We're still warming up. Try again in a moment, or refine your profile."
            : "Each match comes with the reason it was made. Open to see the full breakdown."}
        </p>

        {matches.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
            <p className="font-serif text-xl font-semibold text-ink">
              No matches yet.
            </p>
            <p className="mt-2 text-sm text-warmgray-600">
              Either we're still preparing, or your profile isn't set up.
            </p>
            <Link
              href="/onboard"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
            >
              Complete your profile
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {matches.map((m) => {
              const cand = resolveCandidate(m, allTalent, allStartups);
              if (!cand) return null;
              return <MatchCard key={m.id} match={m} candidate={cand} utahOrgs={utahOrgs} />;
            })}
          </div>
        )}
      </main>
  );
}

function resolveCandidate(
  m: MatchDTO,
  talent: TalentDTO[],
  startups: StartupDTO[],
):
  | { kind: "talent"; talent: TalentDTO }
  | { kind: "startup"; startup: StartupDTO }
  | null {
  if (m.candidateKind === "talent") {
    const t = talent.find((t) => t.id === m.candidateId);
    return t ? { kind: "talent", talent: t } : null;
  }
  const s = startups.find((s) => s.id === m.candidateId);
  return s ? { kind: "startup", startup: s } : null;
}
