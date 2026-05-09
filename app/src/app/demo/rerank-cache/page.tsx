import { Database, Filter, Cpu, Sparkles, Zap, Layers } from "lucide-react";

const PIPELINE = [
  { icon: Sparkles, label: "embed query", cost: "$0.00002 / query", note: "1× per page" },
  { icon: Database, label: "ANN top-20", cost: "0 LLM tokens", note: "vector index" },
  { icon: Filter, label: "hard filter", cost: "0 cost", note: "stage / comp / availability" },
  { icon: Cpu, label: "LLM rerank + explain", cost: "$0.0008 / pair", note: "cached on content hash" },
  { icon: Zap, label: "MIN-bound score", cost: "0 cost", note: "bidirectional fairness" },
  { icon: Layers, label: "ranked list", cost: "—", note: "served to UI" },
];

export default function RerankCachePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        Match Quality · 2 of 3
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Pay OpenAI once per pair.
        <br />
        Not once per page load.
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left — pipeline */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            The pipeline
          </div>
          <ol className="mt-3 space-y-2">
            {PIPELINE.map((step, i) => (
              <li
                key={step.label}
                className="show-fade-right flex items-center gap-4 rounded-lg border border-warmgray-200 bg-white px-4 py-3"
                style={{ animationDelay: `${500 + i * 180}ms` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  <step.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink">{step.label}</div>
                  <div className="font-mono text-[11px] text-warmgray-500">{step.note}</div>
                </div>
                <span className="font-mono text-[11px] text-warmgray-700">{step.cost}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Right — cache */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            The cache
          </div>
          <div
            className="show-fade-left mt-3 rounded-xl border border-warmgray-200 bg-warmgray-900 p-6 font-mono text-[13px] leading-relaxed text-paper"
            style={{ animationDelay: "1200ms" }}
          >
            <div className="text-orange-400">// match-cache key</div>
            <div className="mt-1 break-all text-paper">
              subject:candidate:tal-sarah-chen
              <br />
              :business:k=20
            </div>
            <div className="mt-4 text-orange-400">// fingerprint</div>
            <div className="mt-1 text-warmgray-300">
              viewerHash<span className="text-paper">: 8f3a…</span>
            </div>
            <div className="text-warmgray-300">
              poolRevision<span className="text-paper">: 142</span>
            </div>
            <div className="mt-4 text-orange-400">// invalidates on</div>
            <div className="text-warmgray-300">bio · lookingFor · skills · domains</div>
            <div className="mt-2 text-orange-400">// ignores</div>
            <div className="text-warmgray-300">photo · socials · createdAt</div>
          </div>

          <div
            className="show-fade-up mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-[13px] leading-relaxed text-ink"
            style={{ animationDelay: "1700ms" }}
          >
            Cosmetic edits don't bust the cache. Meaningful edits to bio or
            looking-for do. We pay OpenAI once per pair, not once per page load.
          </div>

          <div
            className="show-fade-up mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-warmgray-200 bg-warmgray-200"
            style={{ animationDelay: "2000ms" }}
          >
            <Stat label="cache hits" value="91%" />
            <Stat label="cold avg" value="1.4s" />
            <Stat label="warm avg" value="142ms" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-warmgray-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
