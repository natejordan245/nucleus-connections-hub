import {
  AffinityConnectionPanel,
  AffinityPushCard,
} from "@/components/AffinityPushCard";
import { LUMEN, SARAH, SARAH_LUMEN_PUSH } from "@/lib/demo/show-fixtures";

/**
 * Slide 4 — the integration.
 *
 * Real `/affinity-push` row against a hardcoded fixture. Same connection
 * panel, same payload card, same API timeline — every visual matches what
 * judges will see in the live app, but driven by static data.
 */
export default function IntegrationSlidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">Integration</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        Mutual matches land in Affinity.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warmgray-600">
        Organization + person + list-entry + note. The note body is the same
        reason paragraph the user saw — Nucleus operators see exactly{" "}
        <em className="not-italic text-orange-700">why</em> we matched these two.
      </p>

      <AffinityConnectionPanel
        synced={1}
        queued={0}
        failed={0}
        lists="lists #18271 / #18272"
      />

      <ul className="mt-4 space-y-3">
        <AffinityPushCard
          push={SARAH_LUMEN_PUSH}
          candidateName={SARAH.name}
          businessName={LUMEN.name}
          candidateId={SARAH.id}
          businessId={LUMEN.id}
        />
      </ul>

      <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-warmgray-200 bg-white px-3 py-2 font-mono text-[11px] text-warmgray-600">
        transport: <span className="text-orange-700">mock</span> · flip{" "}
        <span className="text-ink">AFFINITY_LIVE=true</span> for{" "}
        <span className="text-ink">api.affinity.co</span>
      </div>
    </main>
  );
}
