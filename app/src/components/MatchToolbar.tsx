"use client";

import { ChevronDown, Filter, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SortKey = "score-desc" | "score-asc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  "score-desc": "Score",
  "score-asc": "Score (low → high)",
  name: "Name (A → Z)",
};

const MIN_SCORE_OPTIONS = [
  { value: "", label: "All scores" },
  { value: "75", label: "75% and up" },
  { value: "90", label: "90% and up" },
] as const;

export function MatchToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sort") as SortKey | null) ?? "score-desc";
  const minScore = searchParams.get("minScore") ?? "";
  const location = searchParams.get("location") ?? "";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState(location);

  const filtersRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLocationDraft(location), [location]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (minScore) n += 1;
    if (location) n += 1;
    return n;
  }, [minScore, location]);

  function applyLocation() {
    const trimmed = locationDraft.trim();
    if (trimmed === location) {
      setFiltersOpen(false);
      return;
    }
    updateParams({ location: trimmed || null });
  }

  function clearFilters() {
    setLocationDraft("");
    updateParams({ minScore: null, location: null });
  }

  return (
    <>
      <div ref={filtersRef} className="relative">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
            activeFilterCount > 0
              ? "border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400"
              : "border-warmgray-200 text-warmgray-700 hover:border-warmgray-300"
          }`}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 font-mono text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filtersOpen && (
          <div
            role="dialog"
            aria-label="Filters"
            className="absolute right-0 top-9 z-30 w-72 overflow-hidden rounded-lg border border-warmgray-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-warmgray-200 px-3 py-2">
              <span className="eyebrow text-warmgray-500">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-warmgray-500 hover:text-ink"
                >
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-3 px-3 py-3">
              <div>
                <p className="eyebrow mb-1.5 text-warmgray-500">Min score</p>
                <div className="flex flex-wrap gap-1">
                  {MIN_SCORE_OPTIONS.map((opt) => {
                    const selected = (minScore || "") === opt.value;
                    return (
                      <button
                        key={opt.value || "all"}
                        type="button"
                        onClick={() => updateParams({ minScore: opt.value || null })}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          selected
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-warmgray-200 text-warmgray-700 hover:border-warmgray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label
                  htmlFor="filter-location"
                  className="eyebrow mb-1.5 block text-warmgray-500"
                >
                  Location
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyLocation();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    id="filter-location"
                    type="text"
                    value={locationDraft}
                    onChange={(e) => setLocationDraft(e.target.value)}
                    placeholder="e.g. Provo"
                    className="flex-1 rounded-md border border-warmgray-200 px-2 py-1 text-xs text-ink outline-none placeholder:text-warmgray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-ink px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-warmgray-800"
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={sortRef} className="relative">
        <button
          type="button"
          onClick={() => setSortOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={sortOpen}
          className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
        >
          Sort: {SORT_LABELS[sort] ?? SORT_LABELS["score-desc"]}{" "}
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>

        {sortOpen && (
          <div
            role="listbox"
            aria-label="Sort"
            className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-lg border border-warmgray-200 bg-white shadow-lg"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => {
              const selected = sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    updateParams({ sort: key === "score-desc" ? null : key });
                    setSortOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition ${
                    selected
                      ? "bg-orange-50 font-semibold text-orange-700"
                      : "text-warmgray-700 hover:bg-warmgray-50"
                  }`}
                >
                  {SORT_LABELS[key]}
                  {selected && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
