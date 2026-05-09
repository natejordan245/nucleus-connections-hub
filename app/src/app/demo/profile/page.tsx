import { ProfileFillCycle } from "./ProfileFillCycle";

/**
 * Slide 2 — the structured profile.
 *
 * Cycles between the two onboarding paths so the slide demonstrates both
 * sides of the network on a single surface:
 *   1. Candidate uploads a resume → profile auto-fills.
 *   2. Business pastes a website URL → profile auto-fills.
 * The cycle loops on a timer; no interaction needed.
 */
export default function ProfileSlidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">UX</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        One input. The profile fills itself.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warmgray-600">
        Candidates upload a resume. Businesses paste a website URL. Same
        structured profile out the back.
      </p>

      <ProfileFillCycle />
    </main>
  );
}
