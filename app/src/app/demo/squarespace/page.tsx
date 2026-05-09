import { ArrowRight, FileText, Webhook, CheckCircle2 } from "lucide-react";
import { DelicateArch } from "@/components/DelicateArch";

export default function SquarespacePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        Integration · 1 of 2
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Drop-in inbound.
        <br />
        The Squarespace form keeps working.
      </h1>

      <div className="mt-12 grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_60px_1fr_60px_1fr]">
        {/* Squarespace */}
        <div
          className="show-fade-right rounded-xl border border-warmgray-200 bg-white p-5"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
            <FileText className="h-3.5 w-3.5" aria-hidden /> What Nucleus already has
          </div>
          <h2 className="mt-3 font-serif text-lg font-semibold text-ink">Squarespace form</h2>
          <ul className="mt-4 space-y-2 text-[12px]">
            <li className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2 text-warmgray-700">
              Your name
            </li>
            <li className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2 text-warmgray-700">
              Your email
            </li>
            <li className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2 text-warmgray-700">
              Tell us about yourself
            </li>
            <li className="rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2 text-warmgray-700">
              What are you looking for?
            </li>
          </ul>
        </div>

        {/* Arrow with payload */}
        <FlowArrow delay={1000} payload={`{ name, email, bio, lookingFor }`} />

        {/* Connections Hub */}
        <div
          className="show-fade-up flex flex-col items-center rounded-xl border border-orange-200 bg-orange-50 p-5"
          style={{ animationDelay: "1300ms" }}
        >
          <DelicateArch className="h-9 w-9" />
          <span className="mt-2 font-serif text-lg font-semibold text-ink">Connections Hub</span>
          <div className="mt-4 w-full space-y-1.5 text-[11px]">
            {[
              "POST /api/integrations/squarespace/webhook",
              "verify x-nucleus-secret",
              "extractCandidate(bio + lookingFor)",
              "embed(...) → vector(1536)",
              "profileStore.put(profile)",
              "email magic-link",
            ].map((line, i) => (
              <div
                key={line}
                className="show-fade-up flex items-center gap-1.5 rounded-md bg-white px-2 py-1 font-mono text-warmgray-700"
                style={{ animationDelay: `${1500 + i * 140}ms` }}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden />
                {line}
              </div>
            ))}
          </div>
        </div>

        <FlowArrow delay={2400} payload={`{ profile, signInUrl }`} />

        {/* Profile created */}
        <div
          className="show-fade-left rounded-xl border border-warmgray-200 bg-white p-5"
          style={{ animationDelay: "2700ms" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Structured profile
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-warmgray-200 bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              SC
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-ink">Sarah Chen</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-warmgray-500">
                candidate · operator · slc
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {["GTM", "fractional", "ai", "saas", "qualtrics-alumni"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            Magic-link emailed to sarah@…
          </div>
        </div>
      </div>

      <div
        className="show-fade-up mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
        style={{ animationDelay: "3300ms" }}
      >
        <Callout
          icon={Webhook}
          title="Header-secret-validated"
          body="x-nucleus-secret matches SQUARESPACE_WEBHOOK_SECRET. Signed payload."
        />
        <Callout
          icon={FileText}
          title="Same extraction pipeline"
          body="Webhook submissions run through gpt-5.3-nano structured-output, just like the form."
        />
        <Callout
          icon={CheckCircle2}
          title="Zero migration"
          body="Existing form keeps working. Nucleus stops doing manual matchmaking."
        />
      </div>
    </main>
  );
}

function Callout({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Webhook;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-warmgray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-orange-500">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {title}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-warmgray-600">{body}</p>
    </div>
  );
}

function FlowArrow({ delay, payload }: { delay: number; payload: string }) {
  return (
    <div
      className="show-fade-in flex flex-col items-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="rounded-full border border-warmgray-200 bg-white px-2 py-1 font-mono text-[10px] text-warmgray-500">
        {payload}
      </div>
      <ArrowRight className="mt-2 h-6 w-6 text-orange-500" strokeWidth={1.75} aria-hidden />
    </div>
  );
}
