import { User, Building2, Search, Users } from "lucide-react";

const PIPELINE_STEPS = [
  "embed",
  "ANN top-20",
  "rerank + explain",
  "MIN-bound",
  "rank",
];

const MODES = [
  {
    title: "Subject mode",
    sub: "Candidate → Business",
    leftIcon: User,
    rightIcon: Building2,
    note: "Hard filters: availability, stage, comp",
    delay: 600,
  },
  {
    title: "Peer mode",
    sub: "Candidate ↔ Candidate",
    leftIcon: User,
    rightIcon: Users,
    note: "Relaxed gates · semantic + Utah proximity",
    delay: 900,
  },
  {
    title: "Query mode",
    sub: "free-text → either pool",
    leftIcon: Search,
    rightIcon: User,
    note: "Phrases from your search quoted back",
    delay: 1200,
  },
];

export default function ThreeModesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        Match Quality · 3 of 3
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        One engine.
        <br />
        Three modes.
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {MODES.map((m) => (
          <div
            key={m.title}
            className="show-fade-up overflow-hidden rounded-xl border border-warmgray-200 bg-white p-6"
            style={{ animationDelay: `${m.delay}ms` }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
              {m.title}
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">{m.sub}</h2>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-warmgray-100 bg-warmgray-50 px-4 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <m.leftIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="flex flex-1 items-center justify-center font-mono text-2xl text-warmgray-400">
                <span aria-hidden>→</span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                <m.rightIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-warmgray-600">{m.note}</p>
          </div>
        ))}
      </div>

      <div
        className="show-fade-up mt-12 rounded-xl border border-warmgray-200 bg-warmgray-900 p-6 text-paper"
        style={{ animationDelay: "1700ms" }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">
          Same engine
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {PIPELINE_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-paper">
                {step}
              </span>
              {i < PIPELINE_STEPS.length - 1 && (
                <span className="font-mono text-warmgray-500" aria-hidden>
                  →
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="mt-4 text-[12px] leading-relaxed text-warmgray-400">
          Only the stage-1 hard filters differ between modes. Everything downstream
          — embedding fan-out, top-K, rerank, MIN-bound score, explanation — is
          shared.
        </div>
      </div>
    </main>
  );
}
