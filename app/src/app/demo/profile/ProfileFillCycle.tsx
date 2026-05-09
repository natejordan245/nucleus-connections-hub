"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  Globe,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { LUMEN, SARAH } from "@/lib/demo/show-fixtures";
import {
  AVAILABILITY_LABELS,
  COMPENSATION_LABELS,
  FUNDING_STATUS_LABELS,
  NEED_LABELS,
  ORIGIN_LABELS,
  SECTOR_LABELS,
  STAGE_LABELS,
  TALENT_CATEGORY_LABELS,
} from "@/lib/data/enum-labels";

type Mode = "candidate" | "business";

// Phase 0 → empty input (waiting prompt).
// Phase 1 → input "filling" (file dropped / URL typed).
// Phase 2 → submit + processing spinner.
// Phase 3 → profile cascade reveal.
// Phase 4 → hold the filled profile.
// Phase 5 → fade out, swap mode.
type Phase = 0 | 1 | 2 | 3 | 4 | 5;

const TIMING: Record<Phase, number> = {
  0: 700,
  1: 1900,
  2: 900,
  3: 2600,
  4: 2400,
  5: 700,
};

const BUSINESS_URL = "https://plaibook.tech";

export function ProfileFillCycle() {
  const [mode, setMode] = useState<Mode>("candidate");
  const [phase, setPhase] = useState<Phase>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => {
      if (phase < 5) {
        setPhase((p) => (p + 1) as Phase);
      } else {
        setMode((m) => (m === "candidate" ? "business" : "candidate"));
        setPhase(0);
      }
    }, TIMING[phase]);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [phase, mode]);

  // Profile reveal kicks in at phase 3; stays visible through 4; fades on 5.
  const profileVisible = phase >= 3 && phase <= 4;
  const inputVisible = phase <= 2;

  return (
    <div className="relative mt-6 min-h-[520px]">
      {/* Mode chip — anchors the slide so judges always know which of the two
          onboarding paths is currently being demonstrated. */}
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-warmgray-200 bg-white px-3 py-1 text-[11px] font-mono text-warmgray-700">
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (mode === "candidate" ? "bg-orange-500" : "bg-emerald-500")
            }
          />
          {mode === "candidate" ? "candidate.path" : "business.path"}
        </div>
        <CycleDots mode={mode} />
      </div>

      <div className="relative">
        <div
          className={
            "transition-all duration-500 " +
            (inputVisible
              ? "opacity-100 translate-y-0"
              : "pointer-events-none absolute inset-0 -translate-y-2 opacity-0")
          }
        >
          {mode === "candidate" ? (
            <CandidateInputPanel phase={phase} />
          ) : (
            <BusinessInputPanel phase={phase} />
          )}
        </div>

        <div
          className={
            "transition-all duration-500 " +
            (profileVisible
              ? "opacity-100 translate-y-0"
              : "pointer-events-none absolute inset-0 translate-y-3 opacity-0")
          }
        >
          {mode === "candidate" ? (
            <CandidateProfileReveal active={profileVisible} />
          ) : (
            <BusinessProfileReveal active={profileVisible} />
          )}
        </div>
      </div>
    </div>
  );
}

function CycleDots({ mode }: { mode: Mode }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-warmgray-400">
      <span className="flex items-center gap-1">
        <span
          className={
            "h-1.5 w-1.5 rounded-full " +
            (mode === "candidate" ? "bg-orange-500" : "bg-warmgray-200")
          }
        />
        resume
      </span>
      <span className="text-warmgray-300">·</span>
      <span className="flex items-center gap-1">
        <span
          className={
            "h-1.5 w-1.5 rounded-full " +
            (mode === "business" ? "bg-emerald-500" : "bg-warmgray-200")
          }
        />
        website
      </span>
    </div>
  );
}

/* --------------------------- Candidate input ---------------------------- */

function CandidateInputPanel({ phase }: { phase: Phase }) {
  const fileVisible = phase >= 1;
  const processing = phase === 2;

  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">Step 1 — Upload your resume</h2>
      </div>
      <div className="p-6">
        <div
          className={
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors duration-300 " +
            (fileVisible
              ? "border-orange-300 bg-orange-50/40"
              : "border-warmgray-200 bg-warmgray-50/60")
          }
        >
          <Upload
            className={
              "h-6 w-6 transition-colors " +
              (fileVisible ? "text-orange-500" : "text-warmgray-400")
            }
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="mt-3 text-sm font-semibold text-ink">
            Drop your resume here
          </p>
          <p className="mt-1 text-xs text-warmgray-500">
            PDF or DOCX · we extract every field below
          </p>

          <div
            className={
              "mt-5 inline-flex items-center gap-2 rounded-md border border-orange-200 bg-white px-3 py-2 text-xs text-ink shadow-sm transition-all duration-500 " +
              (fileVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0")
            }
          >
            <FileText className="h-3.5 w-3.5 text-orange-600" strokeWidth={2} aria-hidden />
            <span className="font-mono text-[11px]">zac-hales-resume.pdf</span>
            <span className="text-warmgray-400">· 184 KB</span>
            <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} aria-hidden />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          {processing && (
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-warmgray-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              parsing.resume
            </span>
          )}
          <button
            type="button"
            disabled
            className={
              "rounded-md px-3 py-1.5 text-xs font-semibold text-white transition " +
              (fileVisible ? "bg-orange-500" : "bg-warmgray-300")
            }
          >
            Build my profile →
          </button>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Business input ----------------------------- */

function BusinessInputPanel({ phase }: { phase: Phase }) {
  const [typed, setTyped] = useState("");

  // Type the URL one character at a time during phase 1.
  useEffect(() => {
    if (phase < 1) {
      setTyped("");
      return;
    }
    if (phase >= 2) {
      setTyped(BUSINESS_URL);
      return;
    }
    let i = 0;
    setTyped("");
    const interval = setInterval(() => {
      i += 1;
      setTyped(BUSINESS_URL.slice(0, i));
      if (i >= BUSINESS_URL.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, [phase]);

  const processing = phase === 2;
  const filled = phase >= 1;

  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">Step 1 — Paste your website</h2>
      </div>
      <div className="p-6">
        <label className="eyebrow text-warmgray-500" htmlFor="biz-url">
          Company website
        </label>
        <div
          className={
            "mt-2 flex items-center gap-2 rounded-md border bg-white px-3 py-2.5 transition-colors duration-300 " +
            (filled
              ? "border-emerald-300 ring-2 ring-emerald-100"
              : "border-warmgray-200")
          }
        >
          <Globe
            className={
              "h-4 w-4 " + (filled ? "text-emerald-600" : "text-warmgray-400")
            }
            strokeWidth={2}
            aria-hidden
          />
          <span className="font-mono text-[13px] text-ink">
            {typed}
            {phase === 1 && (
              <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-ink align-middle" />
            )}
          </span>
        </div>
        <p className="mt-2 text-xs text-warmgray-500">
          We read the public site — about page, team, products — and structure it.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3">
          {processing && (
            <span className="inline-flex items-center gap-2 font-mono text-[11px] text-warmgray-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              fetching.site
            </span>
          )}
          <button
            type="button"
            disabled
            className={
              "rounded-md px-3 py-1.5 text-xs font-semibold text-white transition " +
              (filled ? "bg-orange-500" : "bg-warmgray-300")
            }
          >
            Build my profile →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------- Profile reveal — candidate ----------------------- */

function StaggerRow({
  i,
  active,
  children,
}: {
  i: number;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "transition-all duration-500 " +
        (active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0")
      }
      style={{ transitionDelay: active ? `${i * 110}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function CandidateProfileReveal({ active }: { active: boolean }) {
  return (
    <div className="space-y-4">
      <StaggerRow i={0} active={active}>
        <header className="flex items-start gap-5 rounded-lg border border-warmgray-200 bg-white p-5">
          <Avatar name={SARAH.name} size="lg" />
          <div className="flex-1">
            <span className="eyebrow text-orange-500">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                Auto-filled · Candidate
              </span>
            </span>
            <h2 className="mt-1 text-2xl font-bold text-ink">{SARAH.name}</h2>
            <p className="mt-1 text-sm text-warmgray-700">{SARAH.headline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="warmgray">{SARAH.location}</Pill>
              <Pill tone="orange">
                {AVAILABILITY_LABELS[SARAH.availability]}
              </Pill>
            </div>
          </div>
        </header>
      </StaggerRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <StaggerRow i={1} active={active}>
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">{SARAH.bio}</p>
            </Card>
          </StaggerRow>
          <StaggerRow i={2} active={active}>
            <Card title="Looking for">
              <p className="text-sm leading-relaxed text-warmgray-700">
                {SARAH.lookingFor}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(SARAH.lookingForNeeds ?? []).map((n) => (
                  <Pill key={n} tone="orange">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </Card>
          </StaggerRow>
          <StaggerRow i={3} active={active}>
            <Card title="Categories">
              <div className="flex flex-wrap gap-2">
                {(SARAH.categories ?? []).map((c) => (
                  <Pill key={c} tone="warmgray">
                    {TALENT_CATEGORY_LABELS[c]}
                  </Pill>
                ))}
              </div>
            </Card>
          </StaggerRow>
        </div>

        <div className="space-y-4">
          <StaggerRow i={2} active={active}>
            <Card title="Domains">
              <div className="flex flex-wrap gap-2">
                {SARAH.domains.map((d) => (
                  <Pill key={d} tone="orange">
                    {SECTOR_LABELS[d]}
                  </Pill>
                ))}
              </div>
            </Card>
          </StaggerRow>
          <StaggerRow i={3} active={active}>
            <Card title="Compensation fit">
              <dl className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-warmgray-500">comp.preference</span>
                  <span className="font-semibold text-ink">
                    {SARAH.compensation.map((c) => COMPENSATION_LABELS[c]).join(", ")}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-warmgray-500">stage.preference</span>
                  <span className="font-semibold text-ink">
                    {SARAH.stagePrefs.map((s) => STAGE_LABELS[s]).join(", ")}
                  </span>
                </div>
              </dl>
            </Card>
          </StaggerRow>
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Profile reveal — business ------------------------ */

function BusinessProfileReveal({ active }: { active: boolean }) {
  return (
    <div className="space-y-4">
      <StaggerRow i={0} active={active}>
        <header className="flex items-start gap-5 rounded-lg border border-warmgray-200 bg-white p-5">
          <Avatar name={LUMEN.name} src={LUMEN.logoUrl} size="lg" />
          <div className="flex-1">
            <span className="eyebrow text-emerald-700">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                Auto-filled · Business
              </span>
            </span>
            <h2 className="mt-1 text-2xl font-bold text-ink">{LUMEN.name}</h2>
            <p className="mt-1 text-sm text-warmgray-700">{LUMEN.oneLiner}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="warmgray">{LUMEN.location}</Pill>
              <Pill tone="orange">{STAGE_LABELS[LUMEN.fundingStage]}</Pill>
              <Pill tone="emerald">
                {FUNDING_STATUS_LABELS[LUMEN.fundingStatus]}
              </Pill>
              {LUMEN.trl && <Pill tone="warmgray">TRL {LUMEN.trl}</Pill>}
            </div>
          </div>
        </header>
      </StaggerRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <StaggerRow i={1} active={active}>
            <Card title="About">
              <p className="text-sm leading-relaxed text-warmgray-700">
                {LUMEN.description}
              </p>
            </Card>
          </StaggerRow>
          <StaggerRow i={2} active={active}>
            <Card title="Origin">
              <p className="text-sm text-warmgray-700">
                {ORIGIN_LABELS[LUMEN.origin]}
              </p>
            </Card>
          </StaggerRow>
          <StaggerRow i={3} active={active}>
            <Card title="Talent they're looking for">
              <div className="flex flex-wrap gap-2">
                {LUMEN.needs.map((n) => (
                  <Pill key={n} tone="orange">
                    {NEED_LABELS[n]}
                  </Pill>
                ))}
              </div>
            </Card>
          </StaggerRow>
        </div>

        <div className="space-y-4">
          <StaggerRow i={2} active={active}>
            <Card title="Sector">
              <Pill tone="warmgray">{SECTOR_LABELS[LUMEN.sector]}</Pill>
            </Card>
          </StaggerRow>
          <StaggerRow i={3} active={active}>
            <Card title="Funding">
              <dl className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-warmgray-500">funding.stage</span>
                  <span className="font-semibold text-ink">
                    {STAGE_LABELS[LUMEN.fundingStage]}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-warmgray-500">funding.status</span>
                  <span className="font-semibold text-ink">
                    {FUNDING_STATUS_LABELS[LUMEN.fundingStatus]}
                  </span>
                </div>
                {LUMEN.trl && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-warmgray-500">trl</span>
                    <span className="font-semibold text-ink">{LUMEN.trl}</span>
                  </div>
                )}
              </dl>
            </Card>
          </StaggerRow>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
