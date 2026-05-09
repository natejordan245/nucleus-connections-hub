import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { GapCloser } from "@/components/GapCloser";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import { FUNDING_STATUS_LABELS, NEED_LABELS, ORIGIN_LABELS, SECTOR_LABELS, STAGE_LABELS } from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";

export default async function BusinessProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const store = getDataStore();
  const business = await store.getBusiness(params.id);
  if (!business) notFound();

  const [matches, viewerCandidate, resources] = await Promise.all([
    viewerId ? store.matchesFor(viewerId) : Promise.resolve([]),
    viewerId ? store.getCandidate(viewerId) : Promise.resolve(null),
    store.listResources(),
  ]);
  const match = matches.find(
    (m) => m.candidateId === business.id && m.candidateKind === "business",
  );
  const showGapCloser = Boolean(viewerCandidate && (match ? match.score < 1 : true));
  const isOwner = viewerId === business.id;

  return (
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back to matches
        </Link>

        <header className="mt-6 flex items-start gap-6">
          <Avatar name={business.name} src={business.logoUrl} size="lg" />
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-ink">{business.name}</h1>
            <p className="mt-1 text-sm text-warmgray-700">{business.oneLiner}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="warmgray">{business.location}</Pill>
              <Pill tone="orange">{STAGE_LABELS[business.fundingStage]}</Pill>
              <Pill tone={business.fundingStatus === "revenue" ? "emerald" : "warmgray"}>
                {FUNDING_STATUS_LABELS[business.fundingStatus]}
              </Pill>
              {business.trl && <Pill tone="warmgray">TRL {business.trl}</Pill>}
            </div>
            <div className="mt-3">
              <SocialLinks profile={business} />
            </div>
          </div>

          {isOwner ? (
            <Link
              href="/onboard/business"
              className="inline-flex h-10 items-center justify-center rounded-full border border-warmgray-200 bg-white px-5 text-sm font-semibold text-ink transition hover:border-warmgray-300"
            >
              Edit profile
            </Link>
          ) : (
            viewerId && match && (
              <Link
                href={`/handshake?with=${business.id}`}
                className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
              >
                Open handshake →
              </Link>
            )
          )}
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">{business.description}</p>
            </Card>
            <Card title="Origin">
              <p className="text-sm text-warmgray-700">{ORIGIN_LABELS[business.origin]}</p>
            </Card>
            <Card title="Talent they're looking for">
              <div className="flex flex-wrap gap-2">
                {business.needs.map((n) => (
                  <Pill key={n} tone="orange">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </Card>
            <Card title="Core sector focus">
              <Pill tone="warmgray">{SECTOR_LABELS[business.sector]}</Pill>
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
            {showGapCloser && viewerCandidate && (
              <GapCloser
                subjectId={viewerCandidate.id}
                candidateId={business.id}
              />
            )}
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
