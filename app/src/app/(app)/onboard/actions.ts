"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, getAppMode } from "@/lib/mode";
import { getDataStore } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
  BusinessDTO,
  CandidateDTO,
  Compensation,
  FundingStatus,
  InvestorDTO,
  MentorDTO,
  Network,
  Origin,
  ResumeExtractMeta,
  Sector,
  Stage,
  StartupNeed,
  TalentCategory,
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

function clampRisk(v: string): CandidateDTO["riskTolerance"] {
  const n = Number(v);
  if (!Number.isFinite(n)) return 3;
  const r = Math.round(Math.max(1, Math.min(5, n)));
  return r as CandidateDTO["riskTolerance"];
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

function uid(prefix: "tal" | "sup" | "men" | "inv", name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "anon";
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${slug}-${suffix}`;
}

/**
 * Resolves the viewer's identity for a fresh profile insert.
 *
 * - Demo viewer: use the persona id.
 * - Live viewer: use the auth user id; allow the form to override `name`.
 * - Anon + live mode: read email/password/name from the form, sign up with
 *   Supabase, and use the new auth user id. (The SSR client sets cookies so
 *   the user is signed in by the time the profile insert runs.)
 * - Anon + demo mode: synthesize a slug-based id and set the demo cookie.
 *
 * `formName` is the name typed into the onboarding form; takes precedence
 * over auth metadata when present. `errorRedirectPath` is where to send the
 * user back if signup fails (typically `/onboard/<kind>`).
 */
async function resolveIdentity(args: {
  prefix: "tal" | "sup" | "men" | "inv";
  formData: FormData;
  errorRedirectPath: string;
}): Promise<{ id: string; name: string; email: string }> {
  const { prefix, formData, errorRedirectPath } = args;
  const formName = String(formData.get("name") ?? "").trim();

  const viewer = await getViewer();

  if (viewer.kind === "demo") {
    return {
      id: viewer.persona.id,
      name: formName || viewer.persona.name,
      email: viewer.persona.email,
    };
  }

  if (viewer.kind === "live") {
    const fallbackName = viewer.email?.split("@")[0] ?? "You";
    return {
      id: viewer.userId,
      name: formName || viewer.name || fallbackName,
      email: viewer.email ?? "",
    };
  }

  // viewer.kind === "anon" from here.

  if (getAppMode() === "demo") {
    // Demo mode: no real auth. Synthesize a slug-based id, set the demo
    // cookie, and let MockDataStore hold the profile.
    const name = formName || "Demo Guest";
    const id = uid(prefix, name);
    const email = String(formData.get("email") ?? "").trim() || `${id}@demo.nucleus`;
    return { id, name, email };
  }

  // Live mode + anon: do the deferred signup using credentials from the form.
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || !formName) {
    redirect(`${errorRedirectPath}?error=missing_account`);
  }

  const sb = getSupabaseServerClient();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name: formName } },
  });
  if (error || !data.user) {
    redirect(
      `${errorRedirectPath}?error=${encodeURIComponent(error?.message ?? "signup_failed")}`,
    );
  }

  return { id: data.user.id, name: formName, email };
}

// ── Candidate ────────────────────────────────────────────────────────────────

export async function createCandidate(formData: FormData) {
  const { id, name, email } = await resolveIdentity({
    prefix: "tal",
    formData,
    errorRedirectPath: "/onboard/candidate",
  });
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();
  const categories = pick<TalentCategory>(formData.getAll("categories"), TALENT_CATEGORIES);
  const lookingForNeeds = pick<StartupNeed>(formData.getAll("lookingForNeeds"), NEEDS);
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

  if (!bio) {
    redirect("/onboard/candidate?error=missing_required");
  }

  const created: CandidateDTO = {
    id,
    name,
    email,
    headline,
    bio,
    lookingFor,
    categories: categories.length > 0 ? categories : ["operator"],
    lookingForNeeds,
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
  await store.putCandidate(created);
  if (getAppMode() === "demo") setDemoCookie(id);
  // Pre-warm the LLM-gate cache so the first dashboard render isn't paying
  // for 25 cold OpenAI calls. Fire-and-forget — we don't block the redirect.
  void store.matchesFor(id).catch((err) => {
    console.warn("[onboard] matchesFor pre-warm failed:", err);
  });
  redirect("/dashboard");
}

// ── Business ─────────────────────────────────────────────────────────────────

export async function createBusiness(formData: FormData) {
  const { id, name } = await resolveIdentity({
    prefix: "sup",
    formData,
    errorRedirectPath: "/onboard/business",
  });
  // Business `name` form field overrides the auth-derived name (e.g. "Bramble AI"
  // != founder name). Required.
  const formName = String(formData.get("name") ?? "").trim() || name;
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
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || undefined;

  if (!formName || !description) {
    redirect("/onboard/business?error=missing_required");
  }

  const created: BusinessDTO = {
    id,
    name: formName,
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
    createdAt: new Date().toISOString(),
  };

  const store = getDataStore();
  try {
    await store.putBusiness(created);
  } catch (err) {
    console.error("[createBusiness] putBusiness failed:", err);
    redirect("/onboard/business?error=save_failed");
  }
  if (getAppMode() === "demo") setDemoCookie(id);
  void store.matchesFor(id).catch((err) => {
    console.warn("[onboard] matchesFor pre-warm failed:", err);
  });
  redirect("/dashboard");
}

// ── Mentor ───────────────────────────────────────────────────────────────────

export async function createMentor(formData: FormData) {
  const { id, name, email } = await resolveIdentity({
    prefix: "men",
    formData,
    errorRedirectPath: "/onboard/mentor",
  });
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const areasAdvised = pick<Sector>(formData.getAll("areasAdvised"), SECTORS);
  const sectorsOfInterest = pick<Sector>(formData.getAll("sectorsOfInterest"), SECTORS);
  const compPreference = pick<Compensation>(formData.getAll("compPreference"), COMPENSATIONS);
  const networks = pick<Network>(formData.getAll("networks"), NETWORKS);
  const hoursRaw = Number(String(formData.get("hoursPerMonth") ?? "4"));
  const hoursPerMonth = Number.isFinite(hoursRaw) ? Math.max(0, Math.min(40, Math.round(hoursRaw))) : 4;
  const boardSeatOpen = String(formData.get("boardSeatOpen") ?? "") === "yes";
  const location = String(formData.get("location") ?? "Salt Lake City, UT").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim() || undefined;
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || undefined;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || undefined;

  if (!bio) {
    redirect("/onboard/mentor?error=missing_required");
  }

  const created: MentorDTO = {
    id,
    name,
    email,
    headline,
    bio,
    areasAdvised,
    hoursPerMonth,
    boardSeatOpen,
    compPreference: compPreference.length > 0 ? compPreference : ["mentor"],
    sectorsOfInterest,
    location,
    utahOrgIds: [],
    networks: networks.length > 0 ? networks : ["mentor"],
    photoUrl,
    linkedinUrl,
    websiteUrl,
    createdAt: new Date().toISOString(),
  };

  const store = getDataStore();
  await store.putMentor(created);
  if (getAppMode() === "demo") setDemoCookie(id);
  redirect("/dashboard");
}

// ── Investor (VC) ────────────────────────────────────────────────────────────

function buildInvestor(formData: FormData, identity: { id: string; name: string; email: string }): InvestorDTO {
  const fundName = String(formData.get("fundName") ?? "").trim() || undefined;
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const sectorsInvested = pick<Sector>(formData.getAll("sectorsInvested"), SECTORS);
  const stagePrefs = pick<Stage>(formData.getAll("stagePrefs"), STAGES);
  const networks = pick<Network>(formData.getAll("networks"), NETWORKS);
  const location = String(formData.get("location") ?? "Salt Lake City, UT").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || undefined;
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim() || undefined;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || undefined;

  const checkSizeMin = parseUsd(formData.get("checkSizeMin"));
  const checkSizeMax = parseUsd(formData.get("checkSizeMax"));

  return {
    id: identity.id,
    name: identity.name,
    email: identity.email,
    fundName,
    headline,
    bio,
    checkSizeMin,
    checkSizeMax,
    sectorsInvested,
    stagePrefs,
    location,
    utahOrgIds: [],
    networks: networks.length > 0 ? networks : ["venture"],
    photoUrl,
    linkedinUrl,
    websiteUrl,
    createdAt: new Date().toISOString(),
  };
}

function parseUsd(v: FormDataEntryValue | null): number | undefined {
  if (typeof v !== "string") return undefined;
  const cleaned = v.replace(/[$,_\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

export async function createInvestor(formData: FormData) {
  const identity = await resolveIdentity({
    prefix: "inv",
    formData,
    errorRedirectPath: "/onboard/investor",
  });
  const created = buildInvestor(formData, identity);
  const store = getDataStore();
  await store.putInvestor(created);
  if (getAppMode() === "demo") setDemoCookie(identity.id);
  redirect("/dashboard");
}

export async function skipInvestor(formData: FormData) {
  const identity = await resolveIdentity({
    prefix: "inv",
    formData,
    errorRedirectPath: "/onboard/investor",
  });
  const created = buildInvestor(formData, identity);
  const store = getDataStore();
  await store.putInvestor(created);
  if (getAppMode() === "demo") setDemoCookie(identity.id);
  redirect("/search?kind=business");
}
