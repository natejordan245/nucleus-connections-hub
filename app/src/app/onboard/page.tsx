import Link from "next/link";
import { Briefcase, Building2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getSidebarViewer, maybeViewer } from "@/lib/viewer";

export default async function OnboardChooserPage() {
  const { viewerId } = await maybeViewer();
  const sidebarViewer = await getSidebarViewer();
  return (
    <AppShell viewer={sidebarViewer}>
      <main className="mx-auto w-full max-w-3xl px-8 py-12">
        <span className="eyebrow text-orange-500">Get started</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
          Tell us who you are.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          Two minutes of input is all we need to start ranking matches for you.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <ChoiceCard
            href="/onboard/talent"
            icon={<Briefcase className="h-6 w-6" strokeWidth={1.75} aria-hidden />}
            title="I'm an operator, advisor, or candidate"
            body="Find your next role, advisor seat, or co-founder fit at a Utah startup."
          />
          <ChoiceCard
            href="/onboard/startup"
            icon={<Building2 className="h-6 w-6" strokeWidth={1.75} aria-hidden />}
            title="I'm building a company"
            body="Surface the operators, scientists, and advisors who match what you need."
          />
        </div>

        <p className="mt-8 text-center text-xs text-warmgray-500">
          You can edit any of this later from your profile.
        </p>
      </main>
    </AppShell>
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
      className="group rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm transition hover:border-orange-300"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-700">
        {icon}
      </span>
      <h2 className="mt-4 font-serif text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-warmgray-600">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-orange-600 group-hover:text-orange-700">
        Continue <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
