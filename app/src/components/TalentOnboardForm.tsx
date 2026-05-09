"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { ChipGroup } from "@/components/ChipGroup";
import { DemoFiller } from "@/components/DemoFiller";
import { Field, Input, Select, Textarea } from "@/components/FormField";
import { OnboardAccountFields, decodeOnboardError } from "@/components/OnboardAccountFields";
import {
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  COMPENSATION_LABELS,
  COMPENSATIONS,
  NEED_LABELS,
  NETWORK_LABELS,
  NETWORKS,
  ROLE_NEEDS,
  SECTOR_LABELS,
  SECTORS,
  STAGE_LABELS,
  STAGES,
  TALENT_CATEGORIES,
  TALENT_CATEGORY_LABELS,
} from "@/lib/data/enum-labels";
import type {
  Availability,
  CandidateDTO,
  Compensation,
  Network,
  Sector,
  Stage,
  StartupNeed,
  TalentCategory,
} from "@/lib/data/types";
import type {
  ResumeExtractResponse,
  ResumeSuggestion,
  ResumeSuggestionField,
  ResumeExtractStreamEvent,
} from "@/lib/resume/types";

type ExtractState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; filled: number }
  | { status: "error"; message: string };

type Props = {
  error?: string;
  createTalentAction: (formData: FormData) => void | Promise<void>;
  /** Prefill values from auth metadata (when signed in). */
  prefilledName?: string;
  prefilledEmail?: string;
  /** When false, the form renders email + password fields and the action
   *  signs the user up before writing the profile. */
  signedIn?: boolean;
  /** When provided, the form is in edit mode: seeds all fields from this
   *  candidate, hides resume + account sections, and renders hidden inputs
   *  for fields not surfaced in the UI so the upsert preserves them. */
  initial?: CandidateDTO;
};

type TalentFormState = {
  name: string;
  email: string;
  headline: string;
  bio: string;
  lookingFor: string;
  categories: TalentCategory[];
  lookingForNeeds: StartupNeed[];
  skills: string;
  networks: Network[];
  domains: Sector[];
  availability: Availability;
  compensation: Compensation[];
  stagePrefs: Stage[];
  riskTolerance: string;
  location: string;
  linkedinUrl: string;
  xUrl: string;
};

const INITIAL_FORM: TalentFormState = {
  name: "",
  email: "",
  headline: "",
  bio: "",
  lookingFor: "",
  categories: ["operator"],
  lookingForNeeds: [],
  skills: "",
  networks: ["operator"],
  domains: [],
  availability: "full-time",
  compensation: ["cash", "equity"],
  stagePrefs: ["seed", "series-a"],
  riskTolerance: "3",
  location: "Salt Lake City, UT",
  linkedinUrl: "",
  xUrl: "",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DROPPED_FIELDS: ResumeSuggestionField[] = [
  "headline",
  "xUrl",
  "networks",
  "compensation",
  "stagePrefs",
  "riskTolerance",
];

export function TalentOnboardForm({
  error,
  createTalentAction,
  prefilledName,
  prefilledEmail,
  signedIn = true,
  initial,
}: Props) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<TalentFormState>(() =>
    initial
      ? {
          name: initial.name,
          email: initial.email,
          headline: initial.headline,
          bio: initial.bio,
          lookingFor: initial.lookingFor,
          categories: initial.categories ?? ["operator"],
          lookingForNeeds: initial.lookingForNeeds ?? [],
          skills: initial.skills.join(", "),
          networks: initial.networks,
          domains: initial.domains,
          availability: initial.availability,
          compensation: initial.compensation,
          stagePrefs: initial.stagePrefs,
          riskTolerance: String(initial.riskTolerance),
          location: initial.location,
          linkedinUrl: initial.linkedinUrl ?? "",
          xUrl: initial.xUrl ?? "",
        }
      : {
          ...INITIAL_FORM,
          name: prefilledName ?? "",
          email: prefilledEmail ?? "",
        },
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [extract, setExtract] = useState<ExtractState>({ status: "idle" });
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [resumeMetaJson, setResumeMetaJson] = useState("");
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sectorOpts = SECTORS.map((v) => ({ value: v, label: SECTOR_LABELS[v] }));
  const compOpts = COMPENSATIONS.map((v) => ({ value: v, label: COMPENSATION_LABELS[v] }));
  const stageOpts = STAGES.map((v) => ({ value: v, label: STAGE_LABELS[v] }));
  const networkOpts = NETWORKS.map((v) => ({ value: v, label: NETWORK_LABELS[v] }));
  const categoryOpts = TALENT_CATEGORIES.map((v) => ({ value: v, label: TALENT_CATEGORY_LABELS[v] }));
  const needOpts = ROLE_NEEDS.map((v) => ({ value: v, label: NEED_LABELS[v] }));

  async function onResumeChange(file: File | null) {
    setStatusMessage("");
    setResumeMetaJson("");

    if (!file) {
      setResumeFilename(null);
      setExtract({ status: "idle" });
      return;
    }
    setResumeFilename(file.name);

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      setExtract({ status: "error", message: "Please upload a PDF resume." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setExtract({ status: "error", message: "File too large. Max size is 5 MB." });
      return;
    }

    const requestId = ++requestIdRef.current;
    setExtract({ status: "loading" });
    setStatusMessage("Reading your resume…");
    try {
      const body = new FormData();
      body.set("resume", file);

      const res = await fetch("/api/resume/extract?stream=1", {
        method: "POST",
        body,
      });

      const streamType = res.headers.get("content-type")?.includes("application/x-ndjson");
      if (!streamType || !res.body) {
        const data = (await res.json().catch(() => ({}))) as
          | ResumeExtractResponse
          | { error?: string };
        if (requestId !== requestIdRef.current) return;
        if (!res.ok) {
          const message =
            typeof data === "object" && data !== null && "error" in data
              ? (data.error as string | undefined)
              : undefined;
          setExtract({ status: "error", message: message ?? "Couldn't read that resume." });
          return;
        }
        applyPayload(data as ResumeExtractResponse, requestId);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalPayload: ResumeExtractResponse | null = null;
      let streamError: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let event: ResumeExtractStreamEvent;
          try {
            event = JSON.parse(trimmed) as ResumeExtractStreamEvent;
          } catch {
            continue;
          }
          if (event.type === "status") {
            if (requestId !== requestIdRef.current) return;
            setStatusMessage(event.message);
          } else if (event.type === "result") {
            finalPayload = event.payload;
          } else if (event.type === "error") {
            streamError = event.message;
          }
        }
      }

      if (requestId !== requestIdRef.current) return;
      if (streamError) {
        setExtract({ status: "error", message: streamError });
        return;
      }
      if (!finalPayload) {
        setExtract({ status: "error", message: "Couldn't read that resume." });
        return;
      }
      applyPayload(finalPayload, requestId);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setExtract({ status: "error", message: "Couldn't read that resume. Try again or fill manually." });
    } finally {
      if (requestId === requestIdRef.current) {
        setStatusMessage("");
      }
    }
  }

  function applyPayload(payload: ResumeExtractResponse, requestId: number) {
    if (requestId !== requestIdRef.current) return;
    setResumeMetaJson(JSON.stringify(payload.extractedTextMeta));
    const filtered = payload.suggestions.filter((s) => !DROPPED_FIELDS.includes(s.field));
    const filled = applyResumeSuggestions(filtered, touched, setForm);
    setExtract({ status: "ok", filled });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <DemoFiller />
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">
        {isEdit ? "Edit candidate profile" : "Talent profile"}
      </span>
      <h1 className="mt-2 text-2xl font-bold text-ink">
        {isEdit ? "Edit your profile." : "Tell us about yourself."}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Free-text where it matters; quick chips for the rest.{" "}
        <span className="text-warmgray-500">Tip: double-click any text field to auto-fill a sample.</span>
      </p>

      {error === "missing_required" && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          A short bio is required.
        </p>
      )}

      <form
        action={createTalentAction}
        className="mt-4 space-y-5 rounded-lg border border-warmgray-200 bg-white p-5"
      >
        {!isEdit && (
          <Field
            id="resume"
            name="resume"
            label="Resume"
            hint="Drop in your resume PDF and we'll fill what we can."
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                id="resume"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => onResumeChange(e.currentTarget.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extract.status === "loading"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-warmgray-800 disabled:cursor-not-allowed disabled:bg-warmgray-300"
              >
                {extract.status === "loading" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
                    {statusMessage || "Reading…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {resumeFilename ? "Replace resume" : "Auto-fill from resume"}
                  </>
                )}
              </button>
              {resumeFilename && (
                <span className="truncate text-xs text-warmgray-600">
                  <span className="font-medium text-ink">{resumeFilename}</span>
                </span>
              )}
            </div>
            {extract.status === "ok" && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Filled in {extract.filled} field{extract.filled === 1 ? "" : "s"} from your resume. Review and edit below.
              </p>
            )}
            {extract.status === "error" && (
              <p className="mt-2 text-xs font-medium text-red-700">{extract.message}</p>
            )}
            <input type="hidden" name="resumeExtractMeta" value={resumeMetaJson} />
          </Field>
        )}

        <Field id="name" name="name" label="Name" required>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Sarah Chen"
            data-sample="Sarah Chen"
            value={form.name}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, name: true }));
              setForm((prev) => ({ ...prev, name: value }));
            }}
          />
        </Field>
        <Field id="bio" name="bio" label="Short bio" required>
          <Textarea
            id="bio"
            name="bio"
            required
            placeholder="What you've worked on, what you're proud of, what kind of company you'd want to join."
            data-sample="Eight years scaling B2B revenue at seed and growth stages. Built and ran the GTM org at two YC companies (one acquired, one shipping). Comfortable owning quota, hiring AEs, and talking pricing with founders. Looking for a Utah-based seed or Series A team where the founders are technical and the wedge is real."
            value={form.bio}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, bio: true }));
              setForm((prev) => ({ ...prev, bio: value }));
            }}
          />
        </Field>
        <Field id="lookingFor" name="lookingFor" label="What are you looking for?" hint="Be specific. Stage, comp, role.">
          <Textarea
            id="lookingFor"
            name="lookingFor"
            rows={3}
            placeholder="Sales-leader role at a seed-to-Series-A B2B software company, ideally Utah-based."
            data-sample="Head-of-sales or first-GTM-hire role at a seed → Series A B2B software company. Utah-based or remote-friendly. Open to taking equity-heavy comp if the wedge and the team are right."
            value={form.lookingFor}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, lookingFor: true }));
              setForm((prev) => ({ ...prev, lookingFor: value }));
            }}
          />
        </Field>
        <Field
          id="categories"
          name="categories"
          label="Which categories describe you?"
          hint="Pick every lane you can credibly fill."
        >
          <ChipGroup
            name="categories"
            options={categoryOpts}
            selected={form.categories}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, categories: true }));
              setForm((prev) => ({ ...prev, categories: next as TalentCategory[] }));
            }}
          />
        </Field>
        <Field
          id="lookingForNeeds"
          name="lookingForNeeds"
          label="What roles are you looking for?"
          hint="These map directly to startup demand so matching can align both sides."
        >
          <ChipGroup
            name="lookingForNeeds"
            options={needOpts}
            selected={form.lookingForNeeds}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, lookingForNeeds: true }));
              setForm((prev) => ({ ...prev, lookingForNeeds: next as StartupNeed[] }));
            }}
          />
        </Field>
        <Field id="skills" name="skills" label="Skills" hint="Comma-separated.">
          <Input
            id="skills"
            name="skills"
            placeholder="sales-leadership, gtm-strategy, pricing"
            data-sample="sales-leadership, gtm-strategy, pricing, channel-partnerships, ae-hiring, outbound-motion"
            value={form.skills}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, skills: true }));
              setForm((prev) => ({ ...prev, skills: value }));
            }}
          />
        </Field>

        <Field id="domains" name="domains" label="Domains of interest" hint="Pick any that fit.">
          <ChipGroup
            name="domains"
            options={sectorOpts}
            selected={form.domains}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, domains: true }));
              setForm((prev) => ({ ...prev, domains: next as Sector[] }));
            }}
          />
        </Field>

        <Field id="availability" name="availability" label="Availability">
          <Select
            id="availability"
            name="availability"
            value={form.availability}
            onChange={(e) => {
              const value = e.currentTarget.value as Availability;
              setTouched((prev) => ({ ...prev, availability: true }));
              setForm((prev) => ({ ...prev, availability: value }));
            }}
          >
            {AVAILABILITIES.map((v) => (
              <option key={v} value={v}>
                {AVAILABILITY_LABELS[v]}
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
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, location: true }));
              setForm((prev) => ({ ...prev, location: value }));
            }}
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            data-sample="https://linkedin.com/in/sample-candidate"
            value={form.linkedinUrl}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTouched((prev) => ({ ...prev, linkedinUrl: true }));
              setForm((prev) => ({ ...prev, linkedinUrl: value }));
            }}
          />
        </Field>

        {!isEdit && (
          <OnboardAccountFields signedIn={signedIn} errorMessage={decodeOnboardError(error)} />
        )}

        {isEdit && initial && (
          <>
            {/* Preserve fields not surfaced in this form during the upsert. */}
            <input type="hidden" name="headline" value={initial.headline} />
            <input type="hidden" name="xUrl" value={initial.xUrl ?? ""} />
            <input type="hidden" name="photoUrl" value={initial.photoUrl ?? ""} />
            <input type="hidden" name="riskTolerance" value={String(initial.riskTolerance)} />
            {initial.networks.map((n) => (
              <input key={`net-${n}`} type="hidden" name="networks" value={n} />
            ))}
            {initial.compensation.map((c) => (
              <input key={`comp-${c}`} type="hidden" name="compensation" value={c} />
            ))}
            {initial.stagePrefs.map((s) => (
              <input key={`stage-${s}`} type="hidden" name="stagePrefs" value={s} />
            ))}
            {initial.resumeExtract && (
              <input
                type="hidden"
                name="resumeExtractMeta"
                value={JSON.stringify(initial.resumeExtract)}
              />
            )}
          </>
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

function applyResumeSuggestions(
  suggestions: ResumeSuggestion[],
  touched: Record<string, boolean>,
  setForm: React.Dispatch<React.SetStateAction<TalentFormState>>,
): number {
  let filled = 0;

  setForm((prev) => {
    const next = { ...prev };
    for (const s of suggestions) {
      if (touched[s.field]) continue;

      if (s.kind === "scalar") {
        switch (s.field) {
          case "name":
          case "bio":
          case "lookingFor":
          case "location":
          case "linkedinUrl":
            if (typeof s.value === "string" && s.value && next[s.field] !== s.value) {
              next[s.field] = s.value;
              filled += 1;
            }
            break;
          case "availability":
            if (typeof s.value === "string" && next.availability !== s.value) {
              next.availability = s.value as Availability;
              filled += 1;
            }
            break;
          // headline, xUrl, riskTolerance are filtered upstream; nothing to do here.
        }
        continue;
      }

      const items = s.items.map((item) => String(item.value));
      switch (s.field) {
        case "skills": {
          if (items.length > 0) {
            next.skills = items.join(", ");
            filled += 1;
          }
          break;
        }
        case "categories": {
          if (items.length > 0) {
            next.categories = dedupe(items) as TalentCategory[];
            filled += 1;
          }
          break;
        }
        case "lookingForNeeds": {
          if (items.length > 0) {
            next.lookingForNeeds = dedupe(items) as StartupNeed[];
            filled += 1;
          }
          break;
        }
        case "domains": {
          if (items.length > 0) {
            next.domains = dedupe(items) as Sector[];
            filled += 1;
          }
          break;
        }
        // networks, compensation, stagePrefs are filtered upstream.
      }
    }
    return next;
  });

  return filled;
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
