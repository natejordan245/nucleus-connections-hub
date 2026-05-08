"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { matchService, profileService, searchService } from "@/lib/services/factory";
import type {
  MatchResponse,
  RankedMatch,
  TalentDTO,
  StartupDTO,
  Verdict,
} from "@/contracts/data";
import { OpportunityCard } from "@/components/OpportunityCard";

type TabKey = "search" | "network" | "opportunities";
type SortKey = "score" | "verdict" | "utah";
type FilterKey = "all" | Verdict;

const TABS: Array<{ key: TabKey; label: string; sub: string }> = [
  { key: "search", label: "Search", sub: "Free-text query across people & companies" },
  { key: "network", label: "Network", sub: "People in Utah you should meet" },
  { key: "opportunities", label: "Opportunities", sub: "Companies looking for someone like you" },
];

const SEARCH_SUGGESTIONS = [
  "Life-sciences CEO with FDA experience",
  "BYU spinout in computer vision",
  "fractional GTM advisor for an AI startup",
  "ITAR regulatory advisor in defense / aerospace",
];

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const asId = params.get("as") ?? "tal-sarah-chen";
  const tab = (params.get("tab") as TabKey) ?? "search";
  const isTalentViewer = asId.startsWith("tal-");

  const [viewer, setViewer] = useState<TalentDTO | StartupDTO | null>(null);
  const [viewerErr, setViewerErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setViewer(null);
    setViewerErr(null);
    (async () => {
      try {
        const v = isTalentViewer
          ? await profileService.getTalent(asId)
          : await profileService.getStartup(asId);
        if (!cancelled) setViewer(v);
      } catch (e) {
        if (!cancelled) setViewerErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asId, isTalentViewer]);

  function setTab(next: TabKey) {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", next);
    router.replace(`/matches?${sp.toString()}`);
  }

  const viewerFirstName = viewer && "name" in viewer ? viewer.name.split(" ")[0] : "";
  const headerSubtitle =
    tab === "opportunities"
      ? "Companies whose immediate needs map to your skills, stage prefs, and Utah ecosystem signal."
      : tab === "network"
        ? "Other operators, advisors, and students in the Utah ecosystem worth meeting. No stage gates — pure complementarity + proximity."
        : "Type what you're looking for. Your query is embedded, the closest neighbors are pulled, and each result is reranked with a quoted reason.";

  return (
    <div className="grid gap-6 py-2">
      <header className="border-b border-warmgray-100 pb-6">
        <span className="eyebrow text-orange-600">Dashboard</span>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink">
          {viewerFirstName ? `Welcome back, ${viewerFirstName}` : "Welcome back"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-warmgray-600">{headerSubtitle}</p>
      </header>

      <nav className="flex flex-wrap items-center gap-1 border-b border-warmgray-100">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative -mb-px flex flex-col gap-0.5 px-4 py-3 text-left transition ${
                active
                  ? "border-b-2 border-orange-500 text-ink"
                  : "border-b-2 border-transparent text-warmgray-600 hover:text-ink"
              }`}
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span className="text-[11px] text-warmgray-500">{t.sub}</span>
            </button>
          );
        })}
      </nav>

      {viewerErr && (
        <div className="rounded-xl border border-warmgray-100 bg-white p-6 text-sm text-warmgray-600">
          We couldn't load <code className="font-mono">{asId}</code>. Pick a known identity from
          the slide menu, or finish onboarding first.
          <p className="mt-2 text-xs text-warmgray-400">{viewerErr}</p>
        </div>
      )}

      {tab === "opportunities" && isTalentViewer && (
        <RankedList key="op" mode={{ kind: "match", asId, target: "startup" }} />
      )}
      {tab === "opportunities" && !isTalentViewer && (
        <RankedList key="op-rev" mode={{ kind: "match", asId, target: "talent" }} />
      )}
      {tab === "network" && (
        <RankedList
          key="net"
          mode={{
            kind: "match",
            asId,
            target: isTalentViewer ? "talent" : "startup",
          }}
        />
      )}
      {tab === "search" && <SearchTab asId={asId} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RankedList — shared list surface for Opportunities and Network tabs.
// ─────────────────────────────────────────────────────────────────────────────

type ListMode = { kind: "match"; asId: string; target: "talent" | "startup" };

function RankedList({ mode }: { mode: ListMode }) {
  const [data, setData] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("score");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    (async () => {
      try {
        const isTalent = mode.asId.startsWith("tal-");
        const res = await matchService.getMatches({
          for: mode.asId,
          type: isTalent ? "talent" : "startup",
          target: mode.target,
        });
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode.asId, mode.target]);

  const matches = useMemo(() => sortAndFilter(data?.matches ?? [], filter, sort), [data, filter, sort]);
  const counts = useVerdictCounts(data?.matches ?? []);

  if (error) {
    return (
      <div className="rounded-xl border border-warmgray-100 bg-white p-6 text-sm text-warmgray-600">
        {error}
      </div>
    );
  }
  if (!data) return <SkeletonList />;

  const candidateBase = mode.target === "startup" ? "/profile/startup" : "/profile/talent";

  return (
    <div className="grid gap-4">
      <Toolbar
        total={data.matches.length}
        filtered={matches.length}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        counts={counts}
        timings={data.pipelineMs}
      />
      <div className="grid gap-4">
        {matches.map((m) => (
          <OpportunityCard
            key={m.candidateId}
            match={m}
            viewerId={mode.asId}
            hrefBase={candidateBase}
          />
        ))}
      </div>
      {matches.length === 0 && <EmptyState message="No matches in this filter." />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchTab — semantic search over people or companies.
// ─────────────────────────────────────────────────────────────────────────────

function SearchTab({ asId }: { asId: string }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [kind, setKind] = useState<"startup" | "talent">("startup");
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and sort only become available after a search has run.
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("score");

  async function runSearch(q: string, k: "talent" | "startup") {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSubmitted(q);
    // A new search resets any prior filter selection.
    setFilter("all");
    setSort("score");
    try {
      const res = await searchService.search({ query: q, kind: k });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const candidateBase = kind === "startup" ? "/profile/startup" : "/profile/talent";
  const filteredMatches = useMemo(
    () => sortAndFilter(data?.matches ?? [], filter, sort),
    [data, filter, sort]
  );
  const counts = useVerdictCounts(data?.matches ?? []);

  return (
    <div className="grid gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query, kind);
        }}
        className="rounded-xl border border-warmgray-100 bg-white p-5 shadow-[0_1px_0_rgba(16,16,16,0.04)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="eyebrow mb-1 block text-warmgray-500">Search query</label>
            <div className="flex items-center gap-2 rounded-lg border border-warmgray-200 bg-paper px-3 py-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-sand-100">
              <SearchGlyph />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder='e.g. "fractional GTM advisor for a Series A AI startup"'
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-warmgray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs text-warmgray-500 hover:text-ink"
                  aria-label="Clear query"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <KindToggle kind={kind} onChange={setKind} />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(255,114,39,0.55)] transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Searching…" : "Search →"}
            </button>
          </div>
        </div>

        {!submitted && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-warmgray-500">
            <span className="eyebrow text-warmgray-400">Try</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  runSearch(s, kind);
                }}
                className="rounded-full border border-warmgray-200 px-2.5 py-1 text-warmgray-600 transition hover:border-orange-300 hover:bg-sand-50 hover:text-orange-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && (
        <div className="rounded-xl border border-warmgray-100 bg-white p-6 text-sm text-warmgray-600">
          {error}
        </div>
      )}

      {loading && <SkeletonList />}

      {!loading && data && (
        <>
          <p className="text-sm text-warmgray-600">
            <strong className="text-ink">{data.matches.length}</strong>{" "}
            {kind === "startup" ? "companies" : "people"} match{" "}
            <em className="font-mono not-italic text-orange-700">"{submitted}"</em>
          </p>

          {data.matches.length === 0 ? (
            <EmptyState message="No matches. Try a different phrasing or switch the People / Companies toggle." />
          ) : (
            <>
              <Toolbar
                total={data.matches.length}
                filtered={filteredMatches.length}
                filter={filter}
                setFilter={setFilter}
                sort={sort}
                setSort={setSort}
                counts={counts}
                timings={data.pipelineMs}
              />
              <div className="grid gap-4">
                {filteredMatches.map((m) => (
                  <OpportunityCard
                    key={m.candidateId}
                    match={m}
                    viewerId={asId}
                    hrefBase={candidateBase}
                  />
                ))}
              </div>
              {filteredMatches.length === 0 && (
                <EmptyState message="No matches in this filter. Loosen the filter to see more." />
              )}
            </>
          )}
        </>
      )}

      {!loading && !data && submitted === "" && (
        <div className="rounded-xl border border-dashed border-warmgray-200 bg-white p-10 text-center text-sm text-warmgray-500">
          Search the Utah ecosystem in plain English. Pick a suggestion above to get started.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared toolbar / pieces
// ─────────────────────────────────────────────────────────────────────────────

function Toolbar({
  total,
  filtered,
  filter,
  setFilter,
  sort,
  setSort,
  counts,
  timings,
}: {
  total: number;
  filtered: number;
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  counts: Record<Verdict, number>;
  timings: { gates: number; vector: number; rerank: number; cacheHit?: boolean };
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-warmgray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>
          All <Mono>{total}</Mono>
        </Pill>
        <Pill active={filter === "strong"} onClick={() => setFilter("strong")} tone="strong">
          Strong <Mono>{counts.strong}</Mono>
        </Pill>
        <Pill active={filter === "good"} onClick={() => setFilter("good")} tone="good">
          Good <Mono>{counts.good}</Mono>
        </Pill>
        <Pill active={filter === "partial"} onClick={() => setFilter("partial")} tone="partial">
          Partial <Mono>{counts.partial}</Mono>
        </Pill>
        <span className="ml-2 text-warmgray-500">
          Showing <strong className="text-ink">{filtered}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="eyebrow text-warmgray-400">Sort</span>
        <SortChip active={sort === "score"} onClick={() => setSort("score")}>Score</SortChip>
        <SortChip active={sort === "verdict"} onClick={() => setSort("verdict")}>Verdict</SortChip>
        <SortChip active={sort === "utah"} onClick={() => setSort("utah")}>Utah</SortChip>
        <span className="ml-3 font-mono text-warmgray-500">
          {timings.gates}ms · {timings.vector}ms · {timings.rerank}ms
        </span>
        {timings.cacheHit !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-track ${
              timings.cacheHit
                ? "bg-emerald-50 text-emerald-700"
                : "bg-warmgray-50 text-warmgray-600"
            }`}
            title={
              timings.cacheHit
                ? "Served from match cache (no recomputation)"
                : "Computed fresh — cache will pick up next call"
            }
          >
            {timings.cacheHit ? "cached" : "fresh"}
          </span>
        )}
      </div>
    </div>
  );
}

function KindToggle({
  kind,
  onChange,
}: {
  kind: "startup" | "talent";
  onChange: (k: "startup" | "talent") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-warmgray-200 bg-paper p-0.5">
      <button
        type="button"
        onClick={() => onChange("startup")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          kind === "startup" ? "bg-ink text-white" : "text-warmgray-600 hover:text-ink"
        }`}
      >
        Companies
      </button>
      <button
        type="button"
        onClick={() => onChange("talent")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          kind === "talent" ? "bg-ink text-white" : "text-warmgray-600 hover:text-ink"
        }`}
      >
        People
      </button>
    </div>
  );
}

function Pill({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "strong" | "good" | "partial";
  children: React.ReactNode;
}) {
  const base = "rounded-full border px-2.5 py-1 transition";
  if (active) {
    if (tone === "strong") {
      return (
        <button onClick={onClick} className={`${base} border-emerald-300 bg-emerald-50 text-emerald-700`}>{children}</button>
      );
    }
    if (tone === "good") {
      return (
        <button onClick={onClick} className={`${base} border-orange-300 bg-sand-50 text-orange-700`}>{children}</button>
      );
    }
    if (tone === "partial") {
      return (
        <button onClick={onClick} className={`${base} border-warmgray-300 bg-warmgray-50 text-warmgray-700`}>{children}</button>
      );
    }
    return <button onClick={onClick} className={`${base} border-ink bg-ink text-white`}>{children}</button>;
  }
  return (
    <button
      onClick={onClick}
      className={`${base} border-warmgray-200 bg-white text-warmgray-600 hover:border-orange-200 hover:bg-sand-50 hover:text-orange-700`}
    >
      {children}
    </button>
  );
}

function SortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2 py-1 transition ${
        active ? "bg-ink text-white" : "text-warmgray-600 hover:bg-warmgray-50 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="ml-0.5 font-mono tabular-nums opacity-70">{children}</span>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-warmgray-200 bg-white p-10 text-center text-sm text-warmgray-500">
      {message}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-44 animate-pulse rounded-xl border border-warmgray-100 bg-white" />
      ))}
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4 shrink-0 text-warmgray-500">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function sortAndFilter(matches: RankedMatch[], filter: FilterKey, sort: SortKey): RankedMatch[] {
  let out = matches.slice();
  if (filter !== "all") out = out.filter((m) => m.verdict === filter);
  if (sort === "verdict") {
    const rank: Record<Verdict, number> = { strong: 0, good: 1, partial: 2 };
    out.sort((a, b) => rank[a.verdict] - rank[b.verdict] || b.score - a.score);
  } else if (sort === "utah") {
    out.sort((a, b) => b.proximityBoost - a.proximityBoost || b.score - a.score);
  } else {
    out.sort((a, b) => b.score - a.score);
  }
  return out;
}

function useVerdictCounts(matches: RankedMatch[]): Record<Verdict, number> {
  return useMemo(() => {
    const c: Record<Verdict, number> = { strong: 0, good: 0, partial: 0 };
    for (const m of matches) c[m.verdict]++;
    return c;
  }, [matches]);
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-warmgray-500">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
