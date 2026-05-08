import { NextResponse } from "next/server";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import mammoth from "mammoth";
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

const MODEL = "gpt-5.4-mini";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MODEL_INPUT_CHARS = 50000;
const MAX_STORED_TEXT_CHARS = 50000;
const MAX_PDF_PAGES = 8;
const MAX_DOCX_IMAGES = 12;
const HIGH_CONFIDENCE = 0.8;
const MEDIUM_CONFIDENCE = 0.6;

type ParserKind = "pdf" | "docx";
type PassKind = "text" | "image";
type TruncatedFlag = "model_input" | "stored_text" | "pdf_pages" | "docx_images";

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
  "skills",
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
  "You extract profile suggestions from resume content for a talent onboarding form.",
  "Return only fields with meaningful evidence from the resume content.",
  "Never return email.",
  "No guessing: omit fields without enough evidence.",
  "Use confidence in 0..1 with conservative scoring.",
  "For headline, bio, and lookingFor, keep wording faithful with only minimal rewrite.",
  "For multi-select fields (skills, categories, lookingForNeeds, domains, networks, compensation, stagePrefs), include all plausible values in listValue.",
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

  const parser = detectParser(fileValue);
  if (!parser) {
    throw new HttpError(400, "Unsupported file type. Upload a .pdf or .docx resume.");
  }
  if (fileValue.size <= 0) {
    throw new HttpError(400, "Uploaded file is empty.");
  }
  if (fileValue.size > MAX_FILE_BYTES) {
    throw new HttpError(400, "File too large. Max size is 5 MB.");
  }

  const warnings: string[] = [];
  const truncatedFlags: TruncatedFlag[] = [];
  const passesUsed = new Set<PassKind>();

  let textPass = "";
  let imagePass = "";

  emitStatus(emit, "extracting_text", "Extracting embedded text.");
  try {
    textPass = parser === "pdf" ? await extractPdfText(fileValue) : await extractDocxText(fileValue);
    textPass = normalizeText(textPass);
    if (textPass) passesUsed.add("text");
  } catch (err) {
    const detail = messageFromError(err, "unknown parser error");
    const message = `Text extraction failed (${detail.slice(0, 120)}); continuing with image-based extraction.`;
    warnings.push(message);
    emitWarning(emit, message);
  }

  emitStatus(emit, "extracting_images", "Preparing images for OCR.");
  let imageInputs: string[] = [];
  try {
    imageInputs =
      parser === "pdf"
        ? await extractPdfImageDataUrls(fileValue, warnings, truncatedFlags)
        : await extractDocxImageDataUrls(fileValue, warnings, truncatedFlags);
  } catch {
    warnings.push("Image extraction failed; continuing with text-only extraction.");
    emitWarning(emit, "Image extraction failed; continuing with text-only extraction.");
  }

  if (imageInputs.length > 0) {
    emitStatus(emit, "ocr", "Running OCR over extracted images.");
    try {
      imagePass = await ocrImages(apiKey, imageInputs);
      imagePass = normalizeText(imagePass);
      if (imagePass) passesUsed.add("image");
    } catch {
      warnings.push("OCR pass failed; using text pass only.");
      emitWarning(emit, "OCR pass failed; using text pass only.");
    }
  }

  emitStatus(emit, "merging", "Merging extracted text.");
  const mergedText = mergeExtractedText(textPass, imagePass);
  if (!mergedText) {
    throw new HttpError(400, "No readable resume text found in this file.");
  }

  let modelInput = mergedText;
  if (modelInput.length > MAX_MODEL_INPUT_CHARS) {
    modelInput = modelInput.slice(0, MAX_MODEL_INPUT_CHARS);
    warnings.push("Resume text was truncated before suggestion extraction.");
    truncatedFlags.push("model_input");
    emitWarning(emit, "Resume text was truncated before suggestion extraction.");
  }

  emitStatus(emit, "building_suggestions", "Building profile suggestions.");
  let raw: RawExtraction;
  try {
    await pingModel(apiKey, MODEL);
    raw = await extractSuggestions(apiKey, modelInput);
  } catch (err) {
    throw new HttpError(
      502,
      messageFromError(err, "OpenAI extraction failed. Please fill fields manually."),
    );
  }

  const suggestions = normalizeSuggestions(raw.suggestions ?? []);
  const storedText =
    mergedText.length > MAX_STORED_TEXT_CHARS
      ? mergedText.slice(0, MAX_STORED_TEXT_CHARS)
      : mergedText;
  if (storedText.length !== mergedText.length) {
    warnings.push("Stored resume text was truncated to 50,000 characters.");
    truncatedFlags.push("stored_text");
    emitWarning(emit, "Stored resume text was truncated to 50,000 characters.");
  }

  const extractedTextMeta: ResumeExtractMeta = {
    sourceFilename: fileValue.name,
    extractedAt: new Date().toISOString(),
    parser,
    charCount: storedText.length,
    model: MODEL,
    extractedText: storedText,
    passesUsed: passesUsed.size > 0 ? Array.from(passesUsed) : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    truncatedFlags: truncatedFlags.length > 0 ? dedupe(truncatedFlags) : undefined,
  };

  return {
    suggestions,
    extractedTextMeta,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function emitStatus(emit: EmitFn, stage: ResumeExtractStage, message: string): void {
  emit({ type: "status", stage, message });
}

function emitWarning(emit: EmitFn, message: string): void {
  emit({ type: "warning", message });
}

async function parseFormData(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new HttpError(400, "Expected multipart form-data with a resume file.");
  }
}

function detectParser(file: File): ParserKind | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return null;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).href;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  });

  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];
  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = (textContent.items as Array<{ str?: string }>)
        .map((item) => (typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .trim();
      if (text) pageTexts.push(text);
    }
  } finally {
    await loadingTask.destroy();
  }

  return pageTexts.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  const docx = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) });
  return docx.value ?? "";
}

async function extractPdfImageDataUrls(
  file: File,
  warnings: string[],
  truncatedFlags: TruncatedFlag[],
): Promise<string[]> {
  const pdfToPng = await loadPdfConverter();
  const pages = await pdfToPng(Buffer.from(await file.arrayBuffer()), {
    viewportScale: 2,
    disableFontFace: false,
    useSystemFonts: true,
    returnPageContent: true,
    outputFolder: undefined,
  });

  if (!Array.isArray(pages) || pages.length === 0) return [];
  let selectedPages = pages.filter((p) => p.kind === "content" && p.content);
  if (selectedPages.length === 0) return [];

  if (selectedPages.length > MAX_PDF_PAGES) {
    selectedPages = selectedPages.slice(0, MAX_PDF_PAGES);
    warnings.push(`Only the first ${MAX_PDF_PAGES} PDF pages were analyzed for OCR.`);
    truncatedFlags.push("pdf_pages");
  }

  return selectedPages.map((page) => `data:image/png;base64,${page.content!.toString("base64")}`);
}

async function extractDocxImageDataUrls(
  file: File,
  warnings: string[],
  truncatedFlags: TruncatedFlag[],
): Promise<string[]> {
  const mammothAny = mammoth as unknown as {
    images?: {
      inline: (
        handler: (image: { contentType: string; read: (encoding: string) => Promise<string> }) => Promise<{ src: string }>,
      ) => unknown;
    };
  };
  if (!mammothAny.images?.inline) return [];

  const convertImage = mammothAny.images.inline(async (image) => ({
    src: `data:${image.contentType};base64,${(await image.read("base64")) as string}`,
  }));
  const conversion = await mammoth.convertToHtml(
    { buffer: Buffer.from(await file.arrayBuffer()) },
    { convertImage } as never,
  );
  const html = conversion.value ?? "";
  if (!html) return [];

  const urls = extractDataUriImages(html);
  if (urls.length <= MAX_DOCX_IMAGES) return urls;

  warnings.push(`Only the first ${MAX_DOCX_IMAGES} embedded DOCX images were analyzed for OCR.`);
  truncatedFlags.push("docx_images");
  return urls.slice(0, MAX_DOCX_IMAGES);
}

function extractDataUriImages(html: string): string[] {
  const out: string[] = [];
  const pattern = /<img[^>]+src=(["'])(data:image\/[^"']+)\1/gi;
  let match: RegExpExecArray | null = pattern.exec(html);
  while (match) {
    out.push(match[2]);
    match = pattern.exec(html);
  }
  return dedupe(out);
}

async function ocrImages(apiKey: string, imageDataUrls: string[]): Promise<string> {
  if (imageDataUrls.length === 0) return "";

  const content = [
    {
      type: "input_text" as const,
      text: [
        "Extract plain text from these resume images.",
        "Return only extracted text in reading order.",
        "Do not summarize and do not add commentary.",
        "If text is unreadable, omit it instead of guessing.",
      ].join(" "),
    },
    ...imageDataUrls.map((image_url) => ({
      type: "input_image" as const,
      image_url,
      detail: "high" as const,
    })),
  ];

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "user", content }],
      max_output_tokens: 6000,
    }),
  });
  const rawBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Vision OCR failed (${res.status}): ${JSON.stringify(rawBody).slice(0, 300)}`);
  }

  return extractOutputText(rawBody);
}

async function pingModel(apiKey: string, model: string): Promise<void> {
  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: "Reply with the single word pong.",
      max_output_tokens: 16,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Ping failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

async function extractSuggestions(apiKey: string, resumeText: string): Promise<RawExtraction> {
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
              type: "input_text",
              text: [
                "Extract onboarding suggestions from this resume content.",
                "Only include fields with enough evidence.",
                "Resume content:",
                resumeText,
              ].join("\n\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "resume_onboarding_extract_v2",
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

  if (field === "skills" && out.length === 0) {
    const fallback = splitCsv(input.textValue);
    for (const skill of fallback) {
      const confidence = clamp01(input.confidence ?? 0);
      const band = confidenceBand(confidence);
      if (!band) continue;
      out.push({
        value: skill,
        confidence,
        band,
        autoSelect: band === "high",
        evidence: normalizeEvidence(input.evidence),
        source: normalizeSources(input.source),
        reason: clean(input.reason),
      });
    }
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

  if (field === "skills") return raw;
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

function normalizeText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mergeExtractedText(textPass: string, imagePass: string): string {
  const chunks: string[] = [];
  if (textPass) chunks.push(textPass);
  if (imagePass) chunks.push(imagePass);
  if (chunks.length === 0) return "";

  const merged = chunks
    .join("\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const seenCompact = new Set<string>();
  const deduped: string[] = [];
  for (const line of merged) {
    const key = normalizeToken(line);
    const compact = key.replace(/\s+/g, "");
    const isCompactDup = compact.length >= 8 && seenCompact.has(compact);
    if (!key || seen.has(key) || isCompactDup) continue;
    seen.add(key);
    if (compact.length >= 8) seenCompact.add(compact);
    deduped.push(line);
  }
  return deduped.join("\n");
}

async function loadPdfConverter(): Promise<
  (
    input: Buffer,
    options: Record<string, unknown>,
  ) => Promise<Array<{ kind?: string; content?: Buffer }>>
> {
  try {
    const mod = await import("pdf-to-png-converter");
    return mod.pdfToPng as (
      input: Buffer,
      options: Record<string, unknown>,
    ) => Promise<Array<{ kind?: string; content?: Buffer }>>;
  } catch (err) {
    throw new Error(
      messageFromError(
        err,
        "PDF image conversion dependencies are unavailable. Run npm install and restart the server.",
      ),
    );
  }
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
