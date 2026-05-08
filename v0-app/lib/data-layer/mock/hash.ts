// Deterministic 32-bit string hash (FNV-1a). Used for both:
//  • token-→-bucket feature hashing in the mock embedding client
//  • a sign-bit hash to give buckets ±1 polarity
// Pure, no deps. Identical input → identical output across processes.

export function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}
