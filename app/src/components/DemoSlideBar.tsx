"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SLIDES, findSlide } from "@/lib/demo/slides";

/**
 * Floating bottom-right controller that drives the canonical demo deck.
 * Renders only when the `nch_demo_active` cookie is set (passed in via the
 * `active` prop — read from server in the layout). Arrow keys advance the
 * deck; the "Exit" button clears the cookie and lets the user navigate freely.
 */
export function DemoSlideBar({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  const current = useMemo(() => findSlide(pathname, search), [pathname, search]);
  const idx = current?.index ?? -1;
  const prev = idx > 0 ? SLIDES[idx - 1] : null;
  const next = idx >= 0 && idx < SLIDES.length - 1 ? SLIDES[idx + 1] : null;

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "ArrowRight" && next) router.push(next.path);
      if (e.key === "ArrowLeft" && prev) router.push(prev.path);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, prev, next, router]);

  if (!active) return null;

  // If we're on a non-slide page (e.g. /resources, /search), still show the bar
  // with a hint to jump back into the deck.
  const onSlide = current !== null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-2xl items-center gap-3 rounded-full border border-warmgray-200 bg-white/95 px-3 py-2 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur">
        <span className="ml-1 inline-flex h-6 items-center rounded-full bg-orange-50 px-2.5 text-[10px] font-semibold uppercase tracking-track text-orange-700">
          Demo
        </span>

        {onSlide ? (
          <span className="min-w-0 truncate text-xs text-warmgray-700">
            <span className="font-mono text-warmgray-400">
              {idx + 1}/{SLIDES.length}
            </span>{" "}
            <span className="font-semibold text-ink">{current!.title}</span>{" "}
            <span className="text-warmgray-500">— {current!.beat}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => router.push(SLIDES[0].path)}
            className="text-xs font-medium text-warmgray-600 hover:text-ink"
          >
            ← back to the deck
          </button>
        )}

        <div className="ml-1 flex items-center gap-1">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && router.push(prev.path)}
            aria-label="Previous slide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-warmgray-700 transition hover:bg-warmgray-50 hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && router.push(next.path)}
            aria-label="Next slide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white transition hover:bg-warmgray-800 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <form action="/api/demo/exit" method="post" className="border-l border-warmgray-100 pl-2">
          <button
            type="submit"
            aria-label="Exit demo"
            title="Exit demo"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-warmgray-500 transition hover:bg-warmgray-50 hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
