"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APP_MODE, DEMO_COOKIE, findPersona } from "@/lib/mode";

const ONE_DAY = 60 * 60 * 24;

export async function signInAsDemoPersona(formData: FormData) {
  const id = String(formData.get("personaId") ?? "");
  const persona = findPersona(id);
  if (!persona) {
    redirect("/login?error=unknown_persona");
  }

  cookies().set({
    name: DEMO_COOKIE,
    value: persona.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY,
    path: "/",
  });

  redirect("/dashboard");
}

export async function signOutDemo() {
  cookies().delete(DEMO_COOKIE);
  redirect("/");
}

export async function modeGuard() {
  // Tiny helper so server components can assert they're in the expected mode.
  return APP_MODE;
}
