import { Check, X as XIcon, AlertCircle } from "lucide-react";

export default function VsLinkedInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        UX · 1 of 4
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[48px]"
        style={{ animationDelay: "250ms" }}
      >
        Same person.
        <br />
        Different platform.
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left — LinkedIn */}
        <div
          className="show-fade-right relative overflow-hidden rounded-xl border border-warmgray-200 bg-warmgray-50 p-6 text-warmgray-500"
          style={{ animationDelay: "500ms" }}
        >
          <div className="absolute inset-0 bg-warmgray-50/40 mix-blend-saturation" aria-hidden />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider">linkedin · search</span>
            <span className="font-mono text-[11px]">5,400 results</span>
          </div>
          <h2 className="mt-3 text-base font-semibold text-warmgray-700">
            VP of Sales · Utah · Remote
          </h2>
          <ul className="mt-4 space-y-2.5">
            {[
              { name: "Recruiter at Generic SaaS", line: "5,400 followers · 1st" },
              { name: "Talent Lead at Acme HR", line: "12,800 followers · 2nd" },
              { name: "Open To Work · profile #4291", line: "open to opportunities" },
              { name: "Senior recruiter, mid-market", line: "8,200 followers · 3rd" },
            ].map((row, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-warmgray-200 bg-white/80 px-3 py-2.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-warmgray-700">{row.name}</div>
                  <div className="text-[11px] text-warmgray-500">{row.line}</div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-warmgray-300 px-3 py-1 text-[11px] font-semibold text-warmgray-600"
                  disabled
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-warmgray-300 bg-white px-4 py-3 text-[12px] italic text-warmgray-600">
            <AlertCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden /> "Why was I shown this match? No reason given."
          </div>
        </div>

        {/* Right — Connections Hub */}
        <div
          className="show-fade-left relative overflow-hidden rounded-xl border border-warmgray-200 bg-white p-6"
          style={{ animationDelay: "800ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-orange-500">
              connections hub · match
            </span>
            <span className="font-mono text-[11px] text-warmgray-500">cached · 142ms</span>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-orange-700">
              LB
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold text-ink">Lumen Bio</h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                  78%
                </span>
              </div>
              <p className="mt-1 text-xs text-warmgray-500">
                Light-activated cancer therapeutics · U of U PIVOT spinout · seed
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-warmgray-100 bg-warmgray-50 p-4 text-[13px] leading-relaxed text-warmgray-700">
            Sarah's enterprise GTM at Qualtrics directly addresses Lumen's biggest commercial gap.
            Her fractional availability and equity comfort match Lumen's seed budget. Both are
            anchored in Utah — Silicon Slopes and PIVOT Center share several mentors.
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              ["Stage", "strong", "emerald"],
              ["Skills", "ok", "warmgray"],
              ["Wants", "strong", "emerald"],
              ["Networks", "strong", "emerald"],
              ["Comp", "ok", "warmgray"],
            ].map(([k, v, tone]) => (
              <span
                key={k}
                className={
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
                  (tone === "emerald"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-warmgray-200 bg-warmgray-50 text-warmgray-600")
                }
              >
                {k} · {v}
              </span>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[12px] leading-relaxed text-ink">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <AlertCircle className="h-3 w-3" aria-hidden /> Concerns
            </div>
            Sarah has no FDA / regulatory background. Lumen Bio is a clinical-stage
            therapeutic — this gap matters for any CEO conversation.
          </div>
        </div>
      </div>

      <div
        className="show-fade-up mt-12 overflow-hidden rounded-lg border border-warmgray-200 bg-white"
        style={{ animationDelay: "1200ms" }}
      >
        <table className="w-full text-sm">
          <thead className="bg-warmgray-50">
            <tr className="text-left">
              <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
                feature
              </th>
              <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
                LinkedIn
              </th>
              <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-orange-500">
                Connections Hub
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warmgray-100">
            {[
              "Tells you why you matched",
              "Surfaces concerns up-front",
              "Knows about Utah-specific orgs",
              "Routes to mentors when imperfect",
            ].map((row) => (
              <tr key={row}>
                <td className="px-5 py-3 text-warmgray-700">{row}</td>
                <td className="px-5 py-3 text-warmgray-400">
                  <XIcon className="h-4 w-4" aria-hidden />
                </td>
                <td className="px-5 py-3 text-emerald-600">
                  <Check className="h-4 w-4" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
