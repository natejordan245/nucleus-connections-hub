"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  /** ms per character — default 28ms (~36 cps). */
  speed?: number;
  /** delay before starting, ms. */
  startDelay?: number;
  /** whether to render a blinking cursor at the tail. */
  cursor?: boolean;
  className?: string;
  /** fired once when typing reaches the last character. */
  onDone?: () => void;
};

/** Pure client-side typing animation. No deps on lib/data or any backend. */
export function Typewriter({
  text,
  speed = 28,
  startDelay = 0,
  cursor = false,
  className,
  onDone,
}: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = setTimeout(() => {
      const tick = (i: number) => {
        if (cancelled) return;
        if (i >= text.length) {
          onDone?.();
          return;
        }
        setShown(i + 1);
        timer = setTimeout(() => tick(i + 1), speed);
      };
      tick(0);
    }, startDelay);
    return () => {
      cancelled = true;
      clearTimeout(start);
      if (timer) clearTimeout(timer);
    };
  }, [text, speed, startDelay, onDone]);

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {cursor && <span className="show-blink ml-0.5 inline-block w-[2px] -mb-1 h-[1em] bg-current align-middle" aria-hidden />}
    </span>
  );
}
