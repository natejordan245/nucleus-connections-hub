import {
  AffinityConnectionPanel,
  AffinityPushCard,
} from "@/components/AffinityPushCard";
import { LUMEN, SARAH, SARAH_LUMEN_PUSH } from "@/lib/demo/show-fixtures";
import { AffinityWire } from "./AffinityWire";

/**
 * Slide 4 — the integration.
 *
 * Hero is the live wire animation showing the four Affinity calls fire in
 * sequence — judges see the actual endpoints we hit and the round-trip
 * times. Below it, the real `<AffinityPushCard>` renders the persistent
 * record (org/person/list-entry IDs + custom field values) so the slide
 * proves the payload AND the persistence on one surface.
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

      <AffinityWire />

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
    </main>
  );
}
