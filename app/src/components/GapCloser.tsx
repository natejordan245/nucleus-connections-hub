import { ArrowUpRight, Sparkles } from "lucide-react";
import { Pill } from "./Pill";
import { NEED_LABELS } from "@/lib/data/enum-labels";
import type {
  ResourceDTO,
  StartupDTO,
  TalentDTO,
} from "@/lib/data/types";
import {
  analyzeGap,
  recommendResourcesForGap,
} from "@/lib/match/gap";

/**
 * Shown alongside the explainability panel on a startup profile when the
 * viewing talent isn't a 100% match. Surfaces the gap (needs the talent
 * doesn't yet cover) and recommends resources that close it.
 *
 * The prose description is templated today. The plan is to swap it for an
 * LLM call (gpt-5.5-instant) that takes the talent + startup blobs and
 * writes a one-paragraph gap summary, with the resource recommender powered
 * by embeddings over `resource.summary`.
 */
export function GapCloser({
  talent,
  startup,
  resources,
}: {
  talent: TalentDTO;
  startup: StartupDTO;
  resources: ResourceDTO[];
}) {
  const { covered, gaps, description } = analyzeGap(talent, startup);
  if (gaps.length === 0) return null;

  const recommended = recommendResourcesForGap(gaps, resources, 3);

  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-500" strokeWidth={1.75} aria-hidden />
        <span className="eyebrow text-orange-500">Close the gap</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-warmgray-700">
        {description}
      </p>

      {(covered.length > 0 || gaps.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {covered.length > 0 && (
            <div className="rounded-xl border border-warmgray-100 bg-paper p-3">
              <span className="eyebrow text-emerald-700">Covered</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {covered.map((n) => (
                  <Pill key={n} tone="emerald">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </div>
          )}
          {gaps.length > 0 && (
            <div className="rounded-xl border border-warmgray-100 bg-paper p-3">
              <span className="eyebrow text-warmgray-500">Gap</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {gaps.map((n) => (
                  <Pill key={n} tone="orange">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {recommended.length > 0 && (
        <div className="mt-5">
          <span className="eyebrow text-warmgray-500">Recommended resources</span>
          <ul className="mt-2 space-y-2">
            {recommended.map((r) => (
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
      )}
    </section>
  );
}
