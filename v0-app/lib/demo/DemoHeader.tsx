"use client";

import Link from "next/link";
import { useSlide, SLIDES } from "./SlideController";
import { Suspense, useEffect, useRef, useState } from "react";
import { NotificationBell } from "./NotificationBell";

export function DemoHeader() {
  const { current, next, prev, goTo } = useSlide();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-warmgray-100 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8">
        <Link
          href="/landing"
          className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          Nucleus Utah
        </Link>

        <div ref={ref} className="flex items-center gap-1.5">
          <Suspense fallback={<span className="h-7 w-7" />}>
            <NotificationBell />
          </Suspense>
          <span className="mx-1 h-4 w-px bg-warmgray-200" aria-hidden />
          <button
            onClick={prev}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-warmgray-200 text-warmgray-600 hover:bg-warmgray-50"
            aria-label="Previous slide"
          >
            ‹
          </button>

          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-md border border-warmgray-200 px-3 py-1 text-[11px] font-medium tracking-wide text-warmgray-700 hover:bg-warmgray-50"
            >
              {current.title}
            </button>
            {open && (
              <div className="absolute right-0 z-50 mt-1.5 w-72 overflow-hidden rounded-md border border-warmgray-200 bg-white shadow-lg">
                {SLIDES.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => {
                      setOpen(false);
                      goTo(s.index);
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs transition hover:bg-sand-50 ${
                      s.index === current.index
                        ? "bg-sand-100 text-orange-600"
                        : "text-warmgray-700"
                    }`}
                  >
                    <div className="font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-warmgray-500">{s.beat}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={next}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-warmgray-200 text-warmgray-600 hover:bg-warmgray-50"
            aria-label="Next slide"
          >
            ›
          </button>
        </div>
      </div>
    </header>
  );
}
