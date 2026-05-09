"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Field, Input, Select, Textarea } from "@/components/FormField";
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
  linkedinUrl: string;
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
  linkedinUrl: "",
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
          linkedinUrl: initial.linkedinUrl ?? "",
        }
      : INITIAL,
  );
  const [scrape, setScrape] = useState<ScrapeState>({ status: "idle" });

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
      const filled = applySuggestions(data.suggestions ?? [], setForm);
      setScrape({ status: "ok", filled });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error.";
      setScrape({ status: "error", message });
    }
  }

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const originOpts = ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const fundingOpts = FUNDING_STATUSES.map((f) => ({ value: f, label: FUNDING_STATUS_LABELS[f] }));
  const needOpts = ROLE_NEEDS.map((n) => ({ value: n, label: NEED_LABELS[n] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <DemoFiller />
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">
        {isEdit ? "Edit business profile" : "Business profile"}
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        {isEdit ? "Edit your company profile." : "Tell us about your company."}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Free-text where it matters; quick chips for the rest.{" "}
        <span className="text-warmgray-500">Tip: double-click any text field to auto-fill a sample.</span>
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Company name and a short description are required.
        </p>
      )}

      <form
        action={createBusinessAction}
        className="mt-4 space-y-5 rounded-lg border border-warmgray-200 bg-white p-5"
      >
        <Field
          id="websiteUrl"
          name="websiteUrl"
          label="Company website"
          hint="We'll read your site and pre-fill what we can find."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
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
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleScrape}
              disabled={scrape.status === "loading" || !form.websiteUrl.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800 disabled:cursor-not-allowed disabled:bg-warmgray-300"
            >
              {scrape.status === "loading" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
                  Reading…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Auto-fill from website
                </>
              )}
            </button>
          </div>
          {scrape.status === "ok" && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Filled in {scrape.filled} field{scrape.filled === 1 ? "" : "s"} from your website. Review and edit below.
            </p>
          )}
          {scrape.status === "error" && (
            <p className="mt-2 text-xs font-medium text-red-700">{scrape.message}</p>
          )}
        </Field>

        <Field id="logoUrl" name="logoUrl" label="Company logo" hint="Optional. Helps your card stand out.">
          <PhotoUpload
            name="logoUrl"
            label="Upload logo"
            fallbackName="Co"
            defaultUrl={initial?.logoUrl}
          />
        </Field>

        <Field id="name" name="name" label="Company name" required>
          <Input
            id="name"
            name="name"
            required
            placeholder="Bramble AI"
            data-sample="Beacon Health"
            value={form.name}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, name: v })); }}
          />
        </Field>

        <Field id="oneLiner" name="oneLiner" label="One-liner" hint="Twelve words max.">
          <Input
            id="oneLiner"
            name="oneLiner"
            placeholder="Customer-conversation analytics for vertical SaaS"
            data-sample="AI-driven cancer biomarker detection for community oncology clinics"
            value={form.oneLiner}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, oneLiner: v })); }}
          />
        </Field>

        <Field id="description" name="description" label="What you do" required>
          <Textarea
            id="description"
            name="description"
            required
            rows={5}
            placeholder="Who you are, what you make, who buys it, and where you are in the journey."
            data-sample="Beacon Health is a U of U PIVOT spinout building a deep-learning pipeline that flags early-stage colorectal cancer biomarkers from standard pathology slides. Pilot deployments with two regional oncology networks; running a 510(k) submission this year. Looking for a regulatory lead with FDA experience and a clinical advisor."
            value={form.description}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, description: v })); }}
          />
        </Field>

        <Field id="sector" name="sector" label="Core sector focus">
          <Select
            id="sector"
            name="sector"
            value={form.sector}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, sector: v as Sector })); }}
          >
            {sectorOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="origin" name="origin" label="Origin / lineage">
          <Select
            id="origin"
            name="origin"
            value={form.origin}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, origin: v as Origin })); }}
          >
            {originOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="needs" name="needs" label="What talent are you looking for?" hint="Pick all that apply.">
          <ChipGroup
            name="needs"
            options={needOpts}
            selected={form.needs}
            onChange={(next) => setForm((p) => ({ ...p, needs: next as StartupNeed[] }))}
          />
        </Field>

        <Field id="networksWanted" name="networksWanted" label="Which Nucleus networks do you want help from?" hint="Pick all that apply.">
          <ChipGroup
            name="networksWanted"
            options={networkOpts}
            selected={form.networksWanted}
            onChange={(next) => setForm((p) => ({ ...p, networksWanted: next as Network[] }))}
          />
        </Field>

        <Field id="fundingStage" name="fundingStage" label="Funding stage">
          <Select
            id="fundingStage"
            name="fundingStage"
            value={form.fundingStage}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, fundingStage: v as Stage })); }}
          >
            {stageOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="fundingStatus" name="fundingStatus" label="Funding status">
          <Select
            id="fundingStatus"
            name="fundingStatus"
            value={form.fundingStatus}
            onChange={(e) => {
              const v = e.currentTarget.value as FundingStatus;
              setForm((p) => ({ ...p, fundingStatus: v }));
            }}
          >
            {fundingOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="location" name="location" label="Location">
          <Input
            id="location"
            name="location"
            data-sample="Salt Lake City, UT"
            value={form.location}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, location: v })); }}
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/company/…"
            data-sample="https://linkedin.com/company/beacon-health-sample"
            value={form.linkedinUrl}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, linkedinUrl: v })); }}
          />
        </Field>

        {!isEdit && (
          <OnboardAccountFields signedIn={signedIn} errorMessage={decodeOnboardError(error)} />
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            {isEdit
              ? "Save changes →"
              : signedIn
                ? "Save and see matches →"
                : "Create account & see matches →"}
          </button>
        </div>
      </form>
    </main>
  );
}

function applySuggestions(
  suggestions: Suggestion[],
  setForm: React.Dispatch<React.SetStateAction<BusinessFormState>>,
): number {
  const stringFields: (keyof BusinessFormState)[] = [
    "name",
    "oneLiner",
    "description",
    "location",
    "linkedinUrl",
  ];
  let filled = 0;

  setForm((prev) => {
    const next = { ...prev };
    for (const s of suggestions) {
      const value = s.value;
      if (typeof value === "string") {
        if (s.field === "sector" && (SECTORS as readonly string[]).includes(value)) {
          if (next.sector !== value) {
            next.sector = value as Sector;
            filled += 1;
          }
        } else if (s.field === "origin" && (ORIGINS as readonly string[]).includes(value)) {
          if (next.origin !== value) {
            next.origin = value as Origin;
            filled += 1;
          }
        } else if (s.field === "fundingStage" && (STAGES as readonly string[]).includes(value)) {
          if (next.fundingStage !== value) {
            next.fundingStage = value as Stage;
            filled += 1;
          }
        } else if (
          s.field === "fundingStatus" &&
          (FUNDING_STATUSES as readonly string[]).includes(value)
        ) {
          if (next.fundingStatus !== value) {
            next.fundingStatus = value as FundingStatus;
            filled += 1;
          }
        } else if ((stringFields as string[]).includes(s.field)) {
          const key = s.field as keyof BusinessFormState;
          if (!next[key]) {
            (next[key] as string) = value;
            filled += 1;
          }
        }
      } else if (Array.isArray(value)) {
        if (s.field === "needs") {
          const valid = value.filter((v) =>
            (ROLE_NEEDS as readonly string[]).includes(v),
          ) as StartupNeed[];
          if (valid.length > 0 && next.needs.length === 0) {
            next.needs = valid;
            filled += 1;
          }
        }
      }
    }
    return next;
  });

  return filled;
}

function humanizeError(raw: string): string {
  if (raw.startsWith("fetch_failed")) return "Couldn't reach that website. Check the URL and try again.";
  if (raw.includes("OPENAI_API_KEY")) return "Auto-fill is unavailable in this environment.";
  if (raw.includes("invalid url")) return "That doesn't look like a valid URL.";
  if (raw.includes("unsupported content-type")) return "That URL didn't return a webpage.";
  return raw.length > 120 ? "Couldn't read that website." : raw;
}
