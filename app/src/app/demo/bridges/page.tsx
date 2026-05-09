import { AlertCircle, MapPin, BookOpen, Users, GraduationCap } from "lucide-react";

const RESOURCES = [
  {
    icon: Users,
    kind: "Mentor",
    title: "PIVOT Center FDA mentor program",
    body:
      "Curated FDA-experienced mentors at U of U's tech transfer office. First call is free for licensed-spinout CEOs.",
  },
  {
    icon: GraduationCap,
    kind: "Program",
    title: "BioHive accelerator — Regulatory cohort",
    body:
      "12-week cohort focused on FDA pathway navigation for Utah life-sciences startups.",
  },
  {
    icon: BookOpen,
    kind: "Playbook",
    title: "FDA pathway for Utah biotech",
    body:
      "45-page guide built from interviews with 8 Utah biotech founders who've cleared 510(k) and PMA.",
  },
];

export default function BridgesPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        Innovation · 1 of 1
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Don't sell perfect.
        <br />
        Hand them the bridge.
      </h1>
      <p
        className="show-fade-up mt-4 max-w-2xl text-base text-warmgray-600"
        style={{ animationDelay: "400ms" }}
      >
        Most matches aren't 99%. We tell you exactly what's missing — and route you
        to Utah-specific resources that close the distance. The community does the
        matchmaking. The AI is a routing layer.
      </p>

      {/* The match card with concerns highlighted */}
      <div
        className="show-fade-up mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[480px_1fr]"
        style={{ animationDelay: "650ms" }}
      >
        <div className="rounded-xl border border-warmgray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-orange-500">
              Sarah → Lumen Bio
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">
              78%
            </span>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">Good match</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-warmgray-700">
            Strong on enterprise GTM and stage fit. Both anchored in Utah.
          </p>

          <div className="show-pulse mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-[12px] leading-relaxed text-ink">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              <AlertCircle className="h-3 w-3" aria-hidden /> Concerns
            </div>
            Sarah has no FDA / regulatory background. Lumen Bio is a clinical-stage therapeutic
            — this gap matters for any CEO conversation.
          </div>

          <div
            className="show-fade-up mt-4 inline-flex w-full items-center justify-between rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700"
            style={{ animationDelay: "1100ms" }}
          >
            3 Utah resources can close this gap
            <span aria-hidden>→</span>
          </div>
        </div>

        {/* Resources drawer */}
        <div className="space-y-3">
          {RESOURCES.map((r, i) => (
            <div
              key={r.title}
              className="show-fade-left rounded-xl border border-warmgray-200 bg-white p-5 hover:border-orange-300 transition"
              style={{ animationDelay: `${1400 + i * 220}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <r.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                    <span className="text-warmgray-500">{r.kind}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700">
                      <MapPin className="h-2.5 w-2.5" aria-hidden />
                      Utah
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-ink">{r.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-warmgray-600">{r.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="show-fade-up mt-14 max-w-3xl rounded-xl border border-warmgray-200 bg-warmgray-50 p-6 text-center"
        style={{ animationDelay: "2300ms" }}
      >
        <p className="text-base italic leading-relaxed text-ink">
          "Every other platform sells you a perfect match. We tell you what's
          missing and hand you the bridge."
        </p>
      </div>
    </main>
  );
}
