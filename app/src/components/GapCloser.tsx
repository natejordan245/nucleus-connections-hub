import { ArrowUpRight, Sparkles } from "lucide-react";
import { Pill } from "./Pill";
import { getDataStore } from "@/lib/data";

/**
 * Shown alongside the explainability panel on a candidate profile when the
 * viewer isn't a 100% match. Asks the live data store for nearest-neighbor
 * resources whose embeddable summaries match the cached gap signal between
 * this pair (weak/miss factors + concerns from the LLM verdict).
 *
 * Server component — fetches inside. Pass viewer + candidate ids and a
 * preferred limit; the data layer returns `{ gapText, resources }`.
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
  if (resources.length === 0) return null;

  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" strokeWidth={1.75} aria-hidden />
        <span className="eyebrow text-orange-500">Close the gap</span>
      </div>

      {gapText && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-warmgray-700">
          {gapText}
        </p>
      )}

      <div className="mt-5">
        <span className="eyebrow text-warmgray-500">Recommended resources</span>
        <ul className="mt-2 space-y-2">
          {resources.map((r) => (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-warmgray-100 bg-paper p-3 transition hover:border-orange-300 hover:bg-orange-50/40"
              >
                <Pill tone="warmgray">{r.kind}</Pill>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-warmgray-600">
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
    </section>
  );
}
