/**
 * Story slideshow registry. Five linear slides, ~2 minutes total.
 *
 * Slides 1–4 are pure UI driven by static fixtures — they import production
 * components but never the data store, never `/api/*`. Slide 5 (handoff) is
 * the only one that talks to the backend, and only to set the demo cookie
 * via `/api/demo/start` before redirecting to `/dashboard`.
 *
 * The closing slide at `/demo/closing` is *not* in this registry — it's
 * reached out-of-band via the `Finish demo` icon in the live header.
 */
export type ShowSlide = {
  index: number;
  path: string;
  title: string;
  rubric?: "ux" | "match" | "integration" | "innovation" | "setup";
};

export const SHOW_SLIDES: ShowSlide[] = [
  { index: 0, path: "/demo/open", title: "The bottleneck", rubric: "setup" },
  { index: 1, path: "/demo/profile", title: "The profile", rubric: "ux" },
  { index: 2, path: "/demo/match", title: "The match", rubric: "match" },
  { index: 3, path: "/demo/integration", title: "The integration", rubric: "integration" },
  { index: 4, path: "/demo/handoff", title: "Open the product", rubric: "setup" },
];

export function findShowSlide(pathname: string): ShowSlide | null {
  return SHOW_SLIDES.find((s) => s.path === pathname) ?? null;
}
