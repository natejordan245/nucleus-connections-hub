"use client";

import type { RankedMatch, PipelineTimings } from "@/contracts/data";
import { UtahSignalPill } from "./UtahSignalPill";

export function ExplainabilityPanel({
  match,
  timings,
}: {
  match: RankedMatch;
  timings?: PipelineTimings;
}) {
  return (
    <div className="rounded-lg border border-warmgray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warmgray-500">
          Why was I matched?
        </h2>
        <UtahSignalPill reasons={match.proximityReasons} boost={match.proximityBoost} />
      </div>
      <p className="mt-3 text-base leading-relaxed text-ink">{match.reason}</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Factor label="Skill fit" value={match.factors.skillFit} />
        <Factor label="Stage fit" value={match.factors.stageFit} />
        <Factor label="Utah signal" value={match.factors.utahSignal} />
        <Factor label="Concerns" value={match.factors.concerns} tone="warn" />
      </div>

      {timings && (
        <div className="mt-5 flex items-center gap-3 border-t border-warmgray-100 pt-3 font-mono text-[11px] text-warmgray-500">
          <span>{timings.gates}ms gates</span>
          <span>→</span>
          <span>{timings.vector}ms vector</span>
          <span>→</span>
          <span>{timings.rerank}ms rerank</span>
        </div>
      )}
    </div>
  );
}

function Factor({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <div
      className={`rounded border p-3 text-sm ${
        tone === "warn"
          ? "border-orange-400/30 bg-sand-50/50 text-ink"
          : "border-warmgray-100 bg-warmgray-50 text-ink"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">
        {label}
      </div>
      <div className="mt-1 leading-snug">{value || "—"}</div>
    </div>
  );
}
