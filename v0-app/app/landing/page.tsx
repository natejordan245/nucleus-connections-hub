"use client";

import Link from "next/link";
import { DelicateArch } from "@/components/DelicateArch";

export default function LandingPage() {
  return (
    <div className="-mx-6 -mb-10 -mt-10 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-12 px-8 pt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div>
          <span className="eyebrow text-orange-500">
            Official Ecosystem Portal · Innovation Hub
          </span>

          <h1 className="mt-6 font-serif text-[56px] font-semibold leading-[1.04] tracking-[-0.02em] text-ink sm:text-[64px] lg:text-[72px]">
            AI-powered<br />
            matching for the<br />
            Utah innovation<br />
            ecosystem.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-warmgray-600">
            We pair operators, executives, students, and advisors with Utah deep-tech
            startups and university spinouts — using embeddings, an LLM re-ranker that
            explains every match, and a Utah-specific ecosystem graph that LinkedIn
            cannot see.
          </p>

          <div className="mt-9">
            <Link
              href="/onboard/talent"
              className="group inline-flex items-center gap-3 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600 hover:shadow-[0_10px_30px_-8px_rgba(255,114,39,0.7)]"
            >
              Start the demo
              <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <p className="eyebrow mt-10 text-warmgray-400">
            Navigate with keyboard arrow keys or the controls above.
          </p>
        </div>

        {/* Arch column — pure visual, in its own grid cell so it never overlaps text. */}
        <ArchPanel />
      </div>

      <footer className="mx-auto mt-12 flex w-full max-w-6xl items-center justify-between border-t border-warmgray-100 px-8 py-6 text-[10px] uppercase tracking-track text-warmgray-400">
        <span>© 2026 Nucleus Connections Hub</span>
        <span>Salt Lake City, Utah</span>
      </footer>
    </div>
  );
}

function ArchPanel() {
  return (
    <div className="relative hidden h-[420px] items-center justify-center md:flex lg:h-[520px]">
      <DelicateArch className="h-full w-full text-warmgray-200" />
    </div>
  );
}
