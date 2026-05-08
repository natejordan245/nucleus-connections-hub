import { Pill } from "./Pill";

export function UtahSignalPill({
  sharedOrgs,
  proximityBoost,
}: {
  sharedOrgs: { id: string; name: string }[];
  proximityBoost: number;
}) {
  if (sharedOrgs.length === 0 && proximityBoost === 0) return null;

  const summary =
    sharedOrgs.length === 0
      ? `+${(proximityBoost * 100).toFixed(0)}% Utah signal`
      : sharedOrgs.length === 1
        ? `Shared: ${sharedOrgs[0].name}`
        : `Shared: ${sharedOrgs[0].name} +${sharedOrgs.length - 1}`;

  return <Pill tone="orange">⛰ {summary}</Pill>;
}
