import type { IEmbeddingClient } from "@/contracts/data-layer";
import { MockEmbeddingClient } from "../mock/MockEmbeddingClient";
import { withFallback } from "../feature-flags";

const MODEL = "text-embedding-3-small";

export class OpenAIEmbeddingClient implements IEmbeddingClient {
  private clientCache: unknown = null;
  private mock = new MockEmbeddingClient();

  private async getClient() {
    if (this.clientCache) return this.clientCache;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    const { default: OpenAI } = await import("openai");
    this.clientCache = new OpenAI({ apiKey });
    return this.clientCache;
  }

  async embed(text: string): Promise<number[]> {
    return withFallback(
      "embedding",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.embeddings.create({ model: MODEL, input: text });
        return res.data[0].embedding as number[];
      },
      () => this.mock.embed(text),
      { adapter: "OpenAIEmbeddingClient", op: "embed" }
    );
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return withFallback(
      "embedding",
      async () => {
        const client = (await this.getClient()) as any;
        const res = await client.embeddings.create({ model: MODEL, input: texts });
        return (res.data as Array<{ embedding: number[] }>).map((d) => d.embedding);
      },
      () => this.mock.embedBatch(texts),
      { adapter: "OpenAIEmbeddingClient", op: "embedBatch" }
    );
  }
}
