import { Code2 } from "lucide-react";

/**
 * Slide — distribution.
 *
 * Shows the embed widget the way a partner would see it: dropped into
 * someone else's marketing site. The frame is a mock (no real iframe —
 * keeps the slide deterministic for demos), but the form inside is the
 * same `<EmbedSignupFlow>` shell the real `/embed/signup` route renders.
 */
export default function DistributionSlidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">Distribution</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        Drop the form into any site.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warmgray-600">
        One snippet. Lives inside the partner's own page — Nucleus, BioHive, a
        Stoke Mtn launch site.{" "}
        <span className="text-warmgray-500">(Squarespace compatible.)</span>
      </p>

      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-warmgray-200 bg-white px-3 py-1.5 font-mono text-[11px] text-warmgray-700">
        <Code2 className="h-3.5 w-3.5 text-orange-600" strokeWidth={2} aria-hidden />
        <span className="text-warmgray-500">&lt;script src=</span>
        <span className="text-ink">"connections.utah/embed.js"</span>
        <span className="text-warmgray-500">&gt;&lt;/script&gt;</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-warmgray-200 bg-warmgray-50 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-warmgray-200 bg-white px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
          </div>
          <div className="ml-3 flex-1 truncate rounded-md bg-warmgray-100 px-3 py-1 font-mono text-[11px] text-warmgray-600">
            biohiveutah.org/join
          </div>
        </div>

        {/* Mock partner site header */}
        <div className="flex items-center justify-between border-b border-warmgray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-600 font-serif text-sm font-bold text-white">
              B
            </span>
            <span className="font-serif text-base font-semibold tracking-tight text-ink">
              BioHive Utah
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-medium text-warmgray-600 sm:flex">
            <span>Members</span>
            <span>Events</span>
            <span>Companies</span>
            <span className="text-ink">Join</span>
          </nav>
        </div>

        {/* Hero copy + embedded form side-by-side */}
        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="self-center">
            <span className="eyebrow text-emerald-700">Talent network</span>
            <h2 className="mt-3 font-serif text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
              Join Utah&apos;s life-sciences network.
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-warmgray-600">
              500+ operators, founders, and advisors active in the BioHive
              ecosystem. We&apos;ll match you to teams that need exactly what
              you bring.
            </p>
            <div className="mt-4 flex items-center gap-3 text-[11px] text-warmgray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                live now
              </span>
              <span>·</span>
              <span>powered by Connections Hub</span>
            </div>
          </div>

          {/* Embedded widget mock — same shell as /embed/signup step 1 */}
          <div className="rounded-xl border border-warmgray-200 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-orange-500">Step 1 of 3</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-400">
                embed
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-ink">
              What are you?
            </h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Candidate", body: "Operator, exec, engineer, student." },
                { label: "Business", body: "Founder hiring or fundraising." },
                { label: "Mentor", body: "Advisor offering time + expertise." },
                { label: "VC", body: "Investor backing Utah businesses." },
              ].map((opt, i) => (
                <li
                  key={opt.label}
                  className={`rounded-lg border px-3 py-2 transition ${
                    i === 0
                      ? "border-orange-300 bg-orange-50/60"
                      : "border-warmgray-200 bg-white"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-ink">{opt.label}</span>
                    {i === 0 && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-orange-600">
                        selected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-warmgray-600">
                    {opt.body}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
