import Link from "next/link";
import { ArrowUpRight, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Pill } from "@/components/Pill";
import { AFFINITY_CONFIG } from "@/lib/affinity";
import { getDataStore } from "@/lib/data";
import type { AffinityPushDTO, AffinitySyncState } from "@/lib/data/types";
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
  const queued = pushes.filter((p) => p.syncState === "queued" || p.syncState === "syncing").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <span className="eyebrow text-orange-500">Activity · Affinity CRM</span>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        Mutual matches → CRM.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Every mutual match is upserted as an Organization + Person in Affinity,
        added to the deal-flow lists, and tagged with Nucleus match metadata.
      </p>

      <ConnectionPanel synced={synced} queued={queued} failed={failed} />

      {pushes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
          <p className="font-serif text-xl font-semibold text-ink">No introductions yet.</p>
          <p className="mt-2 text-sm text-warmgray-600">
            They'll show up here as they happen.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {pushes.map((p) => {
            const c = allCandidates.find((c) => c.id === p.talentId);
            const b = allBusinesses.find((b) => b.id === p.startupId);
            return (
              <PushRow
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

function ConnectionPanel({ synced, queued, failed }: { synced: number; queued: number; failed: number }) {
  return (
    <div className="mt-8 rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="eyebrow text-emerald-700">Connected · sandbox</span>
          <span className="text-xs text-warmgray-500">
            Workspace · Lists{" "}
            <code className="rounded bg-warmgray-50 px-1.5 py-0.5 font-mono text-[11px] text-warmgray-700">
              #{AFFINITY_CONFIG.organizationListId}
            </code>{" "}
            /{" "}
            <code className="rounded bg-warmgray-50 px-1.5 py-0.5 font-mono text-[11px] text-warmgray-700">
              #{AFFINITY_CONFIG.personListId}
            </code>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Stat label="Synced" value={synced} tone="emerald" />
          <Stat label="Queued" value={queued} tone="warmgray" />
          <Stat label="Failed" value={failed} tone={failed > 0 ? "orange" : "warmgray"} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "emerald" | "warmgray" | "orange" }) {
  const color =
    tone === "emerald" ? "text-emerald-700" : tone === "orange" ? "text-orange-700" : "text-warmgray-700";
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`font-mono text-base font-semibold ${color}`}>{value}</span>
      <span className="eyebrow text-warmgray-400">{label}</span>
    </span>
  );
}

function PushRow({
  push,
  candidateName,
  businessName,
  candidateId,
  businessId,
}: {
  push: AffinityPushDTO;
  candidateName: string;
  businessName: string;
  candidateId: string | undefined;
  businessId: string | undefined;
}) {
  const when = new Date(push.pushedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li className="rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <ArrowUpRight className="mt-0.5 h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-lg font-semibold text-ink">
              {candidateName} ↔ {businessName}
            </h3>
            <SyncPill state={push.syncState} />
            {push.pipelineStage && (
              <Pill tone="warmgray">{prettyStage(push.pipelineStage)}</Pill>
            )}
          </div>
          <p className="mt-1 text-xs text-warmgray-500">{when}</p>
          <p className="mt-3 text-sm leading-relaxed text-warmgray-700">{push.reason}</p>

          {push.syncError && (
            <div className="mt-3 rounded-lg border border-orange-200 bg-sand-50 px-3 py-2 text-xs text-warmgray-700">
              <span className="font-semibold text-orange-700">Sync failed:</span> {push.syncError}
            </div>
          )}

          {(push.affinityListEntryId || push.fieldValues.length > 0) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <RecordCard push={push} />
              {push.fieldValues.length > 0 && <FieldValuesCard values={push.fieldValues} />}
            </div>
          )}

          {push.apiCalls.length > 0 && (
            <details className="mt-4 group">
              <summary className="cursor-pointer text-xs font-medium text-warmgray-600 hover:text-ink">
                <span className="eyebrow text-warmgray-400">API timeline</span>
                <span className="ml-2 font-mono text-xs">
                  {push.apiCalls.length} calls · {totalDuration(push.apiCalls)}ms
                </span>
              </summary>
              <ul className="mt-3 space-y-1 rounded-xl border border-warmgray-100 bg-warmgray-50 p-3 font-mono text-[11px]">
                {push.apiCalls.map((c, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold " +
                        (c.status >= 400
                          ? "bg-red-100 text-red-700"
                          : c.status >= 300
                          ? "bg-warmgray-200 text-warmgray-700"
                          : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      {c.status}
                    </span>
                    <span className="font-semibold text-warmgray-700">{c.method}</span>
                    <span className="flex-1 truncate text-warmgray-600">{c.path}</span>
                    <span className="text-warmgray-400">{c.durationMs}ms</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {candidateId && (
              <Link
                href={`/profile/candidate/${candidateId}`}
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                View {candidateName} →
              </Link>
            )}
            {businessId && (
              <Link
                href={`/profile/business/${businessId}`}
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                View {businessName} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function RecordCard({ push }: { push: AffinityPushDTO }) {
  return (
    <div className="rounded-xl border border-warmgray-100 bg-warmgray-50 p-3">
      <span className="eyebrow text-warmgray-400">Affinity record</span>
      <dl className="mt-2 space-y-1 text-xs text-warmgray-700">
        {push.affinityOrganizationId != null && (
          <Row label="Organization" value={`#${push.affinityOrganizationId}`} />
        )}
        {push.affinityPersonId != null && (
          <Row label="Person" value={`#${push.affinityPersonId}`} />
        )}
        {push.affinityListEntryId != null && (
          <Row label="List entry" value={`#${push.affinityListEntryId}`} />
        )}
      </dl>
      {push.affinityUrl && (
        <a
          href={push.affinityUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          Open in Affinity <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
        </a>
      )}
    </div>
  );
}

function FieldValuesCard({ values }: { values: Array<{ label: string; value: string }> }) {
  return (
    <div className="rounded-xl border border-warmgray-100 bg-warmgray-50 p-3">
      <span className="eyebrow text-warmgray-400">Field values</span>
      <dl className="mt-2 space-y-1 text-xs text-warmgray-700">
        {values.map((v) => (
          <Row key={v.label} label={v.label} value={v.value} />
        ))}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-24 shrink-0 text-warmgray-500">{label}</dt>
      <dd className="flex-1 truncate font-medium text-ink">{value}</dd>
    </div>
  );
}

function SyncPill({ state }: { state: AffinitySyncState }) {
  if (state === "synced") {
    return (
      <Pill tone="emerald">
        <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden /> Synced
      </Pill>
    );
  }
  if (state === "failed") {
    return (
      <Pill tone="orange">
        <AlertCircle className="h-3 w-3" strokeWidth={2} aria-hidden /> Failed
      </Pill>
    );
  }
  return (
    <Pill tone="warmgray">
      <Clock className="h-3 w-3" strokeWidth={2} aria-hidden /> {state === "syncing" ? "Syncing" : "Queued"}
    </Pill>
  );
}

function totalDuration(calls: AffinityPushDTO["apiCalls"]): number {
  return calls.reduce((sum, c) => sum + c.durationMs, 0);
}

function prettyStage(stage: NonNullable<AffinityPushDTO["pipelineStage"]>): string {
  switch (stage) {
    case "intro_queued":
      return "Intro queued";
    case "in_review":
      return "In review";
    case "intro_made":
      return "Intro made";
    case "closed_won":
      return "Closed — won";
    case "closed_lost":
      return "Closed — lost";
  }
}
