import Link from "next/link";
import { Search, ChevronDown, Filter, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { getDataStore } from "@/lib/data";
import type {
  BusinessDTO,
  CandidateDTO,
  InterestDTO,
  MatchDTO,
  ProfileKind,
} from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  const [candidate, business, mentor, investor, matches, interests, allCandidates, allBusinesses] =
    await Promise.all([
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
  const interested = resolveInterestedIn({
    viewerKind,
    viewerId,
    interests,
    allCandidates,
    allBusinesses,
  });
  const avgScore = matches.length
    ? Math.round((matches.reduce((s, m) => s + m.score, 0) / matches.length) * 100)
    : 0;
  const topScore = matches.length
    ? Math.round(Math.max(...matches.map((m) => m.score)) * 100)
    : 0;
  const sharedTotal = matches.reduce((s, m) => s + m.sharedOrgIds.length, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">{copy.eyebrow}</span>
          <h1 className="mt-2 text-2xl font-bold text-ink">{copy.title}</h1>
          <p className="mt-1 text-sm text-warmgray-500">{copy.sub}</p>
        </div>
        <div className="hidden text-right font-mono text-xs text-warmgray-500 sm:block">
          <div>Last sync · just now</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            live
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-warmgray-200 bg-warmgray-200 sm:grid-cols-4">
        <Stat label="Ranked queue" value={String(matches.length).padStart(2, "0")} />
        <Stat label="Top score" value={`${topScore}%`} accent />
        <Stat label="Avg score" value={`${avgScore}%`} delta={avgScore >= 75 ? "↑" : "·"} />
        <Stat label="Inbound interest" value={String(interested.length).padStart(2, "0")} />
      </div>

      {/* Search + filter row */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-warmgray-200 bg-white p-2">
        <form action="/search" method="GET" role="search" className="flex flex-1 items-center gap-2">
          <Search aria-hidden strokeWidth={1.75} className="ml-2 h-4 w-4 text-warmgray-400" />
          <label htmlFor="dashboard-search" className="sr-only">
            Search
          </label>
          <input
            id="dashboard-search"
            name="q"
            type="search"
            placeholder={copy.placeholder}
            autoComplete="off"
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
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Filters
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
        >
          Sort: Score <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Two-col split */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-lg border border-warmgray-200 bg-white">
          <div className="flex items-center justify-between border-b border-warmgray-200 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-ink">
              {copy.matchesHeading}
              <span className="ml-2 font-mono text-xs text-warmgray-500">{matches.length}</span>
            </h2>
            <span className="font-mono text-xs text-warmgray-500">↻ refresh</span>
          </div>

          {matches.length === 0 ? (
            <EmptyState viewerKind={viewerKind} />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-warmgray-200 bg-warmgray-50 text-left font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">#</th>
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Score</th>
                  <th className="hidden py-2 font-semibold md:table-cell">Location</th>
                  <th className="hidden py-2 font-semibold md:table-cell">Signals</th>
                  <th className="px-4 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100">
                {matches.map((m, i) => {
                  const cand = resolveCandidate(m, allCandidates, allBusinesses);
                  if (!cand) return null;
                  return <DenseRow key={m.id} idx={i} match={m} cand={cand} />;
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-warmgray-200 bg-white">
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

          <section className="rounded-lg border border-warmgray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" strokeWidth={2} aria-hidden />
              Diagnostics
            </div>
            <dl className="space-y-1.5 font-mono text-[11px]">
              <Diag label="shared.org.count" value={String(sharedTotal)} />
              <Diag label="queue.depth" value={String(matches.length)} />
              <Diag label="signal.inbound" value={String(interested.length)} />
              <Diag label="score.spread" value={`${topScore - avgScore}pt`} />
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
  delta,
}: {
  label: string;
  value: string;
  accent?: boolean;
  delta?: string;
}) {
  return (
    <div className={`px-4 py-3 ${accent ? "bg-ink text-paper" : "bg-white"}`}>
      <div
        className={`font-mono text-[10px] uppercase tracking-wider ${
          accent ? "text-orange-300" : "text-warmgray-500"
        }`}
      >
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={`font-mono text-2xl font-bold ${accent ? "text-paper" : "text-ink"}`}
        >
          {value}
        </span>
        {delta && (
          <span className={`text-xs ${accent ? "text-orange-300" : "text-warmgray-400"}`}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-warmgray-500">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

type ResolvedCand =
  | { kind: "candidate"; candidate: CandidateDTO }
  | { kind: "business"; business: BusinessDTO };

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
  const handshakeHref = `/handshake?with=${
    cand.kind === "candidate" ? cand.candidate.id : cand.business.id
  }`;
  const pct = Math.round(match.score * 100);
  const sharedCount = match.sharedOrgIds.length;
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
          <span className={`font-mono text-sm font-bold ${tone}`}>{pct}%</span>
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
      <td className="hidden py-2 align-middle text-xs md:table-cell">
        {sharedCount > 0 ? (
          <span className="font-medium text-orange-700">{sharedCount} shared</span>
        ) : (
          <span className="text-warmgray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right align-middle">
        <Link
          href={handshakeHref}
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
  matchesHeading: string;
} {
  switch (viewerKind) {
    case "business":
      return {
        eyebrow: "Founder home",
        title: "Find your next hire.",
        sub: "Search Utah's operators, or jump to the candidates we ranked for you.",
        placeholder: "Search talent by skill, role, or location…",
        matchesHeading: "Ranked candidates",
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
        matchesHeading: "Ranked businesses",
      };
    case "candidate":
    default:
      return {
        eyebrow: "For you",
        title: "Find businesses that fit you.",
        sub: "Search Utah's businesses, or jump to the matches we ranked for you.",
        placeholder: "Search businesses by sector, role, or stage…",
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
