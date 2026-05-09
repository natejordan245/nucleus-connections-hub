import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MatchCard } from "@/components/MatchCard";
import { getDataStore } from "@/lib/data";
import type { InterestDTO, MatchDTO, StartupDTO, TalentDTO } from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  const [talent, startup, matches, interests, allTalent, allStartups] = await Promise.all([
    store.getTalent(viewerId),
    store.getStartup(viewerId),
    store.matchesFor(viewerId),
    store.listInterests(viewerId),
    store.listTalent(),
    store.listStartups(),
  ]);

  const isTalent = !!talent;
  const eyebrow = isTalent ? "For you" : "Founder home";
  const title = isTalent ? "Find startups that fit you." : "Find your next hire.";
  const sub = isTalent
    ? "Search Utah's startups, or jump to the matches we ranked for you."
    : "Search Utah's operators, or jump to the candidates we ranked for you.";
  const placeholder = isTalent
    ? "Search startups by sector, role, or stage…"
    : "Search talent by skill, role, or location…";


  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <span className="eyebrow text-orange-500">{eyebrow}</span>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">{sub}</p>

      <form
        action="/search"
        method="GET"
        role="search"
        className="mt-8 flex w-full max-w-2xl items-center gap-2"
      >
        <label htmlFor="dashboard-search" className="sr-only">
          Search
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-warmgray-400"
          />
          <input
            id="dashboard-search"
            name="q"
            type="search"
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-full border border-warmgray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
        >
          Search
        </button>
      </form>

      {(() => {
        const interestedCards = resolveInterestedIn({
          isTalent,
          viewerId,
          interests,
          allTalent,
          allStartups,
        });
        if (interestedCards.length === 0) return null;
        return (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Interested in you
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {interestedCards.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="flex items-center gap-3 rounded-2xl border border-warmgray-100 bg-white p-4 shadow-sm transition hover:border-warmgray-200"
                  >
                    <Avatar name={c.name} src={c.photo} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{c.name}</span>
                      <span className="block truncate text-xs text-warmgray-600">
                        {c.headline}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {isTalent ? "Startups for you" : "Candidates for you"}
        </h2>

        {matches.length === 0 ? (
          <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {matches.map((m) => {
              const cand = resolveCandidate(m, allTalent, allStartups);
              if (!cand) return null;
              return <MatchCard key={m.id} match={m} candidate={cand} />;
            })}
          </div>
        )}
      </section>
    </main>
  );
}

type InterestedCard = {
  href: string;
  name: string;
  headline: string;
  photo: string | undefined;
};

function resolveInterestedIn({
  isTalent,
  viewerId,
  interests,
  allTalent,
  allStartups,
}: {
  isTalent: boolean;
  viewerId: string;
  interests: InterestDTO[];
  allTalent: TalentDTO[];
  allStartups: StartupDTO[];
}): InterestedCard[] {
  if (isTalent) {
    return interests
      .filter((i) => i.talentId === viewerId && i.startupState === "interested")
      .map((i) => allStartups.find((s) => s.id === i.startupId))
      .filter((s): s is StartupDTO => Boolean(s))
      .map((s) => ({
        href: `/profile/startup/${s.id}`,
        name: s.name,
        headline: s.oneLiner,
        photo: s.logoUrl,
      }));
  }
  return interests
    .filter((i) => i.startupId === viewerId && i.talentState === "interested")
    .map((i) => allTalent.find((t) => t.id === i.talentId))
    .filter((t): t is TalentDTO => Boolean(t))
    .map((t) => ({
      href: `/profile/talent/${t.id}`,
      name: t.name,
      headline: t.headline,
      photo: t.photoUrl,
    }));
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

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  if (!hasProfile) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
        <p className="font-serif text-xl font-semibold text-ink">
          Tell us about yourself first.
        </p>
        <p className="mt-2 text-sm text-warmgray-600">
          Two minutes of input is all we need to start ranking.
        </p>
        <Link
          href="/onboard"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
        >
          Get started
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
      <p className="font-serif text-xl font-semibold text-ink">
        {isTalent ? "No startup matches yet." : "No candidate matches yet."}
      </p>
      <p className="mt-2 text-sm text-warmgray-600">
        Sharpen your profile so we can rank what fits you.
      </p>
      <Link
        href="/profile"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800"
      >
        Open profile →
      </Link>
    </div>
  );
}
