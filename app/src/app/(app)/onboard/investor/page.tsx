import Link from "next/link";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Field, Input, Textarea } from "@/components/FormField";
import { OnboardAccountFields } from "@/components/OnboardAccountFields";
import { decodeOnboardError } from "@/lib/onboard-errors";
import { PhotoUpload } from "@/components/PhotoUpload";
import {
  SECTOR_LABELS,
  SECTORS,
  STAGE_LABELS,
  STAGES,
} from "@/lib/data/enum-labels";
import { getDataStore } from "@/lib/data";
import { getViewer } from "@/lib/session";
import { createInvestor, skipInvestor } from "../actions";

export default async function OnboardInvestorPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  const signedIn = viewer.kind !== "anon";
  const viewerId =
    viewer.kind === "live" ? viewer.userId : viewer.kind === "demo" ? viewer.persona.id : null;
  const initial = viewerId ? await getDataStore().getInvestor(viewerId) : null;
  const isEdit = Boolean(initial);
  const prefilledName =
    initial?.name ??
    (viewer.kind === "demo"
      ? viewer.persona.name
      : viewer.kind === "live"
        ? viewer.name ?? viewer.email?.split("@")[0]
        : undefined);

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const stageOpts = STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }));
  const errorMessage = decodeOnboardError(searchParams?.error);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <DemoFiller />
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">
        {isEdit ? "Edit VC profile" : "VC profile"}
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        {isEdit ? "Edit your profile." : "Tell us how you invest."}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Most fields are optional. You can fill these in later — or skip straight to
        browsing Utah businesses.{" "}
        <span className="text-warmgray-500">Tip: double-click any text field to auto-fill a sample.</span>
      </p>

      <form
        action={createInvestor}
        className="mt-4 space-y-5 rounded-lg border border-warmgray-200 bg-white p-5"
      >
        <Field id="photoUrl" name="photoUrl" label="Profile / fund photo" hint="Optional.">
          <PhotoUpload
            name="photoUrl"
            label="Upload photo"
            fallbackName={prefilledName ?? "VC"}
            defaultUrl={initial?.photoUrl}
          />
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
            defaultValue={initial?.fundName ?? ""}
            data-sample="Summit Peak Ventures"
          />
        </Field>

        <Field id="headline" name="headline" label="Headline">
          <Input
            id="headline"
            name="headline"
            placeholder="Seed-stage Mountain West generalist"
            defaultValue={initial?.headline ?? ""}
            data-sample="Seed-stage Mountain West generalist · technical founders only"
          />
        </Field>

        <Field id="bio" name="bio" label="Bio" hint="Optional.">
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            placeholder="Stage, sectors, the kinds of founders you back."
            defaultValue={initial?.bio ?? ""}
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
              defaultValue={initial?.checkSizeMin ? String(initial.checkSizeMin) : ""}
              data-sample="250000"
            />
            <Input
              id="checkSizeMax"
              name="checkSizeMax"
              type="text"
              placeholder="Max e.g. 1500000"
              defaultValue={initial?.checkSizeMax ? String(initial.checkSizeMax) : ""}
              data-sample="1500000"
            />
          </div>
        </Field>

        <Field id="sectorsInvested" name="sectorsInvested" label="Sectors I invest in" hint="Pick all that apply.">
          <ChipGroup
            name="sectorsInvested"
            options={sectorOpts}
            defaultSelected={initial?.sectorsInvested}
          />
        </Field>

        <Field id="stagePrefs" name="stagePrefs" label="Stages I invest at" hint="Pick all that apply.">
          <ChipGroup
            name="stagePrefs"
            options={stageOpts}
            defaultSelected={initial?.stagePrefs ?? ["seed"]}
          />
        </Field>

        <Field id="location" name="location" label="Location">
          <Input
            id="location"
            name="location"
            defaultValue={initial?.location ?? "Salt Lake City, UT"}
            data-sample="Salt Lake City, UT"
          />
        </Field>

        <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            defaultValue={initial?.websiteUrl ?? ""}
            data-sample="https://summitpeak.example.com"
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            defaultValue={initial?.linkedinUrl ?? ""}
            data-sample="https://linkedin.com/in/sample-investor"
          />
        </Field>

        {!isEdit && (
          <OnboardAccountFields signedIn={signedIn} errorMessage={errorMessage} />
        )}

        {isEdit && initial?.networks?.map((n) => (
          <input key={`net-${n}`} type="hidden" name="networks" value={n} />
        ))}

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800"
          >
            {isEdit
              ? "Save changes"
              : signedIn
                ? "Save profile"
                : "Create account & save"}
          </button>
          {!isEdit && (
            <button
              type="submit"
              formAction={skipInvestor}
              className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
            >
              {signedIn ? "Skip → take me to Businesses" : "Create account & browse"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
