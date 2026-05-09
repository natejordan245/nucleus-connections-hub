import Link from "next/link";
import { Search } from "lucide-react";
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
  const issue = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  const eyebrow = isTalent ? "For you" : "Founder home";
  const title = isTalent ? "Find startups that fit you." : "Find your next hire.";
  const sub = isTalent
    ? "Search Utah's startups, or jump to the matches we ranked for you."
    : "Search Utah's operators, or jump to the candidates we ranked for you.";
  const placeholder = isTalent
    ? "Search startups by sector, role, or stage…"
    : "Search talent by skill, role, or location…";

  const interested = resolveInterestedIn({ isTalent, viewerId, interests, allTalent, allStartups });

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-12">
      {/* Masthead */}
      <header className="border-b-2 border-ink pb-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-[0.3em] text-ink">
            NUCLEUS · {issue}
          </span>
          <span className="font-mono text-[11px] tracking-[0.3em] text-warmgray-500">
            VOL. 01 · NO. {String(matches.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* Hero — feature article style */}
      <section className="grid grid-cols-12 gap-8 border-b border-warmgray-200 py-12">
        <div className="col-span-12 md:col-span-3">
          <span className="eyebrow text-orange-500">{eyebrow}</span>
          <div className="mt-6 font-mono text-xs text-warmgray-500">
            <div>FEATURE 01</div>
            <div className="mt-1">Curated · weekly</div>
          </div>
        </div>
        <div className="col-span-12 md:col-span-9">
          <h1 className="text-[64px] font-bold leading-[0.95] tracking-[-0.025em] text-ink">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-warmgray-700">
            <span className="float-left mr-2 mt-1 font-bold text-5xl leading-none text-orange-500">
              {sub.charAt(0)}
            </span>
            {sub.slice(1)}
          </p>
          <form action="/search" method="GET" role="search" className="mt-8 flex max-w-xl items-center gap-2 border-b-2 border-ink pb-2">
            <Search aria-hidden strokeWidth={2} className="h-5 w-5 text-ink" />
            <label htmlFor="dashboard-search" className="sr-only">Search</label>
            <input
              id="dashboard-search"
              name="q"
              type="search"
              placeholder={placeholder}
              autoComplete="off"
              className="flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-warmgray-400"
            />
            <button type="submit" className="font-mono text-xs font-bold tracking-[0.2em] text-orange-500 hover:text-orange-700">
              SEARCH →
            </button>
          </form>
        </div>
      </section>

      {/* Interested-in column */}
      {interested.length > 0 && (
        <section className="grid grid-cols-12 gap-8 border-b border-warmgray-200 py-10">
          <div className="col-span-12 md:col-span-3">
            <span className="font-mono text-xs tracking-[0.3em] text-warmgray-500">FEATURE 02</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-ink">
              Interested<br />in you
            </h2>
            <p className="mt-3 text-sm text-warmgray-600">
              {interested.length} {interested.length === 1 ? "person has" : "people have"} signaled.
            </p>
          </div>
          <ul className="col-span-12 divide-y divide-warmgray-200 md:col-span-9">
            {interested.map((c, i) => (
              <li key={c.href}>
                <Link href={c.href} className="group flex items-center gap-5 py-4 transition hover:bg-orange-50">
                  <span className="font-mono text-xs text-warmgray-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                  <Avatar name={c.name} src={c.photo} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-ink group-hover:text-orange-700">{c.name}</div>
                    <div className="truncate text-sm text-warmgray-600">{c.headline}</div>
                  </div>
                  <span aria-hidden className="font-mono text-warmgray-400 transition group-hover:translate-x-1 group-hover:text-orange-500">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Matches as feature articles */}
      <section className="grid grid-cols-12 gap-8 py-10">
        <div className="col-span-12 md:col-span-3">
          <span className="font-mono text-xs tracking-[0.3em] text-warmgray-500">FEATURE 03</span>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink">
            {isTalent ? "Startups\nfor you" : "Candidates\nfor you"}
          </h2>
          <p className="mt-3 max-w-[200px] text-sm text-warmgray-600">
            Ranked by Nucleus · Top {matches.length}.
          </p>
        </div>
        <div className="col-span-12 md:col-span-9">
          {matches.length === 0 ? (
            <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
          ) : (
            <ul className="space-y-10">
              {matches.map((m, idx) => {
                const cand = resolveCandidate(m, allTalent, allStartups);
                if (!cand) return null;
                return <FeatureRow key={m.id} idx={idx} match={m} cand={cand} utahOrgs={utahOrgs} />;
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

function FeatureRow({
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

  return (
    <li className="grid grid-cols-12 gap-6 border-b border-warmgray-200 pb-10 last:border-b-0">
      <div className="col-span-12 sm:col-span-4">
        <Link href={detailHref} className="block">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-sm bg-warmgray-100">
            <Avatar name={name} src={photo} size="lg" />
          </div>
        </Link>
      </div>
      <div className="col-span-12 sm:col-span-8">
        <div className="flex items-baseline justify-between gap-3 font-mono text-[11px] tracking-[0.2em] text-warmgray-500">
          <span>NO. {String(idx + 1).padStart(2, "0")}</span>
          <span className="text-orange-700">{pct}% MATCH</span>
        </div>
        <h3 className="mt-2 text-3xl font-bold leading-tight text-ink">
          <Link href={detailHref} className="hover:text-orange-700">{name}</Link>
        </h3>
        <p className="mt-1 text-base text-warmgray-700">{headline}</p>
        <p className="mt-4 text-base leading-relaxed text-warmgray-700">{match.reason}</p>
        <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t border-warmgray-200 pt-4 text-sm">
          <dt className="font-mono text-xs uppercase tracking-wider text-warmgray-500">Location</dt>
          <dd className="text-ink">{location}</dd>
          {sharedOrgs.length > 0 && (
            <>
              <dt className="font-mono text-xs uppercase tracking-wider text-warmgray-500">Shared</dt>
              <dd className="text-ink">{sharedOrgs.map((o) => o.name).join(" · ")}</dd>
            </>
          )}
        </dl>
        {match.concerns.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs italic text-warmgray-500">
            {match.concerns.map((c, i) => (
              <li key={i}>† {c}</li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex items-center gap-4">
          <Link href={handshakeHref} className="font-mono text-xs font-bold tracking-[0.2em] text-orange-500 hover:text-orange-700">
            OPEN INTRO →
          </Link>
          <Link href={detailHref} className="font-mono text-xs tracking-[0.2em] text-warmgray-500 hover:text-ink">
            CONTINUE READING
          </Link>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  return (
    <div className="border-2 border-dashed border-warmgray-200 p-10 text-center">
      <p className="text-2xl font-bold text-ink">
        {!hasProfile ? "Tell us about yourself first." : isTalent ? "No startup matches yet." : "No candidate matches yet."}
      </p>
      <p className="mt-2 text-sm text-warmgray-600">
        {!hasProfile ? "Two minutes of input is all we need to start ranking." : "Sharpen your profile so we can rank what fits you."}
      </p>
      <Link
        href={!hasProfile ? "/onboard" : "/profile"}
        className="mt-5 inline-block font-mono text-xs font-bold tracking-[0.2em] text-orange-500 hover:text-orange-700"
      >
        {!hasProfile ? "GET STARTED" : "OPEN PROFILE"} →
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
