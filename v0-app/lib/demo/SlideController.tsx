"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export type SlideDef = {
  index: number;
  path: string;
  title: string;
  beat: string;
};

// Slide order = the demo. If you change this, the chevrons follow.
// Paths are named slugs (no nested directories where avoidable) so the URL
// is legible during a live demo.
export const SLIDES: SlideDef[] = [
  { index: 0, path: "/landing", title: "0. Landing", beat: "Pitch + 'start the demo'" },
  { index: 1, path: "/onboard/talent", title: "1. Onboard talent", beat: "Sarah Chen — bio → fields auto-populate" },
  { index: 2, path: "/profile/talent/tal-sarah-chen", title: "2. Talent profile", beat: "What we built from her bio" },
  { index: 3, path: "/onboard/startup", title: "3. Onboard startup", beat: "Lumen Bio — same flow, mirrored" },
  { index: 4, path: "/profile/startup/sup-lumen-bio", title: "4. Startup profile", beat: "Spinout profile rendered" },
  { index: 5, path: "/matches?as=tal-sarah-chen", title: "5. Matches", beat: "Ranked candidates + Why Was I Matched" },
  { index: 6, path: "/handshake?as=tal-sarah-chen&with=sup-bramble-ai", title: "6. Handshake", beat: "Both sides flip → mutual interest" },
  { index: 7, path: "/affinity-push", title: "7. Affinity push", beat: "What's queued for Nucleus's CRM" },
];

interface SlideCtx {
  current: SlideDef;
  next(): void;
  prev(): void;
  goTo(index: number): void;
  totalSlides: number;
}

const Ctx = createContext<SlideCtx | null>(null);

export function SlideProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const current = useMemo(() => {
    // Find by exact path first, else longest-prefix match (for routes with query strings stripped).
    const exact = SLIDES.find((s) => s.path === pathname);
    if (exact) return exact;
    const prefixMatch = SLIDES.slice()
      .reverse()
      .find((s) => pathname.startsWith(s.path.split("?")[0]) && s.path !== "/");
    return prefixMatch ?? SLIDES[0];
  }, [pathname]);

  const goTo = useCallback(
    (idx: number) => {
      const safe = Math.max(0, Math.min(SLIDES.length - 1, idx));
      router.push(SLIDES[safe].path);
    },
    [router]
  );

  const next = useCallback(() => goTo(current.index + 1), [current.index, goTo]);
  const prev = useCallback(() => goTo(current.index - 1), [current.index, goTo]);

  // Keyboard nav. Ignore when focus is inside an input/textarea (you're typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const value: SlideCtx = { current, next, prev, goTo, totalSlides: SLIDES.length };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlide(): SlideCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSlide must be used inside <SlideProvider>");
  return v;
}
