import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { Pill } from "./Pill";
import { SocialLinks } from "./SocialLinks";
import type { CandidateDTO } from "@/lib/data/types";
import {
  AVAILABILITY_LABELS,
  COMPENSATION_LABELS,
  NEED_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  TALENT_CATEGORY_LABELS,
} from "@/lib/data/enum-labels";

/**
 * Presentational candidate-profile layout. Pure props in, JSX out — no data
 * fetching, no auth dependency. Used by the live `/profile/candidate/[id]`
 * page and by the slideshow Slide 2 (with hardcoded fixtures).
 *
 * `headerAction` lets the caller slot in an Edit / Open-handshake button.
 * `aside` lets the caller slot in either the live ExplainabilityPanel or a
 * static "Why was I matched?" placeholder.
 */
export function CandidateProfileCard({
  candidate,
  headerAction,
  aside,
}: {
  candidate: CandidateDTO;
  headerAction?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <>
      <header className="mt-4 flex items-start gap-5 rounded-lg border border-warmgray-200 bg-white p-5">
        <Avatar name={candidate.name} src={candidate.photoUrl} size="lg" />
        <div className="flex-1">
          <span className="eyebrow text-orange-500">Candidate</span>
          <h1 className="mt-1 text-2xl font-bold text-ink">{candidate.name}</h1>
          <p className="mt-1 text-sm text-warmgray-700">{candidate.headline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="warmgray">{candidate.location}</Pill>
            <Pill tone="orange">{AVAILABILITY_LABELS[candidate.availability]}</Pill>
            <Pill tone="warmgray">Risk {candidate.riskTolerance}/5</Pill>
          </div>
          <div className="mt-3">
            <SocialLinks profile={candidate} />
          </div>
        </div>
        {headerAction}
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <Card title="About">
            <p className="text-sm leading-relaxed text-warmgray-700">{candidate.bio}</p>
          </Card>
          <Card title="Looking for">
            <p className="text-sm leading-relaxed text-warmgray-700">{candidate.lookingFor}</p>
            {(candidate.lookingForNeeds ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(candidate.lookingForNeeds ?? []).map((need) => (
                  <Pill key={need} tone="orange">
                    {NEED_LABELS[need]}
                  </Pill>
                ))}
              </div>
            )}
          </Card>
          <Card title="Categories">
            <div className="flex flex-wrap gap-2">
              {(candidate.categories ?? []).map((category) => (
                <Pill key={category} tone="warmgray">
                  {TALENT_CATEGORY_LABELS[category]}
                </Pill>
              ))}
            </div>
          </Card>
          <Card title="Domains">
            <div className="flex flex-wrap gap-2">
              {candidate.domains.map((d) => (
                <Pill key={d} tone="orange">
                  {SECTOR_LABELS[d]}
                </Pill>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          {aside}
          <Card title="Compensation fit">
            <dl className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-warmgray-500">comp.preference</span>
                <span className="font-semibold text-ink">
                  {candidate.compensation.map((c) => COMPENSATION_LABELS[c]).join(", ")}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-warmgray-500">stage.preference</span>
                <span className="font-semibold text-ink">
                  {candidate.stagePrefs.map((s) => STAGE_LABELS[s]).join(", ")}
                </span>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
