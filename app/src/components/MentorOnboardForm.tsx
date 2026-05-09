"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ChipGroup } from "@/components/ChipGroup";
import { Field, Input, Textarea } from "@/components/FormField";
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
};

type MentorFormState = {
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

const VALID_SECTORS = new Set(SECTORS);
const VALID_COMP = new Set(COMPENSATIONS);

export function MentorOnboardForm({
  error,
  createMentorAction,
  prefilledName,
  prefilledEmail,
}: Props) {
  const [paste, setPaste] = useState("");
  const [form, setForm] = useState<MentorFormState>(INITIAL);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);

  const sectorOpts = SECTORS.map((s) => ({ value: s, label: SECTOR_LABELS[s] }));
  const compOpts = COMPENSATIONS.map((c) => ({ value: c, label: COMPENSATION_LABELS[c] }));
  const networkOpts = NETWORKS.map((n) => ({ value: n, label: NETWORK_LABELS[n] }));

  async function onExtract() {
    setExtractError(null);
    setExtractedFields([]);
    if (!paste.trim()) {
      setExtractError("Paste your bio first.");
      return;
    }
    setIsExtracting(true);
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "mentor", text: paste }),
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
            case "headline":
              if (typeof val === "string" && !next.headline) {
                next.headline = val;
                filled.push("headline");
              }
              break;
            case "bio":
              if (typeof val === "string" && !next.bio) {
                next.bio = val;
                filled.push("bio");
              }
              break;
            case "location":
              if (typeof val === "string") {
                next.location = val;
                filled.push("location");
              }
              break;
            case "linkedinUrl":
              if (typeof val === "string") {
                next.linkedinUrl = val;
                filled.push("linkedinUrl");
              }
              break;
            case "areasAdvised":
              if (Array.isArray(val)) {
                next.areasAdvised = val.filter((v): v is Sector => VALID_SECTORS.has(v as Sector));
                filled.push("areasAdvised");
              }
              break;
            case "sectorsOfInterest":
              if (Array.isArray(val)) {
                next.sectorsOfInterest = val.filter((v): v is Sector =>
                  VALID_SECTORS.has(v as Sector),
                );
                filled.push("sectorsOfInterest");
              }
              break;
            case "compPreference":
              if (Array.isArray(val)) {
                const filtered = val.filter((v): v is Compensation =>
                  VALID_COMP.has(v as Compensation),
                );
                if (filtered.length > 0) {
                  next.compPreference = filtered;
                  filled.push("compPreference");
                }
              }
              break;
            case "hoursPerMonth":
              if (typeof val === "string") {
                next.hoursPerMonth = val;
                filled.push("hoursPerMonth");
              }
              break;
            case "boardSeatOpen":
              if (val === "yes" || val === "no") {
                next.boardSeatOpen = val;
                filled.push("boardSeatOpen");
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

      <span className="eyebrow mt-6 block text-orange-500">Mentor profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us how you advise.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Paste your bio or your LinkedIn About section. We'll auto-fill what we can.
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          A short bio is required.
        </p>
      )}

      {(prefilledName || prefilledEmail) && (
        <div className="mt-6 rounded-2xl border border-warmgray-100 bg-white p-4 text-sm text-warmgray-700 shadow-sm">
          <span className="eyebrow text-warmgray-400">Onboarding as</span>
          <p className="mt-1 font-semibold text-ink">
            {prefilledName || "you"}
            {prefilledEmail && (
              <span className="ml-2 font-normal text-warmgray-500">· {prefilledEmail}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-warmgray-500">
            We pulled these from your account. Change them in settings.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-warmgray-100 bg-orange-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" strokeWidth={1.75} aria-hidden />
          <span className="eyebrow text-orange-500">Smart fill</span>
        </div>
        <p className="mt-2 text-sm text-warmgray-700">
          Paste your advisor bio or LinkedIn About section here. We'll extract what we can —
          you can edit anything below.
        </p>
        <Textarea
          rows={5}
          value={paste}
          onChange={(e) => setPaste(e.currentTarget.value)}
          placeholder="Paste your advisor bio or LinkedIn About section…"
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
        {extractError && (
          <p className="mt-2 text-xs text-red-700">{extractError}</p>
        )}
      </section>

      <form
        action={createMentorAction}
        className="mt-6 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
      >
        <Field id="photoUrl" name="photoUrl" label="Profile photo" hint="Optional.">
          <PhotoUpload name="photoUrl" label="Upload photo" fallbackName={prefilledName ?? "You"} />
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

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
          >
            Save profile →
          </button>
        </div>
      </form>
    </main>
  );
}
