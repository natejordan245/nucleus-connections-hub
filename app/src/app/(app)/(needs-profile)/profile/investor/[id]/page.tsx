import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import { SECTOR_LABELS, STAGE_LABELS } from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function InvestorProfilePage({ params }: { params: { id: string } }) {
  const store = getDataStore();
  const investor = await store.getInvestor(params.id);
  if (!investor) notFound();
  const { viewerId } = await maybeViewer();
  const isOwner = viewerId === investor.id;

  const checkSize =
    investor.checkSizeMin && investor.checkSizeMax
      ? `${fmtUsd.format(investor.checkSizeMin)} – ${fmtUsd.format(investor.checkSizeMax)}`
      : investor.checkSizeMin
        ? `from ${fmtUsd.format(investor.checkSizeMin)}`
        : investor.checkSizeMax
          ? `up to ${fmtUsd.format(investor.checkSizeMax)}`
          : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <Link
        href="/dashboard"
        className="font-mono text-xs text-warmgray-500 hover:text-ink"
      >
        ← back to dashboard
      </Link>

      <header className="mt-4 flex items-start gap-5 rounded-lg border border-warmgray-200 bg-white p-5">
        <Avatar name={investor.fundName ?? investor.name} src={investor.photoUrl} size="lg" />
        <div className="flex-1">
          <span className="eyebrow text-orange-500">VC</span>
          <h1 className="mt-1 text-2xl font-bold text-ink">
            {investor.fundName ?? investor.name}
          </h1>
          {investor.fundName && (
            <p className="mt-1 text-sm text-warmgray-700">{investor.name}</p>
          )}
          {investor.headline && (
            <p className="mt-1 text-sm text-warmgray-700">{investor.headline}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="warmgray">{investor.location}</Pill>
            {checkSize && <Pill tone="warmgray">Check {checkSize}</Pill>}
          </div>
          <div className="mt-3">
            <SocialLinks profile={investor} />
          </div>
        </div>

        {isOwner && (
          <Link
            href="/onboard/investor"
            className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
          >
            Edit profile
          </Link>
        )}
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          {investor.bio && (
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">{investor.bio}</p>
            </Card>
          )}
          <Card title="Sectors invested">
            {investor.sectorsInvested.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {investor.sectorsInvested.map((s) => (
                  <Pill key={s} tone="orange">
                    {SECTOR_LABELS[s]}
                  </Pill>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warmgray-600">Sector-agnostic.</p>
            )}
          </Card>
          <Card title="Stage preferences">
            {investor.stagePrefs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {investor.stagePrefs.map((s) => (
                  <Pill key={s} tone="warmgray">
                    {STAGE_LABELS[s]}
                  </Pill>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warmgray-600">Open to multiple stages.</p>
            )}
          </Card>
        </section>

        <aside className="space-y-4">
          <Card title="Quick actions">
            <Link
              href="/search?kind=business"
              className="inline-flex h-8 w-full items-center justify-center rounded-md bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600"
            >
              Browse businesses →
            </Link>
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
