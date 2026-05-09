import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Per-pair LLM gate for the matchmaking pipeline.
 *
 * After the cosine nearest-neighbor pass surfaces ~top-N candidates, each
 * (subject, candidate) pair runs through this:
 *   1. Compute `cache_hash` over both profile texts + the prompt version.
 *   2. Look up `match_summaries(subject_id, candidate_id)`.
 *      - Hit + same hash  → reuse cached verdict.
 *      - Miss / stale     → fresh OpenAI call, then upsert.
 *   3. Return `{ isMatch, summary, factors[], concerns[] }`.
 *
 * Non-matches stay in the cache too (with `is_match=false`) so we don't pay
 * the OpenAI tax twice for the same losing pair.
 */

const PROMPT_VERSION = "2026-05-09-v1";
const MODEL = "gpt-5.4-nano";

export type LLMGateVerdict = {
  isMatch: boolean;
  summary: string;
  factors: Array<{ label: string; verdict: "strong" | "ok" | "weak" | "miss"; detail: string }>;
  concerns: string[];
  cached: boolean;
  model: string;
};

import type { ProfileKind } from "@/lib/data/types";

export type ProfileForGate = {
  id: string;
  kind: ProfileKind;
  name: string;
  embeddingText: string;
  wantsText: string;
};

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cacheKeyInputs(subject: ProfileForGate, candidate: ProfileForGate): string {
  // Model + prompt version are part of the hash so swapping either invalidates
  // the cache without a manual purge.
  return [
    PROMPT_VERSION,
    MODEL,
    subject.kind,
    subject.embeddingText,
    subject.wantsText,
    candidate.kind,
    candidate.embeddingText,
    candidate.wantsText,
  ].join("\n---\n");
}

export async function gatePair(args: {
  sb: SupabaseClient;
  subject: ProfileForGate;
  candidate: ProfileForGate;
}): Promise<LLMGateVerdict | null> {
  const { sb, subject, candidate } = args;
  const cacheHash = await sha256(cacheKeyInputs(subject, candidate));

  // 1. Cache lookup.
  const { data: cached } = await sb
    .from("match_summaries")
    .select("*")
    .eq("subject_id", subject.id)
    .eq("candidate_id", candidate.id)
    .maybeSingle();

  if (cached && cached.cache_hash === cacheHash) {
    return {
      isMatch: cached.is_match,
      summary: cached.summary ?? "",
      factors: (cached.factors ?? []) as LLMGateVerdict["factors"],
      concerns: (cached.concerns ?? []) as string[],
      cached: true,
      model: cached.model ?? "",
    };
  }

  // 2. Miss / stale → fresh call.
  const fresh = await callOpenAI(subject, candidate);
  if (!fresh) return null;

  // 3. Persist.
  await sb.from("match_summaries").upsert(
    {
      subject_id: subject.id,
      candidate_id: candidate.id,
      cache_hash: cacheHash,
      is_match: fresh.isMatch,
      summary: fresh.summary,
      factors: fresh.factors,
      concerns: fresh.concerns,
      model: MODEL,
    },
    { onConflict: "subject_id,candidate_id" },
  );

  return { ...fresh, cached: false, model: MODEL };
}

async function callOpenAI(
  subject: ProfileForGate,
  candidate: ProfileForGate,
): Promise<Omit<LLMGateVerdict, "cached" | "model"> | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[llm-gate] OPENAI_API_KEY missing; skipping.");
    return null;
  }

  const system = [
    "You are a matchmaking analyst for a Utah-focused candidate ↔ business platform.",
    "Given a subject profile and a candidate profile, decide whether the pair is a real match —",
    "good enough that an introduction would be useful to both sides — and explain why or why not",
    "across each relevant dimension.",
    "",
    "Return STRICT JSON in this shape:",
    `{`,
    `  "is_match": true|false,`,
    `  "summary": "<2-3 sentence overall verdict>",`,
    `  "factors": [`,
    `    { "label": "Stage fit",            "verdict": "strong|ok|weak|miss", "detail": "<one sentence>" },`,
    `    { "label": "Skill / domain align", "verdict": "...",                 "detail": "..." },`,
    `    { "label": "What each wants",      "verdict": "...",                 "detail": "..." },`,
    `    { "label": "Network compatibility","verdict": "...",                 "detail": "..." },`,
    `    { "label": "Compensation / availability", "verdict": "...",          "detail": "..." }`,
    `  ],`,
    `  "concerns": ["<short concern>", "..."]`,
    `}`,
    "",
    "Rules:",
    "- `is_match` should be true only if at least 3 factors are 'strong' or 'ok' AND none are 'miss'.",
    "- Concerns should be specific (max 3, each one short).",
    "- Never invent facts — work only from the profile text supplied.",
  ].join("\n");

  const user = [
    `# Subject (${subject.kind}: ${subject.name})`,
    "",
    "Profile (who they are):",
    subject.embeddingText,
    "",
    "Wants (who they're looking for):",
    subject.wantsText,
    "",
    `# Candidate (${candidate.kind}: ${candidate.name})`,
    "",
    "Profile (who they are):",
    candidate.embeddingText,
    "",
    "Wants (who they're looking for):",
    candidate.wantsText,
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[llm-gate] OpenAI ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as {
      is_match?: boolean;
      summary?: string;
      factors?: LLMGateVerdict["factors"];
      concerns?: string[];
    };
    return {
      isMatch: !!parsed.is_match,
      summary: parsed.summary ?? "",
      factors: Array.isArray(parsed.factors) ? parsed.factors : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    };
  } catch (err) {
    console.warn("[llm-gate] fetch / parse failed:", err);
    return null;
  }
}
