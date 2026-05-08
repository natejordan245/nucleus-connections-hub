"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, getAppMode } from "@/lib/mode";
import { getDataStore } from "@/lib/data";
import {
  AVAILABILITIES,
  COMPENSATIONS,
  FUNDING_STATUSES,
  NEEDS,
  NETWORKS,
  ORIGINS,
  ROLE_NEEDS,
  SECTORS,
  STAGES,
  TALENT_CATEGORIES,
} from "@/lib/data/enum-labels";
import { getViewer } from "@/lib/session";
import type {
  Availability,
  Compensation,
  FundingStatus,
  Network,
  Origin,
  Sector,
  Stage,
  ResumeExtractMeta,
  StartupDTO,
  StartupNeed,
  TalentCategory,
  TalentDTO,
} from "@/lib/data/types";

const ONE_DAY = 60 * 60 * 24;

function setDemoCookie(personaId: string) {
  cookies().set({
    name: DEMO_COOKIE,
    value: personaId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY,
    path: "/",
  });
}

function csv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/** Filter form values to those declared in an allow-list. */
function pick<T extends string>(values: FormDataEntryValue[], allowed: readonly T[]): T[] {
  const set = new Set<string>(allowed);
  const out: T[] = [];
  for (const v of values) {
    const s = String(v);
    if (set.has(s)) out.push(s as T);
  }
  return out;
}

function pickOne<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function clampRisk(v: string): TalentDTO["riskTolerance"] {
  const n = Number(v);
  if (!Number.isFinite(n)) return 3;
  const r = Math.round(Math.max(1, Math.min(5, n)));
  return r as TalentDTO["riskTolerance"];
}

function parseResumeExtractMeta(input: FormDataEntryValue | null): ResumeExtractMeta | undefined {
  if (typeof input !== "string" || !input.trim()) return undefined;
  try {
    const parsed = JSON.parse(input) as Partial<ResumeExtractMeta>;
    if (
      !parsed ||
      typeof parsed.sourceFilename !== "string" ||
      typeof parsed.extractedAt !== "string" ||
      (parsed.parser !== "pdf" && parsed.parser !== "docx") ||
      typeof parsed.charCount !== "number" ||
      typeof parsed.model !== "string" ||
      typeof parsed.extractedText !== "string"
    ) {
      return undefined;
    }
    const passesUsed = Array.isArray(parsed.passesUsed)
      ? parsed.passesUsed.filter((v): v is "text" | "image" => v === "text" || v === "image")
      : undefined;
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((v) => String(v).trim()).filter(Boolean)
      : undefined;
    const truncatedFlags = Array.isArray(parsed.truncatedFlags)
      ? parsed.truncatedFlags.filter(
          (v): v is "model_input" | "stored_text" | "pdf_pages" | "docx_images" =>
            v === "model_input" || v === "stored_text" || v === "pdf_pages" || v === "docx_images",
        )
      : undefined;

    return {
      sourceFilename: parsed.sourceFilename,
      extractedAt: parsed.extractedAt,
      parser: parsed.parser,
      charCount: parsed.charCount,
      model: parsed.model,
      extractedText: parsed.extractedText,
      passesUsed: passesUsed && passesUsed.length > 0 ? passesUsed : undefined,
      warnings: warnings && warnings.length > 0 ? warnings : undefined,
      truncatedFlags: truncatedFlags && truncatedFlags.length > 0 ? truncatedFlags : undefined,
    };
  } catch {
    return undefined;
  }
}

function uid(prefix: "tal" | "sup", name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "anon";
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${slug}-${suffix}`;
}

async function resolveProfileId(prefix: "tal" | "sup", name: string): Promise<string> {
  if (getAppMode() !== "live") return uid(prefix, name);
  const viewer = await getViewer();
  if (viewer.kind !== "live") {
    redirect(`/login?error=${encodeURIComponent("sign in before completing your profile")}`);
  }
  return viewer.userId;
}

export async function createTalent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();
  const categories = pick<TalentCategory>(formData.getAll("categories"), TALENT_CATEGORIES);
  const lookingForNeeds = pick<StartupNeed>(formData.getAll("lookingForNeeds"), NEEDS);
  const skills = csv(String(formData.get("skills") ?? ""));
  const domains = pick<Sector>(formData.getAll("domains"), SECTORS);
  const compensation = pick<Compensation>(formData.getAll("compensation"), COMPENSATIONS);
  const stagePrefs = pick<Stage>(formData.getAll("stagePrefs"), STAGES);
  const availability = pickOne<Availability>(
    String(formData.get("availability") ?? ""),
    AVAILABILITIES,
    "full-time",
  );
  const riskTolerance = clampRisk(String(formData.get("riskTolerance") ?? "3"));
  const networks = pick<Network>(formData.getAll("networks"), NETWORKS);
  const location = String(formData.get("location") ?? "Salt Lake City, UT").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim() || undefined;
  const xUrl = String(formData.get("xUrl") ?? "").trim() || undefined;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || undefined;
  const resumeExtract = parseResumeExtractMeta(formData.get("resumeExtractMeta"));

  if (!name || !email || !bio) {
    redirect("/onboard/talent?error=missing_required");
  }

  const id = await resolveProfileId("tal", name);
  const created: TalentDTO = {
    id,
    name,
    email,
    headline,
    bio,
    lookingFor,
    categories: categories.length > 0 ? categories : ["operator"],
    lookingForNeeds,
    skills,
    domains,
    availability,
    compensation: compensation.length > 0 ? compensation : ["cash"],
    stagePrefs: stagePrefs.length > 0 ? stagePrefs : ["seed"],
    riskTolerance,
    location,
    utahOrgIds: [],
    networks: networks.length > 0 ? networks : ["operator"],
    photoUrl,
    linkedinUrl,
    xUrl,
    resumeExtract,
    createdAt: new Date().toISOString(),
  };

  const store = getDataStore();
  await store.putTalent(created);
  if (getAppMode() === "demo") setDemoCookie(id);
  redirect(`/profile/talent/${id}`);
}

export async function createStartup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const oneLiner = String(formData.get("oneLiner") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sector = pickOne<Sector>(String(formData.get("sector") ?? ""), SECTORS, "software");
  const origin = pickOne<Origin>(String(formData.get("origin") ?? ""), ORIGINS, "bootstrapped");
  const fundingStage = pickOne<Stage>(
    String(formData.get("fundingStage") ?? ""),
    STAGES,
    "seed",
  );
  const fundingStatus = pickOne<FundingStatus>(
    String(formData.get("fundingStatus") ?? ""),
    FUNDING_STATUSES,
    "pre-revenue",
  );
  const needs = pick<StartupNeed>(formData.getAll("needs"), ROLE_NEEDS);
  const networksWanted = pick<Network>(formData.getAll("networksWanted"), NETWORKS);
  const location = String(formData.get("location") ?? "Salt Lake City, UT").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || undefined;
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim() || undefined;
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || undefined;

  if (!name || !description) {
    redirect("/onboard/startup?error=missing_required");
  }

  const id = await resolveProfileId("sup", name);
  const created: StartupDTO = {
    id,
    name,
    oneLiner,
    description,
    sector,
    origin,
    fundingStage,
    fundingStatus,
    needs,
    networksWanted: networksWanted.length > 0 ? networksWanted : ["operator"],
    location,
    utahOrgIds: [],
    logoUrl,
    websiteUrl,
    linkedinUrl,
    createdAt: new Date().toISOString(),
  };

  const store = getDataStore();
  await store.putStartup(created);
  if (getAppMode() === "demo") setDemoCookie(id);
  redirect(`/profile/startup/${id}`);
}
