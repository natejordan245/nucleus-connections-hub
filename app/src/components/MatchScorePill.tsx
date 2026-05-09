import { Pill } from "./Pill";

/**
 * Score pill shown on profile pages and match cards. Tone thresholds match
 * `MatchCard`'s ScorePill so the visual treatment is consistent across views.
 */
export function MatchScorePill({ score }: { score: number }) {
  const pct = score * 100;
  const tone = pct >= 85 ? "orange" : pct >= 75 ? "emerald" : "warmgray";
  return <Pill tone={tone}>{pct.toFixed(1)}% match</Pill>;
}
