import type { IMatchCache, CacheFingerprint, CachedMatch } from "@/contracts/data-layer";

/**
 * In-process LRU-ish cache. Stores up to MAX entries; on overflow it drops
 * the oldest insertion. Each entry carries a fingerprint that the caller
 * compares against the current pool/viewer fingerprint on read — mismatches
 * are treated as misses (and the stale entry is dropped so it stops taking
 * up space).
 *
 * For production the same interface fronts a Redis-backed implementation;
 * the keying scheme and fingerprint comparison stay identical.
 */
export class MockMatchCache implements IMatchCache {
  private readonly entries = new Map<string, { fingerprint: CacheFingerprint; value: CachedMatch }>();
  private readonly MAX = 200;

  async get(key: string, fingerprint: CacheFingerprint): Promise<CachedMatch | null> {
    const hit = this.entries.get(key);
    if (!hit) return null;
    if (
      hit.fingerprint.viewerHash !== fingerprint.viewerHash ||
      hit.fingerprint.poolRevision !== fingerprint.poolRevision
    ) {
      // Stale — drop and treat as a miss.
      this.entries.delete(key);
      return null;
    }
    // Refresh recency by re-inserting (Map iteration order = insertion order).
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit.value;
  }

  async set(key: string, fingerprint: CacheFingerprint, value: CachedMatch): Promise<void> {
    if (this.entries.size >= this.MAX) {
      const oldest = this.entries.keys().next().value;
      if (oldest) this.entries.delete(oldest);
    }
    this.entries.delete(key);
    this.entries.set(key, { fingerprint, value });
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }
}

let _instance: MockMatchCache | null = null;
export function getMockMatchCache(): MockMatchCache {
  if (!_instance) _instance = new MockMatchCache();
  return _instance;
}
