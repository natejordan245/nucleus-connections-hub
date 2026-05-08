import type {
  IMatchEngine,
  IMatchCache,
  IProfileStore,
  CacheFingerprint,
} from "@/contracts/data-layer";
import type { TalentDTO, StartupDTO, RankedMatch, PipelineTimings } from "@/contracts/data";
import { fnv1a } from "./mock/hash";

/**
 * Decorator that caches `IMatchEngine` results keyed by viewer + mode + target.
 * Cache validity is checked against a 2-part fingerprint:
 *
 *   1. viewerHash   — stable hash of the viewer's match-relevant fields
 *                     (bio, lookingFor, skills, domains, …)
 *   2. poolRevision — monotonic counter from the profile store, bumped on
 *                     any putTalent / putStartup
 *
 * Either changing causes the entry to be treated as stale and recomputed.
 * The decorator does not need to know what's *inside* the inner engine —
 * any IMatchEngine works (mock, pgvector, future variants).
 */
export class CachedMatchEngine implements IMatchEngine {
  constructor(
    private inner: IMatchEngine,
    private store: IProfileStore,
    private cache: IMatchCache
  ) {}

  async findMatches(args: {
    for: string;
    type: "talent" | "startup";
    target?: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    const target = args.target ?? (args.type === "talent" ? "startup" : "talent");
    const key = `subject:${args.type}:${args.for}:${target}:k=${args.k ?? 20}`;
    const fingerprint = await this.computeFingerprint(args.for, args.type);

    const cached = await this.cache.get(key, fingerprint);
    if (cached) {
      return {
        matches: cached.matches,
        pipelineMs: { ...cached.pipelineMs, cacheHit: true },
      };
    }

    const fresh = await this.inner.findMatches(args);
    await this.cache.set(key, fingerprint, {
      matches: fresh.matches,
      pipelineMs: fresh.pipelineMs,
      cachedAt: new Date().toISOString(),
    });
    return { matches: fresh.matches, pipelineMs: { ...fresh.pipelineMs, cacheHit: false } };
  }

  async findFromQuery(args: {
    query: string;
    target: "talent" | "startup";
    k?: number;
  }): Promise<{ matches: RankedMatch[]; pipelineMs: PipelineTimings }> {
    // Query mode has no viewer — only the pool revision and the query text
    // gate validity. The query is hashed into the cache key.
    const queryHash = fnv1a(args.query.trim().toLowerCase()).toString(16);
    const key = `query:${args.target}:${queryHash}:k=${args.k ?? 20}`;
    const fingerprint: CacheFingerprint = {
      viewerHash: "", // unused for query mode
      poolRevision: this.store.getPoolRevision(),
    };

    const cached = await this.cache.get(key, fingerprint);
    if (cached) {
      return {
        matches: cached.matches,
        pipelineMs: { ...cached.pipelineMs, cacheHit: true },
      };
    }

    const fresh = await this.inner.findFromQuery(args);
    await this.cache.set(key, fingerprint, {
      matches: fresh.matches,
      pipelineMs: fresh.pipelineMs,
      cachedAt: new Date().toISOString(),
    });
    return { matches: fresh.matches, pipelineMs: { ...fresh.pipelineMs, cacheHit: false } };
  }

  private async computeFingerprint(
    viewerId: string,
    type: "talent" | "startup"
  ): Promise<CacheFingerprint> {
    const profile =
      type === "talent"
        ? await this.store.getTalent(viewerId)
        : await this.store.getStartup(viewerId);
    return {
      viewerHash: profile ? viewerHash(profile) : "missing",
      poolRevision: this.store.getPoolRevision(),
    };
  }
}

/**
 * Stable, content-addressed hash of the *match-relevant* fields. Edits to
 * fields that don't influence matching (e.g. photoUrl, socials, createdAt)
 * are deliberately ignored so the cache survives cosmetic changes.
 */
export function viewerHash(profile: TalentDTO | StartupDTO): string {
  if ("availability" in profile) {
    const parts = [
      profile.bio,
      profile.lookingFor ?? "",
      profile.headline,
      profile.skills.slice().sort().join("|"),
      profile.domains.slice().sort().join("|"),
      profile.availability,
      profile.compensation.slice().sort().join("|"),
      profile.stagePrefs.slice().sort().join("|"),
      String(profile.riskTolerance),
      profile.location,
      profile.utahOrgs.map((o) => o.id).sort().join("|"),
    ];
    return fnv1a(parts.join("\n")).toString(16);
  }
  const parts = [
    profile.description,
    profile.oneLiner,
    profile.sector,
    profile.origin,
    String(profile.trl ?? ""),
    profile.fundingStage,
    profile.fundingStatus,
    profile.needs.slice().sort().join("|"),
    profile.location,
    profile.utahOrgs.map((o) => o.id).sort().join("|"),
  ];
  return fnv1a(parts.join("\n")).toString(16);
}
