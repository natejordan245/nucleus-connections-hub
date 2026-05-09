import type { ReactNode } from "react";
import { SlideShellNav } from "@/components/demo/SlideShellNav";

/**
 * The story-slideshow layout. Sits OUTSIDE the (app) group so it doesn't
 * inherit `<AppShell>`. Pure UI — pages under `/demo/*` (except `/handoff`
 * and `/closing`) must not import from `lib/data` or `lib/supabase`.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SlideShellNav />
      {children}
    </div>
  );
}
