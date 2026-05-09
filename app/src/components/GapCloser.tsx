import { ArrowUpRight, Sparkles } from "lucide-react";
import { Pill } from "./Pill";
import { getDataStore } from "@/lib/data";
import type { ResourceDTO } from "@/lib/data/types";

/**
 * Presentational gap-closer card. Pure props in, JSX out — no data-store
 * dependency. Use this directly when you already have the resource list
 * (slideshow fixtures, server actions that pre-resolved). For the live
 * dashboard / profile page, use the async {@link GapCloser} wrapper below.
 */
export function GapCloserView({
  gapText,
  resources,
}: {
  gapText?: string;
  resources: ResourceDTO[];
}) {
  if (resources.length === 0) return null;

  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="flex items-center gap-1.5 border-b border-warmgray-200 px-4 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-orange-500" strokeWidth={2} aria-hidden />
        <h2 className="text-sm font-semibold text-ink">Close the gap</h2>
      </div>

      <div className="p-4">
        {gapText && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-warmgray-700">
            {gapText}
          </p>
        )}

        <div className="mt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
            recommended resources
          </span>
          <ul className="mt-2 space-y-1.5">
            {resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 rounded-md border border-warmgray-200 bg-paper p-2.5 transition hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <Pill tone="warmgray">{r.kind}</Pill>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{r.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-warmgray-500">
                      {r.summary}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warmgray-400 transition group-hover:text-orange-600"
                    strokeWidth={2}
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Async wrapper that fetches the gap-resource recommendation for a viewer ↔
 * candidate pair and renders {@link GapCloserView}. Server component.
 */
export async function GapCloser({
  subjectId,
  candidateId,
  limit = 3,
}: {
  subjectId: string;
  candidateId: string;
  limit?: number;
}) {
  const store = getDataStore();
  const { gapText, resources } = await store.recommendGapResources({
    subjectId,
    candidateId,
    limit,
  });
  return <GapCloserView gapText={gapText} resources={resources} />;
}
