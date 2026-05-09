import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import { SECTOR_LABELS } from "@/lib/data/enum-labels";
import type {
  BusinessDTO,
  CandidateDTO,
  InvestorDTO,
  MentorDTO,
  ResourceDTO,
} from "@/lib/data/types";
import { getViewerKind, requireViewer } from "@/lib/viewer";

type Tab = "people" | "companies" | "mentors" | "investors" | "resources";

const TABS: { value: Tab; label: string }[] = [
  { value: "people",    label: "People"     },
  { value: "companies", label: "Companies"  },
  { value: "mentors",   label: "Mentors"    },
  { value: "investors", label: "VCs"        },
  { value: "resources", label: "Resources"  },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; kind?: string };
}) {
  const q = searchParams?.q ?? "";
  // Map URL kind values: `business` is also accepted as a synonym for `companies`.
  const requestedTab: Tab =
    searchParams?.kind === "companies" || searchParams?.kind === "business"
      ? "companies"
      : searchParams?.kind === "mentors" || searchParams?.kind === "mentor"
        ? "mentors"
        : searchParams?.kind === "investors" || searchParams?.kind === "investor"
          ? "investors"
          : searchParams?.kind === "resources"
            ? "resources"
            : "people";

  const { viewerId } = await requireViewer();
  const viewerKind = await getViewerKind(viewerId);

  // Tabs allowed for this viewer kind. Candidates only browse companies;
  // businesses don't see other businesses.
  const allowedTabs: Tab[] =
    viewerKind === "candidate"
      ? ["companies"]
      : viewerKind === "business"
        ? ["people", "mentors", "investors", "resources"]
        : ["people", "companies", "mentors", "investors", "resources"];

  const store = getDataStore();
  const [results, viewerMatches] = await Promise.all([
    store.search(q),
    store.matchesFor(viewerId),
  ]);

  // Backfill cosine-only scores for everyone in the result set, then let the
  // viewer's curated `matchesFor` queue override (it's the LLM-validated score
  // shown elsewhere in the app).
  const allResultIds = [
    ...results.candidates.map((c) => c.id),
    ...results.businesses.map((b) => b.id),
    ...results.mentors.map((m) => m.id),
    ...results.investors.map((i) => i.id),
  ];
  const bulkScores = await store.bulkScoresFor({
    subjectId: viewerId,
    candidateIds: allResultIds,
  });
  const scoreById = new Map<string, number>(bulkScores);
  for (const m of viewerMatches) scoreById.set(m.candidateId, m.score);

  const counts: Record<Tab, number> = {
    people: results.candidates.length,
    companies: results.businesses.length,
    mentors: results.mentors.length,
    investors: results.investors.length,
    resources: results.resources.length,
  };

  // When there's a query, only show tabs with results. Without a query,
  // keep all allowed tabs visible so the user can browse.
  const visibleTabs: Tab[] = q
    ? allowedTabs.filter((t) => counts[t] > 0)
    : allowedTabs;

  // Pick the active tab: prefer the requested one if it's visible;
  // otherwise jump to the visible tab with the most results.
  const tab: Tab =
    visibleTabs.includes(requestedTab) && (q ? counts[requestedTab] > 0 : true)
      ? requestedTab
      : (visibleTabs.slice().sort((a, b) => counts[b] - counts[a])[0] ??
        allowedTabs[0]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">Search</span>
          <h1 className="mt-2 text-2xl font-bold text-ink">
            Find people, companies, and resources.
          </h1>
          <p className="mt-1 text-sm text-warmgray-500">
            Operators, businesses, mentors, VCs, and the playbooks Nucleus has
            gathered.
          </p>
        </div>
      </div>

      <form
        action="/search"
        method="GET"
        className="mt-4 flex items-center gap-2 rounded-lg border border-warmgray-200 bg-white p-2"
      >
        <SearchIcon
          className="ml-2 h-4 w-4 shrink-0 text-warmgray-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Try bioengineering, GTM, seed, or Lehi…"
          className="flex-1 bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-warmgray-400"
        />
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
        >
          Search
        </button>
      </form>

      {visibleTabs.length > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-1 border-b border-warmgray-200">
          {TABS.filter((t) => visibleTabs.includes(t.value)).map((t) => {
            const active = t.value === tab;
            const href = `/search?kind=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link
                key={t.value}
                href={href}
                className={
                  "relative inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition " +
                  (active
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-500"
                    : "text-warmgray-500 hover:text-ink")
                }
              >
                {t.label}
                <span
                  className={
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] " +
                    (active
                      ? "bg-orange-50 text-orange-700"
                      : "bg-warmgray-50 text-warmgray-500")
                  }
                >
                  {counts[t.value]}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      <section className="mt-6">
        {tab === "people" && (
          <PeopleResults items={results.candidates} q={q} scoreById={scoreById} />
        )}
        {tab === "companies" && (
          <CompanyResults items={results.businesses} q={q} scoreById={scoreById} />
        )}
        {tab === "mentors" && (
          <MentorResults items={results.mentors} q={q} scoreById={scoreById} />
        )}
        {tab === "investors" && (
          <InvestorResults items={results.investors} q={q} scoreById={scoreById} />
        )}
        {tab === "resources" && <ResourceResults items={results.resources} q={q} />}
      </section>
    </main>
  );
}

function EmptyState({ kind, q }: { kind: string; q: string }) {
  return (
    <div className="rounded-lg border border-dashed border-warmgray-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">
        {q ? `No ${kind} match "${q}".` : `No ${kind} yet.`}
      </p>
      <p className="mt-1 text-xs text-warmgray-500">
        {q ? "Try a different term, or switch tabs." : "Check back soon."}
      </p>
    </div>
  );
}

function MatchPill({ score }: { score: number | undefined }) {
  if (score === undefined) return null;
  const pct = score * 100;
  const tone = pct >= 85 ? "orange" : pct >= 75 ? "emerald" : "warmgray";
  return (
    <Pill tone={tone}>
      <span className="font-mono">{pct.toFixed(1)}% match</span>
    </Pill>
  );
}

function PeopleResults({
  items,
  q,
  scoreById,
}: {
  items: CandidateDTO[];
  q: string;
  scoreById: Map<string, number>;
}) {
  if (items.length === 0) return <EmptyState kind="people" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/profile/candidate/${c.id}`}
            className="flex h-full gap-3 rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-warmgray-300"
          >
            <Avatar name={c.name} src={c.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {c.name}
                </h3>
                <MatchPill score={scoreById.get(c.id)} />
              </div>
              <p className="truncate text-[11px] text-warmgray-500">{c.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{c.location}</Pill>
                {c.domains.slice(0, 2).map((d) => (
                  <Pill key={d} tone="orange">
                    {SECTOR_LABELS[d]}
                  </Pill>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CompanyResults({
  items,
  q,
  scoreById,
}: {
  items: BusinessDTO[];
  q: string;
  scoreById: Map<string, number>;
}) {
  if (items.length === 0) return <EmptyState kind="companies" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/profile/business/${s.id}`}
            className="flex h-full gap-3 rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-warmgray-300"
          >
            <Avatar name={s.name} src={s.logoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {s.name}
                </h3>
                <MatchPill score={scoreById.get(s.id)} />
              </div>
              <p className="truncate text-[11px] text-warmgray-500">{s.oneLiner}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{s.location}</Pill>
                <Pill tone="orange">{SECTOR_LABELS[s.sector]}</Pill>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MentorResults({
  items,
  q,
  scoreById,
}: {
  items: MentorDTO[];
  q: string;
  scoreById: Map<string, number>;
}) {
  if (items.length === 0) return <EmptyState kind="mentors" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((m) => (
        <li key={m.id}>
          <Link
            href={`/profile/mentor/${m.id}`}
            className="flex h-full gap-3 rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-warmgray-300"
          >
            <Avatar name={m.name} src={m.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {m.name}
                </h3>
                <MatchPill score={scoreById.get(m.id)} />
              </div>
              <p className="truncate text-[11px] text-warmgray-500">{m.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{m.location}</Pill>
                <Pill tone="orange">{m.hoursPerMonth} hrs/mo</Pill>
                {m.boardSeatOpen && <Pill tone="emerald">Board OK</Pill>}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InvestorResults({
  items,
  q,
  scoreById,
}: {
  items: InvestorDTO[];
  q: string;
  scoreById: Map<string, number>;
}) {
  if (items.length === 0) return <EmptyState kind="VCs" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((i) => (
        <li key={i.id}>
          <Link
            href={`/profile/investor/${i.id}`}
            className="flex h-full gap-3 rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-warmgray-300"
          >
            <Avatar name={i.fundName ?? i.name} src={i.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-ink">
                  {i.fundName ?? i.name}
                </h3>
                <MatchPill score={scoreById.get(i.id)} />
              </div>
              <p className="truncate text-[11px] text-warmgray-500">{i.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{i.location}</Pill>
                {i.sectorsInvested.slice(0, 2).map((s) => (
                  <Pill key={s} tone="orange">
                    {SECTOR_LABELS[s]}
                  </Pill>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ResourceResults({ items, q }: { items: ResourceDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="resources" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((r) => (
        <li key={r.id}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-warmgray-300"
          >
            <div className="flex items-center gap-2">
              <Pill tone="orange">{r.kind}</Pill>
              <span className="font-mono text-[11px] text-warmgray-500">{r.uploadedByName}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-ink">{r.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-warmgray-700">
              {r.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.map((tag) => (
                <Pill key={tag} tone="warmgray">
                  {tag}
                </Pill>
              ))}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
