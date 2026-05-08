"use client";

import Link from "next/link";
import { useState } from "react";
import type { RankedMatch, StartupDTO, TalentDTO } from "@/contracts/data";
import { TalentAvatar, StartupLogo } from "./Avatar";
import { SocialLinks } from "./SocialLinks";
import { UtahSignalPill } from "./UtahSignalPill";
import { cn } from "@/lib/utils";

const verdictTone: Record<RankedMatch["verdict"], string> = {
  strong: "border-emerald-200 bg-emerald-50 text-emerald-700",
  good: "border-orange-200 bg-sand-50 text-orange-700",
  partial: "border-warmgray-200 bg-warmgray-50 text-warmgray-700",
};

/**
 * One opportunity (a candidate match), rendered as a self-contained card.
 * Carries everything the viewer needs to decide:
 *   identity → reason → factors (incl. concerns) → action.
 * No reliance on a separate detail panel.
 */
export function OpportunityCard({
  match,
  viewerId,
  hrefBase,
}: {
  match: RankedMatch;
  viewerId: string;
  hrefBase: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const c = match.candidate;
  const isStartup = "sector" in c;
  const startup = isStartup ? (c as StartupDTO) : null;
  const talent = isStartup ? null : (c as TalentDTO);

  const handshakeHref = startup
    ? `/handshake?as=${viewerId}&with=${startup.id}`
    : talent
      ? `/handshake?as=${talent.id}&with=${viewerId}`
      : "#";

  return (
    <article className="overflow-hidden rounded-xl border border-warmgray-100 bg-white shadow-[0_1px_0_rgba(16,16,16,0.04)] transition hover:border-orange-200 hover:shadow-[0_8px_24px_-12px_rgba(255,114,39,0.25)]">
      <div className="flex items-start gap-5 px-7 pt-6">
        {startup ? (
          <StartupLogo name={startup.name} logoUrl={startup.logoUrl} size={64} />
        ) : talent ? (
          <TalentAvatar
            id={talent.id}
            name={talent.name}
            photoUrl={talent.photoUrl}
            size={64}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${hrefBase}/${match.candidateId}`}
              className="font-serif text-xl font-semibold tracking-tight text-ink hover:text-orange-700"
            >
              {startup?.name ?? talent?.name}
            </Link>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-track",
                verdictTone[match.verdict]
              )}
            >
              {match.verdict}
            </span>
            <UtahSignalPill reasons={match.proximityReasons} boost={match.proximityBoost} />
          </div>

          <p className="mt-1 text-sm text-warmgray-600">
            {startup?.oneLiner ?? talent?.headline}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-warmgray-500">
            {startup && (
              <>
                <Tag>{startup.sector}</Tag>
                <Tag>{startup.fundingStage}</Tag>
                <Tag>{startup.origin}</Tag>
              </>
            )}
            {talent && (
              <>
                <Tag>{talent.availability}</Tag>
                <Tag>{talent.compensation.join(" · ")}</Tag>
              </>
            )}
            <span>·</span>
            <span>{startup?.location ?? talent?.location}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-3xl font-semibold tabular-nums text-ink">
            {(match.score * 100).toFixed(0)}
          </div>
          <div className="eyebrow text-warmgray-400">match</div>
        </div>
      </div>

      <div className="mx-7 mt-5 rounded-lg border border-warmgray-100 bg-warmgray-50 p-4">
        <div className="eyebrow mb-1.5 text-orange-600">Why this match</div>
        <p className="text-[15px] leading-relaxed text-ink">{match.reason}</p>
      </div>

      <div className="px-7 py-5">
        <button
          onClick={() => setExpanded((x) => !x)}
          className="text-[11px] font-semibold uppercase tracking-track text-warmgray-500 hover:text-orange-600"
        >
          {expanded ? "− Hide factors" : "+ Show match factors"}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Factor label="Skill fit" value={match.factors.skillFit} />
            <Factor label="Stage fit" value={match.factors.stageFit} />
            <Factor label="Utah signal" value={match.factors.utahSignal} />
            <Factor label="Concerns" value={match.factors.concerns} tone="warn" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-warmgray-100 px-7 py-4">
        <SocialLinks
          linkedinUrl={startup?.linkedinUrl ?? talent?.linkedinUrl}
          xUrl={startup?.xUrl ?? talent?.xUrl}
          websiteUrl={startup?.websiteUrl}
          email={talent?.email}
        />
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-warmgray-200 px-3 py-1.5 text-xs font-medium text-warmgray-600 transition hover:bg-warmgray-50">
            Pass
          </button>
          <Link
            href={handshakeHref}
            className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            I'm interested →
          </Link>
        </div>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-warmgray-50 px-1.5 py-0.5 text-warmgray-700">{children}</span>
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
      className={cn(
        "rounded-md border p-3 text-sm leading-snug",
        tone === "warn"
          ? "border-orange-200 bg-sand-50 text-ink"
          : "border-warmgray-100 bg-warmgray-50 text-ink"
      )}
    >
      <div className="eyebrow mb-1 text-warmgray-500">{label}</div>
      {value || "—"}
    </div>
  );
}
