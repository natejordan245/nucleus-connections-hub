// Run: npx tsx scripts/smoke-match.ts
// Prints top-5 matches for each demo scenario to console. Uses whichever data
// layer DATA_MODE selects — mock by default, real if env is configured.

import { matchEngine } from "@/lib/data-layer/factory";
import { DEMO_SCENARIOS } from "@/data/demo-personas";

async function main() {
  for (const s of DEMO_SCENARIOS) {
    console.log(`\n━━ ${s.label} ━━`);
    const out = await matchEngine.findMatches({ for: s.viewerId, type: s.viewerType });
    out.matches.slice(0, 5).forEach((m, i) => {
      const name = "name" in m.candidate ? m.candidate.name : "?";
      const expected = m.candidateId === s.expectedTopCandidateId ? "  ⭐" : "";
      console.log(
        `${i + 1}. ${(m.score * 100).toFixed(0)}  [${m.verdict}]  ${name}  (boost +${m.proximityBoost.toFixed(2)})${expected}`
      );
    });
    console.log(
      `pipeline: ${out.pipelineMs.gates}ms gates → ${out.pipelineMs.vector}ms vector → ${out.pipelineMs.rerank}ms rerank`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
