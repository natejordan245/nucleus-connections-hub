"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { SLIDES, findSlide } from "@/lib/demo/slides";

/**
 * Top-of-app strip that surfaces the demo deck. Each slide is a real route,
 * so we render them as a tabbed page nav. Active tab gets the orange rule;
 * arrow keys still advance/rewind for hands-off walkthroughs.
 */
export function DemoDeckHeader({ active }: { active: boolean }) {
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
    function go(path: string, external: boolean | undefined) {
      if (external) {
        window.location.href = path;
      } else {
        router.push(path);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "ArrowRight" && next) go(next.path, next.external);
      if (e.key === "ArrowLeft" && prev) go(prev.path, prev.external);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, prev, next, router]);

  if (!active) return null;

  return (
    <div className="border-b border-warmgray-100 bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 pt-3">
        <span className="inline-flex h-6 items-center rounded-full bg-orange-50 px-2.5 text-[10px] font-semibold uppercase tracking-track text-orange-700">
          Demo deck
        </span>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {SLIDES.map((s) => {
            const isActive = s.index === idx;
            const className =
              "relative inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs font-medium transition " +
              (isActive
                ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-500"
                : s.external
                  ? "text-orange-600 hover:text-orange-700"
                  : "text-warmgray-600 hover:text-ink");
            const inner = (
              <>
                <span className="font-mono text-[10px] text-warmgray-400">
                  {s.index + 1}
                </span>
                {s.title}
              </>
            );
            return s.external ? (
              <a key={s.index} href={s.path} className={className}>
                {inner}
              </a>
            ) : (
              <Link key={s.index} href={s.path} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!prev}
            onClick={() => {
              if (!prev) return;
              if (prev.external) window.location.href = prev.path;
              else router.push(prev.path);
            }}
            aria-label="Previous slide"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-warmgray-700 transition hover:bg-warmgray-50 hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => {
              if (!next) return;
              if (next.external) window.location.href = next.path;
              else router.push(next.path);
            }}
            aria-label="Next slide"
            className={
              "inline-flex h-8 items-center justify-center rounded-full text-white transition disabled:opacity-30 " +
              (next?.external
                ? "gap-1 bg-orange-500 px-3 hover:bg-orange-600"
                : "w-8 bg-ink hover:bg-warmgray-800")
            }
          >
            {next?.external ? (
              <>
                <span className="text-xs font-semibold">Try it for real</span>
                <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
              </>
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            )}
          </button>

          <form action="/api/demo/exit" method="post" className="ml-1 border-l border-warmgray-100 pl-1">
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

      {current?.beat && (
        <p className="mx-auto w-full max-w-6xl px-6 pb-3 text-xs leading-relaxed text-warmgray-600">
          {current.beat}
        </p>
      )}
    </div>
  );
}
