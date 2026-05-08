import { describe, expect, it } from "vitest";
import { MockEmbeddingClient, EMBEDDING_DIM, cosine } from "../MockEmbeddingClient";

describe("MockEmbeddingClient", () => {
  const client = new MockEmbeddingClient();

  it("produces a 1536-d unit vector", async () => {
    const v = await client.embed("Sarah Chen, fractional GTM advisor");
    expect(v).toHaveLength(EMBEDDING_DIM);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic — identical input → identical vector", async () => {
    const a = await client.embed("hello world");
    const b = await client.embed("hello world");
    expect(a).toEqual(b);
  });

  it("similar text has higher cosine than unrelated text", async () => {
    const subject = await client.embed(
      "VP of Sales scaling enterprise SaaS GTM at Qualtrics, fractional advisor for Utah AI startups"
    );
    const similar = await client.embed(
      "Bramble AI needs a fractional GTM advisor with enterprise SaaS sales experience for our Utah AI startup"
    );
    const unrelated = await client.embed(
      "iron-air long-duration grid storage with DOE OCED award"
    );
    expect(cosine(subject, similar)).toBeGreaterThan(cosine(subject, unrelated));
  });
});
