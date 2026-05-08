// Hand-authored anchors for the demo. The match engine finds these matches
// organically — we hand-author *inputs*, not outputs.
//
// All three required match scenarios from the bounty are covered:
//   1. Executive       → deep-tech startup     (Marcus Okafor → Lumen Bio)
//   2. Student         → research spinout      (Priya Patel   → CropVision / Bramble AI)
//   3. Operator        → scaling company       (Jen Walker    → Altimer Robotics)
//   plus the marquee:  Sarah Chen (fractional GTM) → Bramble AI

export const DEMO_PERSONAS = {
  talent: {
    sarahChen: "tal-sarah-chen",
    marcusOkafor: "tal-marcus-okafor",
    priyaPatel: "tal-priya-patel",
    jenWalker: "tal-jen-walker",
  },
  startups: {
    lumenBio: "sup-lumen-bio",
    brambleAi: "sup-bramble-ai",
    cropVision: "sup-cropvision",
    altimerRobotics: "sup-altimer",
  },
} as const;

/**
 * The four required demo scenarios. A scenario pairs a "viewer" identity with
 * the candidate they should see ranked in the top result of their match list.
 * The engine isn't told the answer — it's a smoke check we run in scripts/.
 */
export const DEMO_SCENARIOS = [
  {
    label: "Fractional GTM advisor → AI startup",
    viewerType: "talent" as const,
    viewerId: DEMO_PERSONAS.talent.sarahChen,
    expectedTopCandidateId: DEMO_PERSONAS.startups.brambleAi,
  },
  {
    label: "Life-sci CEO → U of U bio spinout",
    viewerType: "talent" as const,
    viewerId: DEMO_PERSONAS.talent.marcusOkafor,
    expectedTopCandidateId: DEMO_PERSONAS.startups.lumenBio,
  },
  {
    label: "BYU CS senior → BYU AI spinout",
    viewerType: "talent" as const,
    viewerId: DEMO_PERSONAS.talent.priyaPatel,
    expectedTopCandidateId: DEMO_PERSONAS.startups.cropVision,
  },
  {
    label: "COO operator → scaling Series A manufacturer",
    viewerType: "talent" as const,
    viewerId: DEMO_PERSONAS.talent.jenWalker,
    expectedTopCandidateId: DEMO_PERSONAS.startups.altimerRobotics,
  },
] as const;
