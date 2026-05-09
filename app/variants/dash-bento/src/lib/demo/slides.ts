export type Slide = {
  index: number;
  path: string;
  title: string;
  beat: string;
  /** True when the slide path is an API route or external exit — the deck
   *  header renders it as a plain anchor so the browser does a real
   *  navigation (cookies on Set-Cookie are honored). */
  external?: boolean;
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
    path: "/search?q=sales",
    title: "Search",
    beat: "One box across people, companies, and resources.",
  },
  {
    index: 2,
    path: "/profile/startup/sup-bramble",
    title: "Why was I matched?",
    beat: "Skill alignment, stage fit, +0.18 Utah boost — and resources to close the gap.",
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
  {
    index: 5,
    path: "/api/demo/exit?to=login",
    title: "Try it for real",
    beat: "Sign in or create an account to use Nucleus on your own data.",
    external: true,
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
