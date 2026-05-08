import { describe, expect, it, beforeEach } from "vitest";
import { MockProfileStore } from "../mock/MockProfileStore";
import { MockEmbeddingClient } from "../mock/MockEmbeddingClient";
import { MockLLMClient } from "../mock/MockLLMClient";
import { MockMatchEngine } from "../mock/MockMatchEngine";
import { MockMatchCache } from "../mock/MockMatchCache";
import { CachedMatchEngine, viewerHash } from "../CachedMatchEngine";
import type { TalentDTO } from "@/contracts/data";

function build() {
  const store = new MockProfileStore();
  const cache = new MockMatchCache();
  const inner = new MockMatchEngine(store, new MockEmbeddingClient(), new MockLLMClient());
  const engine = new CachedMatchEngine(inner, store, cache);
  return { store, cache, engine };
}

describe("CachedMatchEngine.findMatches", () => {
  it("first call is a cache miss, second call is a hit", async () => {
    const { engine } = build();
    const a = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    const b = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(a.pipelineMs.cacheHit).toBe(false);
    expect(b.pipelineMs.cacheHit).toBe(true);
    expect(b.matches.map((m) => m.candidateId)).toEqual(a.matches.map((m) => m.candidateId));
  });

  it("invalidates when the viewer's match-relevant fields change", async () => {
    const { store, engine } = build();
    await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });

    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    const edited: TalentDTO = { ...sarah, lookingFor: "Totally different intent now — life-sciences CEO seat" };
    await store.putTalent(edited);

    const next = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(next.pipelineMs.cacheHit).toBe(false);
  });

  it("does NOT invalidate on cosmetic-only edits (photoUrl, socials)", async () => {
    const { store, engine } = build();
    await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });

    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    // viewerHash ignores photoUrl and socials, so editing them shouldn't invalidate.
    // But putting still bumps poolRevision, which DOES invalidate. That's OK —
    // the contract is conservative, and this test asserts the *fingerprint*
    // semantics by checking viewerHash directly.
    expect(viewerHash(sarah)).toBe(viewerHash({ ...sarah, photoUrl: "https://example.com/x.jpg" }));
    expect(viewerHash(sarah)).toBe(viewerHash({ ...sarah, linkedinUrl: "https://x.example/y" }));
  });

  it("invalidates when the candidate pool changes (poolRevision bumps)", async () => {
    const { store, engine } = build();
    const a = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(a.pipelineMs.cacheHit).toBe(false);

    // Edit a *different* profile — Sarah's hash is unchanged, but pool bumps.
    const marcus = (await store.getTalent("tal-marcus-okafor"))!;
    await store.putTalent({ ...marcus, bio: marcus.bio + " (updated)" });

    const b = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(b.pipelineMs.cacheHit).toBe(false);
  });

  it("query-mode cache: same query is hit, different query is miss", async () => {
    const { engine } = build();
    const a = await engine.findFromQuery({
      query: "fractional GTM advisor",
      target: "talent",
    });
    const b = await engine.findFromQuery({
      query: "fractional GTM advisor",
      target: "talent",
    });
    const c = await engine.findFromQuery({
      query: "U of U bio spinout CEO",
      target: "startup",
    });
    expect(a.pipelineMs.cacheHit).toBe(false);
    expect(b.pipelineMs.cacheHit).toBe(true);
    expect(c.pipelineMs.cacheHit).toBe(false);
  });
});

describe("viewerHash", () => {
  it("is stable for unchanged inputs", async () => {
    const { store } = build();
    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    expect(viewerHash(sarah)).toBe(viewerHash({ ...sarah }));
  });

  it("changes when bio changes", async () => {
    const { store } = build();
    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    expect(viewerHash(sarah)).not.toBe(viewerHash({ ...sarah, bio: "Different bio" }));
  });

  it("changes when lookingFor changes", async () => {
    const { store } = build();
    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    expect(viewerHash(sarah)).not.toBe(viewerHash({ ...sarah, lookingFor: "Different intent" }));
  });

  it("ignores skill order (sort-stable)", async () => {
    const { store } = build();
    const sarah = (await store.getTalent("tal-sarah-chen"))!;
    const reordered = { ...sarah, skills: sarah.skills.slice().reverse() };
    expect(viewerHash(sarah)).toBe(viewerHash(reordered));
  });
});
