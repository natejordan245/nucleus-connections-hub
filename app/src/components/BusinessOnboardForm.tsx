"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Globe,
  Layers,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Input, Select, Textarea } from "@/components/FormField";
import { OnboardAccountFields, decodeOnboardError } from "@/components/OnboardAccountFields";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  FUNDING_STATUS_LABELS,
  FUNDING_STATUSES,
  NEED_LABELS,
  NETWORK_LABELS,
  NETWORKS,
  ORIGIN_LABELS,
  ORIGINS,
  ROLE_NEEDS,
  SECTOR_LABELS,
  SECTORS,
  STAGE_LABELS,
  STAGES,
} from "@/lib/data/enum-labels";
import type {
  BusinessDTO,
  FundingStatus,
  Network,
  Origin,
  Sector,
  Stage,
  StartupNeed,
} from "@/lib/data/types";

type Suggestion = { field: string; value: string | string[]; confidence: number };
type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; filled: number }
  | { status: "error"; message: string };

type Props = {
  error?: string;
  createBusinessAction: (formData: FormData) => void | Promise<void>;
  signedIn?: boolean;
  initial?: BusinessDTO;
};

type BusinessFormState = {
  name: string;
  oneLiner: string;
  description: string;
  sector: Sector;
  origin: Origin;
  fundingStage: Stage;
  fundingStatus: FundingStatus;
  needs: StartupNeed[];
  networksWanted: Network[];
  location: string;
  websiteUrl: string;
  logoUrl: string;
};

const INITIAL: BusinessFormState = {
  name: "",
  oneLiner: "",
  description: "",
  sector: "software",
  origin: "bootstrapped",
  fundingStage: "seed",
  fundingStatus: "pre-revenue",
  needs: [],
  networksWanted: ["operator"],
  location: "Salt Lake City, UT",
  websiteUrl: "",
  logoUrl: "",
};

export function BusinessOnboardForm({
  error,
  createBusinessAction,
  signedIn = true,
  initial,
}: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<BusinessFormState>(() =>
    initial
      ? {
          name: initial.name,
          oneLiner: initial.oneLiner,
          description: initial.description,
          sector: initial.sector,
          origin: initial.origin,
          fundingStage: initial.fundingStage,
          fundingStatus: initial.fundingStatus,
          needs: initial.needs,
          networksWanted: initial.networksWanted,
          location: initial.location,
          websiteUrl: initial.websiteUrl ?? "",
          logoUrl: initial.logoUrl ?? "",
        }
      : INITIAL,
  );
  const [scrape, setScrape] = useState<ScrapeState>({ status: "idle" });
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());

  async function handleScrape() {
    const url = form.websiteUrl.trim();
    if (!url) {
      setScrape({ status: "error", message: "Enter your website URL first." });
      return;
    }
    setScrape({ status: "loading" });
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "business", url }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        suggestions?: Suggestion[];
        error?: string;
      };
      if (!res.ok) {
        setScrape({
          status: "error",
          message: data.error ? humanizeError(data.error) : "Couldn't read that website.",
        });
        return;
      }
      const { next, fields } = applySuggestions(data.suggestions ?? [], form);
      setForm(next);
      setAutoFilled(new Set(fields));
      setScrape({ status: "ok", filled: fields.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error.";
      setScrape({ status: "error", message });
    }
  }

  function clearMark(key: string) {
    if (!autoFilled.has(key)) return;
    setAutoFilled((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const originOpts = ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const fundingOpts = FUNDING_STATUSES.map((f) => ({ value: f, label: FUNDING_STATUS_LABELS[f] }));
  const needOpts = ROLE_NEEDS.map((n) => ({ value: n, label: NEED_LABELS[n] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  const filledCount = countFilled(form);
  const totalFields = 11;
  const pct = Math.round((filledCount / totalFields) * 100);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <DemoFiller />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Profile types", href: "/onboard" },
              { label: "Business" },
            ]}
          />
          <span className="eyebrow mt-3 block text-orange-500">
            {isEdit ? "Edit business profile" : "Business profile"}
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {isEdit ? "Edit your company profile." : "Tell us about your company."}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-warmgray-600">
            Free-text where it matters, quick chips for the rest.{" "}
            <span className="text-warmgray-500">
              Double-click any field to drop in a sample.
            </span>
          </p>
        </div>
        <div className="hidden items-center gap-2 text-sm text-warmgray-500 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden />
          <span>
            {filledCount} of {totalFields} fields filled
          </span>
        </div>
      </div>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Company name and a short description are required.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form action={createBusinessAction} className="space-y-4">
          {/* Smart import — distinct module above the main form */}
          <section className="rounded-2xl border border-warmgray-200 bg-gradient-to-br from-orange-50/60 via-white to-white">
            <div className="px-5 py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">Smart import</h2>
                    <span className="rounded-full bg-warmgray-100 px-2 py-0.5 text-[11px] font-medium text-warmgray-600">
                      Optional
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-warmgray-600">
                    Paste your homepage and we'll fill in what we can find.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Globe
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warmgray-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="example.com"
                    value={form.websiteUrl}
                    onChange={(e) => {
                      const v = e.currentTarget.value;
                      setForm((p) => ({ ...p, websiteUrl: v }));
                      if (scrape.status !== "idle" && scrape.status !== "loading") {
                        setScrape({ status: "idle" });
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.currentTarget.value.trim();
                      if (v && !/^https?:\/\//i.test(v)) {
                        setForm((p) => ({ ...p, websiteUrl: `https://${v}` }));
                      }
                    }}
                    className="w-full rounded-xl border border-warmgray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScrape}
                  disabled={scrape.status === "loading" || !form.websiteUrl.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.6)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-warmgray-200 disabled:text-warmgray-400 disabled:shadow-none"
                >
                  {scrape.status === "loading" ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={2}
                        aria-hidden
                      />
                      Reading…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      Auto-fill
                    </>
                  )}
                </button>
              </div>
              {scrape.status === "ok" && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  Filled {scrape.filled} field{scrape.filled === 1 ? "" : "s"} — review them below.
                </p>
              )}
              {scrape.status === "error" && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  {scrape.message}
                </p>
              )}
            </div>
          </section>

          {/* Identity */}
          <Section
            icon={<Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
            title="Identity"
            description="The basics — what you're called, and what you do."
          >
            <LabeledField
              id="logoUrl"
              label="Logo"
              hint="Optional. Helps your card stand out."
              marked={autoFilled.has("logoUrl")}
            >
              <PhotoUpload
                name="logoUrl"
                label="Upload logo"
                fallbackName="Co"
                defaultUrl={form.logoUrl || initial?.logoUrl}
              />
            </LabeledField>

            <LabeledField
              id="name"
              label="Company name"
              required
              marked={autoFilled.has("name")}
            >
              <Input
                id="name"
                name="name"
                required
                placeholder="Bramble AI"
                data-sample="Beacon Health"
                value={form.name}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setForm((p) => ({ ...p, name: v }));
                  clearMark("name");
                }}
              />
            </LabeledField>

            <LabeledField
              id="oneLiner"
              label="One-liner"
              hint="Twelve words max."
              marked={autoFilled.has("oneLiner")}
            >
              <Input
                id="oneLiner"
                name="oneLiner"
                placeholder="Customer-conversation analytics for vertical SaaS"
                data-sample="AI-driven cancer biomarker detection for community oncology clinics"
                value={form.oneLiner}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setForm((p) => ({ ...p, oneLiner: v }));
                  clearMark("oneLiner");
                }}
              />
            </LabeledField>

            <LabeledField
              id="description"
              label="What you do"
              required
              marked={autoFilled.has("description")}
            >
              <Textarea
                id="description"
                name="description"
                required
                rows={5}
                placeholder="Who you are, what you make, who buys it, where you are in the journey."
                data-sample="Beacon Health is a U of U PIVOT spinout building a deep-learning pipeline that flags early-stage colorectal cancer biomarkers from standard pathology slides. Pilot deployments with two regional oncology networks; running a 510(k) submission this year. Looking for a regulatory lead with FDA experience and a clinical advisor."
                value={form.description}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setForm((p) => ({ ...p, description: v }));
                  clearMark("description");
                }}
              />
            </LabeledField>
          </Section>

          {/* Classification */}
          <Section
            icon={<Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
            title="Where you sit in the ecosystem"
            description="Helps us route your matches."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LabeledField id="sector" label="Core sector" marked={autoFilled.has("sector")}>
                <Select
                  id="sector"
                  name="sector"
                  value={form.sector}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((p) => ({ ...p, sector: v as Sector }));
                    clearMark("sector");
                  }}
                >
                  {sectorOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </LabeledField>
              <LabeledField id="origin" label="Origin / lineage" marked={autoFilled.has("origin")}>
                <Select
                  id="origin"
                  name="origin"
                  value={form.origin}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((p) => ({ ...p, origin: v as Origin }));
                    clearMark("origin");
                  }}
                >
                  {originOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </LabeledField>
              <LabeledField
                id="fundingStage"
                label="Funding stage"
                marked={autoFilled.has("fundingStage")}
              >
                <Select
                  id="fundingStage"
                  name="fundingStage"
                  value={form.fundingStage}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setForm((p) => ({ ...p, fundingStage: v as Stage }));
                    clearMark("fundingStage");
                  }}
                >
                  {stageOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </LabeledField>
              <LabeledField
                id="fundingStatus"
                label="Funding status"
                marked={autoFilled.has("fundingStatus")}
              >
                <Select
                  id="fundingStatus"
                  name="fundingStatus"
                  value={form.fundingStatus}
                  onChange={(e) => {
                    const v = e.currentTarget.value as FundingStatus;
                    setForm((p) => ({ ...p, fundingStatus: v }));
                    clearMark("fundingStatus");
                  }}
                >
                  {fundingOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </LabeledField>
            </div>
          </Section>

          {/* What you need */}
          <Section
            icon={<Users className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
            title="Who you're looking for"
            description="Pick anything that fits — you can change this later."
          >
            <LabeledField
              id="needs"
              label="Talent you're hiring"
              hint="Pick all that apply."
              marked={autoFilled.has("needs")}
            >
              <ChipGroup
                name="needs"
                options={needOpts}
                selected={form.needs}
                onChange={(next) => {
                  setForm((p) => ({ ...p, needs: next as StartupNeed[] }));
                  clearMark("needs");
                }}
              />
            </LabeledField>
            <LabeledField
              id="networksWanted"
              label="Networks you want help from"
              hint="Pick all that apply."
            >
              <ChipGroup
                name="networksWanted"
                options={networkOpts}
                selected={form.networksWanted}
                onChange={(next) =>
                  setForm((p) => ({ ...p, networksWanted: next as Network[] }))
                }
              />
            </LabeledField>
          </Section>

          {/* Location & links */}
          <Section
            icon={<MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
            title="Location"
            description="Where you're based."
          >
            <LabeledField id="location" label="Location" marked={autoFilled.has("location")}>
              <Input
                id="location"
                name="location"
                data-sample="Salt Lake City, UT"
                value={form.location}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setForm((p) => ({ ...p, location: v }));
                  clearMark("location");
                }}
              />
            </LabeledField>
          </Section>

          {!isEdit && (
            <OnboardAccountFields signedIn={signedIn} errorMessage={decodeOnboardError(error)} />
          )}

          {/* Submit */}
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-warmgray-500">
              You can edit any of this later from your profile.
            </p>
            <button
              type="submit"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.6)] transition hover:bg-orange-600 hover:shadow-[0_12px_36px_-10px_rgba(37,99,235,0.7)]"
            >
              {isEdit
                ? "Save changes"
                : signedIn
                  ? "Save and see matches"
                  : "Create account & see matches"}
              <ArrowRight
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </div>
        </form>

        {/* Sidebar — live preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-warmgray-200 bg-white">
              <header className="px-5 pt-5">
                <p className="text-sm font-semibold text-ink">Live preview</p>
                <p className="mt-0.5 text-xs text-warmgray-500">
                  How your profile takes shape as you fill it in.
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-medium text-warmgray-700">Completion</span>
                  <span className="font-medium text-ink">{pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warmgray-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </header>
              <dl className="mt-4 space-y-2.5 px-5 pb-5 text-sm">
                <Pair k="Name" v={truncate(form.name, 24) || "—"} />
                <Pair k="Tagline" v={truncate(form.oneLiner, 24) || "—"} />
                <Pair k="Sector" v={SECTOR_LABELS[form.sector]} />
                <Pair k="Origin" v={ORIGIN_LABELS[form.origin]} />
                <Pair k="Stage" v={STAGE_LABELS[form.fundingStage]} />
                <Pair k="Funding" v={FUNDING_STATUS_LABELS[form.fundingStatus]} />
                <Pair
                  k="Hiring for"
                  v={form.needs.length ? `${form.needs.length} role${form.needs.length === 1 ? "" : "s"}` : "—"}
                />
                <Pair k="Location" v={truncate(form.location, 24) || "—"} />
              </dl>
            </div>

            <div className="rounded-2xl border border-warmgray-200 bg-warmgray-50/70 px-5 py-4">
              <p className="text-sm font-semibold text-ink">Don't sweat the blanks</p>
              <p className="mt-1 text-sm leading-relaxed text-warmgray-600">
                Anything you leave empty shows up as a quick suggestion on your
                dashboard — you can come back and fill it in any time.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-warmgray-200 bg-white">
      <header className="flex items-start gap-3 border-b border-warmgray-100 px-5 py-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-warmgray-500">{description}</p>
          )}
        </div>
      </header>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

function LabeledField({
  id,
  label,
  hint,
  required,
  marked,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  marked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-1 text-orange-500">*</span>}
        </label>
        {marked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
            <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
            Auto-filled
          </span>
        )}
      </div>
      {hint && <p className="mt-0.5 text-sm text-warmgray-500">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-warmgray-500">{k}</span>
      <span
        className={`truncate text-right font-medium ${v === "—" ? "text-warmgray-400" : "text-ink"}`}
        title={v}
      >
        {v}
      </span>
    </div>
  );
}

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function countFilled(f: BusinessFormState): number {
  let c = 0;
  if (f.name.trim()) c++;
  if (f.oneLiner.trim()) c++;
  if (f.description.trim()) c++;
  if (f.location.trim()) c++;
  if (f.websiteUrl.trim()) c++;
  if (f.needs.length) c++;
  if (f.networksWanted.length) c++;
  // sector / origin / fundingStage / fundingStatus always have a default value
  c += 4;
  return c;
}

/**
 * Apply scraped suggestions to a form snapshot. Pure — returns the next
 * state plus the list of fields that actually changed. The caller passes
 * the result into `setForm` and reports the count from `fields.length`,
 * which matters because `setForm((prev) => ...)` updaters run on a later
 * tick — we can't read a closure counter inside one and expect the value
 * to be ready synchronously.
 */
function applySuggestions(
  suggestions: Suggestion[],
  prev: BusinessFormState,
): { next: BusinessFormState; fields: string[] } {
  const stringFields: (keyof BusinessFormState)[] = [
    "name",
    "oneLiner",
    "description",
    "location",
    "logoUrl",
  ];
  const next = { ...prev };
  const fields: string[] = [];

  for (const s of suggestions) {
    const value = s.value;
    if (typeof value === "string") {
      if (s.field === "sector" && (SECTORS as readonly string[]).includes(value)) {
        if (next.sector !== value) {
          next.sector = value as Sector;
          fields.push("sector");
        }
      } else if (s.field === "origin" && (ORIGINS as readonly string[]).includes(value)) {
        if (next.origin !== value) {
          next.origin = value as Origin;
          fields.push("origin");
        }
      } else if (s.field === "fundingStage" && (STAGES as readonly string[]).includes(value)) {
        if (next.fundingStage !== value) {
          next.fundingStage = value as Stage;
          fields.push("fundingStage");
        }
      } else if (
        s.field === "fundingStatus" &&
        (FUNDING_STATUSES as readonly string[]).includes(value)
      ) {
        if (next.fundingStatus !== value) {
          next.fundingStatus = value as FundingStatus;
          fields.push("fundingStatus");
        }
      } else if ((stringFields as string[]).includes(s.field)) {
        const key = s.field as keyof BusinessFormState;
        if (!next[key]) {
          (next[key] as string) = value;
          fields.push(s.field);
        }
      }
    } else if (Array.isArray(value)) {
      if (s.field === "needs") {
        const valid = value.filter((v) =>
          (ROLE_NEEDS as readonly string[]).includes(v),
        ) as StartupNeed[];
        if (valid.length > 0 && next.needs.length === 0) {
          next.needs = valid;
          fields.push("needs");
        }
      }
    }
  }

  return { next, fields };
}

function humanizeError(raw: string): string {
  if (raw.startsWith("fetch_failed"))
    return "Couldn't reach that website. Check the URL and try again.";
  if (raw.includes("OPENAI_API_KEY")) return "Auto-fill is unavailable in this environment.";
  if (raw.includes("invalid url")) return "That doesn't look like a valid URL.";
  if (raw.includes("unsupported content-type")) return "That URL didn't return a webpage.";
  return raw.length > 120 ? "Couldn't read that website." : raw;
}
