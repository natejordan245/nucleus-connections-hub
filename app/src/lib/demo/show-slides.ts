/**
 * Story slideshow registry. Frontend-only — every slide page under `/demo/*`
 * (except `/demo/handoff` and `/demo/closing`) imports nothing from
 * `lib/data`, `lib/supabase`, or `app/api`. Pure UI animations.
 *
 * This supersedes the legacy product-walkthrough deck in `slides.ts`. The
 * deck here pitches the product first; the live product is reached via the
 * `/demo/handoff` slide which POSTs to `/api/demo/start`.
 */
export type ShowSlide = {
  index: number;
  path: string;
  title: string;
  rubric?: "ux" | "match" | "integration" | "innovation" | "setup";
};

export const SHOW_SLIDES: ShowSlide[] = [
  { index: 0, path: "/demo/cold-open", title: "Utah is making the future", rubric: "setup" },
  { index: 1, path: "/demo/vs-linkedin", title: "vs LinkedIn", rubric: "ux" },
  { index: 2, path: "/demo/onboarding", title: "Onboarding", rubric: "ux" },
  { index: 3, path: "/demo/profile-reveal", title: "Structured profile", rubric: "ux" },
  { index: 4, path: "/demo/dashboard-tour", title: "Dashboard tour", rubric: "ux" },
  { index: 5, path: "/demo/match-engine", title: "Match engine", rubric: "match" },
  { index: 6, path: "/demo/rerank-cache", title: "Rerank + cache", rubric: "match" },
  { index: 7, path: "/demo/three-modes", title: "Three modes", rubric: "match" },
  { index: 8, path: "/demo/squarespace", title: "Squarespace inbound", rubric: "integration" },
  { index: 9, path: "/demo/affinity", title: "Affinity outbound", rubric: "integration" },
  { index: 10, path: "/demo/bridges", title: "Bridges over gaps", rubric: "innovation" },
  { index: 11, path: "/demo/handoff", title: "Open the product", rubric: "setup" },
];

export function findShowSlide(pathname: string): ShowSlide | null {
  return SHOW_SLIDES.find((s) => s.path === pathname) ?? null;
}
