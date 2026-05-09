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
  "",
  "Rules:",
  "- Only include fields you can credibly infer. Skip everything else.",
  "- For each suggestion: string -> stringValue, array -> arrayValue.",
  "- Confidence ≥ 0.6 only.",
].join("\n");

export async function POST(req: Request) {
  let body: { kind?: string; text?: string; url?: string };
  try {
    body = (await req.json()) as { kind?: string; text?: string; url?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const kind = body.kind === "mentor" ? "mentor" : body.kind === "business" ? "business" : null;
  if (!kind) {
    return NextResponse.json({ error: "kind must be 'mentor' or 'business'" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing — extraction unavailable in this environment." },
      { status: 503 },
    );
  }

  const warnings: string[] = [];
  let sourceText = typeof body.text === "string" ? body.text.trim() : "";
  let faviconUrl: string | undefined;

  if (!sourceText && typeof body.url === "string" && body.url.trim()) {
    if (kind !== "business") {
      return NextResponse.json(
        { error: "url scraping is only supported for kind=business" },
        { status: 400 },
      );
    }
    try {
      const fetched = await fetchWebsiteText(body.url.trim());
      sourceText = fetched.text;
      faviconUrl = fetched.faviconUrl;
      if (fetched.warning) warnings.push(fetched.warning);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `fetch_failed: ${message}` }, { status: 502 });
    }
  }

  if (!sourceText) {
    return NextResponse.json({ error: "text or url required" }, { status: 400 });
  }

  const truncated = sourceText.slice(0, MAX_INPUT_CHARS);
  if (sourceText.length > MAX_INPUT_CHARS) {
    warnings.push(`Input was truncated at ${MAX_INPUT_CHARS} characters.`);
  }

  try {
    const raw = await callOpenAI(apiKey, kind, truncated);
    const suggestions = normalizeSuggestions(kind, raw);
    if (faviconUrl) {
      suggestions.push({ field: "logoUrl", value: faviconUrl, confidence: 0.95 });
    }
    return NextResponse.json({ suggestions, warnings } satisfies ProfileExtractResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `extraction_failed: ${message}` }, { status: 500 });
  }
}

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;

async function fetchWebsiteText(
  rawUrl: string,
): Promise<{ text: string; faviconUrl?: string; warning?: string }> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("invalid url");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "NucleusConnectionsBot/1.0 (+onboarding)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("xhtml")) {
    throw new Error(`unsupported content-type: ${contentType}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("empty response body");
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncatedBytes = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > MAX_HTML_BYTES) {
      truncatedBytes = true;
      try {
        await reader.cancel();
      } catch {}
      break;
    }
    chunks.push(value);
  }
  const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
  const text = htmlToText(html);
  if (!text) throw new Error("no readable text on page");
  // Resolve favicon against the post-redirect URL so relative hrefs land
  // on the right origin (e.g. www.example.com vs example.com).
  const baseUrl = (() => {
    try {
      return new URL(res.url);
    } catch {
      return url;
    }
  })();
  const faviconUrl = extractFaviconUrl(html, baseUrl);
  return {
    text,
    faviconUrl,
    warning: truncatedBytes ? "Page exceeded 1.5MB — only the first portion was read." : undefined,
  };
}

/**
 * Pull the best icon URL out of a page's <head>. Prefers the largest
 * declared `<link rel="…icon…">` so the logo reads at avatar size; falls
 * back to `/favicon.ico` at the site root.
 */
function extractFaviconUrl(html: string, baseUrl: URL): string | undefined {
  const head = html.slice(0, 32_000); // head is always near the top; cap work.
  const linkRe = /<link\b[^>]*>/gi;
  const candidates: { href: string; rank: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(head))) {
    const tag = m[0];
    const relMatch = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!relMatch) continue;
    const rel = relMatch[1].toLowerCase();
    if (!rel.includes("icon")) continue;
    const hrefMatch = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!hrefMatch) continue;
    const href = hrefMatch[1].trim();
    if (!href) continue;
    // Apple-touch-icon is usually 180px+; declared sizes win when present.
    let rank = rel.includes("apple-touch-icon") ? 180 : 32;
    const sizesMatch = /\bsizes\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (sizesMatch) {
      const first = sizesMatch[1].split(/[\s,]+/)[0];
      const n = parseInt(first.split("x")[0], 10);
      if (Number.isFinite(n) && n > 0) rank = n;
    }
    candidates.push({ href, rank });
  }
  candidates.sort((a, b) => b.rank - a.rank);
  for (const c of candidates) {
    try {
      return new URL(c.href, baseUrl).toString();
    } catch {
      continue;
    }
  }
  try {
    return new URL("/favicon.ico", baseUrl).toString();
  } catch {
    return undefined;
  }
}

function normalizeUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  let s = html;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  s = s.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(s);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : "";

  const metaDescriptions: string[] = [];
  const metaRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(s))) {
    const tag = m[0];
    const nameMatch = /\b(name|property)\s*=\s*"([^"]+)"/i.exec(tag);
    const contentMatch = /\bcontent\s*=\s*"([^"]*)"/i.exec(tag);
    if (!nameMatch || !contentMatch) continue;
    const key = nameMatch[2].toLowerCase();
    if (
      key === "description" ||
      key === "og:description" ||
      key === "og:title" ||
      key === "og:site_name" ||
      key === "twitter:description"
    ) {
      const v = decodeEntities(contentMatch[1]).trim();
      if (v) metaDescriptions.push(`${key}: ${v}`);
    }
  }

  const body = stripTags(s);
  const collapsed = decodeEntities(body).replace(/\s+/g, " ").trim();

  const head = [title && `TITLE: ${title}`, ...metaDescriptions].filter(Boolean).join("\n");
  return [head, collapsed].filter(Boolean).join("\n\n");
}

function stripTags(html: string): string {
  return html.replace(/<\/?[a-z][^>]*>/gi, " ");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
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
