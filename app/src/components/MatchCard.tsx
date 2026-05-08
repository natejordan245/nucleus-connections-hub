import Link from "next/link";
import type { MatchDTO, StartupDTO, TalentDTO, UtahOrg } from "@/lib/data/types";
import { Avatar } from "./Avatar";
import { Pill } from "./Pill";
import { UtahSignalPill } from "./UtahSignalPill";

type Candidate =
  | { kind: "talent"; talent: TalentDTO }
  | { kind: "startup"; startup: StartupDTO };

export function MatchCard({
  match,
  candidate,
  utahOrgs,
}: {
  match: MatchDTO;
  candidate: Candidate;
  utahOrgs: UtahOrg[];
}) {
  const sharedOrgs = match.sharedOrgIds
    .map((id) => utahOrgs.find((o) => o.id === id))
    .filter((o): o is UtahOrg => Boolean(o))
    .map((o) => ({ id: o.id, name: o.name }));

  const name = candidate.kind === "talent" ? candidate.talent.name : candidate.startup.name;
  const photo = candidate.kind === "talent" ? candidate.talent.photoUrl : candidate.startup.logoUrl;
  const headline =
    candidate.kind === "talent" ? candidate.talent.headline : candidate.startup.oneLiner;
  const detailHref =
    candidate.kind === "talent"
      ? `/profile/talent/${candidate.talent.id}`
      : `/profile/startup/${candidate.startup.id}`;
  const handshakeHref = `/handshake?with=${candidate.kind === "talent" ? candidate.talent.id : candidate.startup.id}`;

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
            <UtahSignalPill sharedOrgs={sharedOrgs} proximityBoost={match.proximityBoost} />
            <Pill tone="warmgray">
              {candidate.kind === "talent"
                ? candidate.talent.location
                : candidate.startup.location}
            </Pill>
          </div>
        </div>
      </header>

      <p className="mt-5 text-sm leading-relaxed text-warmgray-700">{match.reason}</p>

      {match.concerns.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-warmgray-500">
          {match.concerns.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden className="text-warmgray-300">!</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
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
  const tone = pct >= 90 ? "orange" : pct >= 75 ? "emerald" : "neutral";
  return <Pill tone={tone}>{pct}% match</Pill>;
}
