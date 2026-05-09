"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Search, Bell } from "lucide-react";

const HOTSPOTS = [
  { id: 0, label: "Score pill", caption: "Calibrated to be honest. Most matches are 65–85%." },
  { id: 1, label: "Reason paragraph", caption: "Quotes your actual query. No black-box ranking." },
  { id: 2, label: "Factor chips", caption: "Per-dimension verdicts. Every match, every time." },
  { id: 3, label: "Concerns block", caption: "Surfaced, not hidden. The trust surface." },
  { id: 4, label: "Bridges drawer", caption: "Partial matches get routed to Utah resources." },
];

export default function DashboardTourPage() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % HOTSPOTS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        UX · 4 of 4
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Every card. Every trust signal. Every time.
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        {/* Mock dashboard */}
        <div
          className="show-fade-up overflow-hidden rounded-xl border border-warmgray-200 bg-white"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center justify-between border-b border-warmgray-100 px-6 py-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-500">
                Sarah's matches
              </span>
              <h2 className="mt-0.5 text-base font-bold text-ink">Top 12 of 247 candidates</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-8 items-center gap-1.5 rounded-md border border-warmgray-200 px-3 text-xs text-warmgray-600">
                <Search className="h-3.5 w-3.5" aria-hidden /> Search
              </button>
              <Bell className="h-4 w-4 text-warmgray-500" aria-hidden />
            </div>
          </div>
          <div className="divide-y divide-warmgray-100">
            <MockCard
              name="Bramble AI"
              kind="business · series-a · ai"
              score={84}
              tone="emerald"
              partial={false}
              activeId={active}
              focusOn={[0, 1, 2]}
            />
            <MockCard
              name="Lumen Bio"
              kind="business · seed · life-sciences"
              score={78}
              tone="emerald"
              partial={true}
              activeId={active}
              focusOn={[2, 3, 4]}
            />
            <MockCard
              name="Heliogen"
              kind="business · seed · energy"
              score={64}
              tone="warmgray"
              partial={true}
              activeId={active}
              focusOn={[3, 4]}
            />
          </div>
          <div className="border-t border-warmgray-100 bg-warmgray-50 px-6 py-2.5 font-mono text-[11px] text-warmgray-500">
            pipeline.timing.ms = 142 · cache.hit = true · matches.shown = 12
          </div>
        </div>

        {/* Annotation cycler */}
        <aside className="space-y-3">
          {HOTSPOTS.map((h) => (
            <div
              key={h.id}
              className={
                "rounded-lg border bg-white p-4 transition " +
                (active === h.id
                  ? "border-orange-500 bg-orange-50 shadow-[0_8px_24px_-12px_rgba(37,99,235,0.45)]"
                  : "border-warmgray-200")
              }
            >
              <div
                className={
                  "text-[11px] font-semibold uppercase tracking-wider " +
                  (active === h.id ? "text-orange-700" : "text-warmgray-400")
                }
              >
                {h.label}
              </div>
              <p
                className={
                  "mt-1.5 text-[12px] leading-relaxed " +
                  (active === h.id ? "text-ink" : "text-warmgray-500")
                }
              >
                {h.caption}
              </p>
            </div>
          ))}
        </aside>
      </div>
    </main>
  );
}

function MockCard({
  name,
  kind,
  score,
  tone,
  partial,
  activeId,
  focusOn,
}: {
  name: string;
  kind: string;
  score: number;
  tone: "emerald" | "warmgray";
  partial: boolean;
  activeId: number;
  focusOn: number[];
}) {
  const isActiveCard = focusOn.includes(activeId);
  return (
    <div
      className={
        "px-6 py-5 transition " + (isActiveCard ? "bg-orange-50/40" : "bg-white")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 text-sm font-bold text-orange-700">
            {name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <div className="font-serif text-lg font-semibold text-ink">{name}</div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
              {kind}
            </div>
          </div>
        </div>
        <span
          className={
            "rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold transition " +
            (tone === "emerald"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-warmgray-200 bg-warmgray-50 text-warmgray-700") +
            (activeId === 0 && isActiveCard ? " ring-2 ring-orange-500 ring-offset-2" : "")
          }
        >
          {score}%
        </span>
      </div>

      <p
        className={
          "mt-3 rounded-md text-[13px] leading-relaxed text-warmgray-700 transition " +
          (activeId === 1 && isActiveCard
            ? "ring-2 ring-orange-500 ring-offset-2 bg-white p-3 -m-1"
            : "")
        }
      >
        Strong on {name === "Bramble AI" ? "AI scaling and series-A GTM" : name === "Lumen Bio" ? "stage fit and Utah anchor" : "energy sector match"}.
        {name === "Lumen Bio" ? " Weaker on FDA / regulatory experience." : ""}
      </p>

      <div
        className={
          "mt-3 flex flex-wrap gap-1.5 transition " +
          (activeId === 2 && isActiveCard ? "ring-2 ring-orange-500 ring-offset-2 rounded-md p-1 -m-1" : "")
        }
      >
        {(["Stage", "Skills", "Wants", "Networks", "Comp"] as const).map((k, i) => (
          <span
            key={k}
            className={
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
              (i % 3 === 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : i % 3 === 1
                  ? "border-warmgray-200 bg-warmgray-50 text-warmgray-600"
                  : "border-orange-200 bg-orange-50 text-orange-700")
            }
          >
            {k} · {i % 3 === 0 ? "strong" : i % 3 === 1 ? "ok" : "weak"}
          </span>
        ))}
      </div>

      {partial && (
        <>
          <div
            className={
              "mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[12px] leading-relaxed text-ink transition " +
              (activeId === 3 && isActiveCard ? "ring-2 ring-orange-500 ring-offset-2" : "")
            }
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <AlertCircle className="h-3 w-3" aria-hidden /> Concerns
            </div>
            {name === "Lumen Bio"
              ? "No FDA / regulatory background. Clinical-stage therapeutic — this gap matters."
              : "Stage too early for Sarah's typical advisory engagements."}
          </div>
          <button
            type="button"
            className={
              "mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-[11px] font-semibold text-orange-700 transition " +
              (activeId === 4 && isActiveCard ? "ring-2 ring-orange-500 ring-offset-2" : "")
            }
          >
            3 Utah resources can close this gap →
          </button>
        </>
      )}
    </div>
  );
}
