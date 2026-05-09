"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SHOW_SLIDES, findShowSlide } from "@/lib/demo/show-slides";

/**
 * Renders the keyboard-bound navigation chrome that wraps every story-slideshow
 * page. Listens for `→` / `←` / `space` and calls `router.push(next.path)`.
 * Also renders the top progress bar + a small exit affordance.
 */
export function SlideShellNav() {
  const router = useRouter();
  const pathname = usePathname();
  const slide = findShowSlide(pathname);

  useEffect(() => {
    if (!slide) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Spacebar") {
        const next = SHOW_SLIDES[slide.index + 1];
        if (next) {
          e.preventDefault();
          router.push(next.path);
        }
      } else if (e.key === "ArrowLeft") {
        const prev = SHOW_SLIDES[slide.index - 1];
        if (prev) {
          e.preventDefault();
          router.push(prev.path);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        router.push("/");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide, router]);

  if (!slide) return null;
  const total = SHOW_SLIDES.length;
  const progress = ((slide.index + 1) / total) * 100;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-warmgray-100">
        <div
          className="h-full bg-orange-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="fixed top-3 right-4 z-50 flex items-center gap-3 text-[11px] font-mono text-warmgray-400">
        <span>
          {String(slide.index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <Link
          href="/"
          aria-label="Exit slideshow"
          className="flex h-7 w-7 items-center justify-center rounded-md text-warmgray-400 transition hover:bg-warmgray-100 hover:text-ink"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 flex items-center gap-1 rounded-full border border-warmgray-200 bg-white/90 px-1.5 py-1 text-warmgray-500 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => {
            const prev = SHOW_SLIDES[slide.index - 1];
            if (prev) router.push(prev.path);
          }}
          disabled={slide.index === 0}
          aria-label="Previous slide"
          className="flex h-7 w-7 items-center justify-center rounded-full text-warmgray-500 transition hover:bg-warmgray-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            const next = SHOW_SLIDES[slide.index + 1];
            if (next) router.push(next.path);
          }}
          disabled={slide.index === total - 1}
          aria-label="Next slide"
          className="flex h-7 w-7 items-center justify-center rounded-full text-warmgray-500 transition hover:bg-warmgray-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </>
  );
}
