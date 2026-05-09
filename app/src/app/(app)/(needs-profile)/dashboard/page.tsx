import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MatchCard } from "@/components/MatchCard";
import { getDataStore } from "@/lib/data";
import type {
  BusinessDTO,
  CandidateDTO,
  InterestDTO,
  InvestorDTO,
  MatchDTO,
  MentorDTO,
  ProfileKind,
} from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  const [candidate, business, mentor, investor, matches, interests, allCandidates, allBusinesses] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
    store.matchesFor(viewerId),
    store.listInterests(viewerId),
    store.listCandidates(),
    store.listBusinesses(),
  ]);

  const viewerKind: ProfileKind | null = candidate
    ? "candidate"
    : business
      ? "business"
      : mentor
        ? "mentor"
        : investor
          ? "investor"
          : null;

  const copy = dashboardCopy(viewerKind);

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <span className="eyebrow text-orange-500">{copy.eyebrow}</span>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">{copy.sub}</p>

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
            placeholder={copy.placeholder}
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
          viewerKind,
          viewerId,
          interests,
          allCandidates,
          allBusinesses,
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
          {copy.matchesHeading}
        </h2>

        {matches.length === 0 ? (
          <EmptyState viewerKind={viewerKind} />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {matches.map((m) => {
              const cand = resolveCandidate(m, allCandidates, allBusinesses);
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

function dashboardCopy(viewerKind: ProfileKind | null): {
  eyebrow: string;
  title: string;
  sub: string;
  placeholder: string;
  matchesHeading: string;
} {
  switch (viewerKind) {
    case "business":
      return {
        eyebrow: "Founder home",
        title: "Find your next hire.",
        sub: "Search Utah's operators, or jump to the candidates we ranked for you.",
        placeholder: "Search talent by skill, role, or location…",
        matchesHeading: "Candidates for you",
      };
    case "mentor":
      return {
        eyebrow: "Mentor home",
        title: "Find founders to advise.",
        sub: "Browse Utah businesses and candidates that may want your help.",
        placeholder: "Search businesses or candidates by sector or stage…",
        matchesHeading: "Recommended for you",
      };
    case "investor":
      return {
        eyebrow: "VC home",
        title: "Find businesses to back.",
        sub: "Browse Utah companies that match your check size, stage, and sector.",
        placeholder: "Search businesses by sector, stage, or origin…",
        matchesHeading: "Businesses for you",
      };
    case "candidate":
    default:
      return {
        eyebrow: "For you",
        title: "Find businesses that fit you.",
        sub: "Search Utah's businesses, or jump to the matches we ranked for you.",
        placeholder: "Search businesses by sector, role, or stage…",
        matchesHeading: "Businesses for you",
      };
  }
}

function resolveInterestedIn({
  viewerKind,
  viewerId,
  interests,
  allCandidates,
  allBusinesses,
}: {
  viewerKind: ProfileKind | null;
  viewerId: string;
  interests: InterestDTO[];
  allCandidates: CandidateDTO[];
  allBusinesses: BusinessDTO[];
}): InterestedCard[] {
  // Interest handshake is candidate↔business only. Mentor/investor: no cards.
  if (viewerKind === "candidate") {
    return interests
      .filter((i) => i.talentId === viewerId && i.startupState === "interested")
      .map((i) => allBusinesses.find((b) => b.id === i.startupId))
      .filter((b): b is BusinessDTO => Boolean(b))
      .map((b) => ({
        href: `/profile/business/${b.id}`,
        name: b.name,
        headline: b.oneLiner,
        photo: b.logoUrl,
      }));
  }
  if (viewerKind === "business") {
    return interests
      .filter((i) => i.startupId === viewerId && i.talentState === "interested")
      .map((i) => allCandidates.find((c) => c.id === i.talentId))
      .filter((c): c is CandidateDTO => Boolean(c))
      .map((c) => ({
        href: `/profile/candidate/${c.id}`,
        name: c.name,
        headline: c.headline,
        photo: c.photoUrl,
      }));
  }
  return [];
}

function resolveCandidate(
  m: MatchDTO,
  candidates: CandidateDTO[],
  businesses: BusinessDTO[],
):
  | { kind: "candidate"; candidate: CandidateDTO }
  | { kind: "business"; business: BusinessDTO }
  | null {
  if (m.candidateKind === "candidate") {
    const c = candidates.find((x) => x.id === m.candidateId);
    return c ? { kind: "candidate", candidate: c } : null;
  }
  if (m.candidateKind === "business") {
    const b = businesses.find((x) => x.id === m.candidateId);
    return b ? { kind: "business", business: b } : null;
  }
  // Mentor / investor matches don't surface yet.
  return null;
}

function EmptyState({ viewerKind }: { viewerKind: ProfileKind | null }) {
  if (!viewerKind) {
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
  if (viewerKind === "mentor" || viewerKind === "investor") {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
        <p className="font-serif text-xl font-semibold text-ink">
          Match recommendations coming soon.
        </p>
        <p className="mt-2 text-sm text-warmgray-600">
          For now, browse the directory to find{" "}
          {viewerKind === "mentor" ? "businesses or candidates" : "businesses"} that fit you.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
        >
          Browse the directory →
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
      <p className="font-serif text-xl font-semibold text-ink">
        {viewerKind === "candidate" ? "No business matches yet." : "No candidate matches yet."}
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
