import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pill } from "@/components/Pill";
import { SocialLinks } from "@/components/SocialLinks";
import { getDataStore } from "@/lib/data";
import { COMPENSATION_LABELS, SECTOR_LABELS } from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";

export default async function MentorProfilePage({ params }: { params: { id: string } }) {
  const store = getDataStore();
  const mentor = await store.getMentor(params.id);
  if (!mentor) notFound();
  const { viewerId } = await maybeViewer();
  const isOwner = viewerId === mentor.id;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mentor" },
          { label: mentor.name },
        ]}
      />

      <header className="mt-4 flex items-start gap-5 rounded-lg border border-warmgray-200 bg-white p-5">
        <Avatar name={mentor.name} src={mentor.photoUrl} size="lg" />
        <div className="flex-1">
          <span className="eyebrow text-orange-500">Mentor</span>
          <h1 className="mt-1 text-2xl font-bold text-ink">{mentor.name}</h1>
          <p className="mt-1 text-sm text-warmgray-700">{mentor.headline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="warmgray">{mentor.location}</Pill>
            <Pill tone="warmgray">{mentor.hoursPerMonth} hrs/mo</Pill>
            {mentor.boardSeatOpen && <Pill tone="emerald">Open to board seat</Pill>}
          </div>
          <div className="mt-3">
            <SocialLinks profile={mentor} />
          </div>
        </div>

        {isOwner && (
          <Link
            href="/onboard/mentor"
            className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
          >
            Edit profile
          </Link>
        )}
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <Card title="About">
            <p className="text-sm leading-relaxed text-warmgray-700">{mentor.bio}</p>
          </Card>
          <Card title="Areas advised">
            <div className="flex flex-wrap gap-2">
              {mentor.areasAdvised.map((s) => (
                <Pill key={s} tone="orange">
                  {SECTOR_LABELS[s]}
                </Pill>
              ))}
            </div>
          </Card>
          <Card title="Sectors of interest">
            <div className="flex flex-wrap gap-2">
              {mentor.sectorsOfInterest.map((s) => (
                <Pill key={s} tone="warmgray">
                  {SECTOR_LABELS[s]}
                </Pill>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card title="Compensation preference">
            <div className="flex flex-wrap gap-2">
              {mentor.compPreference.map((c) => (
                <Pill key={c} tone="warmgray">
                  {COMPENSATION_LABELS[c]}
                </Pill>
              ))}
            </div>
          </Card>
          <Card title="Availability">
            <dl className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-warmgray-500">hours.per.month</span>
                <span className="font-semibold text-ink">{mentor.hoursPerMonth}</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-warmgray-500">board.seat.open</span>
                <span className="font-semibold text-ink">
                  {mentor.boardSeatOpen ? "yes" : "no"}
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
