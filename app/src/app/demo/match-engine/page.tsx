"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, RefreshCcw, CheckCircle2 } from "lucide-react";
import { Typewriter } from "@/components/demo/Typewriter";

/**
 * Slide 6 — match engine animation.
 *
 * Phases (advance by elapsed time, all in ms):
 *  0 — cards slide in
 *  1 — embedding arrows fan from each card
 *  2 — cosine + MIN formula prints
 *  3 — hard filter ticks
 *  4 — vector top-K flashes
 *  5 — LLM rerank pulses
 *  6 — match card materializes (with reason typing in)
 *  7 — ✓ stamp lands
 */

const REASON =
  "Sarah's enterprise GTM at Qualtrics directly addresses Lumen Bio's biggest commercial gap. Her fractional availability and equity comfort match Lumen's seed budget. Both are anchored in Utah — Silicon Slopes and PIVOT Center share several mentors.";

const FACTORS: Array<{ k: string; v: "strong" | "ok" }> = [
  { k: "Stage", v: "strong" },
  { k: "Skills", v: "ok" },
  { k: "Wants", v: "strong" },
  { k: "Networks", v: "strong" },
  { k: "Comp", v: "ok" },
];

const PHASE_TIMES = [0, 600, 1800, 3000, 3800, 4600, 5800, 9500];
//                   0  1     2     3     4     5     6     7

export default function MatchEnginePage() {
  const [phase, setPhase] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPhase(0);
    let i = 0;
    const advance = () => {
      i += 1;
      if (i >= PHASE_TIMES.length) return;
      const delay = PHASE_TIMES[i] - PHASE_TIMES[i - 1];
      timerRef.current = setTimeout(() => {
        setPhase(i);
        advance();
      }, delay);
    };
    advance();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [restartKey]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-24">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="eyebrow text-orange-500">Match Quality · 1 of 3</span>
          <h1 className="mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]">
            Bidirectional embeddings.
            <br />
            MIN-bound score.
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

      {/* The animation stage */}
      <div className="relative mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr_300px]">
        {/* Sarah card */}
        <SideCard
          name="Sarah Chen"
          sub="Candidate · operator"
          tone="left"
          arrowDir="right"
          phase={phase}
        />

        {/* Center stage */}
        <CenterStage phase={phase} />

        {/* Lumen card */}
        <SideCard
          name="Lumen Bio"
          sub="Business · seed · life-sciences"
          tone="right"
          arrowDir="left"
          phase={phase}
        />
      </div>

      {/* Stage caption strip */}
      <div className="mt-10">
        <PhaseCaption phase={phase} />
      </div>

      {/* Final match card */}
      {phase >= 6 && (
        <div
          key={`match-${restartKey}`}
          className="show-fade-up relative mx-auto mt-12 w-full max-w-3xl rounded-xl border border-warmgray-200 bg-white p-7"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-orange-500">
              Sarah → Lumen Bio · result
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">
              78%
            </span>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">Good match</h2>

          <p className="mt-4 rounded-lg border border-warmgray-100 bg-warmgray-50 p-4 text-[13px] leading-relaxed text-warmgray-700">
            <Typewriter text={REASON} speed={18} startDelay={200} />
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {FACTORS.map((f, i) => (
              <span
                key={f.k}
                className={
                  "show-fade-up inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
                  (f.v === "strong"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-warmgray-200 bg-warmgray-50 text-warmgray-600")
                }
                style={{ animationDelay: `${REASON.length * 18 + 300 + i * 90}ms` }}
              >
                {f.k} · {f.v}
              </span>
            ))}
          </div>

          <div
            className="show-fade-up mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[12px] leading-relaxed text-ink"
            style={{ animationDelay: `${REASON.length * 18 + 800}ms` }}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <AlertCircle className="h-3 w-3" aria-hidden /> Concerns
            </div>
            Sarah has no FDA / regulatory background. Lumen Bio is a clinical-stage
            therapeutic — this gap matters for any CEO conversation.
          </div>

          {phase >= 7 && (
            <div className="show-stamp pointer-events-none absolute -top-4 right-6 flex items-center gap-1.5 rounded-full border-2 border-emerald-500 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Match
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function SideCard({
  name,
  sub,
  tone,
  arrowDir,
  phase,
}: {
  name: string;
  sub: string;
  tone: "left" | "right";
  arrowDir: "left" | "right";
  phase: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className={
        "show-fade-up relative rounded-xl border border-warmgray-200 bg-white p-5 transition-opacity " +
        (phase >= 6 ? "opacity-50" : "opacity-100")
      }
      style={{ animationDelay: tone === "left" ? "100ms" : "200ms" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
          {initials}
        </div>
        <div>
          <div className="font-serif text-base font-semibold text-ink">{name}</div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
            {sub}
          </div>
        </div>
      </div>

      {/* Embedding arrows */}
      {phase >= 1 && (
        <div className="mt-4 space-y-2">
          <ArrowRow
            color="warmgray"
            label="embedding"
            note="who I am"
            dir={arrowDir}
            delay={150}
          />
          <ArrowRow
            color="orange"
            label="embedding_wants"
            note="who I'm looking for"
            dir={arrowDir}
            delay={350}
          />
        </div>
      )}
    </div>
  );
}

function ArrowRow({
  color,
  label,
  note,
  dir,
  delay,
}: {
  color: "orange" | "warmgray";
  label: string;
  note: string;
  dir: "left" | "right";
  delay: number;
}) {
  const palette =
    color === "orange"
      ? "bg-orange-50 border-orange-200 text-orange-700"
      : "bg-warmgray-50 border-warmgray-200 text-warmgray-600";
  return (
    <div
      className={`show-fade-${dir === "right" ? "left" : "right"} flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${palette}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="font-mono text-[11px]">{label}</span>
      <span className="ml-auto text-[10px] text-warmgray-500">{note}</span>
      <span className="font-mono" aria-hidden>
        {dir === "right" ? "→" : "←"}
      </span>
    </div>
  );
}

function CenterStage({ phase }: { phase: number }) {
  return (
    <div className="relative flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-warmgray-200 bg-warmgray-50 p-6">
      {/* Vector space (phase 1+) */}
      {phase >= 1 && phase < 6 && (
        <div className="relative mb-4 h-32 w-32 rounded-full border border-warmgray-300 bg-white">
          <Dot color="warmgray" x="20%" y="30%" delay={200} />
          <Dot color="orange" x="65%" y="35%" delay={400} />
          <Dot color="orange" x="32%" y="68%" delay={600} />
          <Dot color="warmgray" x="72%" y="60%" delay={800} />
          {phase >= 2 && (
            <div className="show-fade-in absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                cosine
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formula (phase 2+) */}
      {phase >= 2 && phase < 6 && (
        <div
          className="show-fade-up rounded-md border border-warmgray-200 bg-white px-3 py-2 text-center font-mono text-[12px] text-ink"
          style={{ animationDelay: "100ms" }}
        >
          score = MIN(cos(her→them), cos(them→her)) ={" "}
          <span className="text-emerald-700">0.78</span>
        </div>
      )}

      {/* Hard filter (phase 3+) */}
      {phase >= 3 && phase < 6 && (
        <div
          className="show-fade-up mt-4 flex flex-wrap justify-center gap-1.5"
          style={{ animationDelay: "100ms" }}
        >
          {["availability", "stage", "comp"].map((g, i) => (
            <span
              key={g}
              className="show-fade-up inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-700"
              style={{ animationDelay: `${200 + i * 120}ms` }}
            >
              {g} ✓
            </span>
          ))}
        </div>
      )}

      {/* Top-K (phase 4+) */}
      {phase >= 4 && phase < 6 && (
        <div
          className="show-fade-up mt-3 rounded-md bg-warmgray-900 px-3 py-1.5 font-mono text-[11px] text-paper"
          style={{ animationDelay: "100ms" }}
        >
          ANN top-20 candidates
        </div>
      )}

      {/* LLM rerank (phase 5+) */}
      {phase >= 5 && phase < 6 && (
        <div
          className="show-fade-up mt-3 flex items-center gap-2"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-0.5">
            <span className="show-dot inline-block h-1.5 w-1.5 rounded-full bg-orange-500" style={{ animationDelay: "0ms" }} />
            <span className="show-dot inline-block h-1.5 w-1.5 rounded-full bg-orange-500" style={{ animationDelay: "200ms" }} />
            <span className="show-dot inline-block h-1.5 w-1.5 rounded-full bg-orange-500" style={{ animationDelay: "400ms" }} />
          </div>
          <span className="font-mono text-[11px] text-warmgray-700">
            gpt-5.5-instant · rerank + explain
          </span>
        </div>
      )}

      {/* Done bookend */}
      {phase >= 6 && (
        <div className="text-center">
          <div className="rounded-full bg-emerald-500 px-3 py-1 font-mono text-[11px] font-bold text-white">
            verdict assembled
          </div>
          <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-warmgray-600">
            Score, reason, factor chips, concerns — all generated together.
          </p>
        </div>
      )}
    </div>
  );
}

function Dot({
  color,
  x,
  y,
  delay,
}: {
  color: "orange" | "warmgray";
  x: string;
  y: string;
  delay: number;
}) {
  const bg = color === "orange" ? "bg-orange-500" : "bg-warmgray-700";
  return (
    <span
      className={`show-fade-up absolute h-2 w-2 rounded-full ${bg}`}
      style={{ left: x, top: y, animationDelay: `${delay}ms` }}
      aria-hidden
    />
  );
}

function PhaseCaption({ phase }: { phase: number }) {
  const captions = [
    "Two profiles. Each carries two embeddings — who they are, who they're looking for.",
    "Embeddings fan into the vector space.",
    "Cosine similarity — both directions. Take the MIN to penalize lopsided pairs.",
    "Hard filters cull anyone who fails availability, stage, or comp gates.",
    "ANN pulls the top-20 candidates by score.",
    "The reranker scores per-dimension and writes the reason paragraph.",
    "Score, reason, factor chips, concerns — all generated together.",
    "Match locked in. Same shape every time.",
  ];
  return (
    <div className="rounded-xl border border-warmgray-200 bg-white px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
        Phase {phase + 1} of {captions.length}
      </div>
      <p key={phase} className="show-fade-up mt-2 text-[14px] leading-relaxed text-ink" style={{ animationDelay: "0ms" }}>
        {captions[phase]}
      </p>
    </div>
  );
}
