"use client";

import { useState } from "react";
import Link from "next/link";
import { ChipGroup } from "@/components/ChipGroup";
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
  Network,
  Sector,
} from "@/lib/data/types";

type Props = {
  error?: string;
  createMentorAction: (formData: FormData) => void | Promise<void>;
  prefilledName?: string;
  prefilledEmail?: string;
  signedIn?: boolean;
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
}: Props) {
  const [form, setForm] = useState<MentorFormState>(() => ({
    ...INITIAL,
    name: prefilledName ?? "",
  }));

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const compOpts = COMPENSATIONS.map((c) => ({ value: c, label: COMPENSATION_LABELS[c] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-10">
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">Mentor profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us how you advise.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        A few quick fields and you're set up.
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          A short bio is required.
        </p>
      )}

      <form
        action={createMentorAction}
        className="mt-6 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
      >
        <Field id="photoUrl" name="photoUrl" label="Profile photo" hint="Optional.">
          <PhotoUpload name="photoUrl" label="Upload photo" fallbackName={form.name || prefilledName || "You"} />
        </Field>

        <Field id="name" name="name" label="Your name" required>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="David Holm"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.currentTarget.value }))}
          />
        </Field>

        <Field id="headline" name="headline" label="Headline" hint="One line — your advisor positioning.">
          <Input
            id="headline"
            name="headline"
            placeholder="Two-time founder · post-exit advisor for SaaS GTM"
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
            value={form.websiteUrl}
            onChange={(e) => { const v = e.currentTarget.value; setForm((p) => ({ ...p, websiteUrl: v })); }}
          />
        </Field>

        <OnboardAccountFields signedIn={signedIn} errorMessage={decodeOnboardError(error)} />

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            {signedIn ? "Save profile →" : "Create account & save →"}
          </button>
        </div>
      </form>
    </main>
  );
}
