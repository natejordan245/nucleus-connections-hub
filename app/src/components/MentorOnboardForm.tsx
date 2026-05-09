"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Field, Input, Textarea } from "@/components/FormField";
import { OnboardAccountFields, decodeOnboardError } from "@/components/OnboardAccountFields";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  COMPENSATION_LABELS,
  COMPENSATIONS,
  NETWORK_LABELS,
  NETWORKS,
  SECTOR_LABELS,
  SECTORS,
} from "@/lib/data/enum-labels";
import type {
  Compensation,
  MentorDTO,
  Network,
  Sector,
} from "@/lib/data/types";

type Props = {
  error?: string;
  createMentorAction: (formData: FormData) => void | Promise<void>;
  prefilledName?: string;
  prefilledEmail?: string;
  signedIn?: boolean;
  initial?: MentorDTO;
};

type MentorFormState = {
  name: string;
  headline: string;
  bio: string;
  areasAdvised: Sector[];
  hoursPerMonth: string;
  boardSeatOpen: "yes" | "no";
  compPreference: Compensation[];
  sectorsOfInterest: Sector[];
  networks: Network[];
  location: string;
  linkedinUrl: string;
  websiteUrl: string;
};

const INITIAL: MentorFormState = {
  name: "",
  headline: "",
  bio: "",
  areasAdvised: [],
  hoursPerMonth: "4",
  boardSeatOpen: "no",
  compPreference: ["mentor"],
  sectorsOfInterest: [],
  networks: ["mentor"],
  location: "Salt Lake City, UT",
  linkedinUrl: "",
  websiteUrl: "",
};

export function MentorOnboardForm({
  error,
  createMentorAction,
  prefilledName,
  prefilledEmail: _prefilledEmail,
  signedIn = true,
  initial,
}: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<MentorFormState>(() =>
    initial
      ? {
          name: initial.name,
          headline: initial.headline,
          bio: initial.bio,
          areasAdvised: initial.areasAdvised,
          hoursPerMonth: String(initial.hoursPerMonth),
          boardSeatOpen: initial.boardSeatOpen ? "yes" : "no",
          compPreference: initial.compPreference,
          sectorsOfInterest: initial.sectorsOfInterest,
          networks: initial.networks,
          location: initial.location,
          linkedinUrl: initial.linkedinUrl ?? "",
          websiteUrl: initial.websiteUrl ?? "",
        }
      : { ...INITIAL, name: prefilledName ?? "" },
  );

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const compOpts = COMPENSATIONS.map((c) => ({ value: c, label: COMPENSATION_LABELS[c] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <DemoFiller />
      <Breadcrumb
        items={[
          { label: "Profile types", href: "/onboard" },
          { label: "Mentor" },
        ]}
      />

      <span className="eyebrow mt-6 block text-orange-500">
        {isEdit ? "Edit mentor profile" : "Mentor profile"}
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        {isEdit ? "Edit your profile." : "Tell us how you advise."}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        A few quick fields and you're set up.{" "}
        <span className="text-warmgray-500">Tip: double-click any text field to auto-fill a sample.</span>
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          A short bio is required.
        </p>
      )}

      <form
        action={createMentorAction}
        className="mt-4 space-y-5 rounded-lg border border-warmgray-200 bg-white p-5"
      >
        <Field id="photoUrl" name="photoUrl" label="Profile photo" hint="Optional.">
          <PhotoUpload
            name="photoUrl"
            label="Upload photo"
            fallbackName={form.name || prefilledName || "You"}
            defaultUrl={initial?.photoUrl}
          />
        </Field>

        <Field id="name" name="name" label="Your name" required>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="David Holm"
            data-sample="David Holm"
            value={form.name}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, name: v })); }}
          />
        </Field>

        <Field id="headline" name="headline" label="Headline" hint="One line — your advisor positioning.">
          <Input
            id="headline"
            name="headline"
            placeholder="Two-time founder · post-exit advisor for SaaS GTM"
            data-sample="Two-time founder · post-exit advisor for SaaS GTM and seed-stage hiring"
            value={form.headline}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, headline: v })); }}
          />
        </Field>

        <Field id="bio" name="bio" label="Bio" required>
          <Textarea
            id="bio"
            name="bio"
            required
            rows={5}
            placeholder="Background, the kinds of founders you advise, and what's worked."
            data-sample="Founded and exited two B2B SaaS companies (one PE buyout, one acqui-hire). Now advising 6–8 seed-stage Utah teams a quarter on GTM, hiring AEs, and post-pilot enterprise motion. Best when paired with technical founders who haven't run sales orgs before. Lassonde Founder Track mentor."
            value={form.bio}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, bio: v })); }}
          />
        </Field>

        <Field id="areasAdvised" name="areasAdvised" label="Areas you advise on" hint="Pick all that apply.">
          <ChipGroup
            name="areasAdvised"
            options={sectorOpts}
            selected={form.areasAdvised}
            onChange={(next) => setForm((p) => ({ ...p, areasAdvised: next as Sector[] }))}
          />
        </Field>

        <Field
          id="hoursPerMonth"
          name="hoursPerMonth"
          label="Hours per month available"
          hint="Realistic monthly capacity, 0–40."
        >
          <Input
            id="hoursPerMonth"
            name="hoursPerMonth"
            type="number"
            min={0}
            max={40}
            data-sample="6"
            value={form.hoursPerMonth}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, hoursPerMonth: v })); }}
          />
        </Field>

        <Field id="boardSeatOpen" name="boardSeatOpen" label="Open to a board seat?">
          <ChipGroup
            name="boardSeatOpen"
            multi={false}
            options={[
              { value: "yes" as const, label: "Yes" },
              { value: "no" as const, label: "No" },
            ]}
            selected={[form.boardSeatOpen]}
            onChange={(next) => {
              const v = (next[0] === "yes" ? "yes" : "no") as "yes" | "no";
              setForm((p) => ({ ...p, boardSeatOpen: v }));
            }}
          />
        </Field>

        <Field id="compPreference" name="compPreference" label="Compensation preference" hint="Pick all that apply.">
          <ChipGroup
            name="compPreference"
            options={compOpts}
            selected={form.compPreference}
            onChange={(next) => setForm((p) => ({ ...p, compPreference: next as Compensation[] }))}
          />
        </Field>

        <Field id="sectorsOfInterest" name="sectorsOfInterest" label="Sectors of interest" hint="Beyond what you currently advise on.">
          <ChipGroup
            name="sectorsOfInterest"
            options={sectorOpts}
            selected={form.sectorsOfInterest}
            onChange={(next) => setForm((p) => ({ ...p, sectorsOfInterest: next as Sector[] }))}
          />
        </Field>

        <Field id="networks" name="networks" label="Which Nucleus networks do you fit?">
          <ChipGroup
            name="networks"
            options={networkOpts}
            selected={form.networks}
            onChange={(next) => setForm((p) => ({ ...p, networks: next as Network[] }))}
          />
        </Field>

        <Field id="location" name="location" label="Location">
          <Input
            id="location"
            name="location"
            data-sample="Park City, UT"
            value={form.location}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, location: v })); }}
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            data-sample="https://linkedin.com/in/sample-mentor"
            value={form.linkedinUrl}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, linkedinUrl: v })); }}
          />
        </Field>

        <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            data-sample="https://sample-mentor.example.com"
            value={form.websiteUrl}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, websiteUrl: v })); }}
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
                ? "Save profile →"
                : "Create account & save →"}
          </button>
        </div>
      </form>
    </main>
  );
}
