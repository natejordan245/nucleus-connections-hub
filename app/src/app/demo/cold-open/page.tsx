"use client";

import { useEffect, useState } from "react";
import { DelicateArch } from "@/components/DelicateArch";

type Stat = { label: string; target: number; suffix?: string; prefix?: string };

const STATS: Stat[] = [
  { target: 247, label: "deep-tech spinouts" },
  { target: 2.1, label: "raised in 2025", prefix: "$", suffix: "B" },
  { target: 3, label: "universities, 1 ecosystem" },
];

const HEADLINE = ["Utah", "is", "making", "the", "future."];

export default function ColdOpenPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-warmgray-900 px-6 text-paper">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.5) 0, transparent 35%)",
          }}
        />
      </div>

      <h1 className="relative z-10 max-w-4xl text-center font-serif text-[56px] leading-[1.04] tracking-[-0.02em] sm:text-[72px]">
        {HEADLINE.map((word, i) => (
          <span
            key={i}
            className="show-fade-up mr-3 inline-block"
            style={{ animationDelay: `${i * 180}ms` }}
          >
            {word}
          </span>
        ))}
      </h1>

      <div className="relative z-10 mt-16 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
        {STATS.map((stat, i) => (
          <StatCell key={i} stat={stat} delay={1200 + i * 220} />
        ))}
      </div>

      <p
        className="show-fade-in relative z-10 mt-10 text-center text-xs uppercase tracking-[0.18em] text-warmgray-300"
        style={{ animationDelay: "2200ms" }}
      >
        Salt Lake City · Provo · Logan
      </p>

      <div
        className="show-fade-in absolute bottom-8 right-8 flex items-center gap-2"
        style={{ animationDelay: "2600ms" }}
      >
        <DelicateArch className="h-7 w-7" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-orange-400">
          Connections Hub
        </span>
      </div>
    </main>
  );
}

function StatCell({ stat, delay }: { stat: Stat; delay: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let started = false;
    const startTimer = setTimeout(() => {
      started = true;
      const startTs = performance.now();
      const duration = 1500;
      const tick = (now: number) => {
        const elapsed = Math.min(now - startTs, duration);
        const eased = 1 - Math.pow(1 - elapsed / duration, 3);
        setVal(stat.target * eased);
        if (elapsed < duration) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(startTimer);
      if (started && raf) cancelAnimationFrame(raf);
    };
  }, [stat, delay]);

  const isFloat = stat.target % 1 !== 0;
  const display = isFloat ? val.toFixed(1) : Math.round(val).toString();

  return (
    <div
      className="show-fade-up bg-warmgray-900 px-6 py-5"
      style={{ animationDelay: `${delay - 200}ms` }}
    >
      <div className="font-mono text-[36px] leading-none text-paper">
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <div className="mt-2 text-xs text-warmgray-300">{stat.label}</div>
    </div>
  );
}
