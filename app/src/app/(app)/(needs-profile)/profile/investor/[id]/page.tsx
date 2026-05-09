import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import { SECTOR_LABELS, STAGE_LABELS } from "@/lib/data/enum-labels";

const fmtUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function InvestorProfilePage({ params }: { params: { id: string } }) {
  const store = getDataStore();
  const investor = await store.getInvestor(params.id);
  if (!investor) notFound();

  const checkSize =
    investor.checkSizeMin && investor.checkSizeMax
      ? `${fmtUsd.format(investor.checkSizeMin)} – ${fmtUsd.format(investor.checkSizeMax)}`
      : investor.checkSizeMin
        ? `from ${fmtUsd.format(investor.checkSizeMin)}`
        : investor.checkSizeMax
          ? `up to ${fmtUsd.format(investor.checkSizeMax)}`
          : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <header className="mt-6 flex items-start gap-6">
        <Avatar name={investor.fundName ?? investor.name} src={investor.photoUrl} size="lg" />
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-semibold text-ink">
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
            <Pill tone="orange">VC</Pill>
            {checkSize && <Pill tone="warmgray">Check {checkSize}</Pill>}
          </div>
          <div className="mt-3">
            <SocialLinks profile={investor} />
          </div>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
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

        <aside className="space-y-6">
          <Card title="Quick actions">
            <Link
              href="/search?kind=business"
              className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
            >
              Browse Businesses →
            </Link>
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
