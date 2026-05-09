import { GapCloserView } from "@/components/GapCloser";
import { MatchCard } from "@/components/MatchCard";
import {
  LUMEN,
  SARAH_LUMEN_GAP_TEXT,
  SARAH_LUMEN_MATCH,
  SARAH_LUMEN_RESOURCES,
} from "@/lib/demo/show-fixtures";

/**
 * Slide 3 — the match.
 *
 * Real `<MatchCard>` rendered against a hardcoded fixture, with the
 * `<GapCloserView>` slotted in via the `gapCloser` prop so the partial
 * match shows its Utah resources without touching the data store.
 *
 * Score, reason, factor chips, concerns, and bridges live on a single
 * card — covers Match Quality + Innovation in one frame.
 */
export default function MatchSlidePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">Match Quality · Innovation</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        Intelligent matching. Better than LinkedIn.
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Every match carries the same trust surface. When the score is partial,
        the gap-closer routes to local Utah resources — mentors, cohorts, and
        playbooks already in the ecosystem — that close the distance.
      </p>

      <div className="mt-8">
        <MatchCard
          match={SARAH_LUMEN_MATCH}
          candidate={{ kind: "business", business: LUMEN }}
          hideExplainabilityLink
          gapCloser={
            <GapCloserView
              gapText={SARAH_LUMEN_GAP_TEXT}
              resources={SARAH_LUMEN_RESOURCES}
            />
          }
        />
      </div>
    </main>
  );
}
