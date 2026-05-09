"use client";

import { useState } from "react";
import Link from "next/link";
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
  signedIn?: boolean;
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
}: Props) {
  const [form, setForm] = useState<BusinessFormState>(INITIAL);

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const originOpts = ORIGINS.map((o) => ({ value: o, label: ORIGIN_LABELS[o] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const fundingOpts = FUNDING_STATUSES.map((f) => ({ value: f, label: FUNDING_STATUS_LABELS[f] }));
  const needOpts = ROLE_NEEDS.map((n) => ({ value: n, label: NEED_LABELS[n] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-10">
      <DemoFiller />
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">Business profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us about your company.
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

        <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            data-sample="https://beaconhealth.example.com"
            value={form.websiteUrl}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, websiteUrl: v })); }}
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

        <OnboardAccountFields signedIn={signedIn} errorMessage={decodeOnboardError(error)} />

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            {signedIn ? "Save and see matches →" : "Create account & see matches →"}
          </button>
        </div>
      </form>
    </main>
  );
}
