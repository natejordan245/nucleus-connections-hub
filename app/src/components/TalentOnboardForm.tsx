"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChipGroup } from "@/components/ChipGroup";
import { Field, Input, Select, Textarea } from "@/components/FormField";
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
  Compensation,
  Network,
  Sector,
  Stage,
  StartupNeed,
  TalentCategory,
} from "@/lib/data/types";
import type {
  ResumeExtractResponse,
  ResumeExtractStage,
  ResumeSuggestion,
  ResumeSuggestionField,
  ResumeSuggestionSource,
  ResumeExtractStreamEvent,
} from "@/lib/resume/types";

type Props = {
  error?: string;
  createTalentAction: (formData: FormData) => void | Promise<void>;
  /** Pre-resolved from auth metadata. The form no longer asks for these. */
  prefilledName?: string;
  prefilledEmail?: string;
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

const FIELD_LABELS: Record<ResumeSuggestionField, string> = {
  name: "Name",
  headline: "Headline",
  bio: "Short bio",
  lookingFor: "What are you looking for?",
  skills: "Skills",
  location: "Location",
  linkedinUrl: "LinkedIn",
  xUrl: "X URL",
  categories: "Categories",
  lookingForNeeds: "Roles you're looking for",
  domains: "Domains of interest",
  networks: "Nucleus networks",
  compensation: "Compensation interest",
  stagePrefs: "Stage preference",
  availability: "Availability",
  riskTolerance: "Risk tolerance",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function TalentOnboardForm({ error, createTalentAction, prefilledName, prefilledEmail }: Props) {
  const [form, setForm] = useState<TalentFormState>(() => ({
    ...INITIAL_FORM,
    name: prefilledName ?? "",
    email: prefilledEmail ?? "",
  }));
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusStage, setStatusStage] = useState<ResumeExtractStage | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [resumeMetaJson, setResumeMetaJson] = useState("");
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const sectorOpts = SECTORS.map((v) => ({ value: v, label: SECTOR_LABELS[v] }));
  const compOpts = COMPENSATIONS.map((v) => ({ value: v, label: COMPENSATION_LABELS[v] }));
  const stageOpts = STAGES.map((v) => ({ value: v, label: STAGE_LABELS[v] }));
  const networkOpts = NETWORKS.map((v) => ({ value: v, label: NETWORK_LABELS[v] }));
  const categoryOpts = TALENT_CATEGORIES.map((v) => ({ value: v, label: TALENT_CATEGORY_LABELS[v] }));
  const needOpts = ROLE_NEEDS.map((v) => ({ value: v, label: NEED_LABELS[v] }));

  async function onResumeChange(file: File | null) {
    setExtractError(null);
    setWarnings([]);
    setSuggestions([]);
    setSelected({});
    setStatusStage(null);
    setStatusMessage("");
    setResumeMetaJson("");

    if (!file) {
      setResumeFilename(null);
      return;
    }
    setResumeFilename(file.name);

    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isDocx =
      lower.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!isPdf && !isDocx) {
      setExtractError("Unsupported file type. Please upload a .pdf or .docx resume.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setExtractError("File too large. Max size is 5 MB.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsExtracting(true);
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
          setExtractError(message ?? "Resume extraction failed.");
          return;
        }
        consumeExtractPayload(data as ResumeExtractResponse);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalPayload: ResumeExtractResponse | null = null;
      const collectedWarnings: string[] = [];
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
            setStatusStage(event.stage);
            setStatusMessage(event.message);
          } else if (event.type === "warning") {
            collectedWarnings.push(event.message);
          } else if (event.type === "result") {
            finalPayload = event.payload;
          } else if (event.type === "error") {
            streamError = event.message;
          }
        }
      }

      if (requestId !== requestIdRef.current) return;
      if (streamError) {
        setExtractError(streamError);
        return;
      }
      if (!finalPayload) {
        setExtractError("Resume extraction did not return suggestions.");
        return;
      }
      consumeExtractPayload({
        ...finalPayload,
        warnings: [...(finalPayload.warnings ?? []), ...collectedWarnings],
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setExtractError("Resume extraction failed. You can continue filling fields manually.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsExtracting(false);
        setStatusStage(null);
      }
    }
  }

  function consumeExtractPayload(payload: ResumeExtractResponse) {
    const nextSelected: Record<string, boolean> = {};
    for (const suggestion of payload.suggestions) {
      if (suggestion.kind === "scalar") {
        nextSelected[suggestion.field] = suggestion.autoSelect;
        continue;
      }
      for (const item of suggestion.items) {
        nextSelected[itemSelectionKey(suggestion.field, item.value)] = item.autoSelect;
      }
    }
    setWarnings(dedupeWarnings(payload.warnings ?? []));
    setSuggestions(payload.suggestions);
    setSelected(nextSelected);
    setResumeMetaJson(JSON.stringify(payload.extractedTextMeta));
  }

  function applySelectedSuggestions() {
    if (suggestions.length === 0) return;

    setForm((prev) => {
      const next = { ...prev };
      for (const s of suggestions) {
        if (s.kind === "scalar") {
          if (!selected[s.field]) continue;
          if (touched[s.field]) continue;
          switch (s.field) {
            case "name":
            case "headline":
            case "bio":
            case "lookingFor":
            case "location":
            case "linkedinUrl":
            case "xUrl":
              if (typeof s.value === "string") {
                next[s.field] = s.value;
              }
              break;
            case "availability":
              if (typeof s.value === "string") next.availability = s.value as Availability;
              break;
            case "riskTolerance":
              if (typeof s.value === "number") next.riskTolerance = String(s.value);
              break;
          }
          continue;
        }

        if (touched[s.field]) continue;

        switch (s.field) {
          case "skills": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value).trim())
              .filter(Boolean);
            if (values.length > 0) next.skills = values.join(", ");
            break;
          }
          case "categories": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as TalentCategory[];
            if (values.length > 0) next.categories = dedupe(values) as TalentCategory[];
            break;
          }
          case "lookingForNeeds": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as StartupNeed[];
            if (values.length > 0) next.lookingForNeeds = dedupe(values) as StartupNeed[];
            break;
          }
          case "domains": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as Sector[];
            if (values.length > 0) next.domains = dedupe(values) as Sector[];
            break;
          }
          case "networks": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as Network[];
            if (values.length > 0) next.networks = dedupe(values) as Network[];
            break;
          }
          case "compensation": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as Compensation[];
            if (values.length > 0) next.compensation = dedupe(values) as Compensation[];
            break;
          }
          case "stagePrefs": {
            const values = s.items
              .filter((item) => selected[itemSelectionKey(s.field, item.value)])
              .map((item) => String(item.value)) as Stage[];
            if (values.length > 0) next.stagePrefs = dedupe(values) as Stage[];
            break;
          }
        }
      }
      return next;
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-10">
      <Link href="/onboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
        ← Back
      </Link>

      <span className="eyebrow mt-6 block text-orange-500">Talent profile</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
        Tell us about yourself.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Free-text where it matters; quick chips for the rest.
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

      <form
        action={createTalentAction}
        className="mt-8 space-y-6 rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm"
      >
        <Field
          id="resume"
          name="resume"
          label="Resume upload (PDF/DOCX)"
          hint="Upload once and we'll auto-extract high-confidence profile suggestions."
        >
          <input
            id="resume"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="block w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
            onChange={(e) => onResumeChange(e.currentTarget.files?.[0] ?? null)}
          />
          {resumeFilename && (
            <p className="mt-2 text-xs text-warmgray-600">
              File: <span className="font-medium text-ink">{resumeFilename}</span>
            </p>
          )}
          {isExtracting && (
            <p className="mt-2 text-xs font-medium text-orange-700">
              {statusMessage || "Analyzing resume…"}
            </p>
          )}
          {extractError && (
            <p className="mt-2 text-xs text-red-700">{extractError}</p>
          )}
          {warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-warmgray-600">
              {warnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          )}
          <input type="hidden" name="resumeExtractMeta" value={resumeMetaJson} />
        </Field>

        {suggestions.length > 0 && (
          <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-orange-600">AI suggestions</p>
                <p className="mt-1 text-xs text-warmgray-600">
                  Toggle fields, then apply selected values into the form.
                </p>
              </div>
              <button
                type="button"
                onClick={applySelectedSuggestions}
                className="inline-flex h-8 items-center justify-center rounded-full bg-orange-500 px-4 text-xs font-semibold text-white transition hover:bg-orange-600"
              >
                Apply selected
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {suggestions.map((s) => (
                <li key={s.field} className="rounded-lg border border-orange-100 bg-white px-3 py-2">
                  {s.kind === "scalar" ? (
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[s.field])}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [s.field]: e.currentTarget.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-warmgray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-ink">{FIELD_LABELS[s.field]}</span>
                          <span className="text-xs font-medium text-warmgray-500">
                            {Math.round(s.confidence * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 break-words text-xs text-warmgray-700">
                          {String(s.value)}
                        </p>
                        {s.reason && <p className="mt-1 text-[11px] text-warmgray-500">{s.reason}</p>}
                        {renderEvidence(s.evidence, s.source)}
                      </div>
                    </label>
                  ) : (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{FIELD_LABELS[s.field]}</span>
                        <span className="text-xs font-medium text-warmgray-500">
                          {Math.round(s.confidence * 100)}%
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {s.items.map((item) => {
                          const itemKey = itemSelectionKey(s.field, item.value);
                          return (
                            <li key={itemKey}>
                              <label className="flex cursor-pointer items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selected[itemKey])}
                                  onChange={(e) =>
                                    setSelected((prev) => ({
                                      ...prev,
                                      [itemKey]: e.currentTarget.checked,
                                    }))
                                  }
                                  className="mt-0.5 h-4 w-4 rounded border-warmgray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="min-w-0 flex-1 text-xs text-warmgray-700">
                                  {String(item.value)}
                                </span>
                                <span className="text-[11px] text-warmgray-500">
                                  {Math.round(item.confidence * 100)}%
                                </span>
                              </label>
                              {item.reason && (
                                <p className="ml-6 mt-0.5 text-[11px] text-warmgray-500">
                                  {item.reason}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {s.reason && <p className="mt-1 text-[11px] text-warmgray-500">{s.reason}</p>}
                      {renderEvidence(s.evidence, s.source)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Name + email come from auth metadata — pulled by the server action. */}
        <Field id="headline" name="headline" label="Headline" hint="One line — your professional summary.">
          <Input
            id="headline"
            name="headline"
            placeholder="Former GTM lead, two seed-stage exits"
            value={form.headline}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, headline: true }));
              setForm((prev) => ({ ...prev, headline: e.currentTarget.value }));
            }}
          />
        </Field>
        <Field id="bio" name="bio" label="Short bio" required>
          <Textarea
            id="bio"
            name="bio"
            required
            placeholder="What you've worked on, what you're proud of, what kind of company you'd want to join."
            value={form.bio}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, bio: true }));
              setForm((prev) => ({ ...prev, bio: e.currentTarget.value }));
            }}
          />
        </Field>
        <Field id="lookingFor" name="lookingFor" label="What are you looking for?" hint="Be specific. Stage, comp, role.">
          <Textarea
            id="lookingFor"
            name="lookingFor"
            rows={3}
            placeholder="Sales-leader role at a seed-to-Series-A B2B software company, ideally Utah-based."
            value={form.lookingFor}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, lookingFor: true }));
              setForm((prev) => ({ ...prev, lookingFor: e.currentTarget.value }));
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
            value={form.skills}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, skills: true }));
              setForm((prev) => ({ ...prev, skills: e.currentTarget.value }));
            }}
          />
        </Field>

        <Field id="networks" name="networks" label="Which Nucleus networks do you fit?" hint="Pick all that apply — most operators just check Operator.">
          <ChipGroup
            name="networks"
            options={networkOpts}
            selected={form.networks}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, networks: true }));
              setForm((prev) => ({ ...prev, networks: next as Network[] }));
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
              setTouched((prev) => ({ ...prev, availability: true }));
              setForm((prev) => ({ ...prev, availability: e.currentTarget.value as Availability }));
            }}
          >
            {AVAILABILITIES.map((v) => (
              <option key={v} value={v}>
                {AVAILABILITY_LABELS[v]}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="compensation" name="compensation" label="Compensation interest" hint="Pick all that apply.">
          <ChipGroup
            name="compensation"
            options={compOpts}
            selected={form.compensation}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, compensation: true }));
              setForm((prev) => ({ ...prev, compensation: next as Compensation[] }));
            }}
          />
        </Field>

        <Field id="stagePrefs" name="stagePrefs" label="Stage preference" hint="Where you want to plug in.">
          <ChipGroup
            name="stagePrefs"
            options={stageOpts}
            selected={form.stagePrefs}
            onChange={(next) => {
              setTouched((prev) => ({ ...prev, stagePrefs: true }));
              setForm((prev) => ({ ...prev, stagePrefs: next as Stage[] }));
            }}
          />
        </Field>

        <Field id="riskTolerance" name="riskTolerance" label="Risk tolerance" hint="1 = stable bet · 5 = pre-PMF moonshot.">
          <Input
            id="riskTolerance"
            name="riskTolerance"
            type="number"
            min={1}
            max={5}
            value={form.riskTolerance}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, riskTolerance: true }));
              setForm((prev) => ({ ...prev, riskTolerance: e.currentTarget.value }));
            }}
          />
        </Field>

        <Field id="location" name="location" label="Location">
          <Input
            id="location"
            name="location"
            value={form.location}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, location: true }));
              setForm((prev) => ({ ...prev, location: e.currentTarget.value }));
            }}
          />
        </Field>

        <Field id="linkedinUrl" name="linkedinUrl" label="LinkedIn" hint="Optional.">
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/…"
            value={form.linkedinUrl}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, linkedinUrl: true }));
              setForm((prev) => ({ ...prev, linkedinUrl: e.currentTarget.value }));
            }}
          />
        </Field>

        <Field id="xUrl" name="xUrl" label="X URL" hint="Optional.">
          <Input
            id="xUrl"
            name="xUrl"
            type="url"
            placeholder="https://x.com/…"
            value={form.xUrl}
            onChange={(e) => {
              setTouched((prev) => ({ ...prev, xUrl: true }));
              setForm((prev) => ({ ...prev, xUrl: e.currentTarget.value }));
            }}
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

function itemSelectionKey(field: ResumeSuggestionField, value: unknown): string {
  return `${field}::${normalizeSelectionToken(String(value ?? ""))}`;
}

function normalizeSelectionToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function dedupeWarnings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function renderEvidence(evidence: string[], source: ResumeSuggestionSource[]) {
  const notes: string[] = [];
  if (evidence.length > 0) {
    notes.push(`Evidence: ${evidence.join(" · ")}`);
  }
  if (source.length > 0) {
    notes.push(`Source: ${source.join(", ")}`);
  }
  if (notes.length === 0) return null;
  return <p className="mt-1 text-[11px] text-warmgray-500">{notes.join(" | ")}</p>;
}
