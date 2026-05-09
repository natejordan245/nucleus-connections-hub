import { NextResponse } from "next/server";

/**
 * AI extraction for Mentor / Business onboarding intake. Accepts a free-text
 * paste (advisor bio, company description, fund thesis) and returns
 * suggestions to pre-fill the structured form fields below the textarea.
 *
 * For Candidate, we use the heavier `/api/resume/extract` route (PDF/DOCX +
 * vision OCR). This route is text-only and keeps a simpler shape.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MODEL = "gpt-5.4-mini";
const MAX_INPUT_CHARS = 50_000;

type Kind = "mentor" | "business";

export type ProfileExtractSuggestion = {
  field: string;
  /** Scalar fields use a string value; multi-select fields use an array. */
  value: string | string[];
  confidence: number;
};

export type ProfileExtractResponse = {
  suggestions: ProfileExtractSuggestion[];
  warnings?: string[];
};

const MENTOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: {
            type: "string",
            enum: [
              "headline",
              "bio",
              "areasAdvised",
              "hoursPerMonth",
              "boardSeatOpen",
              "compPreference",
              "sectorsOfInterest",
              "location",
              "linkedinUrl",
            ],
          },
          stringValue: { type: "string" },
          arrayValue: { type: "array", items: { type: "string" } },
          numberValue: { type: "number" },
          boolValue: { type: "boolean" },
          confidence: { type: "number" },
        },
        required: ["field", "confidence"],
      },
    },
  },
  required: ["suggestions"],
};

const BUSINESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: {
            type: "string",
            enum: [
              "name",
              "oneLiner",
              "description",
              "sector",
              "origin",
              "fundingStage",
              "fundingStatus",
              "needs",
              "location",
              "websiteUrl",
              "linkedinUrl",
            ],
          },
          stringValue: { type: "string" },
          arrayValue: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
        },
        required: ["field", "confidence"],
      },
    },
  },
  required: ["suggestions"],
};

const MENTOR_PROMPT = [
  "You extract structured profile fields for a Utah mentor / advisor onboarding form.",
  "Read the supplied bio text. Return field-level suggestions with confidence in [0,1].",
  "",
  "Field semantics:",
  "- headline (string): one-line title.",
  "- bio (string): the candidate's prose bio, lightly cleaned.",
  "- areasAdvised (array of strings): sectors they advise on. Use ONLY: 'life-sciences', 'ai', 'defense-aerospace', 'cyber', 'energy', 'advanced-manufacturing', 'fintech', 'software'.",
  "- hoursPerMonth (number): integer 0–40, advisory hours per month.",
  "- boardSeatOpen (bool): true if open to a board seat.",
  "- compPreference (array of strings): from 'cash', 'equity', 'mentor'.",
  "- sectorsOfInterest (array of strings): sectors they're personally interested in (same enum as areasAdvised).",
  "- location (string): city, state.",
  "- linkedinUrl (string).",
  "",
  "Rules:",
  "- Only include fields you can credibly infer from the text. Skip everything else.",
  "- For each suggestion put the value in the matching slot:",
  "    string -> stringValue, array -> arrayValue, number -> numberValue, bool -> boolValue.",
  "- Confidence ≥ 0.6 only. Drop low-confidence guesses entirely.",
].join("\n");

const BUSINESS_PROMPT = [
  "You extract structured profile fields for a Utah business / startup onboarding form.",
  "Read the supplied company description. Return field-level suggestions with confidence in [0,1].",
  "",
  "Field semantics:",
  "- name (string): the company name.",
  "- oneLiner (string): ≤12 words pitch.",
  "- description (string): a cleaned-up paragraph description.",
  "- sector (string): ONE of 'life-sciences', 'ai', 'defense-aerospace', 'cyber', 'energy', 'advanced-manufacturing', 'fintech', 'software'.",
  "- origin (string): ONE of 'u-of-u-spinout', 'byu-spinout', 'usu-spinout', 'bootstrapped', 'vc-backed'.",
  "- fundingStage (string): ONE of 'pre-seed', 'seed', 'series-a', 'series-b', 'growth'.",
  "- fundingStatus (string): ONE of 'grant', 'pre-revenue', 'revenue'.",
  "- needs (array of strings): roles they need, from 'executive','cofounder','coo','fractional','operator','engineer','sales','marketing','student','intern','board-member','advisor-paid','mentor-free'.",
  "- location (string): city, state.",
  "- websiteUrl (string).",
  "- linkedinUrl (string).",
  "",
  "Rules:",
  "- Only include fields you can credibly infer. Skip everything else.",
  "- For each suggestion: string -> stringValue, array -> arrayValue.",
  "- Confidence ≥ 0.6 only.",
].join("\n");

export async function POST(req: Request) {
  let body: { kind?: string; text?: string };
  try {
    body = (await req.json()) as { kind?: string; text?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind === "mentor" ? "mentor" : body.kind === "business" ? "business" : null;
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!kind) {
    return NextResponse.json({ error: "kind must be 'mentor' or 'business'" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing — extraction unavailable in this environment." },
      { status: 503 },
    );
  }

  const truncated = text.slice(0, MAX_INPUT_CHARS);
  const warnings: string[] = [];
  if (text.length > MAX_INPUT_CHARS) {
    warnings.push(`Input was truncated at ${MAX_INPUT_CHARS} characters.`);
  }

  try {
    const raw = await callOpenAI(apiKey, kind, truncated);
    const suggestions = normalizeSuggestions(kind, raw);
    return NextResponse.json({ suggestions, warnings } satisfies ProfileExtractResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `extraction_failed: ${message}` }, { status: 500 });
  }
}

async function callOpenAI(apiKey: string, kind: Kind, text: string): Promise<unknown> {
  const schema = kind === "mentor" ? MENTOR_SCHEMA : BUSINESS_SCHEMA;
  const prompt = kind === "mentor" ? MENTOR_PROMPT : BUSINESS_PROMPT;

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: prompt }] },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: ["Extract onboarding suggestions from this content:", "", text].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: `profile_extract_${kind}_v1`,
          strict: false,
          schema,
        },
      },
      max_output_tokens: 1500,
    }),
  });

  const rawBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${JSON.stringify(rawBody).slice(0, 300)}`);
  }

  const outputText = extractOutputText(rawBody);
  if (!outputText) throw new Error("Model returned no output_text.");
  return JSON.parse(outputText) as unknown;
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
      if (c?.type === "output_text" && typeof c.text === "string") chunks.push(c.text);
    }
  }
  return chunks.join("\n").trim();
}

function normalizeSuggestions(kind: Kind, raw: unknown): ProfileExtractSuggestion[] {
  if (!raw || typeof raw !== "object") return [];
  const arr = (raw as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(arr)) return [];

  const out: ProfileExtractSuggestion[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const r = item as {
      field?: string;
      stringValue?: unknown;
      arrayValue?: unknown;
      numberValue?: unknown;
      boolValue?: unknown;
      confidence?: unknown;
    };
    const field = String(r.field ?? "").trim();
    if (!field) continue;
    const confidence = typeof r.confidence === "number" ? r.confidence : 0;
    if (confidence < 0.6) continue;

    let value: string | string[] | undefined;
    if (typeof r.stringValue === "string" && r.stringValue.trim()) {
      value = r.stringValue.trim();
    } else if (Array.isArray(r.arrayValue)) {
      const list = r.arrayValue
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean);
      if (list.length > 0) value = list;
    } else if (typeof r.numberValue === "number") {
      value = String(r.numberValue);
    } else if (typeof r.boolValue === "boolean") {
      value = r.boolValue ? "yes" : "no";
    }
    if (value === undefined) continue;
    out.push({ field, value, confidence });
  }

  // Mentor-specific sanity: dedupe by field, keep highest confidence.
  const byField = new Map<string, ProfileExtractSuggestion>();
  for (const s of out) {
    const prev = byField.get(s.field);
    if (!prev || s.confidence > prev.confidence) byField.set(s.field, s);
  }
  return [...byField.values()];
}
