import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import type { BusinessDTO, CandidateDTO, MatchDTO, MatchFactor, Origin } from "@/lib/data/types";
import { ORIGIN_LABELS } from "@/lib/data/enum-labels";
import { Avatar } from "./Avatar";
import { GapCloser } from "./GapCloser";
import { Pill } from "./Pill";

// Origins worth surfacing as a pill on the match card. The brief opens with
// university-spinout commercialization as the core problem, so promote those
// signals; treat bootstrapped / vc-backed as background and skip the pill.
const SPINOUT_ORIGINS: ReadonlySet<Origin> = new Set([
  "u-of-u-spinout",
  "byu-spinout",
  "usu-spinout",
]);

type Candidate =
  | { kind: "candidate"; candidate: CandidateDTO }
  | { kind: "business"; business: BusinessDTO };

// A match below this score is treated as "partial" — the dashboard surfaces
// the gap-closer inline so the user is handed a next step instead of an
// unexplained 78%.
const STRONG_THRESHOLD = 0.85;

export function MatchCard({
  match,
  candidate,
  gapCloser,
  hideExplainabilityLink = false,
}: {
  match: MatchDTO;
  candidate: Candidate;
  /**
   * Optional override for the partial-match gap-closer. When undefined and
   * the score is partial, the default async {@link GapCloser} fetches via
   * the data store. Slideshow callers pass `<GapCloserView .../>` with
   * fixtures so the component never touches the data layer.
   */
  gapCloser?: ReactNode;
  /** Hide the footer "Why was I matched? →" link. Used on slides where the
   *  reason is already the focus and the link is just visual noise. */
  hideExplainabilityLink?: boolean;
}) {
  const name =
    candidate.kind === "candidate" ? candidate.candidate.name : candidate.business.name;
  const photo =
    candidate.kind === "candidate" ? candidate.candidate.photoUrl : candidate.business.logoUrl;
  const headline =
    candidate.kind === "candidate" ? candidate.candidate.headline : candidate.business.oneLiner;
  const location =
    candidate.kind === "candidate" ? candidate.candidate.location : candidate.business.location;
  const candidateId =
    candidate.kind === "candidate" ? candidate.candidate.id : candidate.business.id;
  const detailHref =
    candidate.kind === "candidate"
      ? `/profile/candidate/${candidateId}`
      : `/profile/business/${candidateId}`;
  const spinoutOrigin =
    candidate.kind === "business" && SPINOUT_ORIGINS.has(candidate.business.origin)
      ? candidate.business.origin
      : null;
  const isPartial = match.score < STRONG_THRESHOLD;

  return (
    <article className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm transition hover:border-warmgray-200">
      <header className="flex items-start gap-4">
        <Avatar name={name} src={photo} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-lg font-semibold text-ink">
              <Link href={detailHref} className="hover:text-orange-700">
                {name}
              </Link>
            </h3>
            <ScorePill score={match.score} />
          </div>
          <p className="mt-1 truncate text-sm text-warmgray-600">{headline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="warmgray">{location}</Pill>
            {spinoutOrigin && (
              <Pill tone="orange">{ORIGIN_LABELS[spinoutOrigin]}</Pill>
            )}
          </div>
        </div>
      </header>

      <FactorStrip factors={match.factors} />

      {match.reason && (
        <p className="mt-4 text-sm leading-relaxed text-warmgray-700">{match.reason}</p>
      )}

      {match.concerns.length > 0 && <ConcernsBlock concerns={match.concerns} />}

      {isPartial && (
        <div className="mt-5">
          {gapCloser ?? (
            <GapCloser
              subjectId={match.subjectId}
              candidateId={match.candidateId}
              limit={3}
            />
          )}
        </div>
      )}

      <footer
        className={
          "mt-5 flex flex-wrap items-center gap-3 border-t border-warmgray-100 pt-4 " +
          (hideExplainabilityLink ? "justify-end" : "justify-between")
        }
      >
        {!hideExplainabilityLink && (
          <Link href={detailHref} className="text-xs font-medium text-warmgray-600 hover:text-ink">
            Why was I matched? →
          </Link>
        )}
        <div className="flex items-center gap-2">
          <Link
            href={detailHref}
            className="inline-flex h-9 items-center rounded-full border border-warmgray-200 px-3.5 text-xs font-semibold text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
          >
            Not a fit
          </Link>
          <Link
            href={detailHref}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-warmgray-800"
          >
            Request intro
            <span aria-hidden>→</span>
          </Link>
        </div>
      </footer>
    </article>
  );
}

function ScorePill({ score }: { score: number }) {
  const pct = score * 100;
  // Distribution note: composite = min(both directions), cosine floor 0.35,
  // so live scores cluster 75-85% with rare elites above. Thresholds chosen
  // so the typical strong match reads emerald, top-tier reads brand orange.
  const tone = pct >= 85 ? "orange" : pct >= 75 ? "emerald" : "warmgray";
  // One decimal so close-score matches don't all read as the same integer.
  return <Pill tone={tone}>{pct.toFixed(1)}% match</Pill>;
}

const FACTOR_TONE_CLASS: Record<"strong" | "ok" | "weak" | "miss", string> = {
  strong: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ok:     "border-warmgray-200 bg-warmgray-50 text-warmgray-700",
  weak:   "border-orange-200 bg-orange-50 text-orange-700",
  miss:   "border-orange-300 bg-orange-100 text-orange-800",
};

function factorVerdict(weight: number): "strong" | "ok" | "weak" | "miss" {
  if (weight >= 0.85) return "strong";
  if (weight >= 0.6) return "ok";
  if (weight >= 0.3) return "weak";
  return "miss";
}

function FactorStrip({ factors }: { factors: MatchFactor[] }) {
  if (!factors.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {factors.map((f, i) => {
        const verdict = factorVerdict(f.weight);
        return (
          <span
            key={`${f.label}-${i}`}
            title={f.detail}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
              FACTOR_TONE_CLASS[verdict]
            }
          >
            {f.label}
          </span>
        );
      })}
    </div>
  );
}

function ConcernsBlock({ concerns }: { concerns: string[] }) {
  return (
    <aside
      role="note"
      className="mt-4 rounded-xl border border-orange-200 bg-sand-50 p-4"
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          className="h-4 w-4 text-orange-600"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="eyebrow text-orange-700">Worth verifying</span>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-warmgray-700">
        {concerns.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </aside>
  );
}
