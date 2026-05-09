import Link from "next/link";
import { Search, Sparkles, ArrowUpRight } from "lucide-react";
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
  const featured = matches[0];
  const featuredCand = featured ? resolveCandidate(featured, allTalent, allStartups) : null;
  const restMatches = matches.slice(1);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-8 rounded-3xl bg-ink p-10 text-paper">
          <span className="eyebrow text-orange-300">{eyebrow}</span>
          <h1 className="mt-4 text-[56px] font-bold leading-[0.95] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-warmgray-300">{sub}</p>
        </div>

        <div className="col-span-12 lg:col-span-4 rounded-3xl bg-orange-500 p-8 text-paper">
          <span className="eyebrow text-orange-100">Ranked for you</span>
          <div className="mt-4 font-mono text-7xl font-bold leading-none">
            {String(matches.length).padStart(2, "0")}
          </div>
          <p className="mt-3 text-sm text-orange-100">
            {isTalent ? "startups in your queue" : "candidates in your queue"}
          </p>
        </div>

        <div className="col-span-12 rounded-3xl border border-warmgray-100 bg-white p-3">
          <form action="/search" method="GET" role="search" className="flex items-center gap-2">
            <label htmlFor="dashboard-search" className="sr-only">Search</label>
            <div className="relative flex-1">
              <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warmgray-400" />
              <input
                id="dashboard-search"
                name="q"
                type="search"
                placeholder={placeholder}
                autoComplete="off"
                className="w-full rounded-2xl bg-warmgray-50 py-4 pl-12 pr-4 text-base text-ink outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-300/60"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
            >
              Search →
            </button>
          </form>
        </div>
      </div>

      {interested.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Interested in you</h2>
            <span className="font-mono text-xs text-warmgray-500">{interested.length} active</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {interested.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col gap-3 rounded-3xl bg-orange-50 p-5 transition hover:bg-orange-100"
                >
                  <Avatar name={c.name} src={c.photo} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{c.name}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-warmgray-600">{c.headline}</div>
                  </div>
                  <ArrowUpRight aria-hidden className="h-4 w-4 text-orange-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {isTalent ? "Startups for you" : "Candidates for you"}
          </h2>
          <Sparkles aria-hidden className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
        </div>

        {matches.length === 0 ? (
          <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
        ) : (
          <div className="grid auto-rows-[180px] grid-cols-1 gap-3 md:grid-cols-4">
            {featured && featuredCand && (
              <BentoTile match={featured} cand={featuredCand} utahOrgs={utahOrgs} variant="hero" />
            )}
            {restMatches.map((m, i) => {
              const cand = resolveCandidate(m, allTalent, allStartups);
              if (!cand) return null;
              const variant = i % 5 === 0 ? "wide" : i % 5 === 3 ? "tall" : "default";
              return <BentoTile key={m.id} match={m} cand={cand} utahOrgs={utahOrgs} variant={variant} />;
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function BentoTile({
  match, cand, utahOrgs, variant,
}: {
  match: MatchDTO;
  cand: { kind: "talent"; talent: TalentDTO } | { kind: "startup"; startup: StartupDTO };
  utahOrgs: UtahOrg[];
  variant: "hero" | "wide" | "tall" | "default";
}) {
  const name = cand.kind === "talent" ? cand.talent.name : cand.startup.name;
  const photo = cand.kind === "talent" ? cand.talent.photoUrl : cand.startup.logoUrl;
  const headline = cand.kind === "talent" ? cand.talent.headline : cand.startup.oneLiner;
  const location = cand.kind === "talent" ? cand.talent.location : cand.startup.location;
  const detailHref = cand.kind === "talent" ? `/profile/talent/${cand.talent.id}` : `/profile/startup/${cand.startup.id}`;
  const pct = Math.round(match.score * 100);
  const sharedOrgs = match.sharedOrgIds
    .map((id) => utahOrgs.find((o) => o.id === id))
    .filter((o): o is UtahOrg => Boolean(o));

  const span =
    variant === "hero" ? "md:col-span-2 md:row-span-2"
    : variant === "wide" ? "md:col-span-2"
    : variant === "tall" ? "md:row-span-2"
    : "";
  const isHero = variant === "hero";

  return (
    <Link
      href={detailHref}
      className={`group relative overflow-hidden rounded-3xl border border-warmgray-100 bg-white p-6 transition hover:border-warmgray-300 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)] ${span}`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <Avatar name={name} src={photo} size={isHero ? "lg" : "md"} />
          <span className="rounded-full bg-orange-50 px-2.5 py-1 font-mono text-xs font-semibold text-orange-700">
            {pct}%
          </span>
        </div>
        <div>
          <h3 className={`${isHero ? "text-2xl" : "text-base"} font-bold leading-tight text-ink`}>
            {name}
          </h3>
          <p className={`mt-1 ${isHero ? "text-sm" : "text-xs"} line-clamp-2 text-warmgray-600`}>
            {headline}
          </p>
          {isHero && (
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-warmgray-700">
              {match.reason}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-warmgray-500">
            <span>{location}</span>
            {sharedOrgs.length > 0 && (
              <>
                <span aria-hidden className="text-warmgray-300">·</span>
                <span className="font-medium text-orange-700">
                  {sharedOrgs.length} shared {sharedOrgs.length === 1 ? "org" : "orgs"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  return (
    <div className="rounded-3xl bg-warmgray-50 p-12 text-center">
      <p className="text-2xl font-bold text-ink">
        {!hasProfile ? "Tell us about yourself first." : isTalent ? "No startup matches yet." : "No candidate matches yet."}
      </p>
      <p className="mt-2 text-sm text-warmgray-600">
        {!hasProfile ? "Two minutes of input is all we need to start ranking." : "Sharpen your profile so we can rank what fits you."}
      </p>
      <Link
        href={!hasProfile ? "/onboard" : "/profile"}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
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
