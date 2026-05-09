import Link from "next/link";
import { Search } from "lucide-react";
import { AnimatedSearchInput } from "@/components/AnimatedSearchInput";
import { Avatar } from "@/components/Avatar";
import { MatchToolbar, type SortKey } from "@/components/MatchToolbar";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import type {
  BusinessDTO,
  CandidateDTO,
  InterestDTO,
  MatchDTO,
  ProfileKind,
} from "@/lib/data/types";
import { primeQueryEmbeddings } from "@/lib/embedding/prewarm";
import { requireViewer } from "@/lib/viewer";

type DashboardSearchParams = {
  sort?: string;
  minScore?: string;
  location?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams;
}) {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  // Kick off the demo-query embedding pre-warm in the background. Doesn't
  // block the dashboard render — by the time the user clicks Search, the
  // common phrases are already cached in `embed()`'s content-hash map.
  void primeQueryEmbeddings();

  // Fetch the viewer's profile kind first so we only load the opposite-side
  // list. (matchesFor already loads opposite-kind rows internally — but the
  // dashboard table also needs lookup-by-id for `resolveCandidate`, so we
  // still need the list. We just don't need both directions.)
  const viewerKind: ProfileKind | null = await store.getProfileKind(viewerId);

  const needsCandidates = viewerKind === "business";
  const needsBusinesses = viewerKind === "candidate";

  const [matches, interests, allCandidates, allBusinesses] = await Promise.all([
    store.matchesFor(viewerId),
    store.listInterests(viewerId),
    needsCandidates ? store.listCandidates() : Promise.resolve([] as CandidateDTO[]),
    needsBusinesses ? store.listBusinesses() : Promise.resolve([] as BusinessDTO[]),
  ]);

  const copy = dashboardCopy(viewerKind);
  const interested = resolveInterestedIn({
    viewerKind,
    viewerId,
    interests,
    allCandidates,
    allBusinesses,
  });

  const sortKey = parseSortKey(searchParams?.sort);
  const minScore = parseMinScore(searchParams?.minScore);
  const locationFilter = (searchParams?.location ?? "").trim().toLowerCase();

  const resolvedRows = matches
    .map((m) => {
      const cand = resolveCandidate(m, allCandidates, allBusinesses);
      return cand ? { match: m, cand } : null;
    })
    .filter((row): row is { match: MatchDTO; cand: ResolvedCand } => row !== null);

  const filteredRows = resolvedRows.filter((row) => {
    if (minScore !== null && row.match.score * 100 < minScore) return false;
    if (locationFilter) {
      const loc =
        row.cand.kind === "candidate"
          ? row.cand.candidate.location
          : row.cand.business.location;
      if (!loc.toLowerCase().includes(locationFilter)) return false;
    }
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortKey === "name") {
      return rowName(a.cand).localeCompare(rowName(b.cand));
    }
    if (sortKey === "score-asc") return a.match.score - b.match.score;
    return b.match.score - a.match.score;
  });
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl flex-col px-6 py-8">
      {/* Search + filter row */}
      <div className="flex items-center gap-2 rounded-lg border border-warmgray-200 bg-white p-2">
        <form action="/search" method="GET" role="search" className="flex flex-1 items-center gap-2">
          <Search aria-hidden strokeWidth={1.75} className="ml-2 h-4 w-4 text-warmgray-400" />
          <label htmlFor="dashboard-search" className="sr-only">
            Search
          </label>
          <AnimatedSearchInput
            id="dashboard-search"
            name="q"
            fallback={copy.placeholder}
            examples={copy.placeholderExamples}
            className="flex-1 bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-warmgray-400"
          />
          <button
            type="submit"
            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
          >
            Search
          </button>
        </form>
        <span className="h-5 w-px bg-warmgray-200" />
        <MatchToolbar />
      </div>

      {/* Two-col split */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {matches.length === 0 ? (
            <section className="flex flex-col rounded-lg border border-warmgray-200 bg-white">
              <div className="flex items-center justify-between border-b border-warmgray-200 px-4 py-2.5">
                <h2 className="text-sm font-semibold text-ink">{copy.matchesHeading}</h2>
                <span className="font-mono text-xs text-warmgray-500">↻ refresh</span>
              </div>
              <EmptyState viewerKind={viewerKind} />
            </section>
          ) : sortedRows.length === 0 ? (
            <section className="flex flex-col rounded-lg border border-warmgray-200 bg-white">
              <div className="flex items-center justify-between border-b border-warmgray-200 px-4 py-2.5">
                <h2 className="text-sm font-semibold text-ink">
                  {copy.matchesHeading}
                  <span className="ml-2 font-mono text-xs text-warmgray-500">
                    0 / {resolvedRows.length}
                  </span>
                </h2>
                <span className="font-mono text-xs text-warmgray-500">↻ refresh</span>
              </div>
              <NoMatchingFilters />
            </section>
          ) : (
            <>
              {/* Top 3 — compact cards, single row on md+. */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">
                    {copy.matchesHeading}
                    <span className="ml-2 font-mono text-xs text-warmgray-500">
                      {sortedRows.length === resolvedRows.length
                        ? sortedRows.length
                        : `${sortedRows.length} / ${resolvedRows.length}`}
                    </span>
                  </h2>
                  <span className="font-mono text-xs text-warmgray-500">↻ refresh</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {sortedRows.slice(0, 3).map(({ match, cand }, i) => (
                    <TopMatchCard key={match.id} rank={i + 1} match={match} cand={cand} />
                  ))}
                </div>
              </section>

              {/* Dense leaderboard for everything past the top 3. */}
              {sortedRows.length > 3 && (
                <section className="flex flex-col overflow-hidden rounded-lg border border-warmgray-200 bg-white">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-warmgray-100">
                      {sortedRows.slice(3).map(({ match, cand }, i) => (
                        <DenseRow key={match.id} idx={i + 3} match={match} cand={cand} />
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-1 flex-col rounded-lg border border-warmgray-200 bg-white">
            <div className="border-b border-warmgray-200 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-ink">
                Interested in you
                <span className="ml-2 font-mono text-xs text-warmgray-500">{interested.length}</span>
              </h2>
            </div>
            {interested.length === 0 ? (
              <p className="px-4 py-6 text-xs text-warmgray-500">No inbound interest yet.</p>
            ) : (
              <ul className="divide-y divide-warmgray-100">
                {interested.slice(0, 8).map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-orange-50"
                    >
                      <Avatar name={c.name} src={c.photo} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-ink">{c.name}</div>
                        <div className="truncate text-[11px] text-warmgray-500">{c.headline}</div>
                      </div>
                      <span aria-hidden className="text-warmgray-300 group-hover:text-orange-500">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

type ResolvedCand =
  | { kind: "candidate"; candidate: CandidateDTO }
  | { kind: "business"; business: BusinessDTO };

function parseSortKey(raw: string | undefined): SortKey {
  if (raw === "name" || raw === "score-asc") return raw;
  return "score-desc";
}

function parseMinScore(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function rowName(cand: ResolvedCand): string {
  return cand.kind === "candidate" ? cand.candidate.name : cand.business.name;
}

function TopMatchCard({
  rank,
  match,
  cand,
}: {
  rank: number;
  match: MatchDTO;
  cand: ResolvedCand;
}) {
  const name = cand.kind === "candidate" ? cand.candidate.name : cand.business.name;
  const photo = cand.kind === "candidate" ? cand.candidate.photoUrl : cand.business.logoUrl;
  const location =
    cand.kind === "candidate" ? cand.candidate.location : cand.business.location;
  const detailHref =
    cand.kind === "candidate"
      ? `/profile/candidate/${cand.candidate.id}`
      : `/profile/business/${cand.business.id}`;
  const pct = match.score * 100;
  const tone = pct >= 85 ? "orange" : pct >= 75 ? "emerald" : "warmgray";

  return (
    <Link
      href={detailHref}
      className="group flex flex-col rounded-lg border border-warmgray-200 bg-white p-3 transition hover:border-warmgray-300"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-400">
          #{String(rank).padStart(2, "0")}
        </span>
        <Pill tone={tone}>{pct.toFixed(1)}%</Pill>
      </div>
      <div className="mt-2 flex items-center gap-2.5">
        <Avatar name={name} src={photo} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink group-hover:text-orange-700">
            {name}
          </div>
          <div className="truncate text-[11px] text-warmgray-500">{location}</div>
        </div>
      </div>
    </Link>
  );
}

function NoMatchingFilters() {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-semibold text-ink">No matches under those filters.</p>
      <p className="mt-1 text-xs text-warmgray-500">Loosen score or location to see more.</p>
    </div>
  );
}

function DenseRow({
  idx,
  match,
  cand,
}: {
  idx: number;
  match: MatchDTO;
  cand: ResolvedCand;
}) {
  const name = cand.kind === "candidate" ? cand.candidate.name : cand.business.name;
  const photo = cand.kind === "candidate" ? cand.candidate.photoUrl : cand.business.logoUrl;
  const headline =
    cand.kind === "candidate" ? cand.candidate.headline : cand.business.oneLiner;
  const location =
    cand.kind === "candidate" ? cand.candidate.location : cand.business.location;
  const detailHref =
    cand.kind === "candidate"
      ? `/profile/candidate/${cand.candidate.id}`
      : `/profile/business/${cand.business.id}`;
  const pct = match.score * 100;
  const pctLabel = pct.toFixed(1);
  const tone =
    pct >= 90 ? "text-orange-700" : pct >= 75 ? "text-emerald-700" : "text-warmgray-700";

  return (
    <tr className="transition hover:bg-warmgray-50">
      <td className="px-4 py-2 align-middle font-mono text-xs text-warmgray-500">
        {String(idx + 1).padStart(2, "0")}
      </td>
      <td className="py-2 align-middle">
        <div className="flex items-center gap-2.5">
          <Avatar name={name} src={photo} size="sm" />
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="block truncate text-sm font-semibold text-ink hover:text-orange-700"
            >
              {name}
            </Link>
            <div className="truncate text-[11px] text-warmgray-500">{headline}</div>
          </div>
        </div>
      </td>
      <td className="py-2 align-middle">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-bold ${tone}`}>{pctLabel}%</span>
          <div className="hidden h-1 w-12 rounded-full bg-warmgray-100 sm:block">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </td>
      <td className="hidden py-2 align-middle text-xs text-warmgray-700 md:table-cell">
        {location}
      </td>
      <td className="px-4 py-2 text-right align-middle">
        <Link
          href={detailHref}
          className="inline-flex h-7 items-center rounded-md bg-ink px-2.5 text-[11px] font-semibold text-white transition hover:bg-warmgray-800"
        >
          Open
        </Link>
      </td>
    </tr>
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
  placeholderExamples: string[];
  matchesHeading: string;
} {
  switch (viewerKind) {
    case "business":
      return {
        eyebrow: "Founder home",
        title: "Find your next hire.",
        sub: "Search Utah's operators, or jump to the candidates we ranked for you.",
        placeholder: "Search talent by skill, role, or location…",
        placeholderExamples: [
          "Software engineer",
          "Sales reps in Provo",
          "Founding designer",
          "Bioengineering interns",
          "Fractional CFO",
          "ML engineer with biotech experience",
        ],
        matchesHeading: "Ranked candidates",
      };
    case "mentor":
      return {
        eyebrow: "Mentor home",
        title: "Find founders to advise.",
        sub: "Browse Utah businesses and candidates that may want your help.",
        placeholder: "Search businesses or candidates by sector or stage…",
        placeholderExamples: [
          "Pre-seed AI founders",
          "Life-sciences spinouts",
          "First-time CEOs in Lehi",
          "Hardware seed-stage teams",
        ],
        matchesHeading: "Recommended for you",
      };
    case "investor":
      return {
        eyebrow: "VC home",
        title: "Find businesses to back.",
        sub: "Browse Utah companies that match your check size, stage, and sector.",
        placeholder: "Search businesses by sector, stage, or origin…",
        placeholderExamples: [
          "Seed-stage AI",
          "U-of-U spinouts",
          "Bootstrapped SaaS",
          "Defense & aerospace pre-seed",
          "Series-A fintech",
        ],
        matchesHeading: "Ranked businesses",
      };
    case "candidate":
    default:
      return {
        eyebrow: "For you",
        title: "Find businesses that fit you.",
        sub: "Search Utah's businesses, or jump to the matches we ranked for you.",
        placeholder: "Search businesses by sector, role, or stage…",
        placeholderExamples: [
          "AI startups in Lehi",
          "Seed-stage fintech",
          "Hardware companies hiring engineers",
          "Life-sciences spinouts",
          "Bootstrapped SaaS in Provo",
        ],
        matchesHeading: "Ranked businesses",
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
): ResolvedCand | null {
  if (m.candidateKind === "candidate") {
    const c = candidates.find((x) => x.id === m.candidateId);
    return c ? { kind: "candidate", candidate: c } : null;
  }
  if (m.candidateKind === "business") {
    const b = businesses.find((x) => x.id === m.candidateId);
    return b ? { kind: "business", business: b } : null;
  }
  return null;
}

function EmptyState({ viewerKind }: { viewerKind: ProfileKind | null }) {
  const noProfile = viewerKind === null;
  const future = viewerKind === "mentor" || viewerKind === "investor";
  const headline = noProfile
    ? "Tell us about yourself first."
    : future
      ? "Match recommendations coming soon."
      : viewerKind === "candidate"
        ? "No business matches yet."
        : "No candidate matches yet.";
  const sub = noProfile
    ? "Two minutes of input is all we need to start ranking."
    : future
      ? "Browse the directory while we build your queue."
      : "Sharpen your profile so we can rank what fits you.";
  const cta = noProfile
    ? { href: "/onboard", label: "Get started" }
    : future
      ? { href: "/search", label: "Browse directory" }
      : { href: "/profile", label: "Open profile" };

  return (
    <div className="px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{headline}</p>
      <p className="mt-1 text-xs text-warmgray-500">{sub}</p>
      <Link
        href={cta.href}
        className="mt-4 inline-flex h-8 items-center rounded-md bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600"
      >
        {cta.label} →
      </Link>
    </div>
  );
}
