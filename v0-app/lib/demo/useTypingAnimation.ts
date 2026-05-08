"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drives a per-character "typing" animation that fires real onChange callbacks
 * at every step so downstream form state stays consistent.
 *
 * Returns: a `typing` flag (for UI cursor) and a `start(text)` trigger.
 */
export function useTypingAnimation(args: {
  speedMs?: number;
  onChange: (next: string) => void;
}) {
  const { speedMs = 25, onChange } = args;
  const [typing, setTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function start(target: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelledRef.current = false;
    setTyping(true);
    onChangeRef.current(""); // clear field

    let i = 0;
    const tick = () => {
      if (cancelledRef.current) return;
      i += 1;
      onChangeRef.current(target.slice(0, i));
      if (i < target.length) {
        timerRef.current = setTimeout(tick, speedMs);
      } else {
        setTyping(false);
      }
    };
    timerRef.current = setTimeout(tick, speedMs);
  }

  function cancel() {
    cancelledRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTyping(false);
  }

  return { typing, start, cancel };
}
