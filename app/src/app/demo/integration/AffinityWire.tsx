"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Zap } from "lucide-react";

type Call = {
  method: "POST" | "PUT";
  path: string;
  status: number;
  ms: number;
};

const CALLS: Call[] = [
  { method: "POST", path: "/v2/organizations", status: 200, ms: 41 },
  { method: "POST", path: "/v2/persons", status: 200, ms: 38 },
  { method: "POST", path: "/v2/lists/18271/list-entries", status: 201, ms: 52 },
  { method: "PUT", path: "/v2/list-entries/220887/field-values", status: 200, ms: 33 },
];

// Each call animates over CALL_DURATION; the next call fires CALL_GAP later.
// Tuned so the whole sequence reads in ~1.5s without dragging.
const CALL_DURATION = 360;
const CALL_GAP = 280;

/**
 * Slide 4 hero — animates the four-call Affinity push as a wire diagram.
 *
 * Sequentially:
 *   1. Each call's row fades in.
 *   2. A packet flies along the wire from `connections.hub` to
 *      `api.affinity.co/v2`.
 *   3. The status code + duration drop in.
 *   4. After the last call, the "synced" footer reveals.
 *
 * The animation auto-plays on mount and can be replayed via the button.
 */
export function AffinityWire() {
  const [step, setStep] = useState(-1);
  const [flightKey, setFlightKey] = useState(0);
  const timeouts = useRef<number[]>([]);

  const play = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
    setStep(-1);

    CALLS.forEach((_, i) => {
      const fireAt = 200 + i * CALL_GAP;
      timeouts.current.push(
        window.setTimeout(() => {
          setStep(i);
          setFlightKey((k) => k + 1);
        }, fireAt),
      );
    });
    // "synced" footer appears after the last packet lands.
    timeouts.current.push(
      window.setTimeout(
        () => setStep(CALLS.length),
        200 + (CALLS.length - 1) * CALL_GAP + CALL_DURATION,
      ),
    );
  }, []);

  useEffect(() => {
    play();
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, [play]);

  const total = CALLS.reduce((s, c) => s + c.ms, 0);
  const done = step >= CALLS.length;
  const inFlight = step >= 0 && step < CALLS.length;

  return (
    <div className="mt-6 rounded-2xl border border-warmgray-200 bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.18)]">
      {/* Top strip — endpoints */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-warmgray-100 px-5 py-4">
        <Endpoint
          label="connections.hub"
          sub="zac.hales ↔ plaibook · payload signed"
          align="left"
          tone="ink"
        />
        <Wire active={inFlight} flightKey={flightKey} />
        <Endpoint
          label="api.affinity.co/v2"
          sub="list #18271 · sandbox"
          align="right"
          tone="orange"
        />
      </div>

      {/* Calls */}
      <ul className="divide-y divide-warmgray-100">
        {CALLS.map((call, i) => {
          const fired = step > i;
          const firing = step === i;
          const visible = step >= i;
          return (
            <li
              key={call.path}
              className={
                "grid grid-cols-[56px_1fr_auto_auto] items-baseline gap-3 px-5 py-2.5 font-mono text-[12px] transition-colors duration-200 " +
                (firing ? "bg-orange-50/50" : "")
              }
            >
              <span
                className={
                  "font-semibold transition-opacity duration-200 " +
                  (visible ? "text-warmgray-700 opacity-100" : "opacity-30")
                }
              >
                {call.method}
              </span>
              <span
                className={
                  "truncate transition-opacity duration-200 " +
                  (visible ? "text-warmgray-700 opacity-100" : "text-warmgray-400 opacity-50")
                }
              >
                {call.path}
              </span>
              <span
                className={
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200 " +
                  (fired
                    ? "bg-emerald-100 text-emerald-700 opacity-100"
                    : firing
                      ? "bg-orange-100 text-orange-700 opacity-100"
                      : "bg-warmgray-100 text-warmgray-400 opacity-30")
                }
              >
                {fired ? call.status : firing ? "···" : "—"}
              </span>
              <span
                className={
                  "w-12 text-right transition-opacity duration-200 " +
                  (fired ? "text-warmgray-500 opacity-100" : "opacity-0")
                }
              >
                {call.ms}ms
              </span>
            </li>
          );
        })}
      </ul>

      {/* Synced footer */}
      <div
        className={
          "flex items-center justify-between border-t border-warmgray-100 px-5 py-3 transition-opacity duration-300 " +
          (done ? "opacity-100" : "opacity-0")
        }
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Synced to Affinity in {total}ms
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-warmgray-500">
            {CALLS.length} calls · 1 organization · 1 person · 1 list-entry
          </span>
          <button
            type="button"
            onClick={play}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-warmgray-200 px-2 text-[11px] font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden />
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}

function Endpoint({
  label,
  sub,
  align,
  tone,
}: {
  label: string;
  sub: string;
  align: "left" | "right";
  tone: "ink" | "orange";
}) {
  return (
    <div className={"min-w-0 " + (align === "right" ? "text-right" : "text-left")}>
      <div
        className={
          "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[12px] font-semibold " +
          (tone === "orange"
            ? "bg-orange-500 text-paper"
            : "bg-warmgray-900 text-paper")
        }
      >
        <Zap className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {label}
      </div>
      <div className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
        {sub}
      </div>
    </div>
  );
}

function Wire({ active, flightKey }: { active: boolean; flightKey: number }) {
  return (
    <div className="relative h-7 w-full min-w-[120px] sm:min-w-[200px]">
      {/* Track */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-warmgray-200" />
      {/* Glow under packet (only when active) */}
      {active && (
        <div
          key={`glow-${flightKey}`}
          className="show-wire-fly absolute top-1/2 h-2.5 w-2.5 rounded-full bg-orange-400/60 blur-sm"
        />
      )}
      {/* Packet */}
      {active && (
        <div
          key={`packet-${flightKey}`}
          className="show-wire-fly absolute top-1/2 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(37,99,235,0.18)]"
        />
      )}
      {/* Direction arrow tick at end */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[11px] text-warmgray-400">
        ▶
      </div>
    </div>
  );
}
