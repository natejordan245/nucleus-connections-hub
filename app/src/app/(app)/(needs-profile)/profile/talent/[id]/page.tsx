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
  SECTOR_LABELS,
  STAGE_LABELS,
} from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";

export default async function TalentProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const store = getDataStore();
  const talent = await store.getTalent(params.id);
  if (!talent) notFound();

  // The match record (if any) the *viewer* would see for this talent.
  const matches = viewerId ? await store.matchesFor(viewerId) : [];
  const match = matches.find((m) => m.candidateId === talent.id && m.candidateKind === "talent");

  return (
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back to matches
        </Link>

        <header className="mt-6 flex items-start gap-6">
          <Avatar name={talent.name} src={talent.photoUrl} size="lg" />
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-ink">{talent.name}</h1>
            <p className="mt-1 text-sm text-warmgray-700">{talent.headline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="warmgray">{talent.location}</Pill>
              <Pill tone="orange">{AVAILABILITY_LABELS[talent.availability]}</Pill>
              <Pill tone="warmgray">Risk {talent.riskTolerance}/5</Pill>
            </div>
            <div className="mt-3">
              <SocialLinks profile={talent} />
            </div>
          </div>

          {viewerId && match && (
            <Link
              href={`/handshake?with=${talent.id}`}
              className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
            >
              Open handshake →
            </Link>
          )}
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">{talent.bio}</p>
            </Card>
            <Card title="Looking for">
              <p className="text-sm leading-relaxed text-warmgray-700">{talent.lookingFor}</p>
            </Card>
            <Card title="Skills">
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((s) => (
                  <Pill key={s} tone="warmgray">
                    {s}
                  </Pill>
                ))}
              </div>
            </Card>
            <Card title="Domains">
              <div className="flex flex-wrap gap-2">
                {talent.domains.map((d) => (
                  <Pill key={d} tone="orange">
                    {SECTOR_LABELS[d]}
                  </Pill>
                ))}
              </div>
            </Card>
          </section>

          <aside className="space-y-6">
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
              <ul className="space-y-1 text-sm text-warmgray-700">
                <li>
                  <span className="font-semibold">Comp:</span>{" "}
                  {talent.compensation.map((c) => COMPENSATION_LABELS[c]).join(", ")}
                </li>
                <li>
                  <span className="font-semibold">Stage:</span>{" "}
                  {talent.stagePrefs.map((s) => STAGE_LABELS[s]).join(", ")}
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
      <span className="eyebrow text-warmgray-500">{title}</span>
      <div className="mt-3">{children}</div>
    </section>
  );
}
