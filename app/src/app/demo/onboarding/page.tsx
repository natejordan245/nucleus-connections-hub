"use client";

import { useEffect, useState } from "react";
import { Briefcase, Building2, Compass, Coins, Check, Globe, Sparkles, RefreshCcw } from "lucide-react";
import { Typewriter } from "@/components/demo/Typewriter";

const URL_TEXT = "lumenbio.utah.edu";
const SARAH_BIO =
  "Former VP of Sales at Qualtrics. 15 years scaling enterprise SaaS in Utah. Built the GTM motion that took us from $40M to $400M ARR. Now interested in fractional advisory work — I want to give back to the next generation of Utah founders.";
const SARAH_LF =
  "Fractional advisory or board roles, Series A or later, Utah AI or SaaS startups, ideally founder-led. 5–10 hours per month. Cash + equity.";

const BUSINESS_FIELDS = [
  { label: "Name", value: "Lumen Bio" },
  { label: "One-liner", value: "Light-activated cancer therapeutics" },
  { label: "Sector", value: "Life Sciences" },
  { label: "Origin", value: "U of U Spinout" },
  { label: "Stage", value: "Seed" },
  { label: "Needs", value: "CEO · FDA mentor" },
  { label: "Utah orgs", value: "PIVOT Center · University of Utah" },
];

const CANDIDATE_FIELDS = [
  { label: "Skills", value: "GTM · enterprise sales · scaling" },
  { label: "Availability", value: "fractional" },
  { label: "Compensation", value: "cash + equity" },
  { label: "Stage pref", value: "series-a or later" },
  { label: "Domains", value: "AI · SaaS" },
  { label: "Location", value: "Salt Lake City" },
  { label: "Utah orgs", value: "Qualtrics Alumni · Silicon Slopes" },
];

const KINDS = [
  { id: "candidate", icon: Briefcase, label: "Candidate", body: "Operators, executives, engineers, students." },
  { id: "business", icon: Building2, label: "Business", body: "Founders building, hiring, fundraising." },
  { id: "mentor", icon: Compass, label: "Mentor", body: "Advisors and SMEs offering time + expertise." },
  { id: "investor", icon: Coins, label: "VC", body: "Investors looking for Utah businesses to back." },
];

export default function OnboardingPage() {
  const [restartKey, setRestartKey] = useState(0);
  const [phase, setPhase] = useState<
    "kinds" | "business-form" | "business-extracted" | "split"
  >("kinds");
  const [businessFieldsRevealed, setBusinessFieldsRevealed] = useState(0);
  const [candidateFieldsRevealed, setCandidateFieldsRevealed] = useState(0);

  // Phase orchestration.
  useEffect(() => {
    setPhase("kinds");
    setBusinessFieldsRevealed(0);
    setCandidateFieldsRevealed(0);

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    timers.push(setTimeout(() => setPhase("business-form"), 1700));
    // After URL types out (~16 chars * 50ms = 800ms + start delay 2400ms)
    timers.push(
      setTimeout(() => {
        setPhase("business-extracted");
        // Stagger field reveals.
        BUSINESS_FIELDS.forEach((_, i) => {
          timers.push(
            setTimeout(
              () => setBusinessFieldsRevealed((r) => Math.max(r, i + 1)),
              i * 220,
            ),
          );
        });
      }, 4000),
    );
    timers.push(
      setTimeout(() => {
        setPhase("split");
        // Bio + LF type out roughly in parallel; field extraction starts after.
        const bioStart = 600;
        const bioDuration = SARAH_BIO.length * 16;
        const lfDuration = SARAH_LF.length * 16;
        const totalDuration = bioStart + bioDuration + lfDuration + 400;
        CANDIDATE_FIELDS.forEach((_, i) => {
          timers.push(
            setTimeout(
              () => setCandidateFieldsRevealed((r) => Math.max(r, i + 1)),
              totalDuration + i * 200,
            ),
          );
        });
      }, 6800),
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [restartKey]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-24">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">UX · 2 of 4</span>
          <h1 className="mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]">
            Four lanes. One form.
            <br />
            Free text in. Structured profile out.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setRestartKey((k) => k + 1)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-warmgray-200 bg-white px-3 text-xs font-semibold text-warmgray-700 transition hover:border-warmgray-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Replay
        </button>
      </div>

      {phase === "kinds" && (
        <div key={`kinds-${restartKey}`} className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KINDS.map((k, i) => (
            <div
              key={k.id}
              className={
                "show-fade-up rounded-xl border bg-white p-6 transition " +
                (k.id === "business"
                  ? "border-orange-300 shadow-[0_8px_24px_-12px_rgba(37,99,235,0.45)]"
                  : "border-warmgray-200")
              }
              style={{ animationDelay: `${300 + i * 150}ms` }}
            >
              <k.icon
                className={
                  "h-6 w-6 " + (k.id === "business" ? "text-orange-500" : "text-warmgray-500")
                }
                strokeWidth={1.75}
                aria-hidden
              />
              <h2 className="mt-3 font-serif text-xl font-semibold text-ink">{k.label}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-warmgray-600">{k.body}</p>
              {k.id === "business" && (
                <div
                  className="show-fade-in mt-3 inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-orange-700"
                  style={{ animationDelay: "1300ms" }}
                >
                  <Sparkles className="h-2.5 w-2.5" aria-hidden /> selecting…
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {phase === "business-form" && (
        <div key={`bform-${restartKey}`} className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="show-fade-up rounded-xl border border-warmgray-200 bg-white p-7" style={{ animationDelay: "100ms" }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
              Business · onboarding
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
              Tell us about your company.
            </h2>
            <div className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
                Company website
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-orange-300 bg-orange-50/40 px-3 py-2.5 ring-2 ring-orange-100">
                <Globe className="h-4 w-4 text-orange-500" aria-hidden />
                <span className="font-mono text-sm text-ink">
                  <Typewriter text={URL_TEXT} speed={50} startDelay={400} cursor />
                </span>
              </div>
              <div
                className="show-fade-in mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-orange-700"
                style={{ animationDelay: "1300ms" }}
              >
                <Sparkles className="h-3 w-3" aria-hidden /> Fetching public information…
              </div>
            </div>
          </div>
          <aside className="rounded-xl border border-warmgray-200 bg-warmgray-50 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
              Why URL → profile?
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-warmgray-700">
              Founders hate filling forms. They have a website. We extract the
              structured profile from public content + the LLM, then let them
              edit before saving.
            </p>
          </aside>
        </div>
      )}

      {phase === "business-extracted" && (
        <div key={`bext-${restartKey}`} className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="show-fade-up rounded-xl border border-warmgray-200 bg-white p-7" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                Business · onboarding
              </div>
              <span className="font-mono text-[10px] text-emerald-600">
                ✓ extraction complete
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {BUSINESS_FIELDS.slice(0, businessFieldsRevealed).map((f) => (
                <div
                  key={f.label}
                  className="show-fade-right flex items-center justify-between rounded-lg border border-warmgray-200 bg-white px-3 py-2.5"
                  style={{ animationDelay: "0ms" }}
                >
                  <div className="font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
                    {f.label}
                  </div>
                  <div className="text-sm text-ink">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] text-warmgray-500">
              <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
              gpt-5.3-nano · 1.4s · structured-output
            </div>
          </div>
          <aside className="rounded-xl border border-warmgray-200 bg-warmgray-50 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
              Edit anything that's off
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-warmgray-700">
              Every extracted field is editable. The LLM gets the user 90% of
              the way; the user closes the last 10%.
            </p>
          </aside>
        </div>
      )}

      {phase === "split" && (
        <div key={`split-${restartKey}`} className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Business — done */}
          <div className="show-fade-right rounded-xl border border-warmgray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              <Check className="h-3 w-3" aria-hidden /> Business · saved
            </div>
            <h3 className="mt-2 font-serif text-lg font-semibold text-ink">Lumen Bio</h3>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              {BUSINESS_FIELDS.slice(0, 6).map((f) => (
                <div key={f.label} className="rounded-md border border-warmgray-100 bg-warmgray-50 px-2 py-1.5">
                  <div className="font-mono uppercase text-warmgray-500">{f.label}</div>
                  <div className="text-ink">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate — typing now */}
          <div className="show-fade-left rounded-xl border border-orange-200 bg-orange-50/30 p-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <Sparkles className="h-3 w-3" aria-hidden /> Candidate · onboarding
            </div>
            <div className="mt-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">
                Bio
              </label>
              <div className="mt-1 min-h-[80px] rounded-md border border-warmgray-200 bg-white p-2 text-[12px] leading-relaxed text-warmgray-700">
                <Typewriter text={SARAH_BIO} speed={16} startDelay={500} cursor />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">
                What I'm looking for
              </label>
              <div className="mt-1 min-h-[60px] rounded-md border border-orange-200 bg-orange-50 p-2 text-[12px] leading-relaxed text-ink">
                <Typewriter
                  text={SARAH_LF}
                  speed={16}
                  startDelay={600 + SARAH_BIO.length * 16}
                  cursor
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              {CANDIDATE_FIELDS.slice(0, candidateFieldsRevealed).map((f) => (
                <div
                  key={f.label}
                  className="show-fade-up rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5"
                  style={{ animationDelay: "0ms" }}
                >
                  <div className="font-mono uppercase text-emerald-700">{f.label}</div>
                  <div className="text-ink">{f.value}</div>
                </div>
              ))}
            </div>
            {candidateFieldsRevealed >= CANDIDATE_FIELDS.length && (
              <div className="show-fade-up mt-3 inline-flex items-center gap-2 font-mono text-[11px] text-warmgray-500">
                <Sparkles className="h-3 w-3 text-orange-500" aria-hidden />
                gpt-5.3-nano · 1.4s · structured-output
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-12 max-w-3xl text-[14px] leading-relaxed text-warmgray-600">
        Same engine across all four kinds. Business gets URL auto-fill;
        Candidate, Mentor, and Investor type two paragraphs and the model
        extracts everything else. Skills, availability, comp, stage, domains —
        even Utah org affiliations.
      </p>
    </main>
  );
}
