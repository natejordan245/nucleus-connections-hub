import {
  AffinityConnectionPanel,
  AffinityPushCard,
} from "@/components/AffinityPushCard";
import { AFFINITY_CONFIG } from "@/lib/affinity";
import { getDataStore } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

export default async function AffinityPushPage() {
  await requireViewer();
  const store = getDataStore();

  const [pushes, allCandidates, allBusinesses] = await Promise.all([
    store.listAffinityPushes(),
    store.listCandidates(),
    store.listBusinesses(),
  ]);

  const synced = pushes.filter((p) => p.syncState === "synced").length;
  const failed = pushes.filter((p) => p.syncState === "failed").length;
  const queued = pushes.filter((p) => p.syncState === "queued" || p.syncState === "syncing")
    .length;
  const lists = `lists #${AFFINITY_CONFIG.organizationListId} / #${AFFINITY_CONFIG.personListId}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">Activity · Affinity CRM</span>
          <h1 className="mt-2 text-2xl font-bold text-ink">Mutual matches → CRM.</h1>
          <p className="mt-1 max-w-2xl text-sm text-warmgray-500">
            Every mutual match is upserted as an Organization + Person in Affinity,
            added to deal-flow lists, and tagged with Nucleus match metadata.
          </p>
        </div>
      </div>

      <AffinityConnectionPanel synced={synced} queued={queued} failed={failed} lists={lists} />

      {pushes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-warmgray-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-ink">No introductions yet.</p>
          <p className="mt-1 text-xs text-warmgray-500">
            They'll show up here as they happen.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {pushes.map((p) => {
            const c = allCandidates.find((c) => c.id === p.talentId);
            const b = allBusinesses.find((b) => b.id === p.startupId);
            return (
              <AffinityPushCard
                key={p.id}
                push={p}
                candidateName={c?.name ?? p.talentId}
                businessName={b?.name ?? p.startupId}
                candidateId={c?.id}
                businessId={b?.id}
              />
            );
          })}
        </ul>
      )}
    </main>
  );
}
