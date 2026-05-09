import { Link2, AtSign, Mail, MapPin } from "lucide-react";

const SKILLS = [
  "Enterprise sales",
  "GTM scaling",
  "Fundraising",
  "Board governance",
  "Recruiting",
  "Pricing",
];
const UTAH_ORGS = ["Qualtrics Alumni", "Silicon Slopes", "Domo Alumni"];

export default function ProfileRevealPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-16 pb-20">
      <span className="show-fade-up eyebrow text-orange-500" style={{ animationDelay: "100ms" }}>
        UX · 3 of 4
      </span>
      <h1
        className="show-fade-up mt-3 max-w-3xl font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]"
        style={{ animationDelay: "250ms" }}
      >
        Two paragraphs in.
        <br />A trust-worthy profile out.
      </h1>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* The profile card */}
        <div
          className="show-fade-up overflow-hidden rounded-xl border border-warmgray-200 bg-white p-7"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-start gap-5">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-orange-700">
              SC
            </div>
            <div className="flex-1">
              <div className="font-mono text-[11px] uppercase tracking-wider text-warmgray-400">
                Candidate · operator
              </div>
              <h2 className="mt-1 font-serif text-3xl font-semibold leading-tight text-ink">
                Sarah Chen
              </h2>
              <p className="mt-1 text-sm text-warmgray-600">
                Former VP of Sales, Qualtrics · Salt Lake City
              </p>
              <div className="mt-3 flex items-center gap-3 text-warmgray-500">
                <Link2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                <AtSign className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                <span className="ml-2 inline-flex items-center gap-1 text-xs">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> Salt Lake City, UT
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-warmgray-700">
            15 years scaling enterprise SaaS in Utah. Built the GTM motion that
            took Qualtrics from $40M to $400M ARR. Now interested in fractional
            advisory work — I want to give back to the next generation of Utah
            founders.
          </p>

          {/* The looking-for panel — the trust differentiator */}
          <div className="show-pulse mt-6 rounded-lg border border-orange-200 bg-orange-50 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              What Sarah is looking for
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Fractional advisory or board roles, Series A or later, Utah AI or
              SaaS startups, ideally founder-led. 5–10 hours per month. Cash + equity.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
              Skills
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SKILLS.map((skill, i) => (
                <span
                  key={skill}
                  className="show-fade-up inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[12px] font-semibold text-orange-700"
                  style={{ animationDelay: `${800 + i * 70}ms` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-warmgray-500">
              Utah affiliations
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {UTAH_ORGS.map((org, i) => (
                <span
                  key={org}
                  className="show-fade-up inline-flex items-center rounded-full border border-warmgray-200 bg-warmgray-50 px-2.5 py-0.5 text-[12px] font-semibold text-warmgray-700"
                  style={{ animationDelay: `${1300 + i * 90}ms` }}
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Annotations */}
        <aside className="space-y-5">
          <Annotation
            delay={1100}
            title="Looking-for is first class"
            body="Most platforms bury intent in a search filter. We promote it because every match is explained against this exact text."
          />
          <Annotation
            delay={1500}
            title="Utah affiliations the system reads"
            body="Qualtrics and Domo Alumni, Silicon Slopes — these aren't tags, they're routing signal."
          />
          <Annotation
            delay={1900}
            title="Same shape across all four kinds"
            body="Candidate, Business, Mentor, Investor — different fields, same trust surface."
          />
        </aside>
      </div>
    </main>
  );
}

function Annotation({
  delay,
  title,
  body,
}: {
  delay: number;
  title: string;
  body: string;
}) {
  return (
    <div
      className="show-fade-left rounded-lg border border-warmgray-200 bg-white p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
        {title}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-warmgray-600">{body}</p>
    </div>
  );
}
