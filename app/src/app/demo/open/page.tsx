"use client";

import { DelicateArch } from "@/components/DelicateArch";

const HEADLINE_LINES = [
  ["Match", "Utah's", "people"],
  ["to", "Utah's", "work."],
];

export default function OpenPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-warmgray-900 px-6 text-paper">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(37,99,235,0.5) 0, transparent 35%)",
        }}
      />

      <h1 className="relative z-10 max-w-4xl text-center font-serif text-[56px] leading-[1.04] tracking-[-0.02em] sm:text-[80px]">
        {HEADLINE_LINES.map((line, li) => (
          <span key={li} className="block">
            {line.map((word, wi) => (
              <span
                key={wi}
                className="show-fade-up mr-3 inline-block"
                style={{ animationDelay: `${(li * line.length + wi) * 160}ms` }}
              >
                {word}
              </span>
            ))}
          </span>
        ))}
      </h1>

      <div
        className="show-fade-in absolute bottom-8 right-8 flex items-center gap-2"
        style={{ animationDelay: "1400ms" }}
      >
        <DelicateArch className="h-7 w-7" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-orange-400">
          Connections Hub
        </span>
      </div>
    </main>
  );
}
