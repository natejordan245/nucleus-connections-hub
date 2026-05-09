import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import {
  AVAILABILITY_LABELS,
  COMPENSATION_LABELS,
  NEED_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  TALENT_CATEGORY_LABELS,
} from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const store = getDataStore();
  const candidate = await store.getCandidate(params.id);
  if (!candidate) notFound();

  const matches = viewerId ? await store.matchesFor(viewerId) : [];
  const match = matches.find(
    (m) => m.candidateId === candidate.id && m.candidateKind === "candidate",
  );
  const isOwner = viewerId === candidate.id;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <Link
        href="/dashboard"
        className="font-mono text-xs text-warmgray-500 hover:text-ink"
      >
        ← back to dashboard
      </Link>

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

        {isOwner ? (
          <Link
            href="/onboard/candidate"
            className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
          >
            Edit profile
          </Link>
        ) : (
          viewerId && match && (
            <Link
              href={`/handshake?with=${candidate.id}`}
              className="inline-flex h-7 items-center rounded-md bg-ink px-2.5 text-[11px] font-semibold text-white transition hover:bg-warmgray-800"
            >
              Open handshake →
            </Link>
          )
        )}
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
          <Card title="Skills">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((s) => (
                <Pill key={s} tone="warmgray">
                  {s}
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
          {match ? (
            <ExplainabilityPanel match={match} />
          ) : (
            <Card title="Why was I matched?">
              <p className="text-sm text-warmgray-600">
                This profile isn't currently in your matches.
              </p>
            </Card>
          )}
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
    </main>
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
