"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

type Props = {
  /** Content to render inside the popover bubble. */
  children: React.ReactNode;
  /** Accessible label for the trigger button. */
  label?: string;
  /** Where the bubble flows from the trigger. Defaults to "below-end". */
  placement?: "below-start" | "below-end";
};

/**
 * Small inline `i` trigger that reveals a popover bubble on click. Used to
 * tuck per-row explanations behind a glyph so dense lists (factor breakdowns,
 * stats with footnotes) stay scannable.
 *
 * Closes on outside click and on Escape.
 */
export function InfoButton({
  children,
  label = "More info",
  placement = "below-end",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const bubblePos =
    placement === "below-start"
      ? "left-0 origin-top-left"
      : "right-0 origin-top-right";

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-warmgray-400 transition hover:text-ink"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute top-full z-20 mt-1.5 w-64 rounded-md border border-warmgray-200 bg-white p-2.5 text-[11px] leading-relaxed text-warmgray-700 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] ${bubblePos}`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
