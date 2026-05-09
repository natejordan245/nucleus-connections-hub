import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import {
  AVAILABILITY_LABELS,
  NETWORK_LABELS,
  NETWORKS,
  SECTOR_LABELS,
} from "@/lib/data/enum-labels";
import type {
  MatchDTO,
  Network,
  StartupDTO,
  TalentDTO,
} from "@/lib/data/types";

type Row = {
  talent: TalentDTO;
  matches: MatchDTO[];
  topCandidates: (StartupDTO | TalentDTO | null)[];
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { network?: string };
}) {
  const networkFilter =
    searchParams?.network && (NETWORKS as string[]).includes(searchParams.network)
      ? (searchParams.network as Network)
      : null;

  const store = getDataStore();
  const [allTalent, allStartups, pushes] = await Promise.all([
    store.listTalent(),
    store.listStartups(),
    store.listAffinityPushes(),
  ]);

  // Run the matchmaking engine for every talent in the queue, in parallel.
  // In live mode, embeddings are cached per-process so this is fast on the
  // second visit. In demo mode, baseline matches are looked up from seed.
  const queue = networkFilter
    ? allTalent.filter((t) => (t.networks ?? ["operator"]).includes(networkFilter))
    : allTalent;

  const rows: Row[] = await Promise.all(
    queue.map(async (talent) => {
      const matches = await store.matchesFor(talent.id);
      const top = matches.slice(0, 3);
      const topCandidates = await Promise.all(
        top.map((m) =>
          m.candidateKind === "startup"
            ? store.getStartup(m.candidateId)
            : store.getTalent(m.candidateId),
        ),
      );
      return { talent, matches: top, topCandidates };
    }),
  );

  const counts = {
    talent: allTalent.length,
    startups: allStartups.length,
    mutual: pushes.length,
    queueWithMatches: rows.filter((r) => r.matches.length > 0).length,
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-10">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
        <span className="eyebrow text-orange-500">Admin · Operator console</span>
      </div>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        Match the queue.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Every signed-up talent gets auto-ranked against the company pool. Use
        the queue to triage who's ready for an introduction.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Talent" value={counts.talent} />
        <Stat label="Startups" value={counts.startups} />
        <Stat label="With matches" value={counts.queueWithMatches} />
        <Stat label="Mutual intros" value={counts.mutual} />
      </dl>

      <NetworkFilter active={networkFilter} />

      {rows.length === 0 ? (
        <EmptyState networkFilter={networkFilter} />
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <QueueRow key={row.talent.id} row={row} />
          ))}
        </ul>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-warmgray-100 bg-white p-4">
      <dt className="eyebrow text-warmgray-400">{label}</dt>
      <dd className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function NetworkFilter({ active }: { active: Network | null }) {
  return (
    <nav className="mt-8 flex flex-wrap items-center gap-2">
      <span className="eyebrow text-warmgray-500">Filter by network</span>
      <FilterChip href="/admin" label="All" isActive={!active} />
      {NETWORKS.map((n) => (
        <FilterChip
          key={n}
          href={`/admin?network=${n}`}
          label={NETWORK_LABELS[n]}
          isActive={active === n}
        />
      ))}
    </nav>
  );
}

function FilterChip({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium transition " +
        (isActive
          ? "border-orange-300 bg-orange-50 text-orange-700"
          : "border-warmgray-200 bg-white text-warmgray-600 hover:border-warmgray-300 hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}

function EmptyState({ networkFilter }: { networkFilter: Network | null }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
      <p className="font-serif text-xl font-semibold text-ink">
        {networkFilter
          ? `No talent in the ${NETWORK_LABELS[networkFilter]} yet.`
          : "Queue is empty."}
      </p>
      <p className="mt-2 text-sm text-warmgray-600">
        New profiles land here as people sign up.
      </p>
    </div>
  );
}

function QueueRow({ row }: { row: Row }) {
  const { talent, matches, topCandidates } = row;
  return (
    <li className="rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-4">
        <Avatar name={talent.name} src={talent.photoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-ink">
              <Link
                href={`/profile/talent/${talent.id}`}
                className="hover:text-orange-700"
              >
                {talent.name}
              </Link>
            </h3>
            <Pill tone="orange">{AVAILABILITY_LABELS[talent.availability]}</Pill>
            {(talent.networks ?? ["operator"]).map((n) => (
              <Pill key={n} tone="warmgray">
                {NETWORK_LABELS[n]}
              </Pill>
            ))}
          </div>
          <p className="mt-1 truncate text-sm text-warmgray-600">{talent.headline}</p>
          {talent.lookingFor && (
            <p className="mt-1 line-clamp-1 text-xs text-warmgray-500">
              <span className="font-semibold text-warmgray-600">Wants:</span>{" "}
              {talent.lookingFor}
            </p>
          )}
        </div>
      </header>

      <div className="mt-4 border-t border-warmgray-100 pt-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-orange-500" strokeWidth={1.75} aria-hidden />
          <span className="eyebrow text-orange-500">Auto-matched</span>
        </div>
        {matches.length === 0 ? (
          <p className="mt-2 text-sm text-warmgray-500">
            No candidates surfaced yet — embedding may be empty or the pool is too small.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {matches.map((m, idx) => {
              const cand = topCandidates[idx];
              if (!cand) return null;
              const isStartup = m.candidateKind === "startup";
              const startup = isStartup ? (cand as StartupDTO) : null;
              const talent2 = !isStartup ? (cand as TalentDTO) : null;
              const photo = isStartup ? startup!.logoUrl : talent2!.photoUrl;
              const headline = isStartup ? startup!.oneLiner : talent2!.headline;
              const sector = isStartup ? SECTOR_LABELS[startup!.sector] : null;
              const href = `/profile/${m.candidateKind}/${cand.id}`;
              return (
                <li key={m.id}>
                  <Link
                    href={href}
                    className="flex h-full items-start gap-3 rounded-xl border border-warmgray-100 bg-paper p-3 transition hover:border-orange-300"
                  >
                    <Avatar name={cand.name} src={photo} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {cand.name}
                        </span>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                          {Math.round(m.score * 100)}%
                        </span>
                      </div>
                      <span className="block truncate text-xs text-warmgray-600">
                        {headline}
                      </span>
                      {sector && (
                        <span className="mt-1 inline-block">
                          <Pill tone="warmgray">{sector}</Pill>
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}
