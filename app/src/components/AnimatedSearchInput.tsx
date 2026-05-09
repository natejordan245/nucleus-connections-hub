"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  id: string;
  name: string;
  examples: string[];
  className?: string;
  /** Static fallback (used pre-hydrate and when the user starts typing). */
  fallback: string;
};

/**
 * Search input whose `placeholder` cycles through example queries with a
 * typewriter effect. Pauses while the input has focus or value so the
 * animation never fights the user.
 */
export function AnimatedSearchInput({
  id,
  name,
  examples,
  className,
  fallback,
}: Props) {
  const [placeholder, setPlaceholder] = useState(fallback);
  const [paused, setPaused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paused || examples.length === 0) return;

    let exIdx = 0;
    let charIdx = 0;
    let phase: "typing" | "holding" | "deleting" | "pausing" = "typing";
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const target = examples[exIdx];
      if (phase === "typing") {
        charIdx += 1;
        setPlaceholder(target.slice(0, charIdx));
        if (charIdx >= target.length) {
          phase = "holding";
          timeout = setTimeout(tick, 1600);
          return;
        }
        timeout = setTimeout(tick, 65 + Math.random() * 50);
        return;
      }
      if (phase === "holding") {
        phase = "deleting";
        timeout = setTimeout(tick, 200);
        return;
      }
      if (phase === "deleting") {
        charIdx -= 1;
        setPlaceholder(target.slice(0, Math.max(0, charIdx)));
        if (charIdx <= 0) {
          phase = "pausing";
          exIdx = (exIdx + 1) % examples.length;
          timeout = setTimeout(tick, 450);
          return;
        }
        timeout = setTimeout(tick, 28);
        return;
      }
      // pausing → next type cycle
      phase = "typing";
      charIdx = 0;
      timeout = setTimeout(tick, 80);
    };

    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [examples, paused]);

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="search"
      placeholder={placeholder}
      autoComplete="off"
      className={className}
      onFocus={() => {
        setPaused(true);
        setPlaceholder(fallback);
      }}
      onBlur={(e) => {
        if (e.currentTarget.value.length === 0) {
          setPaused(false);
        }
      }}
      onInput={(e) => {
        const hasValue = (e.currentTarget as HTMLInputElement).value.length > 0;
        if (hasValue && !paused) setPaused(true);
      }}
    />
  );
}
