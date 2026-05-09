import "server-only";
import { DEMO_QUERIES } from "./demo-queries";
import { embed } from "./embed";

// Firing `embed()` for each phrase in `DEMO_QUERIES` populates the in-process
// content-hash cache in `embed.ts`, so the first real search inside a warm
// Node process skips the OpenAI round-trip. On a cold serverless instance the
// very first request still pays the cost, but subsequent requests within that
// instance are free.
export { DEMO_QUERIES };

let primed: Promise<void> | null = null;

/**
 * Idempotent — repeated calls return the same in-flight promise. Safe to call
 * from request handlers; finishes in ~one OpenAI batch round-trip.
 */
export function primeQueryEmbeddings(): Promise<void> {
  if (primed) return primed;
  primed = (async () => {
    await Promise.allSettled(DEMO_QUERIES.map((q) => embed(q)));
  })();
  return primed;
}
