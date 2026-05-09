import { FileText, Globe } from "lucide-react";
import { CandidateProfileCard } from "@/components/CandidateProfileCard";
import { SARAH } from "@/lib/demo/show-fixtures";

/**
 * Slide 2 — the structured profile.
 *
 * Renders the *real* `<CandidateProfileCard>` against a hardcoded fixture.
 * Aside chip explains the actual onboarding paths: resume upload for
 * candidates, website URL for businesses. No fetch, no API.
 */
export default function ProfileSlidePage() {
  const aside = (
    <section className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
      <div className="eyebrow text-orange-700">Auto-filled from a single input</div>
      <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-warmgray-700">
        <li className="flex items-start gap-2">
          <FileText
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600"
            strokeWidth={2}
            aria-hidden
          />
          <span>
            <span className="font-semibold text-ink">Candidates</span> upload a
            resume — every field below is extracted from it.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Globe
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600"
            strokeWidth={2}
            aria-hidden
          />
          <span>
            <span className="font-semibold text-ink">Businesses</span> paste
            their website URL — we read the public site and structure it.
          </span>
        </li>
      </ul>
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">UX</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        Upload once. Profile fills itself.
      </h1>
      <CandidateProfileCard candidate={SARAH} aside={aside} />
    </main>
  );
}
