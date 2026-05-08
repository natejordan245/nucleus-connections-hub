import type { IEmbeddingClient } from "@/contracts/data-layer";
import { fnv1a, tokenize } from "./hash";

export const EMBEDDING_DIM = 1536;

/**
 * Deterministic feature-hashed bag-of-words → 1536-d unit vector.
 * Token overlap between two strings produces meaningful cosine similarity.
 * No external calls; identical input always yields identical output.
 */
export class MockEmbeddingClient implements IEmbeddingClient {
  async embed(text: string): Promise<number[]> {
    return embedSync(text);
  }
  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(embedSync);
  }
}

export function embedSync(text: string): number[] {
  const v = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return v;

  for (const tok of tokens) {
    const bucket = fnv1a(tok) % EMBEDDING_DIM;
    const sign = (fnv1a(tok, 0x9747b28c) & 1) === 0 ? 1 : -1;
    v[bucket] += sign;
  }
  // L2-normalize so cosine == dot product.
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`cosine: dim mismatch ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
