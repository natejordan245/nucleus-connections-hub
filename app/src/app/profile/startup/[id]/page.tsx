import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import { FUNDING_STATUS_LABELS, NEED_LABELS, ORIGIN_LABELS, SECTOR_LABELS, STAGE_LABELS } from "@/lib/data/enum-labels";
import { getSidebarViewer, maybeViewer } from "@/lib/viewer";

export default async function StartupProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const sidebarViewer = await getSidebarViewer();
  const store = getDataStore();
  const startup = await store.getStartup(params.id);
  if (!startup) notFound();

  const matches = viewerId ? await store.matchesFor(viewerId) : [];
  const match = matches.find(
    (m) => m.candidateId === startup.id && m.candidateKind === "startup",
  );

  return (
    <AppShell viewer={sidebarViewer}>
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <Link href="/matches" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back to matches
        </Link>

        <header className="mt-6 flex items-start gap-6">
          <Avatar name={startup.name} src={startup.logoUrl} size="lg" />
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-semibold text-ink">{startup.name}</h1>
            <p className="mt-1 text-sm text-warmgray-700">{startup.oneLiner}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="warmgray">{startup.location}</Pill>
              <Pill tone="orange">{STAGE_LABELS[startup.fundingStage]}</Pill>
              <Pill tone={startup.fundingStatus === "revenue" ? "emerald" : "warmgray"}>
                {FUNDING_STATUS_LABELS[startup.fundingStatus]}
              </Pill>
              {startup.trl && <Pill tone="warmgray">TRL {startup.trl}</Pill>}
            </div>
            <div className="mt-3">
              <SocialLinks profile={startup} />
            </div>
          </div>

          {viewerId && match && (
            <Link
              href={`/handshake?with=${startup.id}`}
              className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
            >
              Open handshake →
            </Link>
          )}
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">{startup.description}</p>
            </Card>
            <Card title="Origin">
              <p className="text-sm text-warmgray-700">{ORIGIN_LABELS[startup.origin]}</p>
            </Card>
            <Card title="What they're looking for">
              <div className="flex flex-wrap gap-2">
                {startup.needs.map((n) => (
                  <Pill key={n} tone="orange">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </Card>
            <Card title="Sector">
              <Pill tone="warmgray">{SECTOR_LABELS[startup.sector]}</Pill>
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
          </aside>
        </div>
      </main>
    </AppShell>
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
