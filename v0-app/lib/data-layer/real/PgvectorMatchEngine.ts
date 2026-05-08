import type { IMatchEngine, IProfileStore, IEmbeddingClient, ILLMClient } from "@/contracts/data-layer";
import type { RankedMatch, PipelineTimings } from "@/contracts/data";
import { MockMatchEngine } from "../mock/MockMatchEngine";
import { withFallback } from "../feature-flags";

/**
 * Real Postgres + pgvector match engine. The implementation strategy is:
 *  1. SELECT … WHERE <gates> from talent/startup (SQL hard filters)
 *  2. ORDER BY embedding <=> $subjectVec LIMIT k (pgvector ANN)
 *  3. LLM rerank
 *  4. Apply proximity boost
 *
 * For the hackathon scope we keep the pipeline structure identical to
 * MockMatchEngine — and on any failure we delegate to it directly so the demo
 * never goes dark.
 */
export class PgvectorMatchEngine implements IMatchEngine {
  private mock: MockMatchEngine;

  constructor(
    private store: IProfileStore,
    private embedder: IEmbeddingClient,
    private llm: ILLMClient
  ) {
    this.mock = new MockMatchEngine(store, embedder, llm);
  }

  async findMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    return withFallback(
      "matchEngine",
      async () => {
        // The Pgvector path is structurally identical to the mock engine; the
        // difference is the data source. We currently delegate to the mock
        // pipeline because it satisfies the same contract — the SQL/pgvector
        // wiring is documented as a blocker until Supabase access lands.
        throw new Error("PgvectorMatchEngine: live SQL pipeline not yet wired — see blockers/");
      },
      () => this.mock.findMatches(args),
      { adapter: "PgvectorMatchEngine", op: "findMatches" }
    );
  }

  async findFromQuery(args: {
    query: string;
    target: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    return withFallback(
      "matchEngine",
      async () => {
        // Live path would: embedding = embed(query); SELECT … ORDER BY embedding <=> $vec LIMIT k.
        throw new Error("PgvectorMatchEngine.findFromQuery: live SQL pipeline not yet wired — see blockers/");
      },
      () => this.mock.findFromQuery(args),
      { adapter: "PgvectorMatchEngine", op: "findFromQuery" }
    );
  }
}
