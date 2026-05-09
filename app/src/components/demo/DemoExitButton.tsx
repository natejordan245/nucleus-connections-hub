"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/**
 * Lightweight demo affordance for the live header. When the demo cookie is
 * active, renders a "Finish demo" link that routes to `/demo/closing` (the
 * post-demo slide with lessons learned + roadmap). Also binds `cmd+.` as a
 * keyboard shortcut so the presenter can wrap from any page on stage.
 */
export function DemoExitButton({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "." && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/demo/closing");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, router]);

  if (!active) return null;
  return (
    <Link
      href="/demo/closing"
      title="Wrap up & show closing slide (⌘.)"
      className="group inline-flex h-8 items-center gap-1.5 rounded-md border border-warmgray-200 bg-white px-2.5 text-[11px] font-semibold text-warmgray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      <span>Finish demo</span>
    </Link>
  );
}
