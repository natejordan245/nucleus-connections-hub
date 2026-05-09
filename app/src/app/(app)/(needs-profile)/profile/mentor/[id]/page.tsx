import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
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
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <header className="mt-6 flex items-start gap-6">
        <Avatar name={mentor.name} src={mentor.photoUrl} size="lg" />
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-semibold text-ink">{mentor.name}</h1>
          <p className="mt-1 text-sm text-warmgray-700">{mentor.headline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="warmgray">{mentor.location}</Pill>
            <Pill tone="orange">Mentor</Pill>
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
            className="inline-flex h-10 items-center justify-center rounded-full border border-warmgray-200 bg-white px-5 text-sm font-semibold text-ink transition hover:border-warmgray-300"
          >
            Edit profile
          </Link>
        )}
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
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

        <aside className="space-y-6">
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
            <p className="text-sm text-warmgray-700">
              {mentor.hoursPerMonth} hours per month.
              {mentor.boardSeatOpen ? " Open to a board seat." : " Not currently taking new board seats."}
            </p>
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
