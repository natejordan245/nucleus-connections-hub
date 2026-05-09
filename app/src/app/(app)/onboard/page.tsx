import Link from "next/link";
import { Briefcase, Building2, Coins, Compass } from "lucide-react";
import { maybeViewer } from "@/lib/viewer";

export default async function OnboardChooserPage() {
  await maybeViewer();
  return (
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <span className="eyebrow text-orange-500">Get started</span>
        <h1 className="mt-2 text-2xl font-bold text-ink">Tell us who you are.</h1>
        <p className="mt-1 max-w-xl text-sm text-warmgray-500">
          Pick the lane that fits. We'll tailor the rest of onboarding from there.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ChoiceCard
            href="/onboard/candidate"
            icon={<Briefcase className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
            title="Candidate"
            body="Operators, executives, engineers, students — looking for a role at a Utah business."
          />
          <ChoiceCard
            href="/onboard/business"
            icon={<Building2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
            title="Business"
            body="Founders building a company, hiring, fundraising, or seeking advisors."
          />
          <ChoiceCard
            href="/onboard/mentor"
            icon={<Compass className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
            title="Mentor"
            body="Advisors and SMEs offering time, expertise, or board seats to founders."
          />
          <ChoiceCard
            href="/onboard/investor"
            icon={<Coins className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
            title="VC"
            body="Investors looking for Utah businesses to back."
          />
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-warmgray-500">
          You can edit any of this later from your profile.
        </p>
      </main>
  );
}

function ChoiceCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-warmgray-200 bg-white p-4 transition hover:border-orange-300"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 text-orange-700">
        {icon}
      </span>
      <h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-warmgray-500">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 group-hover:text-orange-700">
        Continue <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
