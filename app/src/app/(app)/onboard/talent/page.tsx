import Link from "next/link";
import { ChipGroup } from "@/components/ChipGroup";
import { Field, Input, Select, Textarea } from "@/components/FormField";
import {
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  COMPENSATION_LABELS,
  COMPENSATIONS,
  NETWORK_LABELS,
  NETWORKS,
  SECTOR_LABELS,
  SECTORS,
  STAGE_LABELS,
  STAGES,
} from "@/lib/data/enum-labels";
import { maybeViewer } from "@/lib/viewer";
import { createTalent } from "../actions";

export default async function OnboardTalentPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { viewerId } = await maybeViewer();

  const sectorOpts = SECTORS.map((v) => ({ value: v, label: SECTOR_LABELS[v] }));
  const compOpts = COMPENSATIONS.map((v) => ({ value: v, label: COMPENSATION_LABELS[v] }));
  const stageOpts = STAGES.map((v) => ({ value: v, label: STAGE_LABELS[v] }));
  const networkOpts = NETWORKS.map((v) => ({ value: v, label: NETWORK_LABELS[v] }));

  return (
      <main className="mx-auto w-full max-w-2xl px-8 py-10">
        <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back
        </Link>

        <span className="eyebrow mt-6 block text-orange-500">Operator profile</span>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
          Tell us about yourself.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          Free-text where it matters; quick chips for the rest.
        </p>

        {searchParams?.error === "missing_required" && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Name, email, and a short bio are required.
          </p>
        )}

        <form
          action={createTalent}
          className="mt-8 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
        >
          <Field id="name" name="name" label="Name" required>
            <Input id="name" name="name" required placeholder="Sarah Chen" />
          </Field>
          <Field id="email" name="email" label="Email" required>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </Field>
          <Field id="headline" name="headline" label="Headline" hint="One line — your professional summary.">
            <Input id="headline" name="headline" placeholder="Former GTM lead, two seed-stage exits" />
          </Field>
          <Field id="bio" name="bio" label="Short bio" required>
            <Textarea
              id="bio"
              name="bio"
              required
              placeholder="What you've worked on, what you're proud of, what kind of company you'd want to join."
            />
          </Field>
          <Field id="lookingFor" name="lookingFor" label="What are you looking for?" hint="Be specific. Stage, comp, role.">
            <Textarea
              id="lookingFor"
              name="lookingFor"
              rows={3}
              placeholder="Sales-leader role at a seed-to-Series-A B2B software company, ideally Utah-based."
            />
          </Field>
          <Field id="skills" name="skills" label="Skills" hint="Comma-separated.">
            <Input id="skills" name="skills" placeholder="sales-leadership, gtm-strategy, pricing" />
          </Field>

          <Field id="networks" name="networks" label="Which Nucleus networks do you fit?" hint="Pick all that apply — most operators just check Operator.">
            <ChipGroup name="networks" options={networkOpts} defaultSelected={["operator"]} />
          </Field>

          <Field id="domains" name="domains" label="Domains of interest" hint="Pick any that fit.">
            <ChipGroup name="domains" options={sectorOpts} />
          </Field>

          <Field id="availability" name="availability" label="Availability">
            <Select id="availability" name="availability" defaultValue="full-time">
              {AVAILABILITIES.map((v) => (
                <option key={v} value={v}>
                  {AVAILABILITY_LABELS[v]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="compensation" name="compensation" label="Compensation interest" hint="Pick all that apply.">
            <ChipGroup name="compensation" options={compOpts} defaultSelected={["cash", "equity"]} />
          </Field>

          <Field id="stagePrefs" name="stagePrefs" label="Stage preference" hint="Where you want to plug in.">
            <ChipGroup name="stagePrefs" options={stageOpts} defaultSelected={["seed", "series-a"]} />
          </Field>

          <Field id="riskTolerance" name="riskTolerance" label="Risk tolerance" hint="1 = stable bet · 5 = pre-PMF moonshot.">
            <Input
              id="riskTolerance"
              name="riskTolerance"
              type="number"
              min={1}
              max={5}
              defaultValue={3}
            />
          </Field>

          <Field id="location" name="location" label="Location">
            <Input id="location" name="location" defaultValue="Salt Lake City, UT" />
          </Field>

          <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
            <Input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/…" />
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
