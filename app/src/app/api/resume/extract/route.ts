import { NextResponse } from "next/server";
import {
  AVAILABILITIES,
  COMPENSATIONS,
  NETWORKS,
  ROLE_NEEDS,
  SECTORS,
  STAGES,
  TALENT_CATEGORIES,
} from "@/lib/data/enum-labels";
import type { ResumeExtractMeta } from "@/lib/data/types";
import type {
  ResumeExtractResponse,
  ResumeExtractStage,
  ResumeExtractStreamEvent,
  ResumeMultiSuggestion,
  ResumeMultiSuggestionField,
  ResumeScalarSuggestion,
  ResumeScalarSuggestionField,
  ResumeSuggestion,
  ResumeSuggestionBand,
  ResumeSuggestionField,
  ResumeSuggestionSource,
  ResumeSuggestedItem,
} from "@/lib/resume/types";

export const runtime = "nodejs";

// Vision-capable model with native PDF input support. See:
// https://developers.openai.com/api/docs/guides/file-inputs
const MODEL = "gpt-5.4-mini";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const HIGH_CONFIDENCE = 0.8;
const MEDIUM_CONFIDENCE = 0.6;

type EmitFn = (event: ResumeExtractStreamEvent) => void;

type RawListValue =
  | string
  | {
      value?: string;
      confidence?: number;
      evidence?: string[];
      source?: string[];
      reason?: string;
    };

type RawSuggestion = {
  field?: string;
  confidence?: number;
  reason?: string;
  evidence?: string[];
  source?: string[];
  textValue?: string;
  numberValue?: number;
  listValue?: RawListValue[];
};

type RawExtraction = {
  suggestions?: RawSuggestion[];
};

const SCALAR_FIELDS: ResumeScalarSuggestionField[] = [
  "name",
  "headline",
  "bio",
  "lookingFor",
  "location",
  "linkedinUrl",
  "xUrl",
  "availability",
  "riskTolerance",
];

const MULTI_FIELDS: ResumeMultiSuggestionField[] = [
  "categories",
  "lookingForNeeds",
  "domains",
  "networks",
  "compensation",
  "stagePrefs",
];

const FIELD_ENUM: ResumeSuggestionField[] = [...SCALAR_FIELDS, ...MULTI_FIELDS];

const SUGGESTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string", enum: FIELD_ENUM },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string" },
          evidence: {
            type: "array",
            items: { type: "string" },
          },
          source: {
            type: "array",
            items: {
              type: "string",
              enum: ["text", "image", "both", "inferred"],
            },
          },
          textValue: { type: "string" },
          numberValue: { type: "number" },
          listValue: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                value: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reason: { type: "string" },
                evidence: {
                  type: "array",
                  items: { type: "string" },
                },
                source: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["text", "image", "both", "inferred"],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

const EXTRACTION_PROMPT = [
  "You read a resume PDF directly (text + page images via the model's vision) and extract profile suggestions for a talent onboarding form.",
  "Return only fields with meaningful evidence visible in the resume.",
  "Never return email.",
  "No guessing: omit fields without enough evidence.",
  "Use confidence in 0..1 with conservative scoring.",
  "For headline, bio, and lookingFor, keep wording faithful with only minimal rewrite.",
  "For multi-select fields (categories, lookingForNeeds, domains, networks, compensation, stagePrefs), include all plausible values in listValue.",
  "For listValue items, include value and confidence; optionally include evidence/reason/source.",
  "For riskTolerance, only set numberValue (1..5) when clearly inferable.",
  "Use canonical labels where possible:",
  "categories: executive, cofounder, coo, fractional, operator, engineer, sales, marketing, student, intern, board-member, advisor-paid, mentor-free.",
  "lookingForNeeds: executive, cofounder, coo, fractional, operator, engineer, sales, marketing, student, intern, board-member, advisor-paid, mentor-free.",
  "domains: life-sciences, ai, defense-aerospace, cyber, energy, advanced-manufacturing, fintech, software.",
  "networks: operator, mentor, sme-advisory, venture, service-provider.",
  "compensation: cash, equity, mentor.",
  "stagePrefs: pre-seed, seed, series-a, series-b, growth.",
  "availability: full-time, fractional, advisory, internship.",
].join(" ");

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Resume extraction is unavailable: OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const stream = url.searchParams.get("stream") === "1";
  if (stream) {
    return streamExtraction(req, apiKey);
  }

  try {
    const payload = await runExtraction(req, apiKey);
    return NextResponse.json(payload);
  } catch (err) {
    const { message, status } = errorToHttp(err);
    return NextResponse.json({ error: message }, { status });
  }
}

async function streamExtraction(req: Request, apiKey: string): Promise<Response> {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit: EmitFn = (event) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const payload = await runExtraction(req, apiKey, emit);
        emit({
          type: "status",
          stage: "done",
          message: "Resume extraction completed.",
        });
        emit({ type: "result", payload });
      } catch (err) {
        const { message } = errorToHttp(err);
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function runExtraction(
  req: Request,
  apiKey: string,
  emit: EmitFn = () => {},
): Promise<ResumeExtractResponse> {
  emitStatus(emit, "validating", "Validating upload.");
  const formData = await parseFormData(req);
  const fileValue = formData.get("resume");
  if (!(fileValue instanceof File)) {
    throw new HttpError(400, "Missing resume file.");
  }

  const isPdf =
    fileValue.name.toLowerCase().endsWith(".pdf") ||
    fileValue.type.toLowerCase() === "application/pdf";
  if (!isPdf) {
    throw new HttpError(400, "Unsupported file type. Upload a .pdf resume.");
  }
  if (fileValue.size <= 0) {
    throw new HttpError(400, "Uploaded file is empty.");
  }
  if (fileValue.size > MAX_FILE_BYTES) {
    throw new HttpError(400, "File too large. Max size is 5 MB.");
  }

  emitStatus(emit, "building_suggestions", "Reading your resume with AI.");
  const buffer = Buffer.from(await fileValue.arrayBuffer());
  const dataUri = `data:application/pdf;base64,${buffer.toString("base64")}`;

  let raw: RawExtraction;
  try {
    raw = await extractFromPdf(apiKey, fileValue.name, dataUri);
  } catch (err) {
    throw new HttpError(
      502,
      messageFromError(err, "OpenAI extraction failed. Please fill fields manually."),
    );
  }

  const suggestions = normalizeSuggestions(raw.suggestions ?? []);

  const extractedTextMeta: ResumeExtractMeta = {
    sourceFilename: fileValue.name,
    extractedAt: new Date().toISOString(),
    parser: "pdf",
    charCount: 0,
    model: MODEL,
    extractedText: "",
    passesUsed: ["image"],
  };

  return {
    suggestions,
    extractedTextMeta,
  };
}

function emitStatus(emit: EmitFn, stage: ResumeExtractStage, message: string): void {
  emit({ type: "status", stage, message });
}

async function parseFormData(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new HttpError(400, "Expected multipart form-data with a resume file.");
  }
}

async function extractFromPdf(
  apiKey: string,
  filename: string,
  dataUri: string,
): Promise<RawExtraction> {
  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: EXTRACTION_PROMPT }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename,
              file_data: dataUri,
            },
            {
              type: "input_text",
              text: "Extract onboarding suggestions from this resume. Only include fields with enough evidence.",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_onboarding_extract_v3",
          strict: false,
          schema: SUGGESTION_SCHEMA,
        },
      },
      max_output_tokens: 3000,
    }),
  });

  const rawBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Extraction failed (${res.status}): ${JSON.stringify(rawBody).slice(0, 300)}`);
  }

  const outputText = extractOutputText(rawBody);
  if (!outputText) {
    throw new Error("Model returned no output_text.");
  }
  return JSON.parse(outputText) as RawExtraction;
}

function extractOutputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const candidate = body as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) {
    return candidate.output_text;
  }
  if (!Array.isArray(candidate.output)) return "";

  const chunks: string[] = [];
  for (const part of candidate.output) {
    for (const c of part?.content ?? []) {
      if (c?.type === "output_text" && typeof c.text === "string") {
        chunks.push(c.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function normalizeSuggestions(raw: RawSuggestion[]): ResumeSuggestion[] {
  const byField = new Map<ResumeSuggestionField, ResumeSuggestion>();
  for (const suggestion of raw) {
    const normalized = normalizeSuggestion(suggestion);
    if (!normalized) continue;

    const prev = byField.get(normalized.field);
    if (!prev) {
      byField.set(normalized.field, normalized);
      continue;
    }
    if (normalized.confidence > prev.confidence) {
      byField.set(normalized.field, normalized);
    }
  }

  return FIELD_ENUM
    .map((field) => byField.get(field))
    .filter((item): item is ResumeSuggestion => Boolean(item));
}

function normalizeSuggestion(input: RawSuggestion): ResumeSuggestion | null {
  const field = String(input.field ?? "") as ResumeSuggestionField;
  if (!FIELD_ENUM.includes(field)) return null;
  if (field === "riskTolerance") {
    return normalizeRiskTolerance(input, field);
  }
  if (SCALAR_FIELDS.includes(field as ResumeScalarSuggestionField)) {
    return normalizeScalar(input, field as ResumeScalarSuggestionField);
  }
  return normalizeMulti(input, field as ResumeMultiSuggestionField);
}

function normalizeScalar(
  input: RawSuggestion,
  field: ResumeScalarSuggestionField,
): ResumeScalarSuggestion | null {
  const confidence = clamp01(input.confidence ?? 0);
  const band = confidenceBand(confidence);
  if (!band) return null;

  let value: string | number;
  if (field === "riskTolerance") {
    return normalizeRiskTolerance(input, field);
  } else if (field === "availability") {
    const mapped = mapAvailability(input.textValue ?? "");
    if (!mapped) return null;
    value = mapped;
  } else {
    value = String(input.textValue ?? "").trim();
    if (!value) return null;
  }

  return {
    kind: "scalar",
    field,
    value,
    confidence,
    band,
    autoSelect: band === "high",
    evidence: normalizeEvidence(input.evidence),
    source: normalizeSources(input.source),
    reason: clean(input.reason),
  };
}

function normalizeRiskTolerance(
  input: RawSuggestion,
  field: "riskTolerance",
): ResumeScalarSuggestion | null {
  const confidence = clamp01(input.confidence ?? 0);
  const band = confidenceBand(confidence);
  if (!band) return null;

  const value = Math.round(Number(input.numberValue));
  if (!Number.isFinite(value) || value < 1 || value > 5) return null;

  return {
    kind: "scalar",
    field,
    value,
    confidence,
    band,
    autoSelect: band === "high",
    evidence: normalizeEvidence(input.evidence),
    source: normalizeSources(input.source),
    reason: clean(input.reason),
  };
}

function normalizeMulti(
  input: RawSuggestion,
  field: ResumeMultiSuggestionField,
): ResumeMultiSuggestion | null {
  const normalizedItems = normalizeMultiItems(input, field);
  if (normalizedItems.length === 0) return null;

  const confidence = Math.max(...normalizedItems.map((item) => item.confidence));
  const band = confidenceBand(confidence);
  if (!band) return null;

  return {
    kind: "multi",
    field,
    items: normalizedItems,
    confidence,
    band,
    autoSelect: normalizedItems.some((item) => item.autoSelect),
    evidence: normalizeEvidence(input.evidence),
    source: normalizeSources(input.source),
    reason: clean(input.reason),
  };
}

function normalizeMultiItems(
  input: RawSuggestion,
  field: ResumeMultiSuggestionField,
): ResumeSuggestedItem[] {
  const rawItems = Array.isArray(input.listValue) ? input.listValue : [];
  const out: ResumeSuggestedItem[] = [];

  for (const raw of rawItems) {
    const parsed = normalizeRawItem(raw);
    if (!parsed) continue;
    const confidence = clamp01(parsed.confidence ?? input.confidence ?? 0);
    const band = confidenceBand(confidence);
    if (!band) continue;

    const canonical = canonicalizeMultiValue(field, parsed.value);
    if (!canonical) continue;

    out.push({
      value: canonical,
      confidence,
      band,
      autoSelect: band === "high",
      evidence: normalizeEvidence(parsed.evidence),
      source: normalizeSources(parsed.source),
      reason: clean(parsed.reason),
    });
  }

  return dedupeByValue(out);
}

function normalizeRawItem(raw: RawListValue): {
  value: string;
  confidence?: number;
  evidence?: string[];
  source?: string[];
  reason?: string;
} | null {
  if (typeof raw === "string") {
    const value = raw.trim();
    return value ? { value } : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const value = String(raw.value ?? "").trim();
  if (!value) return null;
  return {
    value,
    confidence: typeof raw.confidence === "number" ? raw.confidence : undefined,
    evidence: Array.isArray(raw.evidence) ? raw.evidence : undefined,
    source: Array.isArray(raw.source) ? raw.source : undefined,
    reason: typeof raw.reason === "string" ? raw.reason : undefined,
  };
}

function canonicalizeMultiValue(
  field: ResumeMultiSuggestionField,
  value: string,
): ResumeSuggestedItem["value"] | null {
  const raw = value.trim();
  if (!raw) return null;
  const key = normalizeToken(raw);

  if (field === "categories") return mapEnumWithAliases(key, TALENT_CATEGORIES, TALENT_CATEGORY_ALIASES);
  if (field === "lookingForNeeds") return mapEnumWithAliases(key, ROLE_NEEDS, ROLE_NEED_ALIASES);
  if (field === "domains") return mapEnumWithAliases(key, SECTORS, DOMAIN_ALIASES);
  if (field === "networks") return mapEnumWithAliases(key, NETWORKS, NETWORK_ALIASES);
  if (field === "compensation") return mapEnumWithAliases(key, COMPENSATIONS, COMPENSATION_ALIASES);
  if (field === "stagePrefs") return mapEnumWithAliases(key, STAGES, STAGE_ALIASES);
  return null;
}

function mapAvailability(value: string): (typeof AVAILABILITIES)[number] | null {
  const mapped = mapEnumWithAliases(
    normalizeToken(value),
    AVAILABILITIES,
    AVAILABILITY_ALIASES,
  );
  return mapped ?? null;
}

function mapEnumWithAliases<T extends string>(
  key: string,
  allowed: readonly T[],
  aliases: Record<string, T>,
): T | null {
  if (!key) return null;
  if ((allowed as readonly string[]).includes(key)) return key as T;
  return aliases[key] ?? null;
}

function normalizeEvidence(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeSources(value: unknown): ResumeSuggestionSource[] {
  if (!Array.isArray(value)) return ["inferred"];
  const valid: ResumeSuggestionSource[] = [];
  for (const source of value) {
    if (source === "text" || source === "image" || source === "both" || source === "inferred") {
      valid.push(source);
    }
  }
  return valid.length > 0 ? dedupe(valid) : ["inferred"];
}

function confidenceBand(confidence: number): ResumeSuggestionBand | null {
  if (confidence >= HIGH_CONFIDENCE) return "high";
  if (confidence >= MEDIUM_CONFIDENCE) return "medium";
  return null;
}

function splitCsv(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function clean(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function dedupeByValue(items: ResumeSuggestedItem[]): ResumeSuggestedItem[] {
  const map = new Map<string, ResumeSuggestedItem>();
  for (const item of items) {
    const key = normalizeToken(String(item.value));
    const prev = map.get(key);
    if (!prev || item.confidence > prev.confidence) {
      map.set(key, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence);
}

function dedupe<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function messageFromError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

function errorToHttp(err: unknown): { status: number; message: string } {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }
  return {
    status: 500,
    message: messageFromError(err, "Resume extraction failed. Please fill fields manually."),
  };
}

const TALENT_CATEGORY_ALIASES: Record<string, (typeof TALENT_CATEGORIES)[number]> = {
  executives: "executive",
  executive: "executive",
  "co founder": "cofounder",
  cofounder: "cofounder",
  founder: "cofounder",
  coo: "coo",
  "chief operating officer": "coo",
  fractional: "fractional",
  operator: "operator",
  operations: "operator",
  engineer: "engineer",
  engineering: "engineer",
  sales: "sales",
  marketing: "marketing",
  student: "student",
  students: "student",
  intern: "intern",
  interns: "intern",
  board: "board-member",
  "board member": "board-member",
  advisor: "advisor-paid",
  advisors: "advisor-paid",
  mentor: "mentor-free",
  mentors: "mentor-free",
};

const ROLE_NEED_ALIASES: Record<string, (typeof ROLE_NEEDS)[number]> = {
  ...TALENT_CATEGORY_ALIASES,
  advisory: "advisor-paid",
};

const DOMAIN_ALIASES: Record<string, (typeof SECTORS)[number]> = {
  "life science": "life-sciences",
  "life sciences": "life-sciences",
  biotech: "life-sciences",
  ai: "ai",
  "artificial intelligence": "ai",
  defense: "defense-aerospace",
  aerospace: "defense-aerospace",
  "defense aerospace": "defense-aerospace",
  cyber: "cyber",
  cybersecurity: "cyber",
  energy: "energy",
  manufacturing: "advanced-manufacturing",
  "advanced manufacturing": "advanced-manufacturing",
  fintech: "fintech",
  finance: "fintech",
  software: "software",
  saas: "software",
};

const NETWORK_ALIASES: Record<string, (typeof NETWORKS)[number]> = {
  operator: "operator",
  operators: "operator",
  mentor: "mentor",
  mentors: "mentor",
  advisor: "sme-advisory",
  advisory: "sme-advisory",
  sme: "sme-advisory",
  venture: "venture",
  investor: "venture",
  investors: "venture",
  "service provider": "service-provider",
  agency: "service-provider",
  legal: "service-provider",
};

const COMPENSATION_ALIASES: Record<string, (typeof COMPENSATIONS)[number]> = {
  cash: "cash",
  salary: "cash",
  paid: "cash",
  equity: "equity",
  options: "equity",
  mentor: "mentor",
  volunteer: "mentor",
  unpaid: "mentor",
};

const STAGE_ALIASES: Record<string, (typeof STAGES)[number]> = {
  "pre seed": "pre-seed",
  preseed: "pre-seed",
  seed: "seed",
  "series a": "series-a",
  "series b": "series-b",
  growth: "growth",
};

const AVAILABILITY_ALIASES: Record<string, (typeof AVAILABILITIES)[number]> = {
  "full time": "full-time",
  fulltime: "full-time",
  "full time role": "full-time",
  fractional: "fractional",
  "part time": "fractional",
  advisory: "advisory",
  advisor: "advisory",
  internship: "internship",
  intern: "internship",
};
