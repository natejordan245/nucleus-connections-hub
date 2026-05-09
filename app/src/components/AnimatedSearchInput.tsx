"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_QUERIES } from "@/lib/embedding/demo-queries";

type Props = {
  id: string;
  name: string;
  examples: string[];
  className?: string;
  /** Static fallback (used pre-hydrate and when the user starts typing). */
  fallback: string;
  /**
   * Phrases to cycle through on double-click. Defaults to the pre-warmed
   * `DEMO_QUERIES` so the typed phrase is guaranteed to hit the embedding
   * cache and land an instant search result.
   */
  demoPhrases?: readonly string[];
};

/**
 * Search input whose `placeholder` cycles through example queries with a
 * typewriter effect. Pauses while the input has focus or value so the
 * animation never fights the user.
 *
 * Double-click types out a pre-warmed phrase — that phrase is guaranteed to
 * be cached in the embedding layer, so submitting it returns instantly.
 */
export function AnimatedSearchInput({
  id,
  name,
  examples,
  className,
  fallback,
  demoPhrases = DEMO_QUERIES,
}: Props) {
  const [placeholder, setPlaceholder] = useState(fallback);
  const [paused, setPaused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const demoIdxRef = useRef(0);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cancel any in-flight demo typing on unmount — otherwise a stale timeout
  // could fire after the input is gone.
  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    };
  }, []);

  // Animate-type a pre-warmed demo phrase into the input. Native input.value
  // is set then dispatched as an `input` event so React's controlled-input
  // reconciliation picks it up correctly (the ref is uncontrolled here).
  const typeDemoPhrase = () => {
    const input = inputRef.current;
    if (!input || demoPhrases.length === 0) return;

    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
      demoTimeoutRef.current = null;
    }

    setPaused(true);
    const phrase = demoPhrases[demoIdxRef.current % demoPhrases.length];
    demoIdxRef.current = (demoIdxRef.current + 1) % demoPhrases.length;

    const setValue = (v: string) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    setValue("");
    input.focus();
    let i = 0;
    const tick = () => {
      i += 1;
      setValue(phrase.slice(0, i));
      if (i < phrase.length) {
        demoTimeoutRef.current = setTimeout(tick, 32 + Math.random() * 38);
      } else {
        demoTimeoutRef.current = null;
      }
    };
    demoTimeoutRef.current = setTimeout(tick, 60);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="search"
      placeholder={placeholder}
      autoComplete="off"
      className={className}
      onDoubleClick={typeDemoPhrase}
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
