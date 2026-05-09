"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, DEMO_PERSONAS, findPersona, getAppMode } from "@/lib/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

function pickDemoPersonaForEmail(email: string) {
  const lower = email.trim().toLowerCase();
  const byEmail = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === lower);
  if (byEmail) return byEmail;
  return DEMO_PERSONAS[0];
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (getAppMode() === "demo") {
    const persona = pickDemoPersonaForEmail(email);
    setDemoCookie(persona.id);
    redirect("/dashboard");
  }

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }
  const sb = getSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (getAppMode() === "demo") {
    // Sign-up in demo mode is just a sign-in. We pick a persona and drop the
    // user straight into the dashboard so they can poke around.
    const persona = pickDemoPersonaForEmail(email || "demo");
    setDemoCookie(persona.id);
    redirect("/dashboard");
  }

  if (!email || !password) {
    redirect("/signup?error=missing_credentials");
  }
  const sb = getSupabaseServerClient();
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signInAsDemoPersona(formData: FormData) {
  const id = String(formData.get("personaId") ?? "");
  const persona = findPersona(id);
  if (!persona) {
    redirect("/login/personas?error=unknown_persona");
  }
  setDemoCookie(persona.id);
  redirect("/dashboard");
}
