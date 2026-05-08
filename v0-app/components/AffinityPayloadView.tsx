"use client";

import type { AffinityPushPayload } from "@/contracts/data";

export function AffinityPayloadView({ p }: { p: AffinityPushPayload }) {
  return (
    <div className="rounded-lg border border-warmgray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-warmgray-500">
            Mutual match queued for Affinity
          </div>
          <h3 className="mt-1 text-base font-semibold text-ink">
            {p.talent.name} ↔ {p.startup.name}
          </h3>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
          ready to push
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded border border-warmgray-100 bg-warmgray-50 p-3 text-xs">
          <div className="font-semibold text-warmgray-500">List</div>
          <div className="mt-1 text-ink">{p.listName}</div>
        </div>
        <div className="rounded border border-warmgray-100 bg-warmgray-50 p-3 text-xs">
          <div className="font-semibold text-warmgray-500">Person</div>
          <div className="mt-1 text-ink">
            {p.talent.name} · {p.talent.email}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded border border-warmgray-100 bg-warmgray-50 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">
          Note body
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink whitespace-pre-line">{p.note}</p>
        {p.proximityReasons.length > 0 && (
          <div className="mt-2 text-xs text-orange-600">
            Utah signal: {p.proximityReasons.join("; ")}
          </div>
        )}
      </div>
    </div>
  );
}
