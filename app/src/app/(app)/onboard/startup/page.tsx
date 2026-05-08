import Link from "next/link";
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
import { maybeViewer } from "@/lib/viewer";
import { createStartup } from "../actions";

export default async function OnboardStartupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { viewerId } = await maybeViewer();

  const needOpts = ROLE_NEEDS.map((v) => ({ value: v, label: NEED_LABELS[v] }));
  const networkOpts = NETWORKS.map((v) => ({ value: v, label: NETWORK_LABELS[v] }));

  return (
      <main className="mx-auto w-full max-w-2xl px-8 py-10">
        <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back
        </Link>

        <span className="eyebrow mt-6 block text-orange-500">Company profile</span>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
          Tell us about your company.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          Free-text where it matters; quick chips for the rest.
        </p>

        {searchParams?.error === "missing_required" && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Name and a short description are required.
          </p>
        )}

        <form
          action={createStartup}
          className="mt-8 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
        >
          <Field id="logoUrl" name="logoUrl" label="Company logo" hint="Optional. Helps your card stand out.">
            <PhotoUpload name="logoUrl" label="Upload logo" fallbackName="Co" />
          </Field>
          <Field id="name" name="name" label="Company name" required>
            <Input id="name" name="name" required placeholder="Bramble AI" />
          </Field>
          <Field id="oneLiner" name="oneLiner" label="One-liner" hint="Twelve words max.">
            <Input id="oneLiner" name="oneLiner" placeholder="Customer-conversation analytics for vertical SaaS" />
          </Field>
          <Field id="description" name="description" label="What you do" required>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Who you are, what you make, who buys it, and where you are in the journey."
            />
          </Field>

          <Field id="sector" name="sector" label="Core sector focus">
            <Select id="sector" name="sector" defaultValue="software">
              {SECTORS.map((v) => (
                <option key={v} value={v}>
                  {SECTOR_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="origin" name="origin" label="Origin / lineage">
            <Select id="origin" name="origin" defaultValue="bootstrapped">
              {ORIGINS.map((v) => (
                <option key={v} value={v}>
                  {ORIGIN_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            id="needs"
            name="needs"
            label="What talent are you looking for?"
            hint="These options match the talent-side categories and intent chips."
          >
            <ChipGroup name="needs" options={needOpts} />
          </Field>

          <Field id="networksWanted" name="networksWanted" label="Which Nucleus networks do you want help from?" hint="Pick all that apply.">
            <ChipGroup name="networksWanted" options={networkOpts} defaultSelected={["operator"]} />
          </Field>

          <Field id="fundingStage" name="fundingStage" label="Funding stage">
            <Select id="fundingStage" name="fundingStage" defaultValue="seed">
              {STAGES.map((v) => (
                <option key={v} value={v}>
                  {STAGE_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="fundingStatus" name="fundingStatus" label="Funding status">
            <Select id="fundingStatus" name="fundingStatus" defaultValue="pre-revenue">
              {FUNDING_STATUSES.map((v) => (
                <option key={v} value={v}>
                  {FUNDING_STATUS_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="location" name="location" label="Location">
            <Input id="location" name="location" defaultValue="Salt Lake City, UT" />
          </Field>

          <Field id="websiteUrl" name="websiteUrl" label="Website" hint="Optional.">
            <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" />
          </Field>

          <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
            <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/company/…" />
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
