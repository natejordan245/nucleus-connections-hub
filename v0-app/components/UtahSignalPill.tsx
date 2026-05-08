"use client";

import { cn } from "@/lib/utils";

export function UtahSignalPill({
  reasons,
  boost,
  className,
}: {
  reasons: string[];
  boost: number;
  className?: string;
}) {
  if (reasons.length === 0) return null;
  return (
    <span
      className={cn(
        "group relative inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-sand-50 px-2 py-0.5 text-[10px] font-medium text-orange-600",
        className
      )}
      title={reasons.join(" • ")}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-400" />
      Utah signal +{boost.toFixed(2)}
    </span>
  );
}
