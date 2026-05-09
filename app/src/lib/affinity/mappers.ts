import { SECTOR_LABELS, STAGE_LABELS } from "@/lib/data/enum-labels";
import type { StartupDTO, TalentDTO } from "@/lib/data/types";

/**
 * Map a Nucleus StartupDTO to the args we'd POST to `/organizations`.
 * Domain is derived from the startup's website url when available; falling
 * back to null lets Affinity match by name.
 */
export function startupToOrganizationInput(startup: StartupDTO): { name: string; domain: string | null } {
  return {
    name: startup.name,
    domain: extractDomain(startup.websiteUrl),
  };
}

/**
 * Map a Nucleus TalentDTO to the args we'd POST to `/persons`. Splits the
 * display name on the first space — Affinity stores `first_name` and
 * `last_name` separately.
 */
export function talentToPersonInput(talent: TalentDTO, organizationIds: number[] = []) {
  const [firstName, ...rest] = talent.name.trim().split(/\s+/);
  return {
    firstName: firstName ?? talent.name,
    lastName: rest.join(" ") || "",
    email: talent.email || null,
    organizationIds,
  };
}

/**
 * Compose the human-readable summary that lands in the `nucleus_reason` text
 * field on the Affinity list entry.
 */
export function describeMatch(args: {
  talent: TalentDTO;
  startup: StartupDTO;
  matchScore?: number;
  reason?: string;
}) {
  const score = args.matchScore != null ? `${Math.round(args.matchScore * 100)}% match` : "Mutual interest";
  const stage = STAGE_LABELS[args.startup.fundingStage];
  const sector = SECTOR_LABELS[args.startup.sector];
  const tail = args.reason ? ` — ${args.reason}` : "";
  return `${score}. ${args.talent.name} ↔ ${args.startup.name} (${stage}, ${sector}).${tail}`;
}

function extractDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
