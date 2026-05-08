"use client";

import Link from "next/link";
import type { RankedMatch, StartupDTO, TalentDTO } from "@/contracts/data";
import { UtahSignalPill } from "./UtahSignalPill";
import { cn } from "@/lib/utils";

const verdictBadge: Record<RankedMatch["verdict"], string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-sand-50 text-orange-600 border-orange-400/40",
  partial: "bg-warmgray-100 text-warmgray-700 border-warmgray-200",
};

export function MatchCard({
  match,
  hrefBase,
  onClick,
}: {
  match: RankedMatch;
  hrefBase: string;
  onClick?: () => void;
}) {
  const c = match.candidate;
  const name = "name" in c ? c.name : "";
  const sub = "oneLiner" in c ? c.oneLiner : (c as TalentDTO).headline;
  const sectorOrAvail =
    "sector" in c ? (c as StartupDTO).sector : (c as TalentDTO).availability;
  const stage = "fundingStage" in c ? c.fundingStage : (c as TalentDTO).stagePrefs.join(" / ");

  return (
    <Link
      href={`${hrefBase}/${match.candidateId}`}
      onClick={onClick}
      className="block rounded-lg border border-warmgray-100 bg-white p-4 shadow-sm transition hover:border-orange-400 hover:shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{name}</h3>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                verdictBadge[match.verdict]
              )}
            >
              {match.verdict}
            </span>
            <UtahSignalPill reasons={match.proximityReasons} boost={match.proximityBoost} />
          </div>
          <p className="mt-0.5 text-xs text-warmgray-500">{sub}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-2xl font-semibold tabular-nums text-ink">
            {(match.score * 100).toFixed(0)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-warmgray-500">match</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-warmgray-700">{match.reason}</p>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-warmgray-500">
        <span className="rounded bg-warmgray-50 px-2 py-0.5">{sectorOrAvail}</span>
        <span className="rounded bg-warmgray-50 px-2 py-0.5">{stage}</span>
      </div>
    </Link>
  );
}
