"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ChipGroup } from "@/components/ChipGroup";
import { Field, Input, Select, Textarea } from "@/components/FormField";
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
  FundingStatus,
  Network,
  Origin,
  Sector,
  Stage,
  StartupNeed,
} from "@/lib/data/types";

type Props = {
  error?: string;
  createBusinessAction: (formData: FormData) => void | Promise<void>;
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

const VALID_SECTOR = new Set(SECTORS);
const VALID_ORIGIN = new Set(ORIGINS);
const VALID_STAGE = new Set(STAGES);
const VALID_FUNDING = new Set(FUNDING_STATUSES);
const VALID_NEEDS = new Set(ROLE_NEEDS);

export function BusinessOnboardForm({ error, createBusinessAction }: Props) {
  const [paste, setPaste] = useState("");
  const [form, setForm] = useState<BusinessFormState>(INITIAL);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const originOpts = ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const fundingOpts = FUNDING_STATUSES.map((f) => ({ value: f, label: FUNDING_STATUS_LABELS[f] }));
  const needOpts = ROLE_NEEDS.map((n) => ({ value: n, label: NEED_LABELS[n] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  async function onExtract() {
    setExtractError(null);
    setExtractedFields([]);
    if (!paste.trim()) {
      setExtractError("Paste a description first.");
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "business", text: paste }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | { suggestions?: { field: string; value: string | string[]; confidence: number }[] }
        | { error?: string };
      if (!res.ok || "error" in data) {
        setExtractError(("error" in data && data.error) || "Extraction failed.");
        return;
      }
      const suggestions = "suggestions" in data ? data.suggestions ?? [] : [];
      const filled: string[] = [];
      setForm((prev) => {
        const next = { ...prev };
        for (const s of suggestions) {
          const val = s.value;
          switch (s.field) {
            case "name":
              if (typeof val === "string" && !next.name) {
                next.name = val;
                filled.push("name");
              }
              break;
            case "oneLiner":
              if (typeof val === "string" && !next.oneLiner) {
                next.oneLiner = val;
                filled.push("oneLiner");
              }
              break;
            case "description":
              if (typeof val === "string" && !next.description) {
                next.description = val;
                filled.push("description");
              }
              break;
            case "sector":
              if (typeof val === "string" && VALID_SECTOR.has(val as Sector)) {
                next.sector = val as Sector;
                filled.push("sector");
              }
              break;
            case "origin":
              if (typeof val === "string" && VALID_ORIGIN.has(val as Origin)) {
                next.origin = val as Origin;
                filled.push("origin");
              }
              break;
            case "fundingStage":
              if (typeof val === "string" && VALID_STAGE.has(val as Stage)) {
                next.fundingStage = val as Stage;
                filled.push("fundingStage");
              }
              break;
            case "fundingStatus":
              if (typeof val === "string" && VALID_FUNDING.has(val as FundingStatus)) {
                next.fundingStatus = val as FundingStatus;
                filled.push("fundingStatus");
              }
              break;
            case "needs":
              if (Array.isArray(val)) {
                const filtered = val.filter((v): v is StartupNeed => VALID_NEEDS.has(v as StartupNeed));
                if (filtered.length > 0) {
                  next.needs = filtered;
                  filled.push("needs");
                }
              }
              break;
            case "location":
              if (typeof val === "string") {
                next.location = val;
                filled.push("location");
              }
              break;
            case "websiteUrl":
              if (typeof val === "string") {
                next.websiteUrl = val;
                filled.push("websiteUrl");
              }
              break;
            case "linkedinUrl":
              if (typeof val === "string") {
                next.linkedinUrl = val;
                filled.push("linkedinUrl");
              }
              break;
          }
        }
        return next;
      });
      setExtractedFields(filled);
      if (filled.length === 0) {
        setExtractError("No high-confidence fields could be extracted. Fill in below.");
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-10">
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">Business profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us about your company.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Paste your website's About section, deck blurb, or pitch summary. We'll auto-fill what we can.
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Company name and a short description are required.
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-warmgray-100 bg-orange-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" strokeWidth={1.75} aria-hidden />
          <span className="eyebrow text-orange-500">Smart fill</span>
        </div>
        <p className="mt-2 text-sm text-warmgray-700">
          Paste a website blurb, pitch summary, or deck slide here. We'll extract what we can.
        </p>
        <Textarea
          rows={5}
          value={paste}
          onChange={(e) => setPaste(e.currentTarget.value)}
          placeholder="Paste your About section, deck blurb, or pitch summary…"
          className="mt-3"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onExtract}
            disabled={isExtracting || !paste.trim()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting ? "Extracting…" : "Extract details →"}
          </button>
          {extractedFields.length > 0 && (
            <p className="text-xs text-emerald-700">
              Pre-filled {extractedFields.length} {extractedFields.length === 1 ? "field" : "fields"} below.
            </p>
          )}
        </div>
        {extractError && <p className="mt-2 text-xs text-red-700">{extractError}</p>}
      </section>

      <form
        action={createBusinessAction}
        className="mt-6 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
      >
        <Field id="logoUrl" name="logoUrl" label="Company logo" hint="Optional. Helps your card stand out.">
          <PhotoUpload name="logoUrl" label="Upload logo" fallbackName="Co" />
        </Field>

        <Field id="name" name="name" label="Company name" required>
          <Input
            id="name"
            name="name"
            required
            placeholder="Bramble AI"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.currentTarget.value }))}
          />
        </Field>

        <Field id="oneLiner" name="oneLiner" label="One-liner" hint="Twelve words max.">
          <Input
            id="oneLiner"
            name="oneLiner"
            placeholder="Customer-conversation analytics for vertical SaaS"
            value={form.oneLiner}
            onChange={(e) => setForm((p) => ({ ...p, oneLiner: e.currentTarget.value }))}
          />
        </Field>

        <Field id="description" name="description" label="What you do" required>
          <Textarea
            id="description"
            name="description"
            required
            rows={5}
            placeholder="Who you are, what you make, who buys it, and where you are in the journey."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.currentTarget.value }))}
          />
        </Field>

        <Field id="sector" name="sector" label="Core sector focus">
          <Select
            id="sector"
            name="sector"
            value={form.sector}
            onChange={(e) => setForm((p) => ({ ...p, sector: e.currentTarget.value as Sector }))}
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
            onChange={(e) => setForm((p) => ({ ...p, origin: e.currentTarget.value as Origin }))}
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
            onChange={(e) => setForm((p) => ({ ...p, fundingStage: e.currentTarget.value as Stage }))}
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
            onChange={(e) =>
              setForm((p) => ({ ...p, fundingStatus: e.currentTarget.value as FundingStatus }))
            }
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
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.currentTarget.value }))}
          />
        </Field>

        <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            value={form.websiteUrl}
            onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.currentTarget.value }))}
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/company/…"
            value={form.linkedinUrl}
            onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.currentTarget.value }))}
          />
        </Field>

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            Save and see matches →
          </button>
        </div>
      </form>
    </main>
  );
}
