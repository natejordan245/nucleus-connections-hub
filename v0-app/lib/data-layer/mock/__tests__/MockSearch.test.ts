import { describe, expect, it } from "vitest";
import { MockProfileStore } from "../MockProfileStore";
import { MockEmbeddingClient } from "../MockEmbeddingClient";
import { MockLLMClient } from "../MockLLMClient";
import { MockMatchEngine } from "../MockMatchEngine";

function build() {
  return new MockMatchEngine(
    new MockProfileStore(),
    new MockEmbeddingClient(),
    new MockLLMClient()
  );
}

describe("MockMatchEngine.findFromQuery", () => {
  it("returns ranked candidates for a free-text query", async () => {
    const engine = build();
    const out = await engine.findFromQuery({
      query: "fractional GTM advisor for an enterprise SaaS startup",
      target: "talent",
    });
    expect(out.matches.length).toBeGreaterThan(0);
    expect(out.matches[0].score).toBeGreaterThan(0);
    expect(out.matches[0].reason).toBeTruthy();
    // The reason for the top result should quote the query.
    expect(out.matches[0].reason.toLowerCase()).toContain("fractional");
  });

  it("ranks Sarah Chen highly for a GTM-advisor query", async () => {
    const engine = build();
    const out = await engine.findFromQuery({
      query: "fractional GTM advisor with enterprise SaaS sales experience",
      target: "talent",
    });
    const top5 = out.matches.slice(0, 5).map((m) => m.candidateId);
    expect(top5).toContain("tal-sarah-chen");
  });

  it("ranks Lumen Bio highly for a U of U bio spinout query", async () => {
    const engine = build();
    const out = await engine.findFromQuery({
      query: "University of Utah bio spinout that needs a CEO with FDA experience",
      target: "startup",
    });
    const top5 = out.matches.slice(0, 5).map((m) => m.candidateId);
    expect(top5).toContain("sup-lumen-bio");
  });

  it("returns empty matches for an empty query", async () => {
    const engine = build();
    const out = await engine.findFromQuery({ query: "   ", target: "startup" });
    expect(out.matches).toHaveLength(0);
  });
});

describe("MockMatchEngine.findMatches with target=peer", () => {
  it("returns talent-↔-talent matches and excludes the viewer", async () => {
    const engine = build();
    const out = await engine.findMatches({
      for: "tal-sarah-chen",
      type: "talent",
      target: "talent",
    });
    expect(out.matches.length).toBeGreaterThan(0);
    const ids = out.matches.map((m) => m.candidateId);
    expect(ids).not.toContain("tal-sarah-chen");
    // All candidates should be talent (have an availability field)
    for (const m of out.matches) {
      expect(m.candidate).toHaveProperty("availability");
    }
  });

  it("defaults to opposing target when target is omitted", async () => {
    const engine = build();
    const out = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    // All candidates should be startups
    for (const m of out.matches) {
      expect(m.candidate).toHaveProperty("sector");
    }
  });
});
