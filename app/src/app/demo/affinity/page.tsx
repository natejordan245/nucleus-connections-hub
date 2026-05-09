import { ArrowRight, CheckCircle2, Database, FileText, ListChecks } from "lucide-react";
import { DelicateArch } from "@/components/DelicateArch";

const API_CALLS = [
  "affinityClient.upsertOrganization(business)",
  "affinityClient.upsertPerson(candidate)",
  "affinityClient.addToList(personId, listId)",
  "affinityClient.setFieldValues({ stage, score, reasonHash })",
];

export default function AffinityPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        Integration · 2 of 2
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Drop-in outbound.
        <br />
        Mutual matches land in Affinity.
      </h1>

      <div className="mt-12 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_60px_1fr_60px_1fr]">
        {/* Mutual interest event */}
        <div
          className="show-fade-right rounded-xl border border-warmgray-200 bg-white p-5"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Mutual interest
          </div>
          <div className="mt-3 rounded-lg border border-warmgray-200 bg-warmgray-50 p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink">Sarah Chen</span>
              <span className="font-mono text-[10px] text-emerald-600">interested</span>
            </div>
            <div className="my-1 text-center font-mono text-warmgray-400" aria-hidden>
              ↕
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-ink">Bramble AI</span>
              <span className="font-mono text-[10px] text-emerald-600">interested</span>
            </div>
          </div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
            mutual_at = 2026-05-08T18:42:11Z
          </div>
        </div>

        <FlowArrow delay={1000} payload="payload" />

        {/* Connections Hub */}
        <div
          className="show-fade-up flex flex-col items-center rounded-xl border border-orange-200 bg-orange-50 p-5"
          style={{ animationDelay: "1300ms" }}
        >
          <DelicateArch className="h-9 w-9" />
          <span className="mt-2 font-serif text-lg font-semibold text-ink">Connections Hub</span>

          <div className="mt-4 w-full space-y-1.5 text-[11px]">
            {API_CALLS.map((line, i) => (
              <div
                key={line}
                className="show-fade-up flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-mono text-warmgray-700"
                style={{ animationDelay: `${1500 + i * 200}ms` }}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden />
                {line}
              </div>
            ))}
          </div>

          <div className="mt-3 self-stretch rounded-md border border-warmgray-200 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
            transport: <span className="text-orange-700">mock</span> · flip <span className="text-ink">AFFINITY_LIVE=true</span>
          </div>
        </div>

        <FlowArrow delay={2400} payload="POST api.affinity.co" />

        {/* Affinity record */}
        <div
          className="show-fade-left rounded-xl border border-warmgray-200 bg-white p-5"
          style={{ animationDelay: "2700ms" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            <Database className="h-3.5 w-3.5" aria-hidden /> Affinity record
          </div>
          <div className="mt-3 space-y-2 text-[12px]">
            <div className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
                organization
              </div>
              <div className="text-ink">Bramble AI · #org-2941</div>
            </div>
            <div className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
                person
              </div>
              <div className="text-ink">Sarah Chen · sarah@…</div>
            </div>
            <div className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
                <ListChecks className="h-3 w-3" aria-hidden /> list entry
              </div>
              <div className="text-ink">Nucleus Connections · Mutual Match</div>
            </div>
            <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-orange-700">
                <FileText className="h-3 w-3" aria-hidden /> note body
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-ink">
                Sarah's enterprise GTM at Qualtrics directly addresses Bramble's
                biggest commercial gap. Stage fit, comp fit, both anchored in Utah.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="show-fade-up mt-12 max-w-3xl rounded-xl border border-warmgray-200 bg-warmgray-50 p-6"
        style={{ animationDelay: "3500ms" }}
      >
        <p className="text-[14px] leading-relaxed text-ink">
          The note body is the same reason paragraph the user saw. When a Nucleus
          operator opens the Affinity record, they see exactly{" "}
          <em className="text-orange-700 not-italic">why</em> we matched these two.
          Today the transport is mock — sandbox creds pending. One env-var flip
          (<span className="font-mono text-ink">AFFINITY_LIVE=true</span>) points
          this exact code at <span className="font-mono text-ink">api.affinity.co</span>.
        </p>
      </div>
    </main>
  );
}

function FlowArrow({ delay, payload }: { delay: number; payload: string }) {
  return (
    <div
      className="show-fade-in flex flex-col items-center pt-12"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="rounded-full border border-warmgray-200 bg-white px-2 py-1 font-mono text-[10px] text-warmgray-500">
        {payload}
      </div>
      <ArrowRight className="mt-2 h-6 w-6 text-orange-500" strokeWidth={1.75} aria-hidden />
    </div>
  );
}
