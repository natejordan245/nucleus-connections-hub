import Link from "next/link";
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
  const role = isTalent ? "TALENT" : "FOUNDER";
  const eyebrow = isTalent ? "FOR YOU" : "FOUNDER HOME";
  const title = isTalent ? "Find startups that fit you." : "Find your next hire.";
  const sub = isTalent
    ? "Search Utah's startups, or jump to the matches we ranked for you."
    : "Search Utah's operators, or jump to the candidates we ranked for you.";
  const placeholder = isTalent
    ? "sector | role | stage…"
    : "skill | role | location…";

  const interested = resolveInterestedIn({ isTalent, viewerId, interests, allTalent, allStartups });
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";

  return (
    <main className="font-mono mx-auto w-full max-w-5xl px-6 py-10 text-ink">
      {/* Top status bar */}
      <pre className="text-[11px] leading-tight text-warmgray-500 select-none">
{`┌─────────────────────────────────────────────────────────────────────────┐
│ NUCLEUS//${ts}  role=${role.padEnd(7)}  matches=${String(matches.length).padStart(2, "0")}  signals=${String(interested.length).padStart(2, "0")}  │
└─────────────────────────────────────────────────────────────────────────┘`}
      </pre>

      <div className="mt-8">
        <span className="text-[11px] font-bold tracking-[0.3em] text-orange-500">// {eyebrow}</span>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-ink">
          <span className="text-orange-500">$</span> {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600"># {sub}</p>
      </div>

      {/* Search prompt */}
      <form action="/search" method="GET" role="search" className="mt-8 border-2 border-ink bg-white">
        <div className="flex items-center gap-3 border-b-2 border-ink bg-warmgray-50 px-3 py-1.5 text-[11px] font-bold tracking-[0.2em]">
          <span className="text-orange-500">●</span>
          <span className="text-ink">SEARCH.SH</span>
          <span className="ml-auto text-warmgray-500">▽ ▢ ✕</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="text-orange-500 font-bold">$</span>
          <span className="text-warmgray-500">query --type={role.toLowerCase()}</span>
          <label htmlFor="dashboard-search" className="sr-only">Search</label>
          <input
            id="dashboard-search"
            name="q"
            type="search"
            placeholder={placeholder}
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-warmgray-400"
          />
          <button type="submit" className="border-2 border-ink bg-orange-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-orange-600">
            run [↵]
          </button>
        </div>
      </form>

      {/* Interested */}
      {interested.length > 0 && (
        <section className="mt-12">
          <h2 className="border-b-2 border-ink pb-2 text-sm font-bold tracking-[0.2em] text-ink">
            <span className="text-orange-500">▶</span> INTERESTED_IN_YOU [{interested.length}]
          </h2>
          <ul className="mt-4 space-y-0">
            {interested.map((c, i) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="group flex items-center gap-4 border-b border-warmgray-200 py-3 transition hover:bg-orange-50 hover:px-3"
                >
                  <span className="text-xs text-warmgray-400">[{String(i).padStart(2, "0")}]</span>
                  <Avatar name={c.name} src={c.photo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink">{c.name}</div>
                    <div className="truncate text-xs text-warmgray-500">{c.headline}</div>
                  </div>
                  <span className="text-xs text-orange-500 transition group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Matches as data rows */}
      <section className="mt-12">
        <h2 className="border-b-2 border-ink pb-2 text-sm font-bold tracking-[0.2em] text-ink">
          <span className="text-orange-500">▶</span> {isTalent ? "STARTUPS" : "CANDIDATES"}_FOR_YOU [{matches.length}]
        </h2>

        {matches.length === 0 ? (
          <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
        ) : (
          <ul className="mt-0 divide-y-2 divide-warmgray-100">
            {matches.map((m, idx) => {
              const cand = resolveCandidate(m, allTalent, allStartups);
              if (!cand) return null;
              return <DataRow key={m.id} idx={idx} match={m} cand={cand} utahOrgs={utahOrgs} />;
            })}
          </ul>
        )}
      </section>

      <pre className="mt-12 text-[11px] leading-tight text-warmgray-400 select-none">
{`> ${matches.length} record(s) returned.  press \`/\` to focus search.`}
      </pre>
    </main>
  );
}

function DataRow({
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
  const sharedOrgs = match.sharedOrgIds
    .map((id) => utahOrgs.find((o) => o.id === id))
    .filter((o): o is UtahOrg => Boolean(o));
  const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));

  return (
    <li className="py-5">
      <div className="flex items-start gap-4">
        <span className="text-xs font-bold text-warmgray-400 mt-1">[{String(idx).padStart(2, "0")}]</span>
        <Avatar name={name} src={photo} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-bold text-ink">
              <Link href={detailHref} className="hover:text-orange-500">{name}</Link>
            </h3>
            <span className="text-xs">
              <span className="text-orange-500">{bar}</span>{" "}
              <span className="font-bold text-ink">{pct}%</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-warmgray-600">{headline}</p>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-warmgray-700">
{`  reason  : ${match.reason}
  loc     : ${location}${sharedOrgs.length > 0 ? `\n  shared  : ${sharedOrgs.map((o) => o.name).join(", ")}` : ""}${match.concerns.length > 0 ? `\n  ! risks : ${match.concerns.join(" | ")}` : ""}`}
          </pre>
          <div className="mt-3 flex gap-2">
            <Link
              href={handshakeHref}
              className="border-2 border-ink bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-orange-600"
            >
              open
            </Link>
            <Link
              href={detailHref}
              className="border-2 border-warmgray-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-warmgray-700 transition hover:border-ink hover:text-ink"
            >
              inspect
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  return (
    <div className="mt-4 border-2 border-dashed border-warmgray-300 bg-warmgray-50 p-8 text-sm">
      <pre className="text-warmgray-500">
{`! NOTICE
${!hasProfile ? "  No profile detected." : isTalent ? "  No startup matches in queue." : "  No candidate matches in queue."}
${!hasProfile ? "  Two minutes of input is all we need." : "  Sharpen your profile to fix ranking."}`}
      </pre>
      <Link
        href={!hasProfile ? "/onboard" : "/profile"}
        className="mt-4 inline-block border-2 border-ink bg-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-orange-600"
      >
        {!hasProfile ? "init" : "edit_profile"} →
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
