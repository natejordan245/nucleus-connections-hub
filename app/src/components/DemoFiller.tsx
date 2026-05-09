"use client";

import { useEffect } from "react";

/**
 * Demo helper: double-click any input/textarea with a `data-sample` attribute
 * to auto-fill it with the sample text, animated as if typing.
 *
 * Implementation note — controlled inputs in React don't pick up `el.value =
 * "x"` directly because React tracks the previous value via an internal
 * descriptor. The accepted workaround is to call the prototype setter and
 * then dispatch a bubbling `input` event, which React's synthetic-event
 * listener picks up the same way it would for a real keystroke. This works
 * for both controlled and uncontrolled inputs.
 *
 * Render this component once per page that wants the behavior — it installs
 * a single document-level dblclick listener.
 */
export function DemoFiller() {
  useEffect(() => {
    const inputSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    const textareaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
      const setter = el instanceof HTMLTextAreaElement ? textareaSetter : inputSetter;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }

    let activeEl: HTMLInputElement | HTMLTextAreaElement | null = null;
    let cancelled = false;

    async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
      activeEl = el;
      // Adaptive cadence so long bios don't take forever.
      const charDelayMs = Math.max(8, Math.min(28, Math.round(900 / text.length)));
      setNativeValue(el, "");
      for (let i = 1; i <= text.length; i++) {
        if (cancelled || activeEl !== el) return;
        setNativeValue(el, text.slice(0, i));
        await new Promise((r) => setTimeout(r, charDelayMs));
      }
      activeEl = null;
    }

    function handleDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLInputElement | HTMLTextAreaElement>(
        "input[data-sample], textarea[data-sample]",
      );
      if (!el) return;
      if (document.activeElement !== el) el.focus();
      const sample = el.dataset.sample;
      if (!sample) return;
      typeInto(el, sample);
    }

    document.addEventListener("dblclick", handleDblClick);
    return () => {
      cancelled = true;
      document.removeEventListener("dblclick", handleDblClick);
    };
  }, []);

  return null;
}
