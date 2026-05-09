import Link from "next/link";
import { Search, ChevronDown, Filter, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { getDataStore } from "@/lib/data";
import type { InterestDTO, MatchDTO, StartupDTO, TalentDTO, UtahOrg } from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();

  const [talent, startup, matches, interests, allTalent, allStartups, utahOrgs] = await Promise.all([
    store.getTalent(viewerId),
    store.getStartup(viewerId),
    store.matchesFor(viewerId),
    store.listInterests(viewerId),
    store.listTalent(),
    store.listStartups(),
    store.listUtahOrgs(),
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

  const interested = resolveInterestedIn({ isTalent, viewerId, interests, allTalent, allStartups });
  const avgScore = matches.length
    ? Math.round((matches.reduce((s, m) => s + m.score, 0) / matches.length) * 100)
    : 0;
  const topScore = matches.length ? Math.round(Math.max(...matches.map((m) => m.score)) * 100) : 0;
  const sharedTotal = matches.reduce((s, m) => s + m.sharedOrgIds.length, 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">{eyebrow}</span>
          <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-warmgray-500">{sub}</p>
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
          <label htmlFor="dashboard-search" className="sr-only">Search</label>
          <input
            id="dashboard-search"
            name="q"
            type="search"
            placeholder={placeholder}
            autoComplete="off"
            className="flex-1 bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-warmgray-400"
          />
          <button type="submit" className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600">
            Search
          </button>
        </form>
        <span className="h-5 w-px bg-warmgray-200" />
        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300">
          <Filter className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Filters
        </button>
        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300">
          Sort: Score <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Two-col split */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Match table */}
        <section className="rounded-lg border border-warmgray-200 bg-white">
          <div className="flex items-center justify-between border-b border-warmgray-200 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-ink">
              {isTalent ? "Ranked startups" : "Ranked candidates"}
              <span className="ml-2 font-mono text-xs text-warmgray-500">{matches.length}</span>
            </h2>
            <button className="font-mono text-xs text-warmgray-500 hover:text-ink">↻ refresh</button>
          </div>

          {matches.length === 0 ? (
            <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
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
                  const cand = resolveCandidate(m, allTalent, allStartups);
                  if (!cand) return null;
                  return <DenseRow key={m.id} idx={i} match={m} cand={cand} utahOrgs={utahOrgs} />;
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Sidebar: inbound interest */}
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
                    <Link href={c.href} className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-orange-50">
                      <Avatar name={c.name} src={c.photo} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-ink">{c.name}</div>
                        <div className="truncate text-[11px] text-warmgray-500">{c.headline}</div>
                      </div>
                      <span aria-hidden className="text-warmgray-300 group-hover:text-orange-500">→</span>
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

function Stat({ label, value, accent, delta }: { label: string; value: string; accent?: boolean; delta?: string }) {
  return (
    <div className={`px-4 py-3 ${accent ? "bg-ink text-paper" : "bg-white"}`}>
      <div className={`font-mono text-[10px] uppercase tracking-wider ${accent ? "text-orange-300" : "text-warmgray-500"}`}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`font-mono text-2xl font-bold ${accent ? "text-paper" : "text-ink"}`}>{value}</span>
        {delta && <span className={`text-xs ${accent ? "text-orange-300" : "text-warmgray-400"}`}>{delta}</span>}
      </div>
    </div>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-warmgray-500">{label}</span>
      <span className="text-ink font-semibold">{value}</span>
    </div>
  );
}

function DenseRow({
  idx, match, cand, utahOrgs,
}: {
  idx: number;
  match: MatchDTO;
  cand: { kind: "talent"; talent: TalentDTO } | { kind: "startup"; startup: StartupDTO };
  utahOrgs: UtahOrg[];
}) {
  const name = cand.kind === "talent" ? cand.talent.name : cand.startup.name;
  const photo = cand.kind === "talent" ? cand.talent.photoUrl : cand.startup.logoUrl;
  const headline = cand.kind === "talent" ? cand.talent.headline : cand.startup.oneLiner;
  const location = cand.kind === "talent" ? cand.talent.location : cand.startup.location;
  const detailHref = cand.kind === "talent" ? `/profile/talent/${cand.talent.id}` : `/profile/startup/${cand.startup.id}`;
  const handshakeHref = `/handshake?with=${cand.kind === "talent" ? cand.talent.id : cand.startup.id}`;
  const pct = Math.round(match.score * 100);
  const sharedCount = match.sharedOrgIds.length;
  const tone = pct >= 90 ? "text-orange-700" : pct >= 75 ? "text-emerald-700" : "text-warmgray-700";

  return (
    <tr className="transition hover:bg-warmgray-50">
      <td className="px-4 py-2 font-mono text-xs text-warmgray-500 align-middle">{String(idx + 1).padStart(2, "0")}</td>
      <td className="py-2 align-middle">
        <div className="flex items-center gap-2.5">
          <Avatar name={name} src={photo} size="sm" />
          <div className="min-w-0">
            <Link href={detailHref} className="block truncate text-sm font-semibold text-ink hover:text-orange-700">{name}</Link>
            <div className="truncate text-[11px] text-warmgray-500">{headline}</div>
          </div>
        </div>
      </td>
      <td className="py-2 align-middle">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-bold ${tone}`}>{pct}%</span>
          <div className="hidden h-1 w-12 rounded-full bg-warmgray-100 sm:block">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td className="hidden py-2 text-xs text-warmgray-700 align-middle md:table-cell">{location}</td>
      <td className="hidden py-2 text-xs align-middle md:table-cell">
        {sharedCount > 0 ? (
          <span className="text-orange-700 font-medium">{sharedCount} shared</span>
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

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">
        {!hasProfile ? "Tell us about yourself first." : isTalent ? "No startup matches yet." : "No candidate matches yet."}
      </p>
      <p className="mt-1 text-xs text-warmgray-500">
        {!hasProfile ? "Two minutes of input is all we need to start ranking." : "Sharpen your profile so we can rank what fits you."}
      </p>
      <Link
        href={!hasProfile ? "/onboard" : "/profile"}
        className="mt-4 inline-flex h-8 items-center rounded-md bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600"
      >
        {!hasProfile ? "Get started" : "Open profile"} →
      </Link>
    </div>
  );
}

type InterestedCard = { href: string; name: string; headline: string; photo: string | undefined };

function resolveInterestedIn({
  isTalent, viewerId, interests, allTalent, allStartups,
}: {
  isTalent: boolean; viewerId: string; interests: InterestDTO[]; allTalent: TalentDTO[]; allStartups: StartupDTO[];
}): InterestedCard[] {
  if (isTalent) {
    return interests
      .filter((i) => i.talentId === viewerId && i.startupState === "interested")
      .map((i) => allStartups.find((s) => s.id === i.startupId))
      .filter((s): s is StartupDTO => Boolean(s))
      .map((s) => ({ href: `/profile/startup/${s.id}`, name: s.name, headline: s.oneLiner, photo: s.logoUrl }));
  }
  return interests
    .filter((i) => i.startupId === viewerId && i.talentState === "interested")
    .map((i) => allTalent.find((t) => t.id === i.talentId))
    .filter((t): t is TalentDTO => Boolean(t))
    .map((t) => ({ href: `/profile/talent/${t.id}`, name: t.name, headline: t.headline, photo: t.photoUrl }));
}

function resolveCandidate(
  m: MatchDTO, talent: TalentDTO[], startups: StartupDTO[],
): { kind: "talent"; talent: TalentDTO } | { kind: "startup"; startup: StartupDTO } | null {
  if (m.candidateKind === "talent") {
    const t = talent.find((t) => t.id === m.candidateId);
    return t ? { kind: "talent", talent: t } : null;
  }
  const s = startups.find((s) => s.id === m.candidateId);
  return s ? { kind: "startup", startup: s } : null;
}
