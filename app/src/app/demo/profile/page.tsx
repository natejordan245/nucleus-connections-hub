import { Sparkles } from "lucide-react";
import { CandidateProfileCard } from "@/components/CandidateProfileCard";
import { SARAH } from "@/lib/demo/show-fixtures";

/**
 * Slide 2 — the structured profile.
 *
 * Renders the *real* `<CandidateProfileCard>` against a hardcoded fixture.
 * One floating chip overlays the bio: "Generated from 2 paragraphs." That's
 * the entire visual story — no fetch, no API.
 */
export default function ProfileSlidePage() {
  const aside = (
    <section className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-orange-600" strokeWidth={2} aria-hidden />
        <span className="eyebrow text-orange-700">Generated from 2 paragraphs</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-warmgray-700">
        Sarah typed her bio and what she's looking for. Skills, availability,
        comp, stage, domains, and Utah affiliations were extracted by{" "}
        <span className="font-mono">gpt-5.3-nano</span>.
      </p>
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">UX</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        From two paragraphs to a structured profile.
      </h1>
      <CandidateProfileCard candidate={SARAH} aside={aside} />
    </main>
  );
}
