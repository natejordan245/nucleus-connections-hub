import { AlertCircle } from "lucide-react";
import type { MatchDTO } from "@/lib/data/types";

export function ExplainabilityPanel({ match }: { match: MatchDTO }) {
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
      <span className="eyebrow text-orange-500">Why was I matched?</span>
      <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-ink">
        Score breakdown
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-warmgray-700">{match.reason}</p>

      <ul className="mt-6 space-y-3">
        {match.factors.map((f) => (
          <li key={f.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{f.label}</span>
              <span className="font-mono text-xs text-warmgray-500">
                {Math.round(f.weight * 100)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-warmgray-100">
              <div
                className="h-full rounded-full bg-orange-400"
                style={{ width: `${Math.round(f.weight * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-warmgray-500">{f.detail}</p>
          </li>
        ))}
      </ul>

      {match.concerns.length > 0 && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-sand-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-4 w-4 text-orange-600"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="eyebrow text-orange-700">Worth verifying</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-warmgray-700">
            {match.concerns.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
