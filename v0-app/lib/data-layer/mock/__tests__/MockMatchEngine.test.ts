import { describe, expect, it } from "vitest";
import { MockProfileStore } from "../MockProfileStore";
import { MockEmbeddingClient } from "../MockEmbeddingClient";
import { MockLLMClient } from "../MockLLMClient";
import { MockMatchEngine, passesGates, applyProximityBoost } from "../MockMatchEngine";
import { DEMO_SCENARIOS } from "@/data/demo-personas";
import type { TalentDTO, StartupDTO, RankedMatch } from "@/contracts/data";

function build() {
  const store = new MockProfileStore();
  const embedder = new MockEmbeddingClient();
  const llm = new MockLLMClient();
  return { engine: new MockMatchEngine(store, embedder, llm), store };
}

describe("MockMatchEngine.findMatches", () => {
  it("returns at least one ranked match for Sarah Chen", async () => {
    const { engine } = build();
    const out = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(out.matches.length).toBeGreaterThan(0);
    expect(out.matches[0].score).toBeGreaterThan(0);
    expect(out.matches[0].reason).toBeTruthy();
    expect(out.matches[0].factors.concerns).toBeTruthy();
  });

  it("emits pipeline timings", async () => {
    const { engine } = build();
    const out = await engine.findMatches({ for: "tal-sarah-chen", type: "talent" });
    expect(out.pipelineMs.gates).toBeGreaterThanOrEqual(0);
    expect(out.pipelineMs.vector).toBeGreaterThanOrEqual(0);
    expect(out.pipelineMs.rerank).toBeGreaterThanOrEqual(0);
  });

  it("matches are sorted by score descending", async () => {
    const { engine } = build();
    const out = await engine.findMatches({ for: "tal-marcus-okafor", type: "talent" });
    for (let i = 1; i < out.matches.length; i++) {
      expect(out.matches[i - 1].score).toBeGreaterThanOrEqual(out.matches[i].score);
    }
  });

  // Smoke check: the engine finds the hand-authored anchor pair for each
  // required demo scenario as a top-5 match. Inputs are hand-authored, outputs
  // are not — so this asserts the pipeline does real work, not lookup.
  for (const scenario of DEMO_SCENARIOS) {
    it(`top-5 contains expected match: ${scenario.label}`, async () => {
      const { engine } = build();
      const out = await engine.findMatches({
        for: scenario.viewerId,
        type: scenario.viewerType,
      });
      const top5 = out.matches.slice(0, 5).map((m) => m.candidateId);
      expect(top5).toContain(scenario.expectedTopCandidateId);
    });
  }
});

describe("passesGates", () => {
  const sarah: TalentDTO = {
    id: "t",
    name: "Sarah",
    email: "s@e.co",
    headline: "",
    bio: "",
    skills: [],
    domains: ["ai"],
    availability: "fractional",
    compensation: ["equity"],
    stagePrefs: ["seed", "series-a"],
    riskTolerance: 4,
    location: "SLC, UT",
    utahOrgs: [],
    createdAt: "",
  };
  const seriesAStartup: StartupDTO = {
    id: "s",
    name: "S",
    oneLiner: "",
    description: "",
    sector: "ai",
    origin: "vc-backed",
    fundingStage: "series-a",
    fundingStatus: "revenue",
    needs: ["sales-lead"],
    location: "SLC, UT",
    utahOrgs: [],
    createdAt: "",
  };

  it("admits a structurally valid pair", () => {
    expect(passesGates(sarah, seriesAStartup, "talent")).toBe(true);
  });

  it("rejects when stage is not in talent's prefs", () => {
    const growth = { ...seriesAStartup, fundingStage: "growth" as const };
    expect(passesGates(sarah, growth, "talent")).toBe(false);
  });

  it("rejects an intern from a CEO role", () => {
    const intern: TalentDTO = { ...sarah, availability: "internship" };
    const ceoNeeded: StartupDTO = { ...seriesAStartup, needs: ["ceo"] };
    expect(passesGates(intern, ceoNeeded, "talent")).toBe(false);
  });

  it("admits a mentor for grant-stage startup", () => {
    const mentor: TalentDTO = { ...sarah, compensation: ["mentor"], availability: "advisory" };
    const grantStartup: StartupDTO = {
      ...seriesAStartup,
      fundingStatus: "grant",
      needs: ["biz-dev"],
    };
    expect(passesGates(mentor, grantStartup, "talent")).toBe(true);
  });
});

describe("applyProximityBoost", () => {
  const baseMatch: RankedMatch = {
    candidateId: "x",
    candidate: {} as StartupDTO,
    score: 0.6,
    verdict: "good",
    reason: "",
    factors: { skillFit: "", stageFit: "", utahSignal: "", concerns: "" },
    proximityBoost: 0,
    proximityReasons: [],
  };

  const talent: TalentDTO = {
    id: "t",
    name: "X",
    email: "x@e.co",
    headline: "",
    bio: "",
    skills: [],
    domains: ["life-sciences"],
    availability: "full-time",
    compensation: ["cash", "equity"],
    stagePrefs: ["seed"],
    riskTolerance: 4,
    location: "Salt Lake City, UT",
    utahOrgs: [{ id: "org-pivot", name: "PIVOT", type: "tto", universities: ["u-of-u"] }],
    createdAt: "",
  };
  const startup: StartupDTO = {
    id: "s",
    name: "Lumen",
    oneLiner: "",
    description: "",
    sector: "life-sciences",
    origin: "u-of-u-spinout",
    fundingStage: "seed",
    fundingStatus: "grant",
    needs: ["ceo"],
    location: "Salt Lake City, UT",
    utahOrgs: [
      { id: "org-pivot", name: "PIVOT", type: "tto", universities: ["u-of-u"] },
      { id: "org-uofu", name: "U of U", type: "university", universities: ["u-of-u"] },
    ],
    createdAt: "",
  };

  it("boosts when subject and candidate share a Utah org", () => {
    const out = applyProximityBoost(talent, { ...baseMatch, candidate: startup }, "talent");
    expect(out.proximityBoost).toBeGreaterThan(0);
    expect(out.proximityReasons.some((r) => r.includes("Shared Utah"))).toBe(true);
  });

  it("caps boost at 0.25", () => {
    const heavyTalent: TalentDTO = {
      ...talent,
      utahOrgs: [
        { id: "org-pivot", name: "PIVOT", type: "tto", universities: ["u-of-u"] },
        { id: "org-uofu", name: "U of U", type: "university", universities: ["u-of-u"] },
        { id: "org-sslopes", name: "Silicon Slopes", type: "community" },
      ],
    };
    const heavyStartup: StartupDTO = {
      ...startup,
      utahOrgs: [
        { id: "org-pivot", name: "PIVOT", type: "tto", universities: ["u-of-u"] },
        { id: "org-uofu", name: "U of U", type: "university", universities: ["u-of-u"] },
        { id: "org-sslopes", name: "Silicon Slopes", type: "community" },
      ],
    };
    const out = applyProximityBoost(
      heavyTalent,
      { ...baseMatch, candidate: heavyStartup },
      "talent"
    );
    expect(out.proximityBoost).toBeLessThanOrEqual(0.25);
  });

  it("doesn't push score above 1", () => {
    const out = applyProximityBoost(
      talent,
      { ...baseMatch, candidate: startup, score: 0.95 },
      "talent"
    );
    expect(out.score).toBeLessThanOrEqual(1);
  });
});
