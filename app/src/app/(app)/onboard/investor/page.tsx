import Link from "next/link";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Field, Input, Textarea } from "@/components/FormField";
import { OnboardAccountFields, decodeOnboardError } from "@/components/OnboardAccountFields";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  SECTOR_LABELS,
  SECTORS,
  STAGE_LABELS,
  STAGES,
} from "@/lib/data/enum-labels";
import { getViewer } from "@/lib/session";
import { createInvestor, skipInvestor } from "../actions";

export default async function OnboardInvestorPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  const signedIn = viewer.kind !== "anon";
  const prefilledName =
    viewer.kind === "demo"
      ? viewer.persona.name
      : viewer.kind === "live"
        ? viewer.name ?? viewer.email?.split("@")[0]
        : undefined;

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const errorMessage = decodeOnboardError(searchParams?.error);

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-10">
      <DemoFiller />
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">VC profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us how you invest.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Most fields are optional. You can fill these in later — or skip straight to
        browsing Utah businesses.{" "}
        <span className="text-warmgray-500">Tip: double-click any text field to auto-fill a sample.</span>
      </p>

      <form
        action={createInvestor}
        className="mt-6 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
      >
        <Field id="photoUrl" name="photoUrl" label="Profile / fund photo" hint="Optional.">
          <PhotoUpload name="photoUrl" label="Upload photo" fallbackName={prefilledName ?? "VC"} />
        </Field>

        <Field id="name" name="name" label="Your name" required>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Rachel Stone"
            defaultValue={prefilledName ?? ""}
            data-sample="Rachel Stone"
          />
        </Field>

        <Field id="fundName" name="fundName" label="Fund name" hint="Optional. Leave blank for solo angels.">
          <Input
            id="fundName"
            name="fundName"
            placeholder="Summit Peak Ventures"
            data-sample="Summit Peak Ventures"
          />
        </Field>

        <Field id="headline" name="headline" label="Headline">
          <Input
            id="headline"
            name="headline"
            placeholder="Seed-stage Mountain West generalist"
            data-sample="Seed-stage Mountain West generalist · technical founders only"
          />
        </Field>

        <Field id="bio" name="bio" label="Bio" hint="Optional.">
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            placeholder="Stage, sectors, the kinds of founders you back."
            data-sample="Pre-seed and seed checks into Utah-rooted technical teams across software, life-sciences tooling, and dev infra. Lead-from-conviction, comfortable being first money in. Active with PIVOT Center and Lassonde."
          />
        </Field>

        <Field id="checkSize" name="checkSize" label="Check size (USD)">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="checkSizeMin"
              name="checkSizeMin"
              type="text"
              placeholder="Min e.g. 250000"
              data-sample="250000"
            />
            <Input
              id="checkSizeMax"
              name="checkSizeMax"
              type="text"
              placeholder="Max e.g. 1500000"
              data-sample="1500000"
            />
          </div>
        </Field>

        <Field id="sectorsInvested" name="sectorsInvested" label="Sectors I invest in" hint="Pick all that apply.">
          <ChipGroup name="sectorsInvested" options={sectorOpts} />
        </Field>

        <Field id="stagePrefs" name="stagePrefs" label="Stages I invest at" hint="Pick all that apply.">
          <ChipGroup name="stagePrefs" options={stageOpts} defaultSelected={["seed"]} />
        </Field>

        <Field id="location" name="location" label="Location">
          <Input
            id="location"
            name="location"
            defaultValue="Salt Lake City, UT"
            data-sample="Salt Lake City, UT"
          />
        </Field>

        <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            data-sample="https://summitpeak.example.com"
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            data-sample="https://linkedin.com/in/sample-investor"
          />
        </Field>

        <OnboardAccountFields signedIn={signedIn} errorMessage={errorMessage} />

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800"
          >
            {signedIn ? "Save profile" : "Create account & save"}
          </button>
          <button
            type="submit"
            formAction={skipInvestor}
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
          >
            {signedIn ? "Skip → take me to Businesses" : "Create account & browse"}
          </button>
        </div>
      </form>
    </main>
  );
}
