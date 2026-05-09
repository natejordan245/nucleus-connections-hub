"use server";

import { cookies } from "next/headers";
import { DEMO_COOKIE, getAppMode } from "@/lib/mode";
import { getDataStore } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BusinessDTO,
  CandidateDTO,
  InvestorDTO,
  MentorDTO,
  ProfileKind,
} from "@/lib/data/types";

const ONE_DAY = 60 * 60 * 24;

export type EmbedRole = "candidate" | "business" | "mentor" | "investor";

export type EmbedSignupInput = {
  role: EmbedRole;
  /** Person's full name (founder name for business). */
  fullName: string;
  /** Company name — required for business, ignored otherwise. */
  companyName?: string;
  /** Short one-line tagline. */
  headline: string;
  /** Longer paragraph. */
  bio: string;
  email: string;
  password: string;
};

export type EmbedSignupResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

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

function uid(role: EmbedRole, name: string) {
  const prefix = role === "candidate" ? "tal" : role === "business" ? "sup" : role === "mentor" ? "men" : "inv";
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "anon";
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${slug}-${suffix}`;
}

function profileHref(kind: ProfileKind, id: string) {
  return `/profile/${kind}/${id}`;
}

function validate(input: EmbedSignupInput): string | null {
  if (!input.role) return "Pick what you are.";
  if (!input.fullName.trim()) return "Your name is required.";
  if (input.role === "business" && !input.companyName?.trim()) {
    return "Company name is required.";
  }
  if (!input.bio.trim()) return "Add a short description.";
  if (!input.email.trim()) return "Email is required.";
  if (!input.password || input.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export async function submitEmbedSignup(
  input: EmbedSignupInput,
): Promise<EmbedSignupResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const mode = getAppMode();
  const fullName = input.fullName.trim();
  const headline = input.headline.trim();
  const bio = input.bio.trim();
  const email = input.email.trim();
  const password = input.password;

  // Resolve identity (auth user id or demo persona id).
  let id: string;

  if (mode === "live") {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name: fullName } },
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "Could not create your account." };
    }
    id = data.user.id;
  } else {
    id = uid(input.role, input.role === "business" ? input.companyName! : fullName);
    setDemoCookie(id);
  }

  const store = getDataStore();
  const now = new Date().toISOString();

  if (input.role === "candidate") {
    const dto: CandidateDTO = {
      id,
      name: fullName,
      email,
      headline,
      bio,
      lookingFor: "",
      categories: ["operator"],
      lookingForNeeds: [],
      skills: [],
      domains: [],
      availability: "full-time",
      compensation: ["cash"],
      stagePrefs: ["seed"],
      riskTolerance: 3,
      location: "Salt Lake City, UT",
      utahOrgIds: [],
      networks: ["operator"],
      createdAt: now,
    };
    await store.putCandidate(dto);
    return { ok: true, redirectUrl: profileHref("candidate", id) };
  }

  if (input.role === "business") {
    const dto: BusinessDTO = {
      id,
      name: input.companyName!.trim(),
      oneLiner: headline,
      description: bio,
      sector: "software",
      origin: "bootstrapped",
      fundingStage: "seed",
      fundingStatus: "pre-revenue",
      needs: [],
      networksWanted: ["operator"],
      location: "Salt Lake City, UT",
      utahOrgIds: [],
      createdAt: now,
    };
    await store.putBusiness(dto);
    return { ok: true, redirectUrl: profileHref("business", id) };
  }

  if (input.role === "mentor") {
    const dto: MentorDTO = {
      id,
      name: fullName,
      email,
      headline,
      bio,
      areasAdvised: [],
      hoursPerMonth: 4,
      boardSeatOpen: false,
      compPreference: ["mentor"],
      sectorsOfInterest: [],
      location: "Salt Lake City, UT",
      utahOrgIds: [],
      networks: ["mentor"],
      createdAt: now,
    };
    await store.putMentor(dto);
    return { ok: true, redirectUrl: profileHref("mentor", id) };
  }

  // investor
  const dto: InvestorDTO = {
    id,
    name: fullName,
    email,
    headline,
    bio,
    sectorsInvested: [],
    stagePrefs: ["seed"],
    location: "Salt Lake City, UT",
    utahOrgIds: [],
    networks: ["venture"],
    createdAt: now,
  };
  await store.putInvestor(dto);
  return { ok: true, redirectUrl: profileHref("investor", id) };
}
