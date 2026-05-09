import { createHmac, timingSafeEqual } from "node:crypto";
import { AFFINITY_CONFIG } from "./config";

/**
 * Verify an `Affinity-Signature` header against the raw request body using
 * HMAC-SHA256 with the workspace's webhook secret. Affinity sends the digest
 * hex-encoded.
 *
 * Returns `true` when the signature matches. Always uses constant-time
 * comparison so timing leaks can't reveal the secret.
 */
export function verifyAffinitySignature(rawBody: string, signature: string | null | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", AFFINITY_CONFIG.webhookSecret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

/** Helper for tests / demos to mint a valid signature for a payload. */
export function signAffinityBody(rawBody: string): string {
  return createHmac("sha256", AFFINITY_CONFIG.webhookSecret).update(rawBody).digest("hex");
}
