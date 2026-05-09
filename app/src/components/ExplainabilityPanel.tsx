import { AlertCircle } from "lucide-react";
import { InfoButton } from "@/components/InfoButton";
import type { MatchDTO } from "@/lib/data/types";

export function ExplainabilityPanel({ match }: { match: MatchDTO }) {
  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <span className="eyebrow text-orange-500">Why was I matched?</span>
        <h2 className="mt-1 text-sm font-semibold text-ink">Score breakdown</h2>
      </div>
      <div className="p-4">
        <p className="text-sm leading-relaxed text-warmgray-700">{match.reason}</p>

        <ul className="mt-4 space-y-2.5">
          {match.factors.map((f) => (
            <li key={f.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  {f.label}
                  <InfoButton label={`Why this factor: ${f.label}`}>
                    {f.detail}
                  </InfoButton>
                </span>
                <span className="font-mono text-[11px] font-bold text-warmgray-700">
                  {Math.round(f.weight * 100)}%
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-warmgray-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.round(f.weight * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        {match.concerns.length > 0 && (
          <div className="mt-4 rounded-md border border-orange-200 bg-sand-50 p-3">
            <div className="flex items-center gap-1.5">
              <AlertCircle
                className="h-3.5 w-3.5 text-orange-600"
                strokeWidth={2}
                aria-hidden
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-orange-700">
                worth verifying
              </span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-warmgray-700">
              {match.concerns.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
