import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { MatchDTO, MatchFactor, StartupDTO, TalentDTO } from "@/lib/data/types";
import { Avatar } from "./Avatar";
import { GapCloser } from "./GapCloser";
import { Pill } from "./Pill";

type Candidate =
  | { kind: "talent"; talent: TalentDTO }
  | { kind: "startup"; startup: StartupDTO };

// A match below this score is treated as "partial" — the dashboard surfaces
// the gap-closer inline so the user is handed a next step instead of an
// unexplained 78%.
const STRONG_THRESHOLD = 0.85;

export function MatchCard({
  match,
  candidate,
}: {
  match: MatchDTO;
  candidate: Candidate;
}) {
  const name = candidate.kind === "talent" ? candidate.talent.name : candidate.startup.name;
  const photo = candidate.kind === "talent" ? candidate.talent.photoUrl : candidate.startup.logoUrl;
  const headline =
    candidate.kind === "talent" ? candidate.talent.headline : candidate.startup.oneLiner;
  const location =
    candidate.kind === "talent" ? candidate.talent.location : candidate.startup.location;
  const candidateId = candidate.kind === "talent" ? candidate.talent.id : candidate.startup.id;
  const detailHref =
    candidate.kind === "talent" ? `/profile/talent/${candidateId}` : `/profile/startup/${candidateId}`;
  const handshakeHref = `/handshake?with=${candidateId}`;
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
          <GapCloser
            subjectId={match.subjectId}
            candidateId={match.candidateId}
            limit={3}
          />
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between border-t border-warmgray-100 pt-4">
        <Link href={detailHref} className="text-xs font-medium text-warmgray-600 hover:text-ink">
          Why was I matched? →
        </Link>
        <Link
          href={handshakeHref}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-warmgray-800"
        >
          Open
          <span aria-hidden>→</span>
        </Link>
      </footer>
    </article>
  );
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  // Distribution note: composite = min(both directions), cosine floor 0.35,
  // so live scores cluster 75-85% with rare elites above. Thresholds chosen
  // so the typical strong match reads emerald, top-tier reads brand orange.
  const tone = pct >= 85 ? "orange" : pct >= 75 ? "emerald" : "warmgray";
  return <Pill tone={tone}>{pct}% match</Pill>;
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
