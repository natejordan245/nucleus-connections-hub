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
  const eyebrow = isTalent ? "For you" : "Founder home";
  const title = isTalent ? "Find startups\nthat fit you." : "Find your\nnext hire.";
  const sub = isTalent
    ? "Search Utah's startups, or jump to the matches we ranked for you."
    : "Search Utah's operators, or jump to the candidates we ranked for you.";
  const placeholder = isTalent
    ? "Search startups by sector, role, or stage…"
    : "Search talent by skill, role, or location…";

  const interested = resolveInterestedIn({ isTalent, viewerId, interests, allTalent, allStartups });

  return (
    <main className="mx-auto w-full max-w-xl px-6 pb-32 pt-24">
      {/* Hairline */}
      <div className="mb-24 flex items-center gap-4">
        <div className="h-px flex-1 bg-warmgray-200" />
        <span className="eyebrow text-orange-500">{eyebrow}</span>
        <div className="h-px flex-1 bg-warmgray-200" />
      </div>

      <h1 className="whitespace-pre-line text-center text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-warmgray-600">
        {sub}
      </p>

      {/* Underline-only search */}
      <form action="/search" method="GET" role="search" className="mx-auto mt-16 flex max-w-md items-center gap-3 border-b border-warmgray-300 pb-2 transition focus-within:border-orange-500">
        <label htmlFor="dashboard-search" className="sr-only">Search</label>
        <input
          id="dashboard-search"
          name="q"
          type="search"
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent py-2 text-center text-sm text-ink outline-none placeholder:text-warmgray-400"
        />
        <button type="submit" className="text-sm font-medium text-orange-500 transition hover:text-orange-700" aria-label="Search">
          →
        </button>
      </form>

      {/* Long pause */}
      {interested.length > 0 && (
        <section className="mt-32">
          <div className="mb-10 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-orange-500" />
            <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-warmgray-500">
              Interested in you
            </h2>
            <span className="h-px w-8 bg-orange-500" />
          </div>
          <ul className="divide-y divide-warmgray-100">
            {interested.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="group flex items-center gap-4 py-5 transition">
                  <Avatar name={c.name} src={c.photo} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base text-ink transition group-hover:text-orange-700">{c.name}</div>
                    <div className="truncate text-xs text-warmgray-500">{c.headline}</div>
                  </div>
                  <span aria-hidden className="text-warmgray-300 transition group-hover:translate-x-1 group-hover:text-orange-500">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Matches as a quiet list */}
      <section className="mt-32">
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-warmgray-500">
            {isTalent ? "Startups for you" : "Candidates for you"}
          </h2>
          <span className="h-px w-8 bg-orange-500" />
        </div>

        {matches.length === 0 ? (
          <EmptyState isTalent={isTalent} hasProfile={isTalent || !!startup} />
        ) : (
          <ol className="space-y-12">
            {matches.map((m, idx) => {
              const cand = resolveCandidate(m, allTalent, allStartups);
              if (!cand) return null;
              return <ZenRow key={m.id} idx={idx} match={m} cand={cand} utahOrgs={utahOrgs} />;
            })}
          </ol>
        )}
      </section>
    </main>
  );
}

function ZenRow({
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
  const pct = Math.round(match.score * 100);
  const sharedOrgs = match.sharedOrgIds
    .map((id) => utahOrgs.find((o) => o.id === id))
    .filter((o): o is UtahOrg => Boolean(o));

  return (
    <li className="text-center">
      <div className="mb-4 font-mono text-[11px] tracking-[0.3em] text-warmgray-400">
        {String(idx + 1).padStart(2, "0")} · {pct}%
      </div>
      <div className="flex justify-center">
        <Avatar name={name} src={photo} size="lg" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold leading-tight text-ink">
        <Link href={detailHref} className="hover:text-orange-700">{name}</Link>
      </h3>
      <p className="mt-2 text-sm text-warmgray-500">{headline}</p>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-warmgray-600">
        {match.reason}
      </p>
      <div className="mt-4 text-xs text-warmgray-400">
        {location}
        {sharedOrgs.length > 0 && <> · {sharedOrgs.length} shared {sharedOrgs.length === 1 ? "org" : "orgs"}</>}
      </div>
      <Link
        href={detailHref}
        className="mt-6 inline-block border-b border-orange-500 pb-0.5 text-xs font-medium tracking-wider text-orange-500 transition hover:text-orange-700"
      >
        OPEN
      </Link>
    </li>
  );
}

function EmptyState({ isTalent, hasProfile }: { isTalent: boolean; hasProfile: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold text-ink">
        {!hasProfile ? "Tell us about yourself first." : isTalent ? "No startup matches yet." : "No candidate matches yet."}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-warmgray-500">
        {!hasProfile ? "Two minutes of input is all we need to start ranking." : "Sharpen your profile so we can rank what fits you."}
      </p>
      <Link
        href={!hasProfile ? "/onboard" : "/profile"}
        className="mt-8 inline-block border-b border-orange-500 pb-0.5 text-xs font-medium tracking-wider text-orange-500 transition hover:text-orange-700"
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
