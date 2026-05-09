import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { DelicateArch } from "@/components/DelicateArch";

const LESSONS = [
  {
    title: "The 'perfect match' theater hurts users",
    body:
      "First instinct was to inflate scores so every match looked great. We pulled back, calibrated 65–85% as the honest middle, and built the gap-closer as the answer. Score honesty isn't a UX problem — it's the differentiator.",
  },
  {
    title: "Mock-first architecture is a force multiplier",
    body:
      "Two strategy boundaries (frontend↔API, API↔data layer), each with mock + Supabase implementations. Three of us shipped in parallel from day one. The demo never goes dark; the live path lights up piece by piece.",
  },
  {
    title: "Embeddings need intent, not just biography",
    body:
      "A single 'who I am' embedding makes lopsided matches. Splitting into embedding + embedding_wants and taking the MIN of both directions was the single biggest quality gain — it penalizes pairs where one side is excited and the other isn't.",
  },
  {
    title: "Utah-specific isn't a graph; it's a routing layer",
    body:
      "We started building a Utah-org graph database. Killed it. Utah's value is the people, programs, and capital that already exist here. We pivoted to a routing layer for that network.",
  },
];

const NEAR_TERM = [
  "Live pgvector query path (mock-first today)",
  "Real Affinity API with Nucleus credentials",
  "Squarespace inbound webhook hardened + reviewer URL",
  "Resources catalog grown to 50+ Utah-tied entries",
];

const MID_TERM = [
  "Talent upskilling recommendations (the bounty's optional bonus)",
  "Operator analytics dashboard for Nucleus team",
  "Squarespace embed widget — matches inline on nucleusutah.org",
];

const LONG_TERM = [
  "Cross-state expansion (Boise, Boulder, Phoenix, Austin)",
  "Outcome-tracked matching — feed real outcomes back into rerank",
  "Founder-introducer flywheel — public ecosystem-connector profiles",
];

export default function ClosingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        What we learned · where this goes
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px]"
        style={{ animationDelay: "250ms" }}
      >
        The honest middle is the win.
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Lessons */}
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            Lessons learned
          </div>
          <ul className="mt-4 space-y-5">
            {LESSONS.map((l, i) => (
              <li
                key={l.title}
                className="show-fade-up rounded-xl border border-warmgray-200 bg-white p-5"
                style={{ animationDelay: `${500 + i * 180}ms` }}
              >
                <h3 className="font-serif text-lg font-semibold text-ink">{l.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-warmgray-600">{l.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Roadmap */}
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            Where this goes
          </div>
          <div className="mt-4 space-y-4">
            <Horizon
              delay={700}
              label="Near term · 30 days"
              items={NEAR_TERM}
              tone="emerald"
            />
            <Horizon delay={1100} label="Mid term · 6 months" items={MID_TERM} tone="orange" />
            <Horizon delay={1500} label="Long term · the bigger bet" items={LONG_TERM} tone="warmgray" />
          </div>
        </section>
      </div>

      <div
        className="show-fade-up mt-16 flex flex-col items-center gap-4 border-t border-warmgray-200 pt-10 text-center"
        style={{ animationDelay: "2200ms" }}
      >
        <div className="flex items-center gap-2 text-warmgray-500">
          <DelicateArch className="h-5 w-5" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-orange-500">
            Connections Hub
          </span>
        </div>
        <p className="max-w-xl text-[14px] leading-relaxed text-warmgray-600">
          Built for the Nucleus Utah bounty. Thank you for watching — happy to dive
          into the architecture, the engine, the cache, or anything you saw.
        </p>
        <Link
          href="https://github.com/natejordan245/nucleus-connections-hub"
          className="group inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-warmgray-800"
        >
          <Code2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Open on GitHub
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </main>
  );
}

function Horizon({
  delay,
  label,
  items,
  tone,
}: {
  delay: number;
  label: string;
  items: string[];
  tone: "emerald" | "orange" | "warmgray";
}) {
  const accent = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    warmgray: "border-warmgray-200 bg-warmgray-50 text-warmgray-700",
  }[tone];
  return (
    <div
      className="show-fade-up rounded-xl border border-warmgray-200 bg-white p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${accent}`}
      >
        {label}
      </div>
      <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-warmgray-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-orange-500" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
