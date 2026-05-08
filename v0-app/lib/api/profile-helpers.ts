import type { TalentDTO, StartupDTO } from "@/contracts/data";

const FALLBACK_TALENT: Omit<TalentDTO, "id" | "name" | "email" | "bio" | "createdAt"> = {
  headline: "",
  skills: [],
  domains: [],
  availability: "fractional",
  compensation: ["equity"],
  stagePrefs: ["seed", "series-a"],
  riskTolerance: 3,
  location: "Salt Lake City, UT",
  utahOrgs: [],
};

const FALLBACK_STARTUP: Omit<StartupDTO, "id" | "name" | "description" | "createdAt"> = {
  oneLiner: "",
  sector: "software",
  origin: "bootstrapped",
  fundingStage: "seed",
  fundingStatus: "pre-revenue",
  needs: [],
  location: "Salt Lake City, UT",
  utahOrgs: [],
};

export function mergeTalent(
  base: Partial<TalentDTO>,
  extracted: Partial<TalentDTO>
): TalentDTO {
  if (!base.bio) throw new Error("bio is required");
  if (!base.name) throw new Error("name is required");
  if (!base.email) throw new Error("email is required");
  return {
    ...FALLBACK_TALENT,
    ...extracted,
    ...base,
    id: base.id ?? cryptoRandomId("tal"),
    createdAt: base.createdAt ?? new Date().toISOString(),
  } as TalentDTO;
}

export function mergeStartup(
  base: Partial<StartupDTO>,
  extracted: Partial<StartupDTO>
): StartupDTO {
  if (!base.description) throw new Error("description is required");
  if (!base.name) throw new Error("name is required");
  return {
    ...FALLBACK_STARTUP,
    ...extracted,
    ...base,
    id: base.id ?? cryptoRandomId("sup"),
    createdAt: base.createdAt ?? new Date().toISOString(),
  } as StartupDTO;
}

export function cryptoRandomId(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}
