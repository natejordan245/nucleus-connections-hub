import type { ILLMClient } from "@/contracts/data-layer";
import type { TalentDTO, StartupDTO, RankedMatch } from "@/contracts/data";
import { MockLLMClient } from "../mock/MockLLMClient";
import { withFallback } from "../feature-flags";

const EXTRACT_MODEL = "gpt-5.3-nano";    // cheap, fast structured extraction
const RERANK_MODEL = "gpt-5.5-instant";  // quality where it matters

export class OpenAILLMClient implements ILLMClient {
  private clientCache: unknown = null;
  private mock = new MockLLMClient();

  private async getClient() {
    if (this.clientCache) return this.clientCache;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    const { default: OpenAI } = await import("openai");
    this.clientCache = new OpenAI({ apiKey });
    return this.clientCache;
  }

  async extractTalent(bio: string): Promise<Partial<TalentDTO>> {
    return withFallback(
      "llm",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.chat.completions.create({
          model: EXTRACT_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: TALENT_EXTRACT_SYSTEM },
            { role: "user", content: bio },
          ],
        });
        const json = JSON.parse(res.choices[0].message.content ?? "{}");
        return json as Partial<TalentDTO>;
      },
      () => this.mock.extractTalent(bio),
      { adapter: "OpenAILLMClient", op: "extractTalent" }
    );
  }

  async extractStartup(description: string): Promise<Partial<StartupDTO>> {
    return withFallback(
      "llm",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.chat.completions.create({
          model: EXTRACT_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: STARTUP_EXTRACT_SYSTEM },
            { role: "user", content: description },
          ],
        });
        const json = JSON.parse(res.choices[0].message.content ?? "{}");
        return json as Partial<StartupDTO>;
      },
      () => this.mock.extractStartup(description),
      { adapter: "OpenAILLMClient", op: "extractStartup" }
    );
  }

  async rerankFromQuery(args: {
    query: string;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]> {
    return withFallback(
      "llm",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.chat.completions.create({
          model: RERANK_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: QUERY_RERANK_SYSTEM },
            {
              role: "user",
              content: JSON.stringify({ query: args.query, candidates: args.candidates }),
            },
          ],
        });
        const json = JSON.parse(res.choices[0].message.content ?? "{}");
        const ranked: Array<Omit<RankedMatch, "candidate" | "proximityBoost" | "proximityReasons">> =
          json.matches ?? [];
        const byId = new Map(args.candidates.map((c) => [c.id, c]));
        return ranked
          .filter((r) => byId.has(r.candidateId))
          .map<RankedMatch>((r) => ({
            ...r,
            candidate: byId.get(r.candidateId)!,
            proximityBoost: 0,
            proximityReasons: [],
          }));
      },
      () => this.mock.rerankFromQuery(args),
      { adapter: "OpenAILLMClient", op: "rerankFromQuery" }
    );
  }

  async rerank(args: {
    subject: TalentDTO | StartupDTO;
    candidates: Array<TalentDTO | StartupDTO>;
  }): Promise<RankedMatch[]> {
    return withFallback(
      "llm",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.chat.completions.create({
          model: RERANK_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: RERANK_SYSTEM },
            {
              role: "user",
              content: JSON.stringify({ subject: args.subject, candidates: args.candidates }),
            },
          ],
        });
        const json = JSON.parse(res.choices[0].message.content ?? "{}");
        const ranked: Array<Omit<RankedMatch, "candidate" | "proximityBoost" | "proximityReasons">> =
          json.matches ?? [];
        const byId = new Map(args.candidates.map((c) => [c.id, c]));
        return ranked
          .filter((r) => byId.has(r.candidateId))
          .map<RankedMatch>((r) => ({
            ...r,
            candidate: byId.get(r.candidateId)!,
            proximityBoost: 0,
            proximityReasons: [],
          }));
      },
      () => this.mock.rerank(args),
      { adapter: "OpenAILLMClient", op: "rerank" }
    );
  }
}

const TALENT_EXTRACT_SYSTEM = `You extract structured fields from a talent's free-text bio.
Return JSON with the keys: name, headline, skills (string[]), domains (Sector[]),
availability ('full-time'|'fractional'|'advisory'|'internship'),
compensation (('cash'|'equity'|'mentor')[]), stagePrefs (Stage[]),
riskTolerance (1..5), location.
Sector ∈ life-sciences|ai|defense-aerospace|cyber|energy|advanced-manufacturing|fintech|software.
Stage ∈ pre-seed|seed|series-a|series-b|growth.`;

const STARTUP_EXTRACT_SYSTEM = `You extract structured fields from a startup's free-text description.
Return JSON with: name, oneLiner, sector (Sector), origin
('u-of-u-spinout'|'byu-spinout'|'usu-spinout'|'bootstrapped'|'vc-backed'),
trl (1..9, optional), fundingStage (Stage), fundingStatus
('grant'|'pre-revenue'|'revenue'), needs
(('ceo'|'cto'|'biz-dev'|'regulatory'|'sales-lead'|'engineering'|'marketing')[]),
location.`;

const RERANK_SYSTEM = `You rank candidates against a subject (talent or startup).
For each candidate emit: candidateId, score (0..1), verdict ('strong'|'good'|'partial'),
reason (one paragraph), factors {skillFit, stageFit, utahSignal, concerns}.
Always include concerns — surface real watch-outs, never sales-pitch every match.
Return { "matches": RankedMatch[] } sorted by score descending.`;

const QUERY_RERANK_SYSTEM = `You rank candidates against a free-text search query.
Quote phrases from the query in your reason paragraph so the user sees why each
candidate was matched. For each candidate emit: candidateId, score (0..1),
verdict, reason, factors {skillFit, stageFit, utahSignal, concerns}.
Concerns must call out semantic-only matches that lack literal term overlap.
Return { "matches": RankedMatch[] } sorted by score descending.`;
