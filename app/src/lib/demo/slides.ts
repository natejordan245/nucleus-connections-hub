export type Slide = {
  index: number;
  path: string;
  title: string;
  beat: string;
};

/**
 * Canonical demo deck. Linear sequence judges walk through with arrow keys.
 * Each slide is a real page route — no special slide rendering — so the demo
 * and the live product share one codebase. The controller (`DemoSlideBar`)
 * translates `→` into router.push(next.path).
 */
export const SLIDES: Slide[] = [
  {
    index: 0,
    path: "/dashboard",
    title: "Home",
    beat: "Sarah's matches, mutual intros, and unread bell — at a glance.",
  },
  {
    index: 1,
    path: "/matches",
    title: "Ranked matches",
    beat: "Each card carries a reason and concerns — no match is sold as perfect.",
  },
  {
    index: 2,
    path: "/profile/startup/sup-bramble",
    title: "Why was I matched?",
    beat: "Skill alignment, stage fit, and a +0.18 Utah ecosystem boost.",
  },
  {
    index: 3,
    path: "/handshake?with=sup-bramble",
    title: "Handshake",
    beat: "Sarah flips to interested. Bramble already did — it goes mutual.",
  },
  {
    index: 4,
    path: "/affinity-push",
    title: "Activity log",
    beat: "Mutual match queues an introduction in the Nucleus CRM.",
  },
];

/** Match a pathname to a slide. `?with=…` kept by suffix-matching the path. */
export function findSlide(pathname: string, search: string): Slide | null {
  const full = search ? `${pathname}?${search.replace(/^\?/, "")}` : pathname;
  // Exact match first.
  const exact = SLIDES.find((s) => s.path === full);
  if (exact) return exact;
  // Fall back to pathname-only match (handshake's slide owns any /handshake URL).
  const path = SLIDES.find((s) => s.path.split("?")[0] === pathname);
  return path ?? null;
}
